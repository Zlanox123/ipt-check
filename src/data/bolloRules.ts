export type TerritoryStatus='verified'|'national-only'|'unverified';
export interface BolloTerritoryRule {
  id:string; territory:string; status:TerritoryStatus; sourceTitle:string; url:string; validFrom:string|null; verifiedOn:string;
  procedure:string; maxPowerKwAllFuels?:number; allowCamper?:boolean; allowQuadricycle?:boolean; allowArt381WithSevere?:boolean;
  allowSevere104AnyPathology?:boolean; allowDownWithoutAccompaniment?:boolean;
}

const aci=(slug:string)=>`https://aci.gov.it/approfondimento/guida-al-bollo-auto/regioni-e-province-autonome-convenzionate/${slug}/`;
const standard=(id:string,territory:string,slug:string,procedure:string):BolloTerritoryRule=>({id,territory,status:'verified',sourceTitle:`ACI Gov – ${territory}`,url:aci(slug),validFrom:null,verifiedOn:'2026-11-10',procedure});

export const bolloTerritories:BolloTerritoryRule[]=[
  standard('abruzzo','Abruzzo','regione-abruzzo','Domanda esclusivamente online tramite Sportello dei servizi regionali con SPID/CIE.'),
  standard('basilicata','Basilicata','regione-basilicata','Domanda tramite Unità Territoriali ACI e canali indicati dalla Regione.'),
  {id:'calabria',territory:'Calabria',status:'national-only',sourceTitle:'Regione Calabria – procedimenti tassa automobilistica',url:'https://trasparenzaold.regione.calabria.it/index.php?Itemid=847&id=12353_c7826ac00c393e4e4d012338bc4a1db0&option=com_k2&task=download&view=item',validFrom:null,verifiedOn:'2026-11-10',procedure:'Istanza via PEC, consegna diretta o posta agli sportelli regionali; disciplina sostanziale nazionale verificata, eventuali estensioni regionali non validate.'},
  standard('campania','Campania','regione-campania','Domanda agli uffici regionali/ACI indicati nella pagina ufficiale.'),
  standard('emilia-romagna','Emilia-Romagna','regione-emilia-romagna','Domanda tramite Unità Territoriali ACI, Delegazioni o canali regionali abilitati.'),
  standard('friuli-venezia-giulia','Friuli Venezia Giulia','regione-friuli-venezia-giulia','Domanda all’Ufficio territoriale competente dell’Agenzia delle Entrate.'),
  standard('lazio','Lazio','regione-lazio','Domanda telematica sulla piattaforma regionale EBAD secondo la provincia di residenza.'),
  standard('liguria','Liguria','regione-liguria','Domanda agli Uffici ACI competenti, anche via PEC o raccomandata A/R.'),
  {...standard('lombardia','Lombardia','regione-lombardia','Domanda a Regione Lombardia tramite ACI, intermediari autorizzati o portale tributi.'),validFrom:'2025-01-01',maxPowerKwAllFuels:185,allowCamper:true,allowQuadricycle:true,allowSevere104AnyPathology:true,allowDownWithoutAccompaniment:true},
  {id:'marche',territory:'Marche',status:'verified',sourceTitle:'Regione Marche – Tassa automobilistica',url:'https://www.regione.marche.it/Regione-Utile/Finanze-e-Tributi/Tassa-Automobilistica',validFrom:'2024-07-25',verifiedOn:'2026-11-10',procedure:'Domanda alla Regione almeno 90 giorni prima della scadenza, tramite i canali regionali indicati.'},
  {id:'molise',territory:'Molise',status:'verified',sourceTitle:'Regione Molise – riduzioni ed esenzioni per veicoli destinati a persone con disabilità',url:'https://www.regione.molise.it/flex/cm/pages/ServeAttachment.php/L/IT/D/1%252Fb%252F5%252FD.44cd0f6f7f8336ba5969/P/BLOB%3AID%3D364/E/pdf?mode=download',validFrom:null,verifiedOn:'2026-11-10',procedure:'Domanda allo Sportello regionale della tassa automobilistica; per l’anno corrente entro il termine utile di pagamento, ai sensi dell’art. 25, comma 2, L.R. 11/2014.'},
  {id:'piemonte',territory:'Piemonte',status:'verified',sourceTitle:'Regione Piemonte – esenzione per persone con disabilità',url:'https://www.regione.piemonte.it/web/temi/tributi/tassa-automobilistica-bollo-auto/esenzioni-dalla-tassa-automobilistica-per-persone-disabilita',validFrom:'2025-02-10',verifiedOn:'2026-11-10',procedure:'Domanda telematica entro 90 giorni dal termine di pagamento tramite Tassa Auto Piemonte.',allowArt381WithSevere:true},
  standard('puglia','Puglia','regione-puglia','Domanda presso Unità Territoriali ACI, PEC, Delegazioni ACI o agenzie autorizzate.'),
  standard('sardegna','Sardegna','regione-sardegna','Domanda agli uffici dell’Agenzia delle Entrate competenti per territorio.'),
  standard('sicilia','Sicilia','regione-sicilia','Domanda alla Regione Siciliana tramite gli Studi di Consulenza autorizzati.'),
  standard('toscana','Toscana','regione-toscana','Domanda tramite Studi di Consulenza entro 180 giorni dalla scadenza ordinaria.'),
  {id:'trentino-alto-adige',territory:'Trentino-Alto Adige',status:'verified',sourceTitle:'ACI Gov – Province autonome convenzionate',url:'https://aci.gov.it/approfondimento/guida-al-bollo-auto/regioni-e-province-autonome-convenzionate/',validFrom:null,verifiedOn:'2026-11-10',procedure:'La disciplina è amministrata separatamente dalle Province autonome: indicare Trento o Bolzano.'},
  standard('umbria','Umbria','regione-umbria','Domanda tramite Portale Istanze, Unità Territoriali ACI, Delegazioni o agenzie autorizzate.'),
  {id:'valle-aosta',territory:'Valle d’Aosta',status:'verified',sourceTitle:'Regione autonoma Valle d’Aosta – esenzione disabilità',url:'https://www.regione.vda.it/finanze/tributi/bollo_auto/esenzione_disabili_i.aspx',validFrom:'2018-01-01',verifiedOn:'2026-11-10',procedure:'Domanda alla Struttura disabilità e invalidità civile entro 90 giorni dalla scadenza.'},
  {id:'veneto',territory:'Veneto',status:'verified',sourceTitle:'Regione Veneto – Bollo auto',url:'https://www.regione.veneto.it/web/tributi-regionali/bolloauto',validFrom:'2023-01-01',verifiedOn:'2026-11-10',procedure:'Domanda online tramite Portale Bollo Auto con SPID/CIE.',allowDownWithoutAccompaniment:true},
  standard('trento','Provincia autonoma di Trento','provincia-autonoma-di-trento','Domanda tramite Portale Istanze ACI, Unità Territoriale ACI, Delegazioni o agenzie autorizzate.'),
  {...standard('bolzano','Provincia autonoma di Bolzano','provincia-autonoma-di-bolzano','Domanda ad Alto Adige Riscossioni.'),validFrom:'2025-01-01',allowSevere104AnyPathology:true,allowDownWithoutAccompaniment:true}
];

const normalize=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
export function resolveBolloTerritory(region:string,province:string){
  const r=normalize(region),p=normalize(province);
  if(r.includes('trentino')||r.includes('alto adige')){
    if(p.includes('bolzano')||p.includes('bozen')) return bolloTerritories.find(x=>x.id==='bolzano');
    if(p.includes('trento')) return bolloTerritories.find(x=>x.id==='trento');
  }
  if(r.includes('provincia autonoma di bolzano')) return bolloTerritories.find(x=>x.id==='bolzano');
  if(r.includes('provincia autonoma di trento')) return bolloTerritories.find(x=>x.id==='trento');
  return bolloTerritories.find(x=>normalize(x.territory)===r);
}
