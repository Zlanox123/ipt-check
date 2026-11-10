import type { Disability } from './types';

export type DetectionStatus = 'present' | 'absent' | 'uncertain';
export type HealthConditionKey = 'law104Severe'|'art381'|'walkingSevere'|'motorPermanent'|'pluriamputation'|'psychic'|'accompaniment'|'blind'|'deaf';
export interface HealthCondition { key:HealthConditionKey; label:string; status:DetectionStatus; quotes:string[] }

const labels:Record<HealthConditionKey,string>={
  law104Severe:'Art. 3, comma 3, Legge 104/1992', art381:'Art. 381 DPR 495/1992',
  walkingSevere:'Grave limitazione permanente della deambulazione', motorPermanent:'Ridotte o impedite capacità motorie permanenti',
  pluriamputation:'Pluriamputazioni', psychic:'Disabilità psichica o mentale', accompaniment:'Indennità di accompagnamento',
  blind:'Cecità', deaf:'Sordità'
};

function normalize(value:string){
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\b1\s*[o0]\s*4\b/g,'104').replace(/\b38[l|]\b/g,'381').replace(/c[o0]mma/g,'comma')
    .replace(/deambulaz[li1]one/g,'deambulazione').replace(/motor[li1]e/g,'motorie').replace(/psich[li1]c/g,'psichic')
    .replace(/non\s+vedente/g,'persona cieca').replace(/\s+/g,' ').trim();
}

const negativeBefore=/(?:\bnon\s+(?:risulta|sussiste|ricorre|presenta|e\s+affett[oa]|affett[oa]|riconosciut[oa])|\bassenza\s+di|\bsenza|\besclus[oa]|\bnegat[oa])[^.;:\n]{0,45}$/;
const negativeAround=/(?:non\s+(?:riconosciut[oa]|concess[oa]|spettante)|esito\s+negativo|non\s+sussiste)/;

function snippets(original:string, normalized:string, patterns:RegExp[], broad?:RegExp):{positive:string[];negative:string[];broad:string[]}{
  const result={positive:[] as string[],negative:[] as string[],broad:[] as string[]};
  const partsOriginal=original.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ü])|[;\n]+/).map(x=>x.trim()).filter(Boolean);
  const partsNormalized=partsOriginal.map(normalize);
  partsNormalized.forEach((part,i)=>{
    let exact=false;
    for(const pattern of patterns){
      const flags=pattern.flags.replace('g',''); const match=new RegExp(pattern.source,flags).exec(part); if(!match) continue;
      exact=true; const before=part.slice(Math.max(0,match.index-70),match.index); const around=part.slice(Math.max(0,match.index-45),Math.min(part.length,match.index+match[0].length+45));
      const target=negativeBefore.test(before)||negativeAround.test(around.replace(match[0],''))?'negative':'positive'; result[target].push(partsOriginal[i]); break;
    }
    if(!exact&&broad?.test(part)) result.broad.push(partsOriginal[i]);
  });
  if(!partsOriginal.length&&normalized) result.broad.push(original);
  return result;
}

function statusOf(found:ReturnType<typeof snippets>):DetectionStatus{
  if(found.positive.length&&found.negative.length) return 'uncertain';
  if(found.positive.length) return 'present';
  if(found.negative.length) return 'absent';
  return found.broad.length?'uncertain':'absent';
}

export function inferFromText(text:string){
  const t=normalize(text);
  const found:Record<HealthConditionKey,ReturnType<typeof snippets>>={
    law104Severe:snippets(text,t,[/art\.?\s*3\s*(?:,|\s)?\s*(?:comma|c\.?|co\.?)[\s.]*3\b/,/handicap\s+(?:in\s+situazione\s+di\s+)?gravita\b/],/legge\s*104|l\.?\s*104/),
    art381:snippets(text,t,[/art\.?\s*381\b[^.;\n]{0,35}(?:d\.?p\.?r\.?)?\s*495(?:\/|\s+del\s+)?1992|art\.?\s*381\b/]),
    walkingSevere:snippets(text,t,[/grave\s+limitazione[^.;\n]{0,45}permanent[^.;\n]{0,45}deambul/,/deambul[^.;\n]{0,45}grave[^.;\n]{0,45}permanent/],/deambul/),
    motorPermanent:snippets(text,t,[/(?:ridott[ea]|impedit[ea])\s+(?:o\s+(?:ridott[ea]|impedit[ea])\s+)?capacita\s+motorie\s+permanent/],/capacita\s+motorie/),
    pluriamputation:snippets(text,t,[/pluri[\s-]?amput|amputazioni\s+multiple/],/amput/),
    psychic:snippets(text,t,[/(?:disabilita|handicap|invalidita)[^.;\n]{0,35}(?:psichic|mental)|(?:psichic|mental)[^.;\n]{0,35}(?:disabilita|handicap|invalidita)/],/psichic|mental/),
    accompaniment:snippets(text,t,[/indennita\s+(?:di\s+)?accompagnamento|accompagnamento\s+(?:riconosciut|concess)/],/accompagnamento/),
    blind:snippets(text,t,[/cecita|ciec[oa]|persona\s+cieca|ipovedente\s+grave/],/minorazione\s+visiva/),
    deaf:snippets(text,t,[/sordomut|sordita|\bsord[oa]\b/],/minorazione\s+uditiva/)
  };
  const conditions=(Object.keys(found) as HealthConditionKey[]).map(key=>({key,label:labels[key],status:statusOf(found[key]),quotes:[...new Set([...found[key].positive,...found[key].negative,...found[key].broad])]}));
  const get=(key:HealthConditionKey)=>conditions.find(x=>x.key===key)!;
  const candidates:[HealthConditionKey,Disability][]=[['walkingSevere','walking-severe'],['motorPermanent','motor-reduced'],['pluriamputation','pluriamputation'],['psychic','psychic'],['blind','blind'],['deaf','deaf']];
  const present=candidates.filter(([key])=>get(key).status==='present');
  const disability:Disability=present.length===1?present[0][1]:'unknown';
  const bool=(key:HealthConditionKey):boolean|null=>get(key).status==='present'?true:get(key).status==='absent'&&get(key).quotes.length?false:null;
  const relevant=conditions.filter(x=>x.quotes.length);
  const requiresManualConfirmation=disability==='unknown'||present.length>1||relevant.some(x=>x.status==='uncertain');
  return {
    law104Severe:bool('law104Severe'), art381:bool('art381'), accompaniment:bool('accompaniment'), permanentMotorLimitation:bool('motorPermanent'), disability,
    conditions, originalPhrases:[...new Set(relevant.flatMap(x=>x.quotes))], requiresManualConfirmation
  };
}
