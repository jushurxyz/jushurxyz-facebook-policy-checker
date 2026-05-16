export async function POST(request) {
  try {
    const { text, context } = await request.json();

    if (!text || text.trim().length < 5) {
      return Response.json({
        result: "Inserisci un testo più completo da analizzare."
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({
        result:
          "ERRORE: la variabile OPENROUTER_API_KEY non risulta configurata su Vercel."
      });
    }

    const prompt = `
Sei un assistente specializzato nell'analisi preliminare di contenuti Facebook rispetto alle Regole della Community di Meta.

IMPORTANTE:
- Non dichiarare mai che una violazione è certa.
- Usa sempre formule come "possibile violazione", "potenzialmente problematico", "richiede revisione".
- Non fingere di rappresentare Meta o Facebook.
- Non inventare norme inesistenti.
- Rispondi sempre in italiano.
- Il tono deve essere professionale, prudente e chiaro.
- Usa il contesto fornito dall'utente solo per interpretare meglio il contenuto, ma non assumerlo come prova assoluta.

Contesto fornito dall'utente:
"${context || "Nessun contesto aggiuntivo fornito."}"

Analizza questo contenuto:

"${text}"

Restituisci un report strutturato in questo formato:

VALUTAZIONE GENERALE
Indica se il contenuto appare:
- non problematico
- potenzialmente problematico
- ad alto rischio

CATEGORIA POSSIBILE
Indica una o più categorie tra:
- Incitamento all'odio
- Minacce o violenza
- Bullismo o molestie
- Linguaggio offensivo
- Contenuti sessuali o nudità
- Contenuti violenti o grafici
- Autolesionismo
- Spam o truffa
- Disinformazione
- Violazione della privacy
- Altro

LIVELLO DI RISCHIO
Basso / Medio / Alto

ELEMENTI PROBLEMATICI
Riporta solo brevi estratti o descrizioni degli elementi problematici.

CONTESTO CONSIDERATO
Spiega brevemente se e come il contesto fornito dall'utente ha influenzato l'analisi.

NORMA META POTENZIALMENTE COINVOLTA
Descrivi in modo prudente la possibile area delle Regole della Community interessata.

SPIEGAZIONE
Spiega perché il contenuto potrebbe essere problematico o perché non lo è.

SUGGERIMENTO OPERATIVO
Indica se:
- non sembra necessario intervenire
- conviene revisionare manualmente
- conviene segnalare a Facebook/Meta
- conviene conservare uno screenshot come prova

AVVERTENZA
Ricorda che solo Meta può stabilire ufficialmente se il contenuto viola le proprie regole.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://facebook-policy-checker.vercel.app",
        "X-Title": "Facebook Policy Checker"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        result: "ERRORE OPENROUTER: " + JSON.stringify(data)
      });
    }

    const output =
      data.choices?.[0]?.message?.content ||
      "Nessuna risposta ricevuta dal modello.";

    return Response.json({ result: output });
  } catch (error) {
    return Response.json({
      result: "ERRORE REALE: " + error.message
    });
  }
}
