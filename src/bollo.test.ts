import { describe,expect,it } from 'vitest';
import { evaluateCase } from './engine';
import { bolloTerritories } from './data/bolloRules';
import { regions,territorialCoverage } from './data/norms';
import type { CaseData } from './types';

const base:CaseData={disability:'walking-severe',law104Severe:true,art381:false,accompaniment:false,permanentMotorLimitation:false,downSyndrome:false,owner:'person',dependent:null,dependentIsChild:null,adapted:false,adaptationOnRegistration:false,fuel:'petrol',displacement:1600,powerKw:100,vehicleCategory:'car',region:'Lazio',province:'Roma',oneVehicleOnly:true,documentText:'',manualRules:''};
const bollo=(changes:Partial<CaseData>={})=>evaluateCase({...base,...changes})[2];

describe('motore bollo territoriale',()=>{
  const cases:[string,string,string][]=[
    ['Abruzzo','L’Aquila','eligible'],['Basilicata','Potenza','eligible'],['Calabria','Catanzaro','eligible'],['Campania','Napoli','eligible'],
    ['Emilia-Romagna','Bologna','eligible'],['Friuli Venezia Giulia','Udine','eligible'],['Lazio','Roma','eligible'],['Liguria','Genova','eligible'],
    ['Lombardia','Milano','eligible'],['Marche','Ancona','eligible'],['Molise','Campobasso','eligible'],['Piemonte','Torino','eligible'],
    ['Puglia','Bari','eligible'],['Sardegna','Cagliari','eligible'],['Sicilia','Palermo','eligible'],['Toscana','Firenze','eligible'],
    ['Trentino-Alto Adige','Trento','eligible'],['Umbria','Perugia','eligible'],['Valle d’Aosta','Aosta','eligible'],['Veneto','Venezia','eligible']
  ];
  it.each(cases)('%s restituisce %s', (region,province,outcome)=>expect(bollo({region,province}).outcome).toBe(outcome));
  it('verifica separatamente la Provincia autonoma di Trento',()=>expect(bollo({region:'Provincia autonoma di Trento',province:'Trento'}).outcome).toBe('eligible'));
  it('verifica separatamente la Provincia autonoma di Bolzano',()=>expect(bollo({region:'Provincia autonoma di Bolzano',province:'Bolzano'}).outcome).toBe('eligible'));
  it('richiede la Provincia autonoma per il Trentino-Alto Adige',()=>expect(bollo({region:'Trentino-Alto Adige',province:''}).outcome).toBe('insufficient'));
  it('in Calabria applica la disciplina nazionale ma non inventa estensioni regionali',()=>{expect(bollo({region:'Calabria',province:'Catanzaro'}).outcome).toBe('eligible');expect(bollo({region:'Calabria',province:'Catanzaro',disability:'psychic',accompaniment:false}).outcome).toBe('unverified')});
  it('applica in Lombardia il limite unico di 185 kW',()=>{expect(bollo({region:'Lombardia',province:'Milano',powerKw:185,displacement:5000}).outcome).toBe('eligible');expect(bollo({region:'Lombardia',province:'Milano',powerKw:186}).outcome).toBe('not-eligible')});
  it('ammette autocaravan solo dove verificato',()=>{expect(bollo({region:'Lombardia',province:'Milano',vehicleCategory:'camper'}).outcome).toBe('eligible');expect(bollo({region:'Lazio',province:'Roma',vehicleCategory:'camper'}).outcome).toBe('not-eligible')});
  it('applica a Bolzano l’estensione art. 3 comma 3 senza dedurre una categoria nazionale',()=>expect(bollo({region:'Trentino-Alto Adige',province:'Bolzano',disability:'motor-severe',law104Severe:true}).outcome).toBe('eligible'));
  it('valuta art. 381 solo nella specifica estensione piemontese',()=>{expect(bollo({region:'Piemonte',province:'Torino',disability:'unknown',art381:true,law104Severe:true}).outcome).toBe('eligible');expect(bollo({region:'Lazio',province:'Roma',disability:'unknown',art381:true,law104Severe:true}).outcome).toBe('insufficient')});
  it('non equipara art. 381 senza art. 3 comma 3 in Piemonte',()=>expect(bollo({region:'Piemonte',province:'Torino',disability:'unknown',art381:true,law104Severe:false}).outcome).toBe('insufficient'));
  it('applica la disposizione verificata per sindrome di Down',()=>expect(bollo({region:'Veneto',province:'Venezia',disability:'psychic',accompaniment:false,downSyndrome:true}).outcome).toBe('eligible'));
  it('richiede accompagnamento fuori dalle deroghe territoriali',()=>expect(bollo({region:'Lazio',province:'Roma',disability:'psychic',accompaniment:false,downSyndrome:true}).outcome).toBe('not-eligible'));
  it('richiede adattamento per ridotte capacità motorie',()=>expect(bollo({disability:'motor-reduced',adapted:false}).outcome).toBe('not-eligible'));
  it('controlla ibrido benzina e diesel separatamente',()=>{expect(bollo({fuel:'hybrid',hybridType:'petrol',displacement:2001}).outcome).toBe('not-eligible');expect(bollo({fuel:'hybrid',hybridType:'diesel',displacement:2800}).outcome).toBe('eligible')});
  it('non presume il tipo di ibrido',()=>expect(bollo({fuel:'hybrid',hybridType:undefined}).outcome).toBe('insufficient'));
  it('controlla il limite elettrico nazionale',()=>expect(bollo({fuel:'electric',powerKw:151,displacement:undefined}).outcome).toBe('not-eligible'));
  it('verifica carico fiscale e limite reddituale',()=>expect(bollo({owner:'family',dependent:true,dependentIncome:3000,dependentIsChild:false}).outcome).toBe('not-eligible'));
  it('mantiene indipendenti IPT, PRA e bollo',()=>{const [ipt,pra,tax]=evaluateCase({...base,region:'Calabria',province:'Catanzaro',disability:'blind'});expect(ipt.outcome).toBe('not-eligible');expect(pra.outcome).toBe('eligible');expect(tax.outcome).toBe('eligible')});
  it('censisce 20 Regioni e 2 Province autonome con metadati',()=>{expect(bolloTerritories).toHaveLength(22);bolloTerritories.forEach(x=>{expect(x.url).toMatch(/^https:\/\//);expect(x.verifiedOn).toBe('2026-11-10');expect(x.procedure.length).toBeGreaterThan(10)})});
  it('mappa esattamente tutte le 20 Regioni e distingue la copertura nazionale della Calabria',()=>{expect(regions).toHaveLength(20);expect(regions.every(region=>bolloTerritories.some(rule=>rule.territory===region))).toBe(true);expect(territorialCoverage.find(x=>x.region==='Calabria')?.status).toBe('national-only');expect(territorialCoverage.filter(x=>x.status==='unverified')).toHaveLength(0)});
});
