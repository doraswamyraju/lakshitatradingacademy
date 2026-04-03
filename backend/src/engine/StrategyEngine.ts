/**
 * backend/src/engine/StrategyEngine.ts
 * ────────────────────────────────────
 * Ported from frontend for server-side evaluation.
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HACandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function buildHeikinAshi(candles: Candle[]): HACandle[] {
  if (candles.length === 0) return [];
  const result: HACandle[] = [];
  let prevO = (candles[0].open + candles[0].close) / 2;
  let prevC = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;
  result.push({ time: candles[0].time, open: prevO, high: Math.max(candles[0].high, prevO, prevC), low: Math.min(candles[0].low, prevO, prevC), close: prevC });
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen  = (prevO + prevC) / 2;
    result.push({
      time:  c.time,
      open:  haOpen,
      high:  Math.max(c.high, haOpen, haClose),
      low:   Math.min(c.low,  haOpen, haClose),
      close: haClose,
    });
    prevO = haOpen;
    prevC = haClose;
  }
  return result;
}

export function calcSMA(closes: number[], period: number, i: number): number | null {
  if (i < period - 1) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j++) sum += closes[j];
  return sum / period;
}

export function calcADX(candles: Candle[], period: number, i: number) {
  if (i < period * 2) return null;
  const trList: number[] = [];
  const dmPlusList: number[] = [];
  const dmMinusList: number[] = [];
  for (let j = i - period * 2 + 1; j <= i; j++) {
    const c = candles[j];
    const prev = candles[j - 1] || c;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    const upMove = c.high - prev.high;
    const downMove = prev.low - c.low;
    trList.push(tr);
    dmPlusList.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinusList.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  const smTR = trList.slice(-period).reduce((a, b) => a + b, 0);
  const smDMPlus = dmPlusList.slice(-period).reduce((a, b) => a + b, 0);
  const smDMMinus = dmMinusList.slice(-period).reduce((a, b) => a + b, 0);
  if (smTR === 0) return null;
  const diPlus = (smDMPlus / smTR) * 100;
  const diMinus = (smDMMinus / smTR) * 100;
  const dxDenom = diPlus + diMinus;
  const dx = dxDenom === 0 ? 0 : (Math.abs(diPlus - diMinus) / dxDenom) * 100;
  return { adx: dx, diPlus, diMinus }; // Simple ADX proxy
}

export type HAPattern = 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'WEAK_CANDLE' | null;

export function detectHAPattern(ha: HACandle[]): HAPattern {
  if (ha.length < 1) return null;
  const c = ha[ha.length - 1];
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0) return 'WEAK_CANDLE';
  const bodyRatio = body / range;
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const upperWick = c.high - Math.max(c.open, c.close);
  if (c.close > c.open && bodyRatio > 0.55 && lowerWick < body * 0.25) return 'STRONG_BULLISH';
  if (c.close < c.open && bodyRatio > 0.55 && upperWick < body * 0.25) return 'STRONG_BEARISH';
  return 'WEAK_CANDLE';
}
