"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");

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
      setResult(data.result || "Nessun risultato.");
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
            setOcrProgress(`Riconoscimento testo: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const extractedText = ocrResult.data.text.trim();

      if (extractedText) {
        setText((prev) =>
          prev
            ? prev + "\n\n--- Testo estratto dallo screenshot ---\n" + extractedText
            : extractedText
        );
        setOcrProgress("Testo estratto correttamente.");
      } else {
        setOcrProgress("Non è stato trovato testo leggibile nello screenshot.");
      }
    } catch (error) {
      setOcrProgress("Errore durante la lettura dello screenshot.");
    }

    setOcrLoading(false);
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
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 48, marginBottom: 10, fontWeight: "bold" }}>
            Facebook Policy Checker
          </h1>

          <p style={{ fontSize: 20, color: "#cbd5e1", maxWidth: 760, lineHeight: 1.5 }}>
            Incolla un testo o carica uno screenshot Facebook. L’app estrarrà il testo e analizzerà
            possibili violazioni delle Regole della Community Meta.
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
            <p style={{ color: "#93c5fd", marginTop: 0 }}>
              {ocrProgress}
            </p>
          )}

          <label
            style={{
              display: "block",
              marginTop: 24,
              marginBottom: 12,
              fontSize: 18,
              fontWeight: "bold"
            }}
          >
            Testo da analizzare
          </label>

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
            placeholder="Incolla qui il contenuto Facebook oppure carica uno screenshot..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
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
              {loading ? "Analisi in corso..." : "Analizza contenuto"}
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
          </div>
        </div>

        {result && (
          <div
            style={{
              marginTop: 40,
              background: "#1e293b",
              borderRadius: 20,
              padding: 30,
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 32 }}>
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
      </div>
    </main>
  );
}
