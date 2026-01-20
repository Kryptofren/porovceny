
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingSource, PriceOffer } from "../types";

const parseMarkdownTable = (text: string): PriceOffer[] => {
  const offers: PriceOffer[] = [];
  const lines = text.split('\n');
  
  let tableStarted = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
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
  // Inicializácia klienta vždy nanovo pre zabezpečenie aktuálneho kľúča v rámci free tier limitov
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    Si bezplatný nákupný asistent. Tvojou úlohou je nájsť aktuálne najlepšie ceny pre: Tesco, Lidl, Kaufland, Billa a Jednota.
    
    FORMÁT:
    1. Krátky sumár.
    2. Markdown tabuľka: | Obchod | Produkt | Cena | Platnosť akcie |
    
    Dôležité: Používaj len Google Search grounding na získanie aktuálnych dát z webu.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Najefektívnejší model pre Free Tier
      contents: `Nájdi ceny pre: ${query} v SR obchodoch.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        // Deaktivujeme thinking budget pre úsporu tokenov a rýchlosť vo free tieri
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text || "Dáta nedostupné.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    const offers = parseMarkdownTable(text);

    return {
      text,
      sources,
      offers,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Free limit vyčerpaný alebo chyba spojenia. Skúste o chvíľu.");
  }
};
