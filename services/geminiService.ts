
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
  // Získame kľúč a ošetríme ho o náhodné medzery
  const rawApiKey = process.env.API_KEY || "";
  const apiKey = rawApiKey.trim();
  
  if (!apiKey) {
    throw new Error("V systéme úplne chýba premenná API_KEY. Pridajte ju vo Verceli.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Si slovenský nákupný asistent. 
    Vždy odpovedaj Markdown tabuľkou: | Obchod | Produkt | Cena | Platnosť |
    Nájdi najlepšie ceny pre dany tovar v SR (Tesco, Lidl, Kaufland, Billa).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Aktuálne akcie na ${query} na Slovensku.`,
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
    
    // Špecifická detekcia neplatného kľúča
    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("NEPLATNÝ API KĽÚČ. Váš kľúč vo Verceli je nesprávny. Skopírujte ho znova z Google AI Studio bez medzier.");
    }

    // Fallback bez vyhľadávania (ak je problém len v Google Search tool)
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Aké sú bežné akciové ceny pre ${query} na Slovensku?`,
        config: { systemInstruction },
      });
      const text = fallbackResponse.text || "";
      return { 
        text: text + "\n\n(Režim bez internetu - obmedzené dáta).", 
        sources: [], 
        offers: parseMarkdownTable(text) 
      };
    } catch (innerError: any) {
      if (innerError.message?.includes("API key not valid")) {
         throw new Error("NEPLATNÝ API KĽÚČ. Skontrolujte nastavenia Vercel.");
      }
      throw new Error(`[Chyba API] ${innerError.message || 'Nepodarilo sa spojiť s AI'}`);
    }
  }
};
