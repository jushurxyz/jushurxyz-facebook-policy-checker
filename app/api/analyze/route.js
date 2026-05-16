export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 5) {
      return Response.json({
        result: "Inserisci un testo più completo da analizzare."
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({
        result: "ERRORE: la variabile OPENROUTER_API_KEY non risulta configurata su Vercel."
      });
    }

    const prompt = `
Sei un assistente che aiuta a valutare se un contenuto potrebbe violare le Regole della Community di Meta/Facebook.

IMPORTANTE:
- Non dire mai che la violazione è certa.
- Usa formule come "possibile violazione", "potenzialmente problematico", "richiede revisione".
- Rispondi in italiano.
- Fornisci un report chiaro e sintetico.

Analizza questo contenuto:

"${text}"

Restituisci il risultato con questa struttura:

Categoria della possibile violazione:
Livello di rischio: basso / medio / alto
Elementi problematici:
Spiegazione:
Suggerimento operativo:
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    const output = data.choices?.[0]?.message?.content || "Nessuna risposta ricevuta dal modello.";

    return Response.json({ result: output });

  } catch (error) {
    return Response.json({
      result: "ERRORE REALE: " + error.message
    });
  }
}
