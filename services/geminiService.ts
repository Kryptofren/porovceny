
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
  // Aplikácia vyžaduje presne názov API_KEY
  const rawApiKey = process.env.API_KEY || "";
  const apiKey = rawApiKey.trim();
  
  if (!apiKey) {
    throw new Error("Chýba premenná s názvom 'API_KEY'. Vo Verceli sa nesmie volať GOOGLE_AI_API_KEY, ale presne API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Používame najnovší gemini-3-flash-preview
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Si slovenský nákupný expert. 
    Hľadaj aktuálne akciové ceny potravín na Slovensku (Tesco, Lidl, Kaufland, Billa, Kraj).
    Vždy odpovedaj Markdown tabuľkou: | Obchod | Produkt | Cena | Platnosť |
    Pod tabuľku pridaj stručné odporúčanie, kde sa nákup najviac oplatí.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Nájdi aktuálne akcie na ${query} v slovenských obchodoch.`,
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
    const keySnippet = apiKey ? `${apiKey.substring(0, 6)}...` : "NONE";

    if (errorMsg.includes("API key not valid") || errorMsg.includes("400")) {
      throw new Error(`Kľúč (${keySnippet}) bol Google serverom odmietnutý. Skontrolujte: 1. Názov musí byť API_KEY. 2. Kľúč musí byť aktívny v Google AI Studio. 3. Skúste REDEPLOY.`);
    }

    // Fallback ak zlyhá len vyhľadávanie
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Aké sú typické akciové ceny pre ${query} na Slovensku? Odpovedaj tabuľkou.`,
        config: { systemInstruction },
      });
      const text = fallbackResponse.text || "";
      return { 
        text: text + "\n\n(Poznámka: Dáta z pamäte AI, vyhľadávanie na webe zlyhalo).", 
        sources: [], 
        offers: parseMarkdownTable(text) 
      };
    } catch (innerError: any) {
      throw new Error(`Kritické zlyhanie: ${innerError.message}`);
    }
  }
};
