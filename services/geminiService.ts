
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
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("V systéme chýba API_KEY. Skontrolujte nastavenia Vercelu.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Si nákupný špecialista na slovenské potraviny. 
    Tvojou úlohou je nájsť AKTUÁLNE AKCIE pre dopyt v obchodoch: Tesco, Lidl, Kaufland, Billa, COOP Jednota.
    
    PRAVIDLÁ:
    1. Vždy vráť Markdown tabuľku: | Obchod | Produkt | Cena | Platnosť |
    2. Pod tabuľku pridaj jednu vetu s odporúčaním.
    3. Ak nevieš nájsť presnú cenu cez Google Search, použi svoje interné vedomosti o bežných akciách na Slovensku.
  `;

  // Pokus č. 1: S Google Search groundingom
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Nájdi aktuálne akciové ceny pre: ${query} na Slovensku.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "Neboli nájdené žiadne dáta.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    return { text, sources, offers: parseMarkdownTable(text) };
    
  } catch (error: any) {
    console.warn("Google Search zlyhal (pravdepodobne regionálne obmedzenie), skúšam fallback bez search toolu...", error);
    
    // Fallback: Ak zlyhá search (400), skúsime to isté bez nástrojov
    if (error.message?.includes("400") || error.message?.includes("403")) {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: modelName,
          contents: `Nájdi aktuálne odhadované akciové ceny pre: ${query} na Slovensku podľa tvojich vedomostí o letákoch.`,
          config: { systemInstruction },
        });

        const text = fallbackResponse.text || "";
        return { 
          text: text + "\n\n(Poznámka: Tieto dáta sú generované bez priameho prístupu k webu kvôli technickému obmedzeniu API.)", 
          sources: [], 
          offers: parseMarkdownTable(text) 
        };
      } catch (innerError) {
        throw new Error("Kritická chyba AI modelu. Skontrolujte API kľúč.");
      }
    }
    
    if (error.message?.includes("429")) throw new Error("Dosiahli ste limit bezplatných dopytov. Skúste o minútu.");
    throw new Error("Chyba spojenia s AI. Skontrolujte nastavenia Vercel.");
  }
};
