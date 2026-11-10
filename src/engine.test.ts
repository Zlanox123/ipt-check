import { describe,expect,it } from 'vitest';
import { evaluateCase } from './engine';
import { iptPraRules } from './data/iptPraRules';
import type { CaseData } from './types';

const base:CaseData={disability:'walking-severe',law104Severe:true,accompaniment:false,permanentMotorLimitation:false,owner:'person',dependent:null,dependentIsChild:null,adapted:false,adaptationOnRegistration:false,fuel:'petrol',displacement:1600,vehicleCategory:'car',region:'Lazio',province:'Roma',oneVehicleOnly:true,previousVehicleStolen:null,lossOfPossessionRecorded:null,documentText:'',manualRules:''};
const result=(changes:Partial<CaseData>={})=>evaluateCase({...base,...changes});

describe('regole IPT ed emolumenti PRA',()=>{
  it('mantiene tre esiti indipendenti',()=>expect(result()).toHaveLength(3));
  it('riconosce l’esenzione IPT nazionale completa',()=>expect(result()[0].outcome).toBe('eligible'));
  it('distingue cecità IPT ed emolumenti PRA a Roma',()=>{const [ipt,pra]=result({disability:'blind'});expect(ipt.outcome).toBe('not-eligible');expect(pra.outcome).toBe('eligible')});
  it('applica l’esenzione sensoriale provinciale totale verificata',()=>expect(result({disability:'deaf',province:'Arezzo'})[0].outcome).toBe('eligible'));
  it('applica la disciplina nazionale nelle Province ordinarie senza deroga',()=>expect(result({disability:'blind',province:'Napoli'})[0].outcome).toBe('not-eligible'));
  it('mantiene indeterminata una Provincia non riconoscibile',()=>expect(result({disability:'blind',province:'Atlantide'})[0].outcome).toBe('unverified'));
  it('applica l’esenzione nazionale anche senza deroghe provinciali',()=>expect(result({disability:'walking-severe',province:'Napoli'})[0].outcome).toBe('eligible'));
  it('non equipara una categoria sanitaria indeterminata',()=>expect(result({disability:'unknown'})[0].outcome).toBe('insufficient'));
  it('richiede accompagnamento per disabilità psichica',()=>{expect(result({disability:'psychic',accompaniment:null})[0].outcome).toBe('insufficient');expect(result({disability:'psychic',accompaniment:false})[1].outcome).toBe('not-eligible')});
  it('richiede adattamento per capacità motorie ridotte',()=>{const [,pra]=result({disability:'motor-reduced',adapted:false,province:'Napoli'});expect(pra.outcome).toBe('not-eligible')});
  it('applica solo all’IPT la deroga provinciale per minori',()=>{const [ipt,pra]=result({disability:'motor-reduced',adapted:false,province:'Roma',disabledAge:17,law104Severe:true});expect(ipt.outcome).toBe('eligible');expect(pra.outcome).toBe('not-eligible')});
  it('applica la deroga di Bolzano per sindrome di Down',()=>expect(result({disability:'psychic',accompaniment:false,downSyndrome:true,province:'Bolzano'})[0].outcome).toBe('eligible'));
  it('non presume la deroga di Bolzano senza accertamento',()=>expect(result({disability:'psychic',accompaniment:false,downSyndrome:null,province:'Bolzano'})[0].outcome).toBe('insufficient'));
  it('richiede dati reddituali quando intestatario è il familiare',()=>expect(result({owner:'family',dependent:true})[0].outcome).toBe('insufficient'));
  it('applica il limite reddituale ordinario',()=>expect(result({owner:'family',dependent:true,dependentIncome:2841,dependentIsChild:false})[0].outcome).toBe('not-eligible'));
  it('applica il limite di 4.000 euro ai figli fino a 24 anni',()=>expect(result({owner:'family',dependent:true,dependentIncome:3999,dependentIsChild:true,dependentAge:24})[0].outcome).toBe('eligible'));
  it.each([
    ['petrol',2000,undefined,'eligible'],['petrol',2001,undefined,'not-eligible'],
    ['diesel',2800,undefined,'eligible'],['diesel',2801,undefined,'not-eligible'],
    ['hybrid',2000,'petrol','eligible'],['hybrid',2001,'petrol','not-eligible'],
    ['hybrid',2800,'diesel','eligible'],['hybrid',2801,'diesel','not-eligible']
  ] as const)('controlla limite %s %s', (fuel,displacement,hybridType,outcome)=>expect(result({fuel,displacement,hybridType})[0].outcome).toBe(outcome));
  it('non presume il tipo di alimentazione ibrida',()=>expect(result({fuel:'hybrid',displacement:1800,hybridType:undefined})[0].outcome).toBe('insufficient'));
  it('controlla il limite elettrico a 150 kW',()=>{expect(result({fuel:'electric',powerKw:150,displacement:undefined})[0].outcome).toBe('eligible');expect(result({fuel:'electric',powerKw:151,displacement:undefined})[0].outcome).toBe('not-eligible')});
  it('esclude una categoria di veicolo non ammessa',()=>expect(result({vehicleCategory:'camper'})[0].outcome).toBe('not-eligible'));
  it('non applica limiti tecnici IPT agli emolumenti PRA',()=>expect(result({fuel:'electric',powerKw:500,displacement:undefined})[1].outcome).toBe('eligible'));
  it('richiede prove per la deroga del secondo veicolo rubato',()=>expect(result({oneVehicleOnly:false})[0].outcome).toBe('insufficient'));
  it('applica la deroga provinciale per furto e perdita di possesso',()=>expect(result({oneVehicleOnly:false,previousVehicleStolen:true,lossOfPossessionRecorded:true})[0].outcome).toBe('eligible'));
  it('nega il secondo veicolo quando la condizione verificata manca',()=>expect(result({oneVehicleOnly:false,previousVehicleStolen:false,lossOfPossessionRecorded:true})[0].outcome).toBe('not-eligible'));
  it('non produce SPETTANTE quando manca un requisito essenziale',()=>{
    const cases:[Partial<CaseData>,number[]][]=[
      [{disability:'unknown'},[0,1,2]],[{owner:'unknown'},[0,2]],[{province:''},[0]],
      [{displacement:undefined},[0,2]],[{oneVehicleOnly:null},[0,2]],
      [{disability:'psychic',accompaniment:null},[0,1,2]],[{disability:'motor-reduced',adapted:null},[0,1,2]],
      [{fuel:'hybrid',hybridType:undefined},[0,2]],[{fuel:'electric',powerKw:undefined,displacement:undefined},[0,2]]
    ];
    cases.forEach(([changes,indexes])=>indexes.forEach(index=>expect(result(changes)[index].outcome).not.toBe('eligible')));
  });
  it('associa metadati verificati a ogni regola IPT/PRA',()=>iptPraRules.forEach(rule=>{expect(rule.url).toMatch(/^https:\/\//);expect(rule.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(rule.verifiedOn).toBe('2026-11-10');expect(rule.status).toBe('verified')}));
});
