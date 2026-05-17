"use client";

import { useEffect, useMemo, useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [history, setHistory] = useState([]);
  const [analysisStep, setAnalysisStep] = useState(
    "Preparazione analisi..."
  );
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(
      "policy_checker_history"
    );

    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!loading) return;

    const steps = [
      "Preparazione analisi...",
      "Controllo linguaggio e tono...",
      "Valutazione possibili violazioni...",
      "Analisi visiva dell’immagine...",
      "Confronto con aree policy Meta...",
      "Calcolo livello di rischio...",
      "Generazione report finale..."
    ];

    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setAnalysisStep(steps[index]);
    }, 1400);

    return () => clearInterval(interval);
  }, [loading]);

  const riskInfo = useMemo(() => {
    const lower = result.toLowerCase();

    if (lower.includes("alto")) {
      return {
        label: "RISCHIO ALTO",
        color: "#dc2626",
        background: "#7f1d1d"
      };
    }

    if (lower.includes("medio")) {
      return {
        label: "RISCHIO MEDIO",
        color: "#f59e0b",
        background: "#78350f"
      };
    }

    return {
      label: "RISCHIO BASSO",
      color: "#22c55e",
      background: "#14532d"
    };
  }, [result]);

  function renderLinkedReport(report) {
    const policyLinks = [
      {
        keywords: [
          "bullismo",
          "molestie",
          "harassment"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/bullying-harassment/"
      },
      {
        keywords: [
          "odio",
          "hate",
          "incitamento all'odio"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/hateful-conduct/"
      },
      {
        keywords: [
          "violenza",
          "minacce",
          "violence"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/violence-incitement/"
      },
      {
        keywords: [
          "nudità",
          "contenuti sessuali",
          "sessuali"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/adult-nudity-sexual-activity/"
      },
      {
        keywords: [
          "autolesionismo",
          "suicidio"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/suicide-self-injury/"
      },
      {
        keywords: [
          "privacy",
          "dati personali"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/privacy-violations/"
      },
      {
        keywords: [
          "spam",
          "truffa",
          "frode"
        ],
        url:
          "https://transparency.meta.com/policies/community-standards/spam/"
      }
    ];

    let linkedText = report;

    policyLinks.forEach((policy) => {
      policy.keywords.forEach(
        (keyword) => {
          const regex = new RegExp(
            `(${keyword})`,
            "gi"
          );

          linkedText =
            linkedText.replace(
              regex,
              `<a href="${policy.url}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;text-decoration:underline;">$1</a>`
            );
        }
      );
    });

    return linkedText;
  }

  function saveToHistory(
    url,
    content,
    contextText,
    imageFileName,
    analysis
  ) {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      sourceUrl: url,
      content,
      context: contextText,
      imageName: imageFileName,
      analysis
    };

    const updatedHistory = [
      newEntry,
      ...history
    ];

    setHistory(updatedHistory);

    localStorage.setItem(
      "policy_checker_history",
      JSON.stringify(updatedHistory)
    );
  }

  async function analyzeContent() {
    setLoading(true);
    setResult("");
    setAnalysisStep(
      "Preparazione analisi..."
    );

    try {
      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            sourceUrl,
            text,
            context,
            imageData,
            imageName,
            ocrText
          })
        }
      );

      const data = await response.json();

      const analysisResult =
        data.result ||
        "Nessun risultato.";

      setResult(analysisResult);

      saveToHistory(
        sourceUrl,
        text,
        context,
        imageName,
        analysisResult
      );
    } catch (error) {
      setResult(
        "Errore durante la richiesta."
      );
    }

    setLoading(false);
  }

  async function handleImageUpload(
    event
  ) {
    const file =
      event.target.files[0];

    if (!file) return;

    setImageName(file.name);
    setOcrLoading(true);

    setOcrProgress(
      "Caricamento immagine e lettura testo di supporto..."
    );

    const reader =
      new FileReader();

    reader.onload = async () => {
      const base64Image =
        reader.result;

      setImageData(base64Image);

      try {
        const ocrResult =
          await Tesseract.recognize(
            file,
            "ita+eng",
            {
              logger: (m) => {
                if (
                  m.status ===
                  "recognizing text"
                ) {
                  setOcrProgress(
                    `OCR di supporto: ${Math.round(
                      m.progress *
                        100
                    )}%`
                  );
                }
              }
            }
          );

        const extractedText =
          ocrResult.data.text.trim();

        setOcrText(
          extractedText || ""
        );

        setOcrProgress(
          "Immagine caricata correttamente. L’AI analizzerà anche il contenuto visivo."
        );
      } catch (error) {
        setOcrText("");

        setOcrProgress(
          "Immagine caricata. OCR non disponibile, ma l’AI Vision analizzerà comunque la foto."
        );
      }

      setOcrLoading(false);
    };

    reader.readAsDataURL(file);
  }

  function clearHistory() {
    localStorage.removeItem(
      "policy_checker_history"
    );

    setHistory([]);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(
        result
      );

      alert(
        "Report copiato negli appunti."
      );
    } catch (error) {
      alert(
        "Errore durante la copia."
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily:
          "Arial, sans-serif",
        padding: "40px 20px"
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto"
        }}
      >
        <h1
          style={{
            fontSize: 48,
            marginBottom: 10
          }}
        >
          Facebook Policy Checker
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            fontSize: 20,
            lineHeight: 1.5,
            marginBottom: 30
          }}
        >
          Analizza contenuti
          Facebook, immagini e
          screenshot per
          individuare possibili
          violazioni delle
          Community Standards
          Meta.
        </p>

        <div
          style={{
            background:
              "#1e293b",
            borderRadius: 20,
            padding: 30
          }}
        >
          <label
            style={labelStyle}
          >
            URL di origine /
            link del post
          </label>

          <input
            type="url"
            value={sourceUrl}
            onChange={(e) =>
              setSourceUrl(
                e.target.value
              )
            }
            placeholder="Incolla il link del post Facebook..."
            style={inputStyle}
          />

          <label
            style={labelStyle}
          >
            Carica screenshot o
            immagine
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={
              handleImageUpload
            }
            style={inputStyle}
          />

          {imageName && (
            <div
              style={{
                marginBottom: 18,
                color: "#93c5fd"
              }}
            >
              Immagine
              caricata:{" "}
              <strong>
                {imageName}
              </strong>
            </div>
          )}

          {ocrProgress && (
            <div
              style={{
                marginBottom: 18,
                color: "#93c5fd"
              }}
            >
              {ocrProgress}
            </div>
          )}

          <label
            style={labelStyle}
          >
            Contenuto da
            analizzare
          </label>

          <textarea
            value={text}
            onChange={(e) =>
              setText(
                e.target.value
              )
            }
            placeholder="Incolla qui testo, commenti o contenuti Facebook..."
            style={textareaStyle}
          />

          <label
            style={labelStyle}
          >
            Contesto /
            spiegazione
            facoltativa
          </label>

          <textarea
            value={context}
            onChange={(e) =>
              setContext(
                e.target.value
              )
            }
            placeholder="Aggiungi eventuale contesto..."
            style={{
              ...textareaStyle,
              minHeight: 120
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
              flexWrap: "wrap"
            }}
          >
            <button
              onClick={
                analyzeContent
              }
              disabled={
                loading ||
                (!text.trim() &&
                  !imageData)
              }
              style={{
                background:
                  "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding:
                  "16px 28px",
                fontSize: 18,
                fontWeight:
                  "bold",
                cursor:
                  "pointer"
              }}
            >
              {loading
                ? "Analisi AI in corso..."
                : "Analizza contenuto"}
            </button>

            <button
              onClick={() => {
                setSourceUrl("");
                setText("");
                setContext("");
                setImageData("");
                setImageName("");
                setOcrText("");
                setResult("");
                setOcrProgress(
                  ""
                );
              }}
              style={{
                background:
                  "#334155",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding:
                  "16px 28px",
                fontSize: 18,
                fontWeight:
                  "bold",
                cursor:
                  "pointer"
              }}
            >
              Pulisci
            </button>
          </div>
        </div>

        {result && (
          <div
            style={{
              marginTop: 40,
              background:
                "#1e293b",
              borderRadius: 20,
              padding: 30
            }}
          >
            <div
              style={{
                display:
                  "inline-block",
                background:
                  riskInfo.background,
                color:
                  riskInfo.color,
                padding:
                  "10px 18px",
                borderRadius:
                  999,
                fontWeight:
                  "bold",
                marginBottom: 24,
                border: `2px solid ${riskInfo.color}`
              }}
            >
              {riskInfo.label}
            </div>

            <div
              style={{
                whiteSpace:
                  "pre-wrap",
                lineHeight: 1.7,
                fontSize: 18,
                color: "#e2e8f0",
                background:
                  "#0f172a",
                padding: 24,
                borderRadius: 16
              }}
              dangerouslySetInnerHTML={{
                __html:
                  renderLinkedReport(
                    result
                  )
              }}
            />

            <button
              onClick={
                copyReport
              }
              style={{
                marginTop: 24,
                background:
                  "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding:
                  "14px 24px",
                fontSize: 16,
                fontWeight:
                  "bold",
                cursor:
                  "pointer"
              }}
            >
              Copia report
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginTop: 22,
  marginBottom: 12,
  fontSize: 18,
  fontWeight: "bold"
};

const inputStyle = {
  width: "100%",
  background: "#0f172a",
  color: "white",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 18,
  fontSize: 18,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 22
};

const textareaStyle = {
  width: "100%",
  minHeight: 260,
  background: "#0f172a",
  color: "white",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 20,
  fontSize: 20,
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box"
};
