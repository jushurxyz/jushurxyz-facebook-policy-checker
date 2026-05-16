import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 5) {
      return Response.json({
        result: "Inserisci un testo più completo da analizzare."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        result: "ERRORE: la variabile GEMINI_API_KEY non risulta configurata su Vercel."
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

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

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    return Response.json({ result: output });

  } catch (error) {
    return Response.json({
      result: "ERRORE REALE: " + error.message
    });
  }
}
