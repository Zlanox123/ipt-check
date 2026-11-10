import { registerSW } from 'virtual:pwa-register';
import { warmOcrOfflineCache } from './offline';

export function setupPwa(){
 let updateSW:ReturnType<typeof registerSW>;
 updateSW=registerSW({
  onNeedRefresh(){if(confirm('È disponibile un aggiornamento. Aggiornare ora?')) void updateSW(true);},
  onOfflineReady(){void warmOcrOfflineCache();}
 });
 return updateSW;
}
