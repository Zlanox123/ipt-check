import { describe, expect, it } from 'vitest';
import { inferFromText } from './inference';

const condition=(text:string,key:string)=>inferFromText(text).conditions.find(x=>x.key===key)!;

describe('riconoscimento condizioni sanitarie INPS',()=>{
  it('riconosce art. 3 comma 3 senza dedurre una categoria',()=>{const x=inferFromText('Handicap grave ai sensi dell’art. 3, comma 3, Legge 104/1992');expect(x.law104Severe).toBe(true);expect(x.disability).toBe('unknown')});
  it('distingue art. 381 dalla grave limitazione della deambulazione',()=>{const x=inferFromText('Ricorrono le condizioni di cui all’art. 381 DPR 495/1992: capacità di deambulazione sensibilmente ridotta');expect(condition('art. 381 DPR 495/1992','art381').status).toBe('present');expect(x.disability).toBe('unknown');expect(condition('art. 381 DPR 495/1992','walkingSevere').status).not.toBe('present')});
  it('riconosce la grave limitazione permanente della deambulazione',()=>expect(inferFromText('grave limitazione permanente della capacità di deambulazione').disability).toBe('walking-severe'));
  it('riconosce ridotte capacità motorie permanenti',()=>expect(inferFromText('ridotte o impedite capacità motorie permanenti').disability).toBe('motor-reduced'));
  it('riconosce le pluriamputazioni',()=>expect(inferFromText('persona con pluriamputazioni').disability).toBe('pluriamputation'));
  it('riconosce disabilità psichica con accompagnamento',()=>{const x=inferFromText('disabilità psichica in situazione di gravità. Indennità di accompagnamento riconosciuta');expect(x.disability).toBe('psychic');expect(x.accompaniment).toBe(true)});
  it('riconosce cecità',()=>expect(inferFromText('persona non vedente affetta da cecità assoluta').disability).toBe('blind'));
  it('riconosce sordità',()=>expect(inferFromText('persona affetta da sordità preverbale').disability).toBe('deaf'));
  it('non trasforma la sola legge 104 in categoria',()=>{const x=inferFromText('Riconoscimento ai sensi della Legge 104/1992');expect(x.disability).toBe('unknown');expect(x.requiresManualConfirmation).toBe(true)});
  it('riconosce una negazione senza attribuire il requisito',()=>{const x=inferFromText('Non sussiste grave limitazione permanente della capacità di deambulazione');expect(x.disability).toBe('unknown');expect(condition('Non sussiste grave limitazione permanente della capacità di deambulazione','walkingSevere').status).toBe('absent')});
  it('tratta diciture contrastanti come ambigue',()=>{const x=inferFromText('Sussiste cecità assoluta. Non risulta cecità assoluta.');expect(x.disability).toBe('unknown');expect(condition('Sussiste cecità assoluta. Non risulta cecità assoluta.','blind').status).toBe('uncertain')});
  it('non usa una generica menzione mentale come categoria favorevole',()=>expect(inferFromText('Esame dello stato mentale nella norma').disability).toBe('unknown'));
  it('tollera comuni errori OCR',()=>{const x=inferFromText('art. 3 c0mma 3 L. 1O4/1992. Ridotte capacita motor1e permanenti');expect(x.law104Severe).toBe(true);expect(x.disability).toBe('motor-reduced')});
  it('conserva le diciture originali',()=>{const phrase='Grave limitazione permanente della capacità di deambulazione';expect(inferFromText(phrase).originalPhrases).toContain(phrase)});
});
