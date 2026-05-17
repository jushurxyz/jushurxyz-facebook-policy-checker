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
- L'URL fornito è solo un riferimento: non fingere di averlo visitato.
- Se è presente un'immagine, analizza anche il contenuto visivo:
  soggetti,
  testo visibile,
  simboli,
  gesti,
  violenza,
  nudità,
  armi,
  contenuti offensivi o potenzialmente problematici.
- Se è presente OCR, usalo solo come supporto perché potrebbe contenere errori.

URL di origine:
"${sourceUrl || "Nessun URL fornito."}"

Nome immagine:
"${imageName || "Nessuna immagine caricata."}"

Contesto fornito dall'utente:
"${context || "Nessun contesto aggiuntivo fornito."}"

Testo inserito manualmente:
"${text || "Nessun testo manuale inserito."}"

Testo OCR di supporto:
"${ocrText || "Nessun testo OCR disponibile."}"

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

ANALISI VISIVA
Se è presente un'immagine, descrivi cosa appare e quali elementi visivi sono rilevanti.

TESTO RILEVATO NELL'IMMAGINE
Se è presente OCR o testo visibile nell'immagine, riassumi solo le parti utili.

URL DI ORIGINE
Riporta l'URL fornito, specificando che è stato usato solo come riferimento e non letto automaticamente.

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
          model: "google/gemma-4-31b-it:free",
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
        result:
          "ERRORE OPENROUTER: " +
          JSON.stringify(data)
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
      result:
        "ERRORE REALE: " +
        error.message
    });
  }
}
