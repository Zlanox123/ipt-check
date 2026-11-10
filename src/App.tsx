import { useMemo, useRef, useState } from "react";
import { evaluateCase } from "./engine";
import { inferFromText } from "./inference";
import { norms, regions } from "./data/norms";
import type { CaseData, Decision, Disability, Outcome } from "./types";

const initial: CaseData = {
  disability: "unknown",
  law104Severe: null,
  art381: null,
  accompaniment: null,
  permanentMotorLimitation: null,
  downSyndrome: null,
  owner: "unknown",
  dependent: null,
  dependentIsChild: null,
  adapted: null,
  adaptationOnRegistration: null,
  fuel: "petrol",
  vehicleCategory: "car",
  region: "",
  province: "",
  oneVehicleOnly: null,
  previousVehicleStolen: null,
  lossOfPossessionRecorded: null,
  documentText: "",
  manualRules: "",
};
const outcomeLabel: Record<Outcome, string> = {
  eligible: "Spettante",
  "not-eligible": "Non spettante",
  insufficient: "Documentazione insufficiente",
  unverified: "Normativa non verificata",
};
const disabilities: { v: Disability; l: string }[] = [
  { v: "unknown", l: "Da verificare" },
  { v: "walking-severe", l: "Deambulazione gravemente limitata" },
  { v: "psychic", l: "Disabilità psichica/mentale" },
  { v: "motor-severe", l: "Disabilità motoria grave" },
  { v: "motor-reduced", l: "Ridotte capacità motorie permanenti" },
  { v: "pluriamputation", l: "Pluriamputazioni" },
  { v: "blind", l: "Non vedente" },
  { v: "deaf", l: "Sordo" },
  { v: "none", l: "Nessuna categoria agevolata" },
];
function Bool({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value === null ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value === "true")
        }
      >
        <option value="">Da verificare</option>
        <option value="true">Sì</option>
        <option value="false">No</option>
      </select>
    </label>
  );
}

export default function App() {
  const [data, setData] = useState(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<Decision[] | null>(null);
  const [confirmExtracted, setConfirmExtracted] = useState(false);
  const extraction = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const update = <K extends keyof CaseData>(k: K, v: CaseData[K]) =>
    setData((d) => ({ ...d, [k]: v }));
  const inferred = useMemo(
    () => inferFromText(data.documentText),
    [data.documentText],
  );
  async function onFile(f?: File) {
    if (!f) return;
    extraction.current?.abort();
    const controller = new AbortController();
    extraction.current = controller;
    setBusy(true);
    setProgress("Preparazione…");
    try {
      const { extractLocal } = await import("./ocr");
      const text = await extractLocal(f, (m, v) => setProgress(`${m} · ${v}%`), { signal: controller.signal });
      setData((d) => ({ ...d, documentText: text }));
      setConfirmExtracted(false);
      setStep(1);
    } catch (e) {
      setProgress(controller.signal.aborted ? "Analisi annullata" : `Errore: ${e instanceof Error ? e.message : "file non leggibile"}`);
    } finally {
      if (extraction.current === controller) extraction.current = null;
      setBusy(false);
    }
  }
  function clearSession() {
    extraction.current?.abort();
    extraction.current = null;
    if (fileInput.current) fileInput.current.value = "";
    setData({ ...initial });
    setResults(null);
    setConfirmExtracted(false);
    setProgress("");
    setBusy(false);
    setStep(0);
  }
  async function exportReport(current: CaseData, currentResults: Decision[]) {
    const report = await import("./report");
    report.exportReport(current, currentResults);
  }
  function check() {
    setResults(evaluateCase(data));
    setStep(3);
  }
  function confirmHealthExtraction() {
    setData((current) => ({
      ...current,
      disability: inferred.disability,
      law104Severe: inferred.law104Severe,
      art381: inferred.art381,
      accompaniment: inferred.accompaniment,
      permanentMotorLimitation: inferred.permanentMotorLimitation,
    }));
    setConfirmExtracted(true);
  }
  return (
    <div className="app">
      <header>
        <a className="brand" href="#top" aria-label="IPT Check home">
          <i>IC</i>
          <span>
            IPT Check <b>2.0</b>
          </span>
        </a>
        <div className="privacy">
          <span className="pulse" />
          Elaborazione locale
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div className="eyebrow">VERIFICA AGEVOLAZIONI AUTO</div>
          <h1>
            Requisiti chiari.
            <br />
            <em>Esiti verificabili.</em>
          </h1>
          <p>
            Controlla separatamente IPT, emolumenti PRA e bollo auto, senza
            inviare online i documenti.
          </p>
          <div className="assurance">
            <span>◈ OCR sul dispositivo</span>
            <span>◈ Fonti ufficiali</span>
            <span>◈ Nessun salvataggio</span>
          </div>
        </section>
        <section className="panel">
          <nav className="steps" aria-label="Avanzamento">
            {["Documento", "Requisiti", "Veicolo", "Esiti"].map((s, i) => (
              <button
                key={s}
                className={i === step ? "active" : i < step ? "done" : ""}
                onClick={() => i <= step && setStep(i)}
              >
                <b>{i < step ? "✓" : i + 1}</b>
                <span>{s}</span>
              </button>
            ))}
          </nav>
          {step === 0 && (
            <div className="content">
              <div className="section-head">
                <span>01</span>
                <div>
                  <h2>Importa il verbale</h2>
                  <p>
                    PDF multipagina, scansione o foto. L’analisi avviene solo in
                    questo browser.
                  </p>
                </div>
              </div>
              <label className={`drop ${busy ? "busy" : ""}`}>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                  disabled={busy}
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <div className="upload-icon">⌁</div>
                <strong>
                  {busy ? "Analisi in corso" : "Scegli o trascina un file"}
                </strong>
                <small>
                  {progress || "PDF, JPG, PNG · OCR italiano locale"}
                </small>
              </label>
              {busy && <button className="secondary wide" type="button" onClick={() => extraction.current?.abort()}>Annulla analisi</button>}
              <div className="or">
                <span />
                oppure
                <span />
              </div>
              <button className="secondary wide" onClick={() => setStep(1)}>
                Continua con inserimento manuale
              </button>
              <div className="notice">
                Il file resta nella memoria temporanea del browser e viene
                rimosso chiudendo o ricaricando la pagina.
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="content">
              <div className="section-head">
                <span>02</span>
                <div>
                  <h2>Conferma i requisiti</h2>
                  <p>
                    L’OCR suggerisce i dati: controllali sempre sul verbale
                    originale.
                  </p>
                </div>
              </div>
              {data.documentText && (
                <div className="extract">
                  <div>
                    <b>Diciture originali rilevate</b>
                    <textarea
                      aria-label="Diciture originali rilevate"
                      value={data.documentText}
                      onChange={(e) => {
                        update("documentText", e.target.value);
                        setConfirmExtracted(false);
                      }}
                    />
                    <div className="condition-list">
                      {inferred.conditions
                        .filter((condition) => condition.quotes.length)
                        .map((condition) => (
                          <span key={condition.key} className={condition.status} title={condition.quotes.join(" · ")}>
                            {condition.label}: {condition.status === "present" ? "rilevata" : condition.status === "absent" ? "negata" : "da confermare"}
                          </span>
                        ))}
                    </div>
                    {inferred.requiresManualConfirmation && !confirmExtracted && (
                      <small>Rilevazione incerta o ambigua: verifica le diciture e conferma manualmente.</small>
                    )}
                  </div>
                  <button onClick={confirmHealthExtraction}>
                    {confirmExtracted ? "Confermato ✓" : "Conferma estrazione"}
                  </button>
                </div>
              )}
              <div className="grid">
                <label className="field">
                  <span>Categoria risultante dal verbale</span>
                  <select
                    value={data.disability}
                    onChange={(e) =>
                      update("disability", e.target.value as Disability)
                    }
                  >
                    {disabilities.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.l}
                      </option>
                    ))}
                  </select>
                </label>
                <Bool
                  label="Art. 3, comma 3, Legge 104?"
                  value={data.law104Severe}
                  onChange={(v) => update("law104Severe", v)}
                />
                <Bool label="Art. 381 DPR 495/1992?" value={data.art381 ?? null} onChange={(v) => update("art381", v)} />
                <Bool
                  label="Indennità di accompagnamento?"
                  value={data.accompaniment}
                  onChange={(v) => update("accompaniment", v)}
                />
                {data.disability === "psychic" && (
                  <Bool label="Sindrome di Down accertata?" value={data.downSyndrome ?? null} onChange={(v) => update("downSyndrome", v)} />
                )}
                <Bool
                  label="Limitazione motoria permanente?"
                  value={data.permanentMotorLimitation}
                  onChange={(v) => update("permanentMotorLimitation", v)}
                />
                <label className="field">
                  <span>Intestatario</span>
                  <select
                    value={data.owner}
                    onChange={(e) =>
                      update("owner", e.target.value as CaseData["owner"])
                    }
                  >
                    <option value="unknown">Da verificare</option>
                    <option value="person">Persona con disabilità</option>
                    <option value="family">Familiare</option>
                    <option value="other">Altro soggetto</option>
                  </select>
                </label>
                {data.owner === "family" && (
                  <>
                    <Bool label="Persona fiscalmente a carico?" value={data.dependent} onChange={(v) => update("dependent", v)} />
                    {data.dependent === true && (
                      <>
                        <label className="field"><span>Reddito complessivo annuo (€)</span><input type="number" value={data.dependentIncome ?? ""} onChange={(e) => update("dependentIncome", e.target.value === "" ? undefined : Number(e.target.value))} /></label>
                        <Bool label="È figlio/a dell’intestatario?" value={data.dependentIsChild ?? null} onChange={(v) => update("dependentIsChild", v)} />
                        {data.dependentIsChild === true && <label className="field"><span>Età</span><input type="number" value={data.dependentAge ?? ""} onChange={(e) => update("dependentAge", e.target.value === "" ? undefined : Number(e.target.value))} /></label>}
                      </>
                    )}
                  </>
                )}
              </div>
              <label className="field">
                <span>
                  Leggi, articoli, commi o condizioni aggiuntive (nota
                  informativa, non modifica le regole)
                </span>
                <textarea
                  value={data.manualRules}
                  onChange={(e) => update("manualRules", e.target.value)}
                  placeholder="Es. verbale ex L. 104/1992, art. 3 comma 3…"
                />
              </label>
              <p className="warning">
                La sola Legge 104 non è sufficiente: servono la specifica
                condizione sanitaria e gli altri requisiti previsti.
              </p>
              <div className="actions">
                <button className="secondary" onClick={() => setStep(0)}>
                  Indietro
                </button>
                <button
                  className="primary"
                  disabled={Boolean(data.documentText && inferred.requiresManualConfirmation && !confirmExtracted)}
                  onClick={() => setStep(2)}
                >
                  Continua
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="content">
              <div className="section-head">
                <span>03</span>
                <div>
                  <h2>Veicolo e territorio</h2>
                  <p>Completa i dati tecnici e territoriali della pratica.</p>
                </div>
              </div>
              <div className="grid">
                <label className="field">
                  <span>Regione</span>
                  <select
                    value={data.region}
                    onChange={(e) => update("region", e.target.value)}
                  >
                    <option value="">Seleziona</option>
                    {regions.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Provincia / città metropolitana</span>
                  <input
                    value={data.province}
                    onChange={(e) => update("province", e.target.value)}
                    placeholder="Es. Roma"
                  />
                </label>
                <label className="field">
                  <span>Categoria veicolo</span>
                  <select
                    value={data.vehicleCategory}
                    onChange={(e) =>
                      update(
                        "vehicleCategory",
                        e.target.value as CaseData["vehicleCategory"],
                      )
                    }
                  >
                    <option value="car">Autovettura</option>
                    <option value="mixed">Trasporto promiscuo</option>
                    <option value="specific">Trasporto specifico</option>
                    <option value="motorcycle">Motoveicolo ammesso</option>
                    <option value="camper">Autocaravan</option>
                    <option value="quadricycle">Quadriciclo leggero</option>
                    <option value="other">Altra</option>
                    <option value="unknown">Da verificare</option>
                  </select>
                </label>
                <label className="field">
                  <span>Alimentazione</span>
                  <select
                    value={data.fuel}
                    onChange={(e) =>
                      update("fuel", e.target.value as CaseData["fuel"])
                    }
                  >
                    <option value="petrol">Benzina</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Ibrida</option>
                    <option value="electric">Elettrica</option>
                    <option value="other">Altra</option>
                  </select>
                </label>
                {data.fuel === "hybrid" && (
                  <label className="field"><span>Motore termico dell’ibrido</span><select value={data.hybridType ?? ""} onChange={(e) => update("hybridType", e.target.value ? e.target.value as "petrol"|"diesel" : undefined)}><option value="">Da verificare</option><option value="petrol">Benzina</option><option value="diesel">Diesel</option></select></label>
                )}
                {data.fuel === "electric" ? (
                  <label className="field">
                    <span>Potenza (kW)</span>
                    <input
                      type="number"
                      value={data.powerKw || ""}
                      onChange={(e) =>
                        update("powerKw", +e.target.value || undefined)
                      }
                    />
                  </label>
                ) : (
                  <label className="field">
                    <span>Cilindrata (cm³)</span>
                    <input
                      type="number"
                      value={data.displacement || ""}
                      onChange={(e) =>
                        update("displacement", +e.target.value || undefined)
                      }
                    />
                  </label>
                )}
                {data.region === "Lombardia" && data.fuel !== "electric" && (
                  <label className="field"><span>Potenza complessiva (kW)</span><input type="number" value={data.powerKw ?? ""} onChange={(e) => update("powerKw", e.target.value === "" ? undefined : Number(e.target.value))} /></label>
                )}
                <Bool
                  label="Veicolo adattato?"
                  value={data.adapted}
                  onChange={(v) => update("adapted", v)}
                />
                <Bool
                  label="Adattamento sulla carta di circolazione?"
                  value={data.adaptationOnRegistration}
                  onChange={(v) => update("adaptationOnRegistration", v)}
                />
                <Bool
                  label="Veicolo prescelto / limite rispettato?"
                  value={data.oneVehicleOnly}
                  onChange={(v) => update("oneVehicleOnly", v)}
                />
                {data.oneVehicleOnly === false && (
                  <>
                    <Bool label="Veicolo precedente rubato?" value={data.previousVehicleStolen ?? null} onChange={(v) => update("previousVehicleStolen", v)} />
                    <Bool label="Perdita di possesso annotata al PRA?" value={data.lossOfPossessionRecorded ?? null} onChange={(v) => update("lossOfPossessionRecorded", v)} />
                  </>
                )}
                {data.disability === "motor-reduced" && data.adapted === false && (
                  <label className="field"><span>Età della persona con disabilità</span><input type="number" value={data.disabledAge ?? ""} onChange={(e) => update("disabledAge", e.target.value === "" ? undefined : Number(e.target.value))} /></label>
                )}
              </div>
              <div className="territorial">
                Copertura territoriale: il motore applica il quadro nazionale
                verificato. Le estensioni e disposizioni specifiche
                regionali/provinciali sono segnalate come non verificate e vanno
                controllate presso l’ente competente.
              </div>
              <div className="actions">
                <button className="secondary" onClick={() => setStep(1)}>
                  Indietro
                </button>
                <button className="primary" onClick={check}>
                  Verifica ora
                </button>
              </div>
            </div>
          )}
          {step === 3 && results && (
            <div className="content results">
              <div className="section-head">
                <span>04</span>
                <div>
                  <h2>Esito della verifica</h2>
                  <p>Tre valutazioni indipendenti, motivate e riproducibili.</p>
                </div>
              </div>
              <div className="result-grid">
                {results.map((r) => (
                  <article className={`result ${r.outcome}`} key={r.benefit}>
                    <div className="result-top">
                      <span>{r.title}</span>
                      <i>{outcomeLabel[r.outcome]}</i>
                    </div>
                    <h3>{outcomeLabel[r.outcome]}</h3>
                    {r.reasons.map((x, i) => (
                      <p key={i}>{x}</p>
                    ))}
                    {r.missing.length > 0 && (
                      <details>
                        <summary>
                          Dati o documenti mancanti ({r.missing.length})
                        </summary>
                        <ul>
                          {r.missing.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <small>{r.validity}</small>
                  </article>
                ))}
              </div>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => {
                    setResults(null);
                    setStep(2);
                  }}
                >
                  Modifica dati
                </button>
                <button
                  className="primary"
                  onClick={() => exportReport(data, results)}
                >
                  Esporta report PDF
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="sources">
          <div>
            <div className="eyebrow">TRASPARENZA NORMATIVA</div>
            <h2>Ogni regola ha una fonte.</h2>
            <p>
              Il database distingue la normativa verificata dalle disposizioni
              territoriali ancora da controllare.
            </p>
          </div>
          <div className="source-list">
            {norms.map((n) => (
              <a href={n.url} target="_blank" rel="noreferrer" key={n.id}>
                <span>{n.authority}</span>
                <b>{n.title}</b>
                <small>
                  Verificata il {n.verifiedOn.split("-").reverse().join("/")}
                </small>
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>IPT Check 2.0 · Strumento informativo</span>
        <button className="secondary" type="button" onClick={clearSession}>Cancella sessione</button>
        <span>Nessun documento o dato sanitario inviato o conservato</span>
      </footer>
    </div>
  );
}
