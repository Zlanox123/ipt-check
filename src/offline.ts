export const OCR_OFFLINE_ASSETS=[
 'https://cdn.jsdelivr.net/npm/tesseract.js@v6.0.1/dist/worker.min.js',
 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.1.2/tesseract-core-simd-lstm.wasm.js',
 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.1.2/tesseract-core-simd-lstm.wasm',
 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.1.2/tesseract-core-lstm.wasm.js',
 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v6.1.2/tesseract-core-lstm.wasm',
 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ita/4.0.0_best_int/ita.traineddata.gz'
] as const;

export async function warmOcrOfflineCache(){
 if(!('caches' in globalThis)||!('fetch' in globalThis)) return false;
 const cache=await caches.open('ocr-runtime');
 const results=await Promise.allSettled(OCR_OFFLINE_ASSETS.map(async url=>{
  if(await cache.match(url)) return;
  const response=await fetch(url,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok) throw new Error(`Asset OCR non disponibile: ${response.status}`);
  await cache.put(url,response);
 }));
 return results.every(result=>result.status==='fulfilled');
}
