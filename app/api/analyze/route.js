export async function POST(request) {
  try {
    const {
      sourceUrl,
      text,
      context,
      imageData,
      imageName,
      ocrText
    } = await request.json();

    if ((!text || text.trim().length < 5) && !imageData) {
      return Response.json({
        result:
          "Inserisci un testo da analizzare oppure carica un’immagine."
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
- Se è presente un'immagine, analizza anche il contenuto visivo.
- Se è presente OCR, usalo solo come supporto.

URL di origine:
"${sourceUrl || "Nessun URL fornito."}"

Nome immagine:
"${imageName || "Nessuna immagine caricata."}"

Contesto:
"${context || "Nessun contesto fornito."}"

Testo manuale:
"${text || "Nessun testo manuale."}"

Testo OCR:
"${ocrText || "Nessun OCR disponibile."}"

Restituisci:
- valutazione generale
- categorie possibili
- livello di rischio
- elementi problematici
- analisi visiva
- spiegazione
- suggerimento operativo
- avvertenza finale
`;

    const messageContent = [
      {
        type: "text",
        text: prompt
      }
    ];

    if (imageData) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: imageData
        }
      });
    }

    const models = [
      "google/gemma-4-31b-it:free",
      "qwen/qwen2.5-vl-72b-instruct:free",
      "meta-llama/llama-3.2-11b-vision-instruct:free"
    ];

    let finalResponse = null;
    let finalError = null;

    for (const model of models) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer":
                "https://facebook-policy-checker.vercel.app",
              "X-Title":
                "Facebook Policy Checker"
            },
            body: JSON.stringify({
              model,
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

        if (response.ok) {
          finalResponse =
            data.choices?.[0]?.message?.content ||
            "Nessuna risposta ricevuta.";

          break;
        }

        finalError = data;
      } catch (error) {
        finalError = error.message;
      }
    }

    if (!finalResponse) {
      return Response.json({
        result:
          "ERRORE OPENROUTER: " +
          JSON.stringify(finalError)
      });
    }

    return Response.json({
      result: finalResponse
    });
  } catch (error) {
    return Response.json({
      result:
        "ERRORE REALE: " +
        error.message
    });
  }
}
