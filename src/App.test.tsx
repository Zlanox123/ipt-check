import { cleanup,fireEvent, render, screen } from '@testing-library/react';
import { afterEach,describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('virtual:pwa-register',()=>({registerSW:vi.fn()}));
vi.mock('./ocr',()=>({extractLocal:vi.fn(async()=> 'Sussiste cecità assoluta. Non risulta cecità assoluta.')}));
afterEach(cleanup);

describe('flusso applicativo',()=>{
  it('passa dall’importazione ai requisiti in modalità manuale',()=>{
    render(<App/>);
    fireEvent.click(screen.getByRole('button',{name:'Continua con inserimento manuale'}));
    expect(screen.getByRole('heading',{name:'Conferma i requisiti'})).toBeInTheDocument();
    expect(screen.getByText(/La sola Legge 104 non è sufficiente/)).toBeInTheDocument();
  });
  it('non conferma automaticamente requisiti sanitari OCR incerti e cancella la sessione',async()=>{
    render(<App/>);
    const input=document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input,{target:{files:[new File(['dato'],'verbale.webp',{type:'image/webp'})]}});
    expect(await screen.findByRole('heading',{name:'Conferma i requisiti'})).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria risultante dal verbale')).toHaveValue('unknown');
    expect(screen.getByText(/Rilevazione incerta o ambigua/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Cancella sessione'}));
    expect(screen.getByRole('heading',{name:'Importa il verbale'})).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/cecità assoluta/)).not.toBeInTheDocument();
  });
});
