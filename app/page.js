"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto"
        }}
      >
        <div
          style={{
            marginBottom: 40
          }}
        >
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
              maxWidth: 700,
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
            placeholder="Incolla qui il contenuto Facebook da analizzare..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={analyzeContent}
            disabled={loading || !text.trim()}
            style={{
              marginTop: 20,
              background: loading ? "#475569" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "16px 28px",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.2s"
            }}
          >
            {loading ? "Analisi in corso..." : "Analizza contenuto"}
          </button>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#22c55e"
                }}
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: 32
                }}
              >
                Risultato analisi
              </h2>
            </div>

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

        <div
          style={{
            marginTop: 50,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: 24,
              borderRadius: 18
            }}
          >
            <h3>AI Moderation</h3>
            <p style={{ color: "#94a3b8" }}>
              Analisi intelligente di testi e contenuti social.
            </p>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: 24,
              borderRadius: 18
            }}
          >
            <h3>Meta Policies</h3>
            <p style={{ color: "#94a3b8" }}>
              Rilevazione di possibili violazioni Community Standards.
            </p>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: 24,
              borderRadius: 18
            }}
          >
            <h3>Risk Detection</h3>
            <p style={{ color: "#94a3b8" }}>
              Valutazione del livello di rischio dei contenuti.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
