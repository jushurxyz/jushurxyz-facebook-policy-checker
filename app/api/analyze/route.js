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
- L'URL fornito è solo un riferimento: non devi fingere di averlo visitato.
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
Indica se il contenuto appare non problematico, potenzialmente problematico o ad alto rischio.

2. CATEGORIE POSSIBILI
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

3. LIVELLO DI RISCHIO
Basso / Medio / Alto

4. ELEMENTI PROBLEMATICI
Riporta solo brevi estratti o descrizioni degli elementi problematici.

5. ANALISI VISIVA
Se è presente un'immagine, descrivi cosa appare e quali elementi visivi sono rilevanti.

6. TESTO VISIBILE NELL'IMMAGINE
Se nell'immagine è presente testo leggibile, riassumilo o riportane solo le parti utili.

7. NORMA META POTENZIALMENTE COINVOLTA
Indica in modo prudente la possibile area delle Community Standards Meta coinvolta.

8. RIFERIMENTI META
Indica i riferimenti più pertinenti alle Community Standards Meta usando esattamente questo formato:

- Nome norma: URL ufficiale

Usa solo URL ufficiali del Transparency Center Meta tra questi:
https://transparency.meta.com/policies/community-standards/hateful-conduct/
https://transparency.meta.com/policies/community-standards/violence-incitement/
https://transparency.meta.com/policies/community-standards/bullying-harassment/
https://transparency.meta.com/policies/community-standards/adult-nudity-sexual-activity/
https://transparency.meta.com/policies/community-standards/suicide-self-injury/
https://transparency.meta.com/policies/community-standards/spam/
https://transparency.meta.com/policies/community-standards/privacy-violations/

Se nessuno di questi riferimenti è pertinente, scrivi:
- Nessun riferimento Meta specifico individuato.

9. SPIEGAZIONE
Spiega perché il contenuto potrebbe essere problematico o perché non lo è.

10. SUGGERIMENTO OPERATIVO
Indica se:
- non sembra necessario intervenire
- conviene revisionare manualmente
- conviene segnalare a Facebook/Meta
- conviene conservare uno screenshot come prova

11. AVVERTENZA FINALE
Ricorda che solo Meta può stabilire ufficialmente se il contenuto viola le proprie regole.
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
          model: "openrouter/free",
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
