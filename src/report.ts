import { jsPDF } from 'jspdf';
import type { CaseData, Decision } from './types';
import { norms } from './data/norms';
const labels={eligible:'SPETTANTE','not-eligible':'NON SPETTANTE',insufficient:'DOCUMENTAZIONE INSUFFICIENTE',unverified:'NORMATIVA NON VERIFICATA'} as const;
export function exportReport(data:CaseData, decisions:Decision[]){
 const pdf=new jsPDF(); let y=18; const add=(s:string,size=10)=>{pdf.setFontSize(size); const lines=pdf.splitTextToSize(s.replace(/[–—]/g,'-'),178); if(y+lines.length*5>280){pdf.addPage();y=18;} pdf.text(lines,16,y);y+=lines.length*5+2;};
 pdf.setTextColor(18,25,38); add('IPT Check 2.0 - Report di verifica',18); add(`Generato il ${new Date().toLocaleDateString('it-IT')} - ${data.region || 'Regione non indicata'} / ${data.province || 'Provincia non indicata'}`,9); add('Questo report è informativo e non sostituisce il provvedimento dell’ente competente. Il verbale non è stato salvato né incluso.',9); y+=3;
 decisions.forEach(d=>{ add(`${d.title}: ${labels[d.outcome]}`,13); d.reasons.forEach(r=>add(`- ${r}`)); if(d.missing.length) add(`Documenti/dati mancanti: ${d.missing.join(', ')}.`); add(d.validity,8); y+=3; });
 add('Fonti ufficiali',13); [...new Set(decisions.flatMap(d=>d.sources))].forEach(id=>{const n=norms.find(x=>x.id===id);if(n)add(`${n.title} - ${n.url}`,8);});
 add('Nota privacy: elaborazione eseguita nel browser. Nessun verbale viene trasmesso o archiviato dall’app.',8); pdf.save(`ipt-check-${new Date().toISOString().slice(0,10)}.pdf`);
}
