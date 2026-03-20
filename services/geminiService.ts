
import { AIAnalysisResult, Candle, AlgorithmType } from "../types";

export const analyzeMarket = async (
  symbol: string,
  candles: Candle[]
): Promise<AIAnalysisResult> => {
  return {
    signal: "HOLD",
    confidence: 0,
    reasoning: "AI Module is currently disabled in the frontend.",
    keyLevels: { support: 0, resistance: 0 }
  };
};

export const sendChatMessage = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  return "AI Chat is currently offline.";
}

export const analyzeAlgorithm = async (algorithm: AlgorithmType, arraySize: number) => {
  return {
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    explanation: "Algorithm analysis currently disabled.",
    optimizationTips: "AI Offline"
  };
};
