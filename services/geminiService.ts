
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
  
  // Diagnostická informácia o kľúči (pre zobrazenie v UI v prípade chyby)
  const keySnippet = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : "CHÝBA";

  if (!apiKey) {
    throw new Error("V systéme chýba API_KEY. Skontrolujte Environment Variables vo Verceli.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Zmena na gemini-2.5-flash pre širšiu kompatibilitu
  const modelName = "gemini-2.5-flash";
  
  const systemInstruction = `
    Si nákupný špecialista pre Slovensko. 
    Vždy odpovedaj Markdown tabuľkou: | Obchod | Produkt | Cena | Platnosť |
    Obchody: Tesco, Lidl, Kaufland, Billa.
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
      throw new Error(`[NEPLATNÝ KĽÚČ] Google odmietol kľúč "${keySnippet}". Skontrolujte ho v Google AI Studio a urobte REDEPLOY vo Verceli.`);
    }

    // Fallback pokus bez Search toolu
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Aké sú bežné akciové ceny pre ${query} na Slovensku? Odpovedaj tabuľkou.`,
        config: { systemInstruction },
      });
      const text = fallbackResponse.text || "";
      return { 
        text: text + "\n\n(Poznámka: Vyhľadávanie na webe je blokované, toto sú archívne dáta).", 
        sources: [], 
        offers: parseMarkdownTable(text) 
      };
    } catch (innerError: any) {
      throw new Error(`[Kritická chyba] Model ${modelName} hlási: ${innerError.message}. Overte kľúč ${keySnippet}`);
    }
  }
};
