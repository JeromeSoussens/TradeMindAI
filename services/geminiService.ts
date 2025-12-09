
import { GoogleGenAI, Type } from "@google/genai";
import { StockAdvice } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeStockPosition = async (
  symbol: string,
  buyPrice: number,
  currentPrice: number,
  sector: string
): Promise<StockAdvice> => {
  const ai = getAiClient();
  
  // Fallback if no API key
  if (!ai) {
    return {
      action: 'UNKNOWN',
      reasoning: 'API Key missing. Cannot generate advice.',
      confidence: 0,
      lastUpdated: Date.now()
    };
  }

  const profitLoss = ((currentPrice - buyPrice) / buyPrice) * 100;
  const plString = profitLoss > 0 ? `+${profitLoss.toFixed(2)}%` : `${profitLoss.toFixed(2)}%`;

  const prompt = `
    Analyze the following stock position for a retail investor:
    Stock: ${symbol} (Sector: ${sector})
    Buy Price: $${buyPrice}
    Current Price: $${currentPrice}
    Performance: ${plString}

    Based on general technical analysis principles for a volatile market:
    1. If the stock has dropped significantly (>10%), consider if it's a "buy the dip" or "cut losses".
    2. If the stock has gained significantly (>20%), consider "taking profits" or "holding for long term".
    3. Provide a recommendation: BUY (add more), SELL (close position), or HOLD.
    4. Provide a very short, punchy reason (max 20 words).
    5. Provide a confidence score (0-100) based on how strong the signal is.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD'] },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.INTEGER }
          },
          required: ['action', 'reasoning', 'confidence']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    
    return {
      action: json.action as 'BUY' | 'SELL' | 'HOLD',
      reasoning: json.reasoning || 'Analysis unavailable',
      confidence: json.confidence || 50,
      lastUpdated: Date.now()
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      action: 'HOLD',
      reasoning: 'AI Service temporarily unavailable. Holding is safer.',
      confidence: 0,
      lastUpdated: Date.now()
    };
  }
};
