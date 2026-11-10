# IPT Check 2.0

PWA offline-first per una verifica guidata e separata di IPT, emolumenti PRA e bollo auto. OCR e PDF vengono elaborati localmente nel browser; nessun verbale viene inviato o salvato.

## Avvio

```bash
npm ci
npm run dev
```

Verifica completa: `npm run check`. Audit delle dipendenze distribuite: `npm audit --omit=dev`.

## Limiti

Il motore usa fonti ufficiali verificate il 10/11/2026. Non costituisce consulenza né provvedimento amministrativo. La disciplina nazionale bollo è verificata per tutte le Regioni e Province autonome; le eventuali estensioni della Calabria restano non verificate perché la fonte regionale non è attualmente raggiungibile. La sola Legge 104 non determina il diritto. Confermare sempre OCR, requisiti, vigenza e prassi con PRA/Regione/ente competente.

L’app e PDF.js sono precache; worker, core e modello italiano Tesseract vengono salvati localmente al primo caricamento online. Documenti e dati sanitari restano in memoria e possono essere rimossi con **Cancella sessione**.

## GitHub Pages

Pubblicare il repository su GitHub con branch `main`, poi in **Settings → Pages → Source** scegliere **GitHub Actions**. Ogni push esegue test, build e deploy.

La configurazione usa percorsi relativi, quindi funziona nel sottopercorso GitHub Pages del repository. Non pubblicare `node_modules`, `dist`, file temporanei o documenti sanitari.
