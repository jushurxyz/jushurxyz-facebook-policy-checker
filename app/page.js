"use client";

import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("policy_checker_history");

    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  function saveToHistory(content, analysis) {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      content,
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
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      const analysisResult = data.result || "Nessun risultato.";

      setResult(analysisResult);

      saveToHistory(text, analysisResult);

    } catch (error) {
      setResult("Errore durante la richiesta.");
    }

    setLoading(false);
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    setOcrLoading(true);
    setOcrProgress("Lettura immagine in corso...");

    try {
      const ocrResult = await Tesseract.recognize(file, "ita+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(
              `Riconoscimento testo: ${Math.round(m.progress * 100)}%`
            );
          }
        }
      });

      const extractedText = ocrResult.data.text.trim();

      if (extractedText) {
        setText((prev) =>
          prev
            ? prev +
                "\n\n--- Testo estratto dallo screenshot ---\n" +
                extractedText
            : extractedText
        );

        setOcrProgress("Testo estratto correttamente.");
      } else {
        setOcrProgress(
          "Non è stato trovato testo leggibile nello screenshot."
        );
      }
    } catch (error) {
      setOcrProgress("Errore durante la lettura dello screenshot.");
    }

    setOcrLoading(false);
  }

  function clearHistory() {
    localStorage.removeItem("policy_checker_history");
    setHistory([]);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 48,
              marginBottom: 10,
              fontWeight: "bold"
            }}
          >
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
            Analizza contenuti Facebook e rileva possibili violazioni delle
            Regole della Community Meta tramite AI.
          </p>
        </div>

        <div
          style={{
            background: "#1e293b",
            borderRadius: 20,
            padding: 30,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: 12,
              fontSize: 18,
              fontWeight: "bold"
            }}
          >
            Carica screenshot
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={ocrLoading}
            style={{
              width: "100%",
              marginBottom: 16,
              padding: 14,
              background: "#0f172a",
              color: "white",
              border: "1px solid #334155",
              borderRadius: 12
            }}
          />

          {ocrProgress && (
            <p style={{ color: "#93c5fd" }}>{ocrProgress}</p>
          )}

          <textarea
            style={{
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
            }}
            placeholder="Incolla qui il contenuto Facebook..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
              disabled={loading || ocrLoading || !text.trim()}
              style={{
                background: loading ? "#475569" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 28px",
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {loading
                ? "Analisi in corso..."
                : "Analizza contenuto"}
            </button>

            <button
              onClick={() => {
                setText("");
                setResult("");
                setOcrProgress("");
              }}
              style={{
                background: "#334155",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 28px",
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Pulisci
            </button>

            <button
              onClick={clearHistory}
              style={{
                background: "#7f1d1d",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 28px",
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer"
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
            <h2 style={{ marginTop: 0 }}>
              Risultato analisi
            </h2>

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                fontSize: 18,
                color: "#e2e8f0"
              }}
            >
              {result}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div
            style={{
              marginTop: 50
            }}
          >
            <h2
              style={{
                marginBottom: 20,
                fontSize: 36
              }}
            >
              Storico analisi
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20
              }}
            >
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

                  <div
                    style={{
                      marginBottom: 18,
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {item.content}
                  </div>

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
