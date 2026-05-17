export async function POST(request) {
  try {
    const { sourceUrl, text, context, imageData, imageName } =
      await request.json();

    if ((!text || text.trim().length < 5) && !imageData) {
      return Response.json({
        result: "Inserisci un testo da analizzare oppure carica un’immagine."
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
- Usa formule come "possibile violazione", "potenzialmente problematico", "richiede revisione".
- Non fingere di rappresentare Meta o Facebook.
- Non inventare norme inesistenti.
- Rispondi sempre in italiano.
- Il tono deve essere professionale, prudente e chiaro.
- L'URL fornito è solo un riferimento.
- Se è presente un'immagine, analizza il contenuto visivo e anche eventuale testo visibile nell'immagine.

URL di origine:
"${sourceUrl || "Nessun URL fornito."}"

Nome immagine:
"${imageName || "Nessuna immagine caricata."}"

Contesto:
"${context || "Nessun contesto fornito."}"

Testo manuale:
"${text || "Nessun testo manuale."}"

Restituisci un report strutturato contenente:

1. VALUTAZIONE GENERALE
2. CATEGORIE POSSIBILI
3. LIVELLO DI RISCHIO
4. ELEMENTI PROBLEMATICI
5. ANALISI VISIVA
6. TESTO VISIBILE NELL'IMMAGINE
7. SPIEGAZIONE
8. SUGGERIMENTO OPERATIVO
9. AVVERTENZA FINALE
`;

    const messageContent = [{ type: "text", text: prompt }];

    if (imageData) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: imageData
        }
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://facebook-policy-checker.vercel.app",
          "X-Title": "Facebook Policy Checker"
        },
        body: JSON.stringify({
          model: "qwen/qwen2.5-vl-32b-instruct:free",
          messages: [
            {
              role: "user",
              content: messageContent
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        result: "ERRORE OPENROUTER: " + JSON.stringify(data)
      });
    }

    const output =
      data.choices?.[0]?.message?.content ||
      "Nessuna risposta ricevuta dal modello.";

    return Response.json({
      result: output
    });
  } catch (error) {
    return Response.json({
      result: "ERRORE REALE: " + error.message
    });
  }
}
