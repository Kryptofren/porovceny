
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
  // POZOR: Na Verceli sa uistite, že premenná sa volá presne API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Chýba API_KEY. Pridajte ho do Environment Variables na Verceli.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Si nákupný špecialista na slovenské potraviny. 
    Vráť Markdown tabuľku: | Obchod | Produkt | Cena | Platnosť |
    Pod tabuľku pridaj krátke odporúčanie.
  `;

  try {
    // Pokus 1: S vyhľadávaním
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Aktuálne ceny pre: ${query} na Slovensku v obchodoch Tesco, Lidl, Kaufland, Billa.`,
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
    console.error("Gemini Search Error:", error);
    
    // Fallback: Ak zlyhá vyhľadávanie (napr. regionálny blok 400), skúsime čisté AI
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Aké sú bežné akciové ceny pre ${query} na Slovensku? (Odpovedaj podľa svojich vedomostí, ak nemáš prístup k webu).`,
        config: { systemInstruction },
      });

      const text = fallbackResponse.text || "";
      return { 
        text: text + "\n\n(Dáta z archívu AI - webové vyhľadávanie je momentálne nedostupné).", 
        sources: [], 
        offers: parseMarkdownTable(text) 
      };
    } catch (innerError: any) {
      // Tu vypíšeme presnú chybu z API, aby používateľ vedel čo opraviť
      throw new Error(`[API Error] ${innerError.message || 'Neznáma chyba'}`);
    }
  }
};
