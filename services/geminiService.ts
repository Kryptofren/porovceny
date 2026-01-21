
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingSource, PriceOffer } from "../types";

const parseMarkdownTable = (text: string): PriceOffer[] => {
  const offers: PriceOffer[] = [];
  const lines = text.split('\n');
  let tableStarted = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      if (trimmed.toLowerCase().includes('obchod') || trimmed.includes('---')) {
        tableStarted = true;
        continue;
      }
      
      if (tableStarted) {
        const cells = trimmed
          .split('|')
          .filter(cell => cell.trim() !== '')
          .map(cell => cell.trim());
        
        if (cells.length >= 3) {
          offers.push({
            store: cells[0] || 'Neznámy',
            product: cells[1] || 'Neznámy',
            price: cells[2] || 'N/A',
            validUntil: cells[3] || 'Neuvedené',
          });
        }
      }
    }
  }
  return offers;
};

export const searchPrices = async (query: string): Promise<SearchResult> => {
  const rawApiKey = process.env.API_KEY || "";
  const apiKey = rawApiKey.trim();
  
  // Získame začiatok kľúča pre diagnostiku
  const keyStart = apiKey.substring(0, 4).toUpperCase();

  if (keyStart === "PLAC" || keyStart === "NONE" || !apiKey) {
    throw new Error(`STÁLE POUŽÍVATE STARÝ KĽÚČ (${apiKey.substring(0, 8)}...). Nastavenie vo Verceli ste síce zmenili, ale aplikáciu ste ešte nepresunuli do prevádzky. Choďte do záložky 'Deployments' a kliknite na 'Redeploy'!`);
  }

  // Ak sme tu a kľúč začína na AIza, malo by to fungovať
  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Si nákupný expert pre Slovensko. 
    Vždy odpovedaj Markdown tabuľkou: | Obchod | Produkt | Cena | Platnosť |
    Zameraj sa na Tesco, Lidl, Kaufland, Billa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Aktuálne ceny pre ${query} na Slovensku.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    return { text, sources, offers: parseMarkdownTable(text) };
    
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const errorMsg = error.message || "";
    
    if (errorMsg.includes("API key not valid") || errorMsg.includes("400")) {
      throw new Error(`Google stále hlási neplatný kľúč (${apiKey.substring(0, 8)}...). Ak ste už urobili Redeploy a kľúč na vašom screenshote je správny, skúste vygenerovať úplne nový kľúč v Google AI Studio.`);
    }

    throw error;
  }
};
