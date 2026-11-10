import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export { inferFromText } from './inference';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type Progress = (message:string, value:number)=>void;
export interface ExtractOptions { signal?:AbortSignal }
export class ExtractionCancelledError extends Error { constructor(){ super('Operazione annullata'); this.name='ExtractionCancelledError'; } }

const OCR_OPTIONS={
 workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@v6.0.1/dist/worker.min.js',
 corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.1.2',
 langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ita/4.0.0_best_int'
};
const supportedImageTypes=new Set(['image/jpeg','image/png','image/webp']);

function cancelled(signal?:AbortSignal){ if(signal?.aborted) throw new ExtractionCancelledError(); }
function isPdf(file:File){ return file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf'); }
function validate(file:File){
 if(isPdf(file)) return;
 const extension=file.name.toLowerCase().match(/\.([^.]+)$/)?.[1];
 if(!supportedImageTypes.has(file.type)&&!['jpg','jpeg','png','webp'].includes(extension??'')) throw new Error('Formato non supportato: usa PDF, JPEG, PNG o WebP');
}

async function createLocalRecognizer(progress:Progress,signal?:AbortSignal){
 cancelled(signal);
 const worker=await createWorker('ita',1,{...OCR_OPTIONS,logger:m=>{if(m.status==='recognizing text') progress('Riconoscimento testo',Math.round((m.progress||0)*100));}});
 try{cancelled(signal);}catch(error){await worker.terminate();throw error;}
 const abort=()=>{void worker.terminate();};
 signal?.addEventListener('abort',abort,{once:true});
 return {
  recognize:async(source:string|HTMLCanvasElement)=>{cancelled(signal);const {data}=await worker.recognize(source,{rotateAuto:true});cancelled(signal);return data.text.trim();},
  close:async()=>{signal?.removeEventListener('abort',abort);await worker.terminate();}
 };
}

export async function extractPdfPages(pdf:any,recognize:(source:HTMLCanvasElement,page:number)=>Promise<string>,progress:Progress,signal?:AbortSignal){
 const texts:string[]=[];
 for(let i=1;i<=pdf.numPages;i++){
  cancelled(signal); progress(`Pagina ${i} di ${pdf.numPages}`,Math.round(((i-1)/pdf.numPages)*100));
  const page=await pdf.getPage(i);
  try{
   const content=await page.getTextContent();
   const digital=content.items.map((x:any)=>'str' in x?x.str:'').join(' ').replace(/\s+/g,' ').trim();
   if(digital.length>=20){ texts.push(digital); }
   else{
    const viewport=page.getViewport({scale:2}); const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
    const context=canvas.getContext('2d'); if(!context) throw new Error('Impossibile elaborare la pagina PDF');
    const task=page.render({canvasContext:context,viewport,canvas}); const abort=()=>task.cancel?.();
    signal?.addEventListener('abort',abort,{once:true});
    try{await task.promise;}finally{signal?.removeEventListener('abort',abort);}
    cancelled(signal); texts.push(await recognize(canvas,i));
   }
  } finally { page.cleanup?.(); }
 }
 progress('Completato',100);
 return texts.join('\n\n--- PAGINA ---\n\n');
}

export async function extractLocal(file:File,progress:Progress=()=>{},options:ExtractOptions={}):Promise<string>{
 validate(file); const {signal}=options; cancelled(signal); let recognizer:Awaited<ReturnType<typeof createLocalRecognizer>>|undefined;
 try{
  if(isPdf(file)){
   const bytes=await file.arrayBuffer(); cancelled(signal);
   const loading=pdfjsLib.getDocument({data:bytes,useWorkerFetch:false});
   const abort=()=>loading.destroy(); signal?.addEventListener('abort',abort,{once:true});
   let pdf:any;
   try{pdf=await loading.promise;}finally{signal?.removeEventListener('abort',abort);}
   try{
    let currentPage=1;
    return await extractPdfPages(pdf,async(canvas,page)=>{
     currentPage=page;
     recognizer??=await createLocalRecognizer((m,v)=>progress(`${m} · pagina ${currentPage}`,Math.round((((currentPage-1)+(v/100))/pdf.numPages)*100)),signal);
     const text=await recognizer.recognize(canvas); progress(`OCR pagina ${page}`,Math.round((page/pdf.numPages)*100)); return text;
    },progress,signal);
   } finally { await pdf.destroy?.(); }
  }
  recognizer=await createLocalRecognizer(progress,signal); const url=URL.createObjectURL(file);
  try{const text=await recognizer.recognize(url);progress('Completato',100);return text;}finally{URL.revokeObjectURL(url);}
 }catch(error){if(signal?.aborted||error instanceof ExtractionCancelledError) throw new ExtractionCancelledError();throw error;}
 finally{await recognizer?.close().catch(()=>{});}
}
