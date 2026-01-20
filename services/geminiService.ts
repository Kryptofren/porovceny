
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
  
  const systemInstruction = `
    Si nákupný špecialista na slovenské potraviny. 
    Tvojou úlohou je nájsť AKTUÁLNE AKCIE pre dopyt v obchodoch: Tesco, Lidl, Kaufland, Billa, COOP Jednota.
    
    PRAVIDLÁ:
    1. Vždy vráť Markdown tabuľku: | Obchod | Produkt | Cena | Platnosť |
    2. Pod tabuľku pridaj jednu vetu s odporúčaním, kde sa to najviac oplatí.
    3. Ak nevieš nájsť presnú cenu, odhadni ju podľa posledných známych letákov.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Nájdi aktuálne akciové ceny pre: ${query} na Slovensku.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
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

    const offers = parseMarkdownTable(text);

    return {
      text,
      sources,
      offers,
    };
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // Špecifickejšie chybové hlášky
    if (error.message?.includes("429")) throw new Error("Dosiahli ste limit bezplatných dopytov (Free Tier). Skúste o minútu.");
    if (error.message?.includes("403")) throw new Error("API kľúč nemá povolenie na Google Search (možné regionálne obmedzenie EÚ).");
    if (error.message?.includes("400")) throw new Error("Chybná požiadavka. Skúste iný názov potraviny.");
    
    throw new Error("Chyba spojenia s AI. Skontrolujte API_KEY v nastaveniach Vercel.");
  }
};
