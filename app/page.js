"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeContent() {
    setLoading(true);
    setResult("");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    setResult(data.result || "Errore durante l’analisi.");
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "Arial", padding: 20 }}>
      <h1>Facebook Policy Checker</h1>

      <p>
        Incolla il testo di un post, commento o contenuto Facebook.
        L’app analizzerà possibili violazioni delle Regole della Community Meta.
      </p>

      <textarea
        style={{ width: "100%", height: 200, padding: 12, fontSize: 16 }}
        placeholder="Incolla qui il contenuto da analizzare..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={analyzeContent}
        disabled={loading || !text.trim()}
        style={{
          marginTop: 16,
          padding: "12px 20px",
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        {loading ? "Analisi in corso..." : "Analizza"}
      </button>

      {result && (
        <section style={{ marginTop: 30, padding: 20, background: "#f3f3f3", whiteSpace: "pre-wrap" }}>
          <h2>Risultato</h2>
          {result}
        </section>
      )}
    </main>
  );
}