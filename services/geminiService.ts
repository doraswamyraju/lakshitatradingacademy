
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Candle, AlgorithmType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarket = async (
  symbol: string,
  candles: Candle[]
): Promise<AIAnalysisResult> => {
  try {
    const model = "gemini-3-pro-preview";
    
    const recentData = candles.slice(-10).map(c => 
      `[${new Date(c.time).toLocaleTimeString()}] O:${c.open.toFixed(2)} H:${c.high.toFixed(2)} L:${c.low.toFixed(2)} C:${c.close.toFixed(2)}`
    ).join('\n');

    const prompt = `
      You are a SEBI registered technical analyst for the Indian Stock Market (NSE/BSE). 
      Analyze the following OHLC data for ${symbol}. Prices are in INR (₹).
      
      Data:
      ${recentData}
      
      Determine the immediate Intraday trend.
      Provide a trading signal (BUY/SELL) suitable for an intraday trader.
      Calculate support and resistance levels.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signal: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
            confidence: { type: Type.NUMBER, description: "0-100 confidence score" },
            reasoning: { type: Type.STRING },
            keyLevels: {
                type: Type.OBJECT,
                properties: {
                    support: { type: Type.NUMBER },
                    resistance: { type: Type.NUMBER }
                }
            }
          },
          required: ["signal", "confidence", "reasoning", "keyLevels"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      signal: "HOLD",
      confidence: 0,
      reasoning: "Market data insufficient for analysis.",
      keyLevels: { support: 0, resistance: 0 }
    };
  }
};

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string) => {
    try {
        const chat = ai.chats.create({
            model: "gemini-3-pro-preview",
            history: history,
            config: {
                systemInstruction: "You are Lakshita Academy, an elite trading assistant specialized in the Indian Stock Market (NSE/BSE). You know about Nifty 50, Bank Nifty, Zerodha Kite API, and Option Greeks. You help users write algorithms using the Python Kite Connect library."
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (e) {
        console.error("Chat error", e);
        return "Connection to NSE server interrupted.";
    }
}

export const analyzeAlgorithm = async (algorithm: AlgorithmType, arraySize: number) => {
    return {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      explanation: "Algorithm analysis currently disabled in Trading Mode.",
      optimizationTips: "Focus on market microstructure."
    };
};
