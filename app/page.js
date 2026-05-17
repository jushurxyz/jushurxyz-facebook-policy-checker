"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [history, setHistory] = useState([]);
  const [analysisStep, setAnalysisStep] = useState("Preparazione analisi...");
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("policy_checker_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!loading) return;

    const steps = [
      "Preparazione analisi...",
      "Analisi visiva dell’immagine...",
      "Valutazione possibili violazioni...",
      "Confronto con aree policy Meta...",
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
      return { label: "RISCHIO ALTO", color: "#dc2626", background: "#7f1d1d" };
    }

    if (lower.includes("medio")) {
      return { label: "RISCHIO MEDIO", color: "#f59e0b", background: "#78350f" };
    }

    return { label: "RISCHIO BASSO", color: "#22c55e", background: "#14532d" };
  }, [result]);

  function renderLinkedReport(report) {
    const policyLinks = [
      {
        keywords: ["bullismo", "molestie", "harassment"],
        url: "https://transparency.meta.com/policies/community-standards/bullying-harassment/"
      },
      {
        keywords: ["odio", "hate", "incitamento all'odio"],
        url: "https://transparency.meta.com/policies/community-standards/hateful-conduct/"
      },
      {
        keywords: ["violenza", "minacce", "violence"],
        url: "https://transparency.meta.com/policies/community-standards/violence-incitement/"
      },
      {
        keywords: ["nudità", "contenuti sessuali", "sessuali"],
        url: "https://transparency.meta.com/policies/community-standards/adult-nudity-sexual-activity/"
      },
      {
        keywords: ["autolesionismo", "suicidio"],
        url: "https://transparency.meta.com/policies/community-standards/suicide-self-injury/"
      },
      {
        keywords: ["privacy", "dati personali"],
        url: "https://transparency.meta.com/policies/community-standards/privacy-violations/"
      },
      {
        keywords: ["spam", "truffa", "frode"],
        url: "https://transparency.meta.com/policies/community-standards/spam/"
      }
    ];

    let linkedText = report;

    policyLinks.forEach((policy) => {
      policy.keywords.forEach((keyword) => {
        const regex = new RegExp(`(${keyword})`, "gi");
        linkedText = linkedText.replace(
          regex,
          `<a href="${policy.url}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;text-decoration:underline;">$1</a>`
        );
      });
    });

    return linkedText;
  }

  function saveToHistory(url, content, contextText, imageFileName, analysis) {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      sourceUrl: url,
      content,
      context: contextText,
      imageName: imageFileName,
      analysis
    };

    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);

    localStorage.setItem(
      "policy_checker_history",
      JSON.stringify(updatedHistory)
    );
  }

  async function analyzeContent() {
    if (loading || imageLoading) return;

    if (!text.trim() && !imageData) {
      setResult("Inserisci un testo da analizzare oppure carica un’immagine.");
      return;
    }

    setLoading(true);
    setResult("");
    setAnalysisStep("Preparazione analisi...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceUrl,
          text,
          context,
          imageData,
          imageName
        })
      });

      const data = await response.json();
      const analysisResult = data.result || "Nessun risultato ricevuto.";

      setResult(analysisResult);
      saveToHistory(sourceUrl, text, context, imageName, analysisResult);
    } catch (error) {
      setResult("Errore durante la richiesta.");
    }

    setLoading(false);
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    setImageLoading(true);
    setImageStatus("Caricamento immagine in corso...");
    setImageName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setImageData(reader.result);
      setImageStatus(
        "Immagine caricata correttamente. Verrà analizzata con AI Vision."
      );
      setImageLoading(false);
    };

    reader.onerror = () => {
      setImageStatus("Errore durante il caricamento dell’immagine.");
      setImageLoading(false);
    };

    reader.readAsDataURL(file);
  }

  function clearForm() {
    setSourceUrl("");
    setText("");
    setContext("");
    setImageData("");
    setImageName("");
    setResult("");
    setImageStatus("");
  }

  function clearHistory() {
    localStorage.removeItem("policy_checker_history");
    setHistory([]);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(result);
      alert("Report copiato negli appunti.");
    } catch (error) {
      alert("Errore durante la copia.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
        position: "relative"
      }}
    >
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }

        @keyframes pulseGlow {
          0% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.25); }
          50% { box-shadow: 0 0 45px rgba(37, 99, 235, 0.75); }
          100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.25); }
        }
      `}</style>

      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.82)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 28,
              padding: 34,
              textAlign: "center",
              animation: "pulseGlow 2s infinite"
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                border: "6px solid rgba(255,255,255,0.18)",
                borderTop: "6px solid #60a5fa",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 24px"
              }}
            />

            <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
              Analisi AI in corso
            </h2>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: 18,
                lineHeight: 1.5,
                marginBottom: 24
              }}
            >
              {analysisStep}
            </p>

            <div
              style={{
                height: 10,
                background: "#0f172a",
                borderRadius: 999,
                overflow: "hidden",
                border: "1px solid #334155"
              }}
            >
              <div
                style={{
                  width: "45%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, #60a5fa, transparent)",
                  animation: "progress 1.4s linear infinite"
                }}
              />
            </div>

            <p
              style={{
                color: "#94a3b8",
                fontSize: 14,
                marginTop: 20,
                marginBottom: 0
              }}
            >
              Non chiudere la pagina durante l’elaborazione.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 48, marginBottom: 10, fontWeight: "bold" }}>
            Facebook Policy Checker
          </h1>

          <p
            style={{
              fontSize: 20,
              color: "#cbd5e1",
              maxWidth: 760,
              lineHeight: 1.5
            }}
          >
            Analizza contenuti Facebook, testi, screenshot e immagini per
            rilevare possibili violazioni delle Regole della Community Meta
            tramite AI.
          </p>

          <div style={{ marginTop: 24, maxWidth: 900 }}>
            <button
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              style={{
                width: "100%",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                borderRadius: 16,
                padding: 18,
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: "bold"
              }}
            >
              <span>Disclaimer legale</span>
              <span style={{ fontSize: 24, lineHeight: 1 }}>
                {showDisclaimer ? "−" : "+"}
              </span>
            </button>

            {showDisclaimer && (
              <div
                style={{
                  marginTop: 10,
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: 16,
                  padding: 20
                }}
              >
                <div
                  style={{
                    color: "#fde68a",
                    lineHeight: 1.7,
                    fontSize: 15
                  }}
                >
                  Questa applicazione fornisce esclusivamente un’analisi
                  preliminare automatizzata basata su modelli di intelligenza
                  artificiale e non rappresenta una valutazione ufficiale di
                  Meta/Facebook.
                  <br />
                  <br />
                  L’eventuale presenza di contenuti potenzialmente problematici
                  non implica necessariamente una violazione effettiva delle
                  Regole della Community.
                  <br />
                  <br />
                  Solo Meta Platforms può stabilire ufficialmente se un
                  contenuto viola le proprie policy o richiede interventi di
                  moderazione.
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#1e293b",
            borderRadius: 20,
            padding: 30,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
          }}
        >
          <label style={labelStyle}>URL di origine / link del post</label>

          <input
            type="url"
            style={inputStyle}
            placeholder="Incolla qui il link del post Facebook. Il link viene usato solo come riferimento."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />

          <label style={labelStyle}>Carica screenshot o immagine</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={imageLoading}
            style={fileInputStyle}
          />

          {imageName && (
            <div style={infoBoxStyle}>
              Immagine caricata: <strong>{imageName}</strong>
            </div>
          )}

          {imageStatus && <p style={{ color: "#93c5fd" }}>{imageStatus}</p>}

          <label style={labelStyle}>Contenuto da analizzare</label>

          <textarea
            style={textareaStyle}
            placeholder="Incolla qui il testo del post, commento o contenuto Facebook. Se carichi solo un’immagine, puoi lasciare vuoto questo campo."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <label style={labelStyle}>Contesto / spiegazione facoltativa</label>

          <textarea
            style={{
              ...textareaStyle,
              minHeight: 120,
              fontSize: 18
            }}
            placeholder="Aggiungi eventuale contesto utile per l’AI: dove è stato pubblicato il contenuto, tono della conversazione, intento satirico, rapporto tra gli utenti, minacce precedenti, ecc..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 20
            }}
          >
            <button
              onClick={analyzeContent}
              disabled={loading || imageLoading || (!text.trim() && !imageData)}
              style={{
                background: loading ? "#475569" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 28px",
                fontSize: 18,
                fontWeight: "bold",
                cursor:
                  loading || imageLoading || (!text.trim() && !imageData)
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              {loading && (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTop: "3px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}
                />
              )}

              {loading ? "Analisi AI in corso..." : "Analizza contenuto"}
            </button>

            <button onClick={clearForm} style={secondaryButtonStyle}>
              Pulisci
            </button>

            <button
              onClick={clearHistory}
              style={{
                ...secondaryButtonStyle,
                background: "#7f1d1d"
              }}
            >
              Cancella storico
            </button>
          </div>
        </div>

        {result && (
          <div
            style={{
              marginTop: 40,
              background: "#1e293b",
              borderRadius: 20,
              padding: 30
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: riskInfo.background,
                color: riskInfo.color,
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: "bold",
                marginBottom: 24,
                border: `2px solid ${riskInfo.color}`
              }}
            >
              {riskInfo.label}
            </div>

            {sourceUrl && (
              <div style={infoBoxStyle}>
                <strong>URL di origine:</strong>
                <br />
                {sourceUrl}
              </div>
            )}

            {imageName && (
              <div style={infoBoxStyle}>
                <strong>Immagine analizzata:</strong>
                <br />
                {imageName}
              </div>
            )}

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                fontSize: 18,
                color: "#e2e8f0",
                background: "#0f172a",
                padding: 24,
                borderRadius: 16
              }}
              dangerouslySetInnerHTML={{
                __html: renderLinkedReport(result)
              }}
            />

            <button onClick={copyReport} style={copyButtonStyle}>
              Copia report
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 50 }}>
            <h2 style={{ marginBottom: 20, fontSize: 36 }}>
              Storico analisi
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#1e293b",
                    borderRadius: 18,
                    padding: 24
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      color: "#93c5fd",
                      fontSize: 14
                    }}
                  >
                    {item.date}
                  </div>

                  {item.sourceUrl && (
                    <div style={infoBoxStyle}>
                      <strong>URL di origine:</strong>
                      <br />
                      {item.sourceUrl}
                    </div>
                  )}

                  {item.imageName && (
                    <div style={infoBoxStyle}>
                      <strong>Immagine:</strong>
                      <br />
                      {item.imageName}
                    </div>
                  )}

                  {item.content && (
                    <div
                      style={{
                        marginBottom: 18,
                        color: "#cbd5e1",
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {item.content}
                    </div>
                  )}

                  {item.context && (
                    <div
                      style={{
                        marginBottom: 18,
                        color: "#fde68a",
                        background: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                        borderRadius: 12,
                        padding: 14,
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      <strong>Contesto fornito:</strong>
                      <br />
                      {item.context}
                    </div>
                  )}

                  <div
                    style={{
                      background: "#0f172a",
                      borderRadius: 14,
                      padding: 18,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6
                    }}
                  >
                    {item.analysis}
                  </div>
                </div>
              ))}
            </div>
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

const fileInputStyle = {
  width: "100%",
  marginBottom: 16,
  padding: 14,
  background: "#0f172a",
  color: "white",
  border: "1px solid #334155",
  borderRadius: 12
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

const secondaryButtonStyle = {
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: 14,
  padding: "16px 28px",
  fontSize: 18,
  fontWeight: "bold",
  cursor: "pointer"
};

const copyButtonStyle = {
  marginTop: 24,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 14,
  padding: "14px 24px",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer"
};

const infoBoxStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 16,
  marginBottom: 22,
  color: "#93c5fd",
  wordBreak: "break-word"
};
