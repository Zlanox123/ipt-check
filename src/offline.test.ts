import { afterEach,describe,expect,it,vi } from 'vitest';
import { OCR_OFFLINE_ASSETS,warmOcrOfflineCache } from './offline';

describe('asset OCR offline e privacy cache',()=>{
 afterEach(()=>vi.unstubAllGlobals());

 it('memorizza solo worker, core e modello italiano senza credenziali',async()=>{
  const put=vi.fn(); const match=vi.fn(async()=>undefined); const open=vi.fn(async()=>({put,match}));
  const fetchMock=vi.fn(async(_url:string,_options?:RequestInit)=>new Response('asset',{status:200}));
  vi.stubGlobal('caches',{open}); vi.stubGlobal('fetch',fetchMock);
  await expect(warmOcrOfflineCache()).resolves.toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(OCR_OFFLINE_ASSETS.length);
  expect(put).toHaveBeenCalledTimes(OCR_OFFLINE_ASSETS.length);
  expect(fetchMock.mock.calls.every(([,options])=>options?.credentials==='omit'&&options?.referrerPolicy==='no-referrer')).toBe(true);
  expect(OCR_OFFLINE_ASSETS.some(url=>url.includes('traineddata'))).toBe(true);
 });

 it('riusa la cache senza rete quando gli asset sono già disponibili',async()=>{
  const match=vi.fn(async()=>new Response('cached')); const open=vi.fn(async()=>({put:vi.fn(),match}));
  const fetchMock=vi.fn(async()=>{throw new Error('offline')});
  vi.stubGlobal('caches',{open}); vi.stubGlobal('fetch',fetchMock);
  await expect(warmOcrOfflineCache()).resolves.toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
 });

 it('segnala un riscaldamento incompleto senza salvare documenti',async()=>{
  const put=vi.fn(); const open=vi.fn(async()=>({put,match:vi.fn(async()=>undefined)}));
  vi.stubGlobal('caches',{open}); vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
  await expect(warmOcrOfflineCache()).resolves.toBe(false);
  expect(put).not.toHaveBeenCalled();
  expect(OCR_OFFLINE_ASSETS.every(url=>url.startsWith('https://cdn.jsdelivr.net/'))).toBe(true);
 });
});
