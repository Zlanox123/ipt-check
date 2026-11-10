import type { Benefit } from '../types';

export interface VerifiedRule {
  id:string; benefits:Benefit[]; sourceId:string; url:string; validFrom:string; validTo:null; verifiedOn:string; status:'verified';
}

const iptUrl='https://aci.gov.it/pratica-auto/esenzioni-ipt-veicoli-destinati-alle-persone-con-disabilita/';
const praUrl='https://aci.gov.it/approfondimento/disabilita-e-diritto-alla-mobilita/esenzione-emolumenti-al-pubblico-registro-automobilistico-pra/';
const faqUrl='https://aci.gov.it/approfondimento/disabilita-e-diritto-alla-mobilita/faq-ipt/';
const fiscalUrl='https://aci.gov.it/approfondimento/disabilita-e-diritto-alla-mobilita/presupposti-e-decadenza-del-diritto/';
const territorialUrl='https://aci.gov.it/pratica-auto/agevolazioni-ipt-veicoli-destinati-alle-persone-con-disabilita-sensoriali-o-patologie-non-ricomprese-nella-normativa-nazionale/';

export const iptPraRules:VerifiedRule[]=[
  {id:'ipt-national-categories',benefits:['ipt'],sourceId:'ACI-IPT',url:iptUrl,validFrom:'2026-04-07',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'ipt-vehicle-limits',benefits:['ipt'],sourceId:'ACI-IPT',url:iptUrl,validFrom:'2026-04-07',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'ipt-owner-one-vehicle',benefits:['ipt'],sourceId:'ACI-IPT',url:iptUrl,validFrom:'2026-04-07',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'ipt-provincial-derogations',benefits:['ipt'],sourceId:'ACI-IPT',url:iptUrl,validFrom:'2026-04-07',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'ipt-sensory-provinces',benefits:['ipt'],sourceId:'ACI-IPT-TERRITORIAL',url:territorialUrl,validFrom:'2026-10-28',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'fiscal-dependence-income',benefits:['ipt'],sourceId:'ACI-PRESUPPOSTI',url:fiscalUrl,validFrom:'2019-01-01',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'pra-national-categories',benefits:['pra'],sourceId:'DM-2013-PRA',url:praUrl,validFrom:'2013-04-02',validTo:null,verifiedOn:'2026-11-10',status:'verified'},
  {id:'pra-independent-from-ipt-limits',benefits:['pra'],sourceId:'ACI-FAQ',url:faqUrl,validFrom:'2026-05-19',validTo:null,verifiedOn:'2026-11-10',status:'verified'}
];

export const sensoryFullExemptionProvinces=['arezzo','benevento','bolzano','prato','sassari','trento'];
export const sensoryReducedOnlyProvinces=['lucca','vibo valentia','crotone','catania','nuoro','firenze','reggio emilia','roma','foggia','bari','belluno','cagliari','la spezia','parma','perugia','sud sardegna','teramo','terni','trapani','asti','bergamo','campobasso','caserta','chieti','como','cremona','lecco','lodi','mantova','massa carrara','milano','monza brianza','novara','padova','pavia','piacenza','rieti','rimini','salerno','savona','siena','varese','verbano cusio ossola','forli cesena','pescara','treviso','ravenna','genova','grosseto','imperia','messina','pisa','potenza','reggio calabria','rovigo','sondrio','verona','vicenza','ancona','aosta','cuneo','fermo','frosinone','latina','macerata','pesaro urbino','pistoia','siracusa'];
export const minorAdaptationWaiverProvinces=['campobasso','isernia','lodi','messina','roma','sassari'];
export const theftSecondVehicleProvinces=['ancona','benevento','biella','brescia','caserta','chieti','como','cosenza','cremona','cuneo','foggia','frosinone','genova','lecco','lodi','monza brianza','pavia','perugia','pistoia','prato','ragusa','roma','sassari','savona','teramo','torino','venezia','bari','barletta andria trani','lecce','pescara','reggio calabria','milano','rieti'];
export const knownItalianProvinces=`agrigento|alessandria|ancona|aosta|arezzo|ascoli piceno|asti|avellino|bari|barletta andria trani|belluno|benevento|bergamo|biella|bologna|bolzano|brescia|brindisi|cagliari|caltanissetta|campobasso|caserta|catania|catanzaro|chieti|como|cosenza|cremona|crotone|cuneo|enna|fermo|ferrara|firenze|foggia|forli cesena|frosinone|genova|gorizia|grosseto|imperia|isernia|l aquila|la spezia|latina|lecce|lecco|livorno|lodi|lucca|macerata|mantova|massa carrara|matera|messina|milano|modena|monza brianza|napoli|novara|nuoro|oristano|padova|palermo|parma|pavia|perugia|pesaro urbino|pescara|piacenza|pisa|pistoia|pordenone|potenza|prato|ragusa|ravenna|reggio calabria|reggio emilia|rieti|rimini|roma|rovigo|salerno|sassari|savona|siena|siracusa|sondrio|sud sardegna|taranto|teramo|terni|torino|trapani|trento|treviso|trieste|udine|varese|venezia|verbano cusio ossola|vercelli|verona|vibo valentia|vicenza|viterbo`.split('|');

export const normalizeProvince=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’\-–—]/g,' ').replace(/^citta metropolitana di /,'').replace(/monza e brianza/,'monza brianza').replace(/pesaro e urbino/,'pesaro urbino').replace(/verbano cusio ossola/,'verbano cusio ossola').replace(/\s+/g,' ').trim();
