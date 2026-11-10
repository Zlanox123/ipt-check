import { beforeEach,describe,expect,it,vi } from 'vitest';

const worker=vi.hoisted(()=>({recognize:vi.fn(),terminate:vi.fn()}));
vi.mock('tesseract.js',()=>({createWorker:vi.fn(async()=>worker)}));
vi.mock('pdfjs-dist',()=>({GlobalWorkerOptions:{workerSrc:''},getDocument:vi.fn()}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url',()=>({default:'pdf.worker.mjs'}));

import { ExtractionCancelledError,extractLocal,extractPdfPages } from './ocr';

function page(text:string){
 return {getTextContent:vi.fn(async()=>({items:text?[{str:text}]:[]})),getViewport:()=>({width:100,height:200}),render:vi.fn(()=>({promise:Promise.resolve(),cancel:vi.fn()})),cleanup:vi.fn()};
}

describe('pipeline OCR/PDF locale',()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  worker.terminate.mockResolvedValue(undefined);
  worker.recognize.mockResolvedValue({data:{text:'testo OCR ruotato'}});
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({} as CanvasRenderingContext2D);
  vi.stubGlobal('URL',{...URL,createObjectURL:vi.fn(()=> 'blob:locale'),revokeObjectURL:vi.fn()});
 });

 it('estrae tutte le pagine di un PDF misto e conserva quelle vuote',async()=>{
  const pages=[page('Pagina digitale con testo sufficiente'),page(''),page('')];
  const pdf={numPages:3,getPage:vi.fn(async(i:number)=>pages[i-1])};
  const recognize=vi.fn(async(_:HTMLCanvasElement,i:number)=>i===2?'Pagina scansionata':'');
  const progress=vi.fn();
  const result=await extractPdfPages(pdf,recognize,progress);
  expect(result).toContain('Pagina digitale con testo sufficiente');
  expect(result).toContain('Pagina scansionata');
  expect(recognize).toHaveBeenCalledTimes(2);
  expect(pages.every(x=>x.cleanup.mock.calls.length===1)).toBe(true);
  expect(progress).toHaveBeenLastCalledWith('Completato',100);
 });

 it('propaga errori di rendering senza saltare la pulizia',async()=>{
  const broken=page(''); broken.render.mockReturnValue({promise:Promise.reject(new Error('render fallito')),cancel:vi.fn()});
  await expect(extractPdfPages({numPages:1,getPage:async()=>broken},vi.fn(),vi.fn())).rejects.toThrow('render fallito');
  expect(broken.cleanup).toHaveBeenCalled();
 });

 it('annulla prima di leggere una pagina',async()=>{
  const controller=new AbortController(); controller.abort();
  await expect(extractPdfPages({numPages:1,getPage:vi.fn()},vi.fn(),vi.fn(),controller.signal)).rejects.toBeInstanceOf(ExtractionCancelledError);
 });

 it.each([['foto.jpg','image/jpeg'],['foto.png','image/png'],['foto.webp','image/webp']])('elabora localmente %s con autorotazione e revoca URL',async(name,type)=>{
  const fetchSpy=vi.spyOn(globalThis,'fetch');
  const result=await extractLocal(new File(['immagine'],name,{type}),vi.fn());
  expect(result).toBe('testo OCR ruotato');
  expect(worker.recognize).toHaveBeenCalledWith('blob:locale',{rotateAuto:true});
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:locale');
  expect(fetchSpy).not.toHaveBeenCalled();
 });

 it('rifiuta formati diversi da PDF/JPEG/PNG/WebP',async()=>{
  await expect(extractLocal(new File(['x'],'verbale.txt',{type:'text/plain'}))).rejects.toThrow('Formato non supportato');
 });
});
