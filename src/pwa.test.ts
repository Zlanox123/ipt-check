import { beforeEach,describe,expect,it,vi } from 'vitest';

const mocks=vi.hoisted(()=>({options:null as any,update:vi.fn(async()=>{}),warm:vi.fn(async()=>true)}));
vi.mock('virtual:pwa-register',()=>({registerSW:vi.fn((options:any)=>{mocks.options=options;return mocks.update;})}));
vi.mock('./offline',()=>({warmOcrOfflineCache:mocks.warm}));
import { setupPwa } from './pwa';

describe('aggiornamenti PWA',()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.options=null;});
 it('attiva il service worker in attesa dopo la conferma',async()=>{
  vi.stubGlobal('confirm',vi.fn(()=>true)); setupPwa(); mocks.options.onNeedRefresh(); await Promise.resolve();
  expect(mocks.update).toHaveBeenCalledWith(true);
  vi.unstubAllGlobals();
 });
 it('prepara gli asset OCR quando l’app è disponibile offline',async()=>{
  setupPwa(); mocks.options.onOfflineReady(); await Promise.resolve();
  expect(mocks.warm).toHaveBeenCalled();
 });
});
