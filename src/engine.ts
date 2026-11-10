import type { Benefit, CaseData, Decision } from './types';
import { knownItalianProvinces, minorAdaptationWaiverProvinces, normalizeProvince, sensoryFullExemptionProvinces, sensoryReducedOnlyProvinces, theftSecondVehicleProvinces } from './data/iptPraRules';
import { resolveBolloTerritory } from './data/bolloRules';

const labels:Record<Benefit,string>={ipt:'IPT',pra:'Emolumenti PRA',bollo:'Bollo auto'};
const nationalIptCategories=['psychic','motor-reduced','walking-severe','pluriamputation'];
const praCategories=[...nationalIptCategories,'blind','deaf'];

function decision(benefit:Benefit,sources:string[]):Decision{
  return {benefit,outcome:'insufficient',title:labels[benefit],reasons:[],missing:[],sources,validity:'Regole verificate il 10/11/2026 sulle fonti ufficiali indicate. Verificare variazioni successive prima della pratica.'};
}
function insufficient(d:Decision,...missing:string[]){d.outcome='insufficient';d.missing.push(...missing);d.reasons.push('I dati disponibili non consentono una decisione deterministica.');return d}
function denied(d:Decision,reason:string){d.outcome='not-eligible';d.reasons.push(reason);return d}

function evaluatePra(c:CaseData):Decision{
  const d=decision('pra',['DM-2013-PRA','ACI-FAQ']);
  if(c.disability==='unknown'||c.disability==='motor-severe') return insufficient(d,'categoria sanitaria specifica risultante dal verbale');
  if(c.disability==='none'||!praCategories.includes(c.disability)) return denied(d,'La categoria sanitaria accertata non rientra tra quelle previste per gli emolumenti PRA.');
  if(c.disability==='psychic'){
    if(c.accompaniment===null) return insufficient(d,'riconoscimento dell’indennità di accompagnamento');
    if(c.accompaniment===false) return denied(d,'Per la disabilità psichica o mentale manca l’indennità di accompagnamento richiesta.');
  }
  if(c.disability==='motor-reduced'){
    if(c.adapted===null) return insufficient(d,'presenza dell’adattamento in funzione della disabilità motoria');
    if(c.adapted===false) return denied(d,'Per le ridotte o impedite capacità motorie permanenti il veicolo non risulta adattato.');
    if(c.adaptationOnRegistration===null) return insufficient(d,'annotazione dell’adattamento sulla carta di circolazione');
    if(c.adaptationOnRegistration===false) return denied(d,'L’adattamento richiesto non risulta dalla carta di circolazione.');
  }
  d.outcome='eligible';
  d.reasons.push('La categoria sanitaria e le condizioni specifiche risultano compatibili con l’esenzione degli emolumenti PRA.');
  d.reasons.push('Non sono applicati i limiti propri dell’IPT relativi a intestazione, singolo veicolo, rivendita o caratteristiche tecniche.');
  return d;
}

function vehicleMissing(c:CaseData):string[]{
  const missing:string[]=[];
  if(c.vehicleCategory==='unknown'||c.vehicleCategory==='other') missing.push('categoria del veicolo verificabile');
  if(c.fuel==='other') missing.push('alimentazione verificabile');
  if(c.fuel==='hybrid'&&!c.hybridType) missing.push('tipo di alimentazione primaria dell’ibrido (benzina o diesel)');
  if(['petrol','diesel','hybrid'].includes(c.fuel)&&c.displacement===undefined) missing.push('cilindrata');
  if(c.fuel==='electric'&&c.powerKw===undefined) missing.push('potenza in kW');
  return missing;
}
function vehicleWithinIptLimits(c:CaseData){
  if(c.fuel==='electric') return (c.powerKw??Infinity)<=150;
  const fuel=c.fuel==='hybrid'?c.hybridType:c.fuel;
  if(fuel==='petrol') return (c.displacement??Infinity)<=2000;
  if(fuel==='diesel') return (c.displacement??Infinity)<=2800;
  return false;
}

function evaluateIpt(c:CaseData):Decision{
  const d=decision('ipt',['ACI-IPT','ACI-FAQ','ACI-PRESUPPOSTI']);
  const province=normalizeProvince(c.province);
  const bolzanoBroad=province==='bolzano'&&c.law104Severe===true;
  const missing:string[]=[];
  if(!c.province) missing.push('provincia o città metropolitana competente');
  if(c.disability==='unknown'||(c.disability==='motor-severe'&&!bolzanoBroad)) missing.push('categoria sanitaria specifica risultante dal verbale');
  if(c.owner==='unknown') missing.push('intestatario del veicolo');
  if(c.owner==='family'){
    if(c.dependent===null) missing.push('prova del carico fiscale');
    if(c.dependent===true&&c.dependentIncome===undefined) missing.push('reddito complessivo annuo della persona con disabilità');
    if(c.dependent===true&&c.dependentIsChild==null) missing.push('rapporto di figlio ai fini del limite reddituale');
    if(c.dependent===true&&c.dependentIsChild===true&&c.dependentAge===undefined) missing.push('età del figlio fiscalmente a carico');
  }
  missing.push(...vehicleMissing(c));
  if(c.oneVehicleOnly===null) missing.push('situazione delle precedenti agevolazioni IPT');
  if(c.disability==='psychic'&&c.accompaniment===null&&!(province==='bolzano'&&c.downSyndrome===true)) missing.push('riconoscimento dell’indennità di accompagnamento');
  if(c.disability==='psychic'&&c.accompaniment===false&&province==='bolzano'&&c.downSyndrome==null) missing.push('eventuale accertamento della sindrome di Down per la deroga provinciale');
  if(c.disability==='motor-reduced'&&c.adapted===null) missing.push('presenza dell’adattamento del veicolo');
  if(c.disability==='motor-reduced'&&c.adapted===true&&c.adaptationOnRegistration===null) missing.push('annotazione dell’adattamento sulla carta di circolazione');
  if(missing.length) return insufficient(d,...missing);

  if(c.owner==='other') return denied(d,'Il veicolo non è intestato alla persona con disabilità né al familiare che la ha fiscalmente a carico.');
  if(c.owner==='family'){
    if(c.dependent===false) return denied(d,'La persona con disabilità non risulta fiscalmente a carico dell’intestatario.');
    const limit=c.dependentIsChild&&c.dependentAge!==undefined&&c.dependentAge<=24?4000:2840.51;
    if((c.dependentIncome??Infinity)>limit) return denied(d,`Il reddito complessivo supera il limite di € ${limit.toLocaleString('it-IT')} per il carico fiscale dichiarato.`);
  }
  if(c.disability==='none') return denied(d,'Non risulta una categoria sanitaria ammessa.');
  if(c.disability==='psychic'&&c.accompaniment===false){
    if(province==='bolzano'&&c.downSyndrome===true){d.sources.push('ACI-IPT-TERRITORIAL');d.reasons.push('Applicata la deroga della Provincia di Bolzano per sindrome di Down senza indennità di accompagnamento.');}
    else return denied(d,'Per la disabilità psichica o mentale manca l’indennità di accompagnamento richiesta.');
  }

  if(c.disability==='motor-reduced'){
    if(c.adapted===false){
      if(minorAdaptationWaiverProvinces.includes(province)){
        if(c.disabledAge===undefined||c.law104Severe===null) return insufficient(d,'età della persona con disabilità','riconoscimento art. 3, comma 3, Legge 104/1992');
        if(!(c.disabledAge<18&&c.law104Severe===true)) return denied(d,'La deroga provinciale all’adattamento non è applicabile alle condizioni dichiarate.');
        d.reasons.push('Applicata la deroga provinciale verificata per minori con disabilità grave e capacità motorie permanenti ridotte o impedite.');
      }else return denied(d,'Per le ridotte o impedite capacità motorie permanenti il veicolo deve essere adattato.');
    }else if(c.adaptationOnRegistration===false) return denied(d,'L’adattamento non risulta dalla carta di circolazione.');
  }

  const sensory=c.disability==='blind'||c.disability==='deaf';
  if(sensory){
    d.sources.push('ACI-IPT-TERRITORIAL');
    if(sensoryFullExemptionProvinces.includes(province)) d.reasons.push('La Provincia risulta tra quelle con esenzione totale IPT verificata per disabilità sensoriali.');
    else if(sensoryReducedOnlyProvinces.includes(province)) return denied(d,'Per la Provincia indicata risulta verificata una riduzione o tariffa agevolata, non l’esenzione totale IPT.');
    else if(knownItalianProvinces.includes(province)) return denied(d,'La categoria sensoriale non dà diritto all’esenzione IPT nazionale e non risulta una deroga di esenzione totale nell’elenco provinciale ACI verificato.');
    else {d.outcome='unverified';d.reasons.push('La Provincia indicata non è riconoscibile o non è coperta dalla fonte territoriale validata.');return d}
  }else if(!nationalIptCategories.includes(c.disability)&&!bolzanoBroad) return denied(d,'La categoria sanitaria non rientra tra quelle ammesse all’esenzione IPT nazionale.');
  if(bolzanoBroad&&!nationalIptCategories.includes(c.disability)){d.sources.push('ACI-IPT-TERRITORIAL');d.reasons.push('Applicata l’esenzione provinciale di Bolzano per disabilità grave ex art. 3, comma 3, Legge 104/1992.');}

  if(!['car','mixed','specific','motorcycle'].includes(c.vehicleCategory)) return denied(d,'La categoria del veicolo non rientra tra quelle ammesse all’esenzione IPT.');
  if(!vehicleWithinIptLimits(c)) return denied(d,'Il veicolo supera il limite applicabile: 2.000 cc benzina/ibrido benzina, 2.800 cc diesel/ibrido diesel o 150 kW elettrico.');

  if(c.oneVehicleOnly===false){
    if(!theftSecondVehicleProvinces.includes(province)) return denied(d,'Risulta già utilizzata l’agevolazione per un veicolo non venduto o cancellato dal PRA.');
    if(c.previousVehicleStolen==null||c.lossOfPossessionRecorded==null) return insufficient(d,'prova del furto del veicolo precedente','annotazione PRA della perdita di possesso');
    if(!c.previousVehicleStolen||!c.lossOfPossessionRecorded) return denied(d,'Non risultano soddisfatte le condizioni provinciali per il secondo veicolo in caso di furto.');
    d.reasons.push('Applicata la deroga provinciale verificata per secondo veicolo dopo furto e perdita di possesso annotata al PRA.');
  }
  d.outcome='eligible';
  d.reasons.push('I requisiti nazionali e le eventuali condizioni provinciali applicabili risultano verificati.');
  return d;
}

function evaluateBollo(c:CaseData):Decision{
  const preliminary=decision('bollo',['ACI-PRESUPPOSTI']);
  if(!c.region) return insufficient(preliminary,'regione o provincia autonoma competente');
  if(c.region==='Trentino-Alto Adige'&&!c.province) return insufficient(preliminary,'Provincia autonoma di Trento o Bolzano');
  const territory=resolveBolloTerritory(c.region,c.province);
  if(!territory||territory.status==='unverified'){
    preliminary.outcome='unverified';
    preliminary.reasons.push(territory?.procedure??'Non è disponibile una fonte territoriale validata per la giurisdizione indicata.');
    return preliminary;
  }
  const d=decision('bollo',[`BOLLO-${territory.id}`,'ACI-BOLLO','ACI-PRESUPPOSTI']);
  d.validity=`Fonte territoriale valida dal ${territory.validFrom??'periodo non determinato'}, verificata il ${territory.verifiedOn}.`;
  const territorialBroad=territory.allowSevere104AnyPathology===true&&c.law104Severe===true&&c.disability!=='none';
  const territorialArt381=territory.allowArt381WithSevere===true&&c.art381===true&&c.law104Severe===true;
  const territorialDown=territory.allowDownWithoutAccompaniment===true&&c.downSyndrome===true;
  const territorialExtensionsUnknown=territory.status==='national-only';
  const missing:string[]=[];
  if(c.disability==='unknown'&&!territorialBroad&&!territorialArt381&&!territorialDown) missing.push('categoria di disabilità risultante dal verbale');
  if(c.disability==='motor-severe'&&!territorialBroad) missing.push('categoria sanitaria specifica risultante dal verbale');
  if(c.owner==='unknown') missing.push('intestatario del veicolo');
  if(c.owner==='family'){
    if(c.dependent===null) missing.push('prova del carico fiscale');
    if(c.dependent===true&&c.dependentIncome===undefined) missing.push('reddito complessivo annuo della persona con disabilità');
    if(c.dependent===true&&c.dependentIsChild==null) missing.push('rapporto di figlio ai fini del limite reddituale');
    if(c.dependent===true&&c.dependentIsChild===true&&c.dependentAge===undefined) missing.push('età del figlio fiscalmente a carico');
  }
  if(c.vehicleCategory==='unknown'||c.vehicleCategory==='other') missing.push('categoria del veicolo verificabile');
  if(c.fuel==='other') missing.push('alimentazione verificabile');
  if(territory.maxPowerKwAllFuels!==undefined){if(c.powerKw===undefined) missing.push('potenza complessiva in kW');}
  else {
    if(c.fuel==='hybrid'&&!c.hybridType) missing.push('tipo di alimentazione primaria dell’ibrido');
    if(['petrol','diesel','hybrid'].includes(c.fuel)&&c.displacement===undefined) missing.push('cilindrata');
    if(c.fuel==='electric'&&c.powerKw===undefined) missing.push('potenza in kW');
  }
  if(c.oneVehicleOnly===null) missing.push('indicazione del veicolo prescelto');
  if(c.disability==='psychic'&&c.accompaniment===null&&!territorialDown) missing.push('riconoscimento dell’indennità di accompagnamento');
  if(c.disability==='motor-reduced'&&!territorialBroad){
    if(c.adapted===null) missing.push('presenza dell’adattamento del veicolo');
    if(c.adapted===true&&c.adaptationOnRegistration===null) missing.push('annotazione dell’adattamento sulla carta di circolazione');
  }
  if(missing.length) return insufficient(d,...missing);
  if(c.owner==='other') return denied(d,'Il veicolo non è intestato alla persona con disabilità né al familiare che la ha fiscalmente a carico.');
  if(c.owner==='family'){
    if(c.dependent===false) return denied(d,'La persona con disabilità non risulta fiscalmente a carico dell’intestatario.');
    const limit=c.dependentIsChild&&c.dependentAge!==undefined&&c.dependentAge<=24?4000:2840.51;
    if((c.dependentIncome??Infinity)>limit) return denied(d,`Il reddito complessivo supera il limite di € ${limit.toLocaleString('it-IT')}.`);
  }
  if(c.oneVehicleOnly===false) return denied(d,'L’esenzione bollo può essere associata a un solo veicolo prescelto.');
  if(c.disability==='none') return denied(d,'Non risulta una categoria sanitaria ammessa.');
  if(c.disability==='psychic'&&c.accompaniment===false&&!territorialDown){
    if(territorialExtensionsUnknown){d.outcome='unverified';d.reasons.push('Il requisito nazionale dell’accompagnamento manca e non è stato possibile validare eventuali estensioni territoriali.');return d}
    return denied(d,'Per la disabilità psichica o mentale manca l’indennità di accompagnamento richiesta.');
  }
  if(c.disability==='motor-reduced'&&!territorialBroad){
    if(c.adapted===false){if(territorialExtensionsUnknown){d.outcome='unverified';d.reasons.push('L’adattamento nazionale manca e non sono state validate eventuali deroghe territoriali.');return d}return denied(d,'Per le ridotte o impedite capacità motorie permanenti il veicolo deve essere adattato.');}
    if(c.adaptationOnRegistration===false) return denied(d,'L’adattamento non risulta dalla carta di circolazione.');
  }
  const nationalCategory=['blind','deaf','psychic','motor-reduced','walking-severe','pluriamputation'].includes(c.disability);
  if(!nationalCategory&&!territorialBroad&&!territorialArt381&&!territorialDown){if(territorialExtensionsUnknown){d.outcome='unverified';d.reasons.push('La categoria non rientra nella disciplina nazionale e le estensioni territoriali non sono state validate.');return d}return denied(d,'La categoria sanitaria non rientra tra quelle ammesse nel territorio.');}
  const allowedVehicle=['car','mixed','specific','motorcycle'].includes(c.vehicleCategory)||(territory.allowCamper&&c.vehicleCategory==='camper')||(territory.allowQuadricycle&&c.vehicleCategory==='quadricycle');
  if(!allowedVehicle){if(territorialExtensionsUnknown){d.outcome='unverified';d.reasons.push('Il veicolo non rientra nelle categorie nazionali e le estensioni territoriali non sono state validate.');return d}return denied(d,'La categoria del veicolo non rientra tra quelle ammesse nel territorio.');}
  if(territory.maxPowerKwAllFuels!==undefined){
    if((c.powerKw??Infinity)>territory.maxPowerKwAllFuels) return denied(d,`La potenza supera il limite territoriale di ${territory.maxPowerKwAllFuels} kW.`);
  }else if(!vehicleWithinIptLimits(c)){if(territorialExtensionsUnknown){d.outcome='unverified';d.reasons.push('Il veicolo supera i limiti nazionali e non sono state validate eventuali deroghe territoriali.');return d}return denied(d,'Il veicolo supera il limite applicabile: 2.000 cc benzina/ibrido benzina, 2.800 cc diesel/ibrido diesel o 150 kW elettrico.');}
  d.outcome='eligible';
  d.reasons.push('I requisiti nazionali e le disposizioni territoriali applicabili risultano verificati.');
  if(territorialArt381) d.reasons.push('Applicata la specifica estensione piemontese: l’art. 381 è valutato separatamente e congiuntamente all’art. 3, comma 3, Legge 104/1992.');
  if(territorialBroad) d.reasons.push('Applicata l’estensione territoriale verificata per necessità di sostegno intensivo ex art. 3, comma 3, Legge 104/1992.');
  if(territorialDown) d.reasons.push('Applicata la disposizione territoriale verificata per sindrome di Down.');
  d.reasons.push(`Procedura: ${territory.procedure}`);
  return d;
}

export function evaluateCase(c:CaseData):Decision[]{return [evaluateIpt(c),evaluatePra(c),evaluateBollo(c)]}
