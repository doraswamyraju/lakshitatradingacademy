/**
 * strategyEngine.ts
 * ─────────────────
 * Pure, side-effect-free functions for indicator calculation and strategy
 * condition evaluation. Used by both the live AutoExecution engine and the
 * BacktestPanel so logic stays identical across both contexts.
 */

import {
  Candle,
  StrategyCondition,
  TradingStrategy,
  IndicatorType,
  OperatorType,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Heikin Ashi transform
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Core indicator functions (index-based for efficiency in loops)
// ─────────────────────────────────────────────────────────────────────────────

export function calcSMA(closes: number[], period: number, i: number): number | null {
  if (i < period - 1) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j++) sum += closes[j];
  return sum / period;
}

export function calcEMA(closes: number[], period: number, i: number): number | null {
  if (i < period - 1) return null;
  const k = 2 / (period + 1);
  // seed with SMA of first `period` values
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let j = period; j <= i; j++) {
    ema = closes[j] * k + ema * (1 - k);
  }
  return ema;
}

export function calcRSI(closes: number[], period: number, i: number): number | null {
  if (i < period) return null;
  let gains = 0, losses = 0;
  for (let j = i - period + 1; j <= i; j++) {
    const d = closes[j] - closes[j - 1];
    if (d >= 0) gains += d; else losses += Math.abs(d);
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export interface MACDResult { macd: number; signal: number; histogram: number }

export function calcMACD(closes: number[], i: number): MACDResult | null {
  if (i < 33) return null; // need at least 34 values
  const fast = calcEMA(closes, 12, i);
  const slow = calcEMA(closes, 26, i);
  if (fast === null || slow === null) return null;
  const macd = fast - slow;
  // signal = EMA-9 of macd values (approximate using last 9 macd values)
  let signalVal = macd;
  const k = 2 / 10;
  for (let j = Math.max(0, i - 8); j <= i; j++) {
    const f = calcEMA(closes, 12, j);
    const s = calcEMA(closes, 26, j);
    if (f !== null && s !== null) signalVal = (f - s) * k + signalVal * (1 - k);
  }
  return { macd, signal: signalVal, histogram: macd - signalVal };
}

export interface BollingerResult { upper: number; middle: number; lower: number }

export function calcBollinger(closes: number[], period: number, stdDevMult: number, i: number): BollingerResult | null {
  const mid = calcSMA(closes, period, i);
  if (mid === null) return null;
  let variance = 0;
  for (let j = i - period + 1; j <= i; j++) variance += Math.pow(closes[j] - mid, 2);
  const sd = Math.sqrt(variance / period);
  return { upper: mid + stdDevMult * sd, middle: mid, lower: mid - stdDevMult * sd };
}

export interface ADXResult { adx: number; diPlus: number; diMinus: number }

export function calcADX(candles: Candle[], period: number, i: number): ADXResult | null {
  if (i < period * 2) return null;
  const trList: number[] = [];
  const dmPlusList: number[] = [];
  const dmMinusList: number[] = [];

  for (let j = i - period * 2 + 1; j <= i; j++) {
    const c = candles[j];
    const prev = candles[j - 1] || c;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    const upMove   = c.high - prev.high;
    const downMove = prev.low - c.low;
    trList.push(tr);
    dmPlusList.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinusList.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth over period
  const smTR     = trList.slice(-period).reduce((a, b) => a + b, 0);
  const smDMPlus = dmPlusList.slice(-period).reduce((a, b) => a + b, 0);
  const smDMMinus= dmMinusList.slice(-period).reduce((a, b) => a + b, 0);

  if (smTR === 0) return null;
  const diPlus  = (smDMPlus  / smTR) * 100;
  const diMinus = (smDMMinus / smTR) * 100;
  const dxDenom = diPlus + diMinus;
  const dx = dxDenom === 0 ? 0 : (Math.abs(diPlus - diMinus) / dxDenom) * 100;

  // Simple average of DX values for ADX
  let adxSum = 0;
  let adxCount = 0;
  for (let j = i - period + 1; j <= i; j++) {
    if (j < 0) continue;
    const cj = candles[j]; const pj = candles[j - 1] || cj;
    const trj = Math.max(cj.high - cj.low, Math.abs(cj.high - pj.close), Math.abs(cj.low - pj.close));
    const up = cj.high - pj.high; const dn = pj.low - cj.low;
    const trSlice = trList.slice(0, j - (i - period * 2 + 1) + 1);
    if (trSlice.length === 0 || trj === 0) continue;
    adxSum += dx; // simplified: use current dx as proxy
    adxCount++;
  }
  const adx = adxCount > 0 ? adxSum / adxCount : dx;
  return { adx, diPlus, diMinus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get a single indicator value by type
// ─────────────────────────────────────────────────────────────────────────────

export function getIndicatorValue(
  type: IndicatorType,
  candles: Candle[],
  ha: HACandle[],
  i: number,
  params: Record<string, any> = {}
): number | null {
  const closes = candles.map(c => c.close);
  switch (type) {
    case 'PRICE':           return closes[i] ?? null;
    case 'SMA':             return calcSMA(closes, params.period ?? 20, i);
    case 'EMA':             return calcEMA(closes, params.period ?? 9, i);
    case 'RSI':             return calcRSI(closes, params.period ?? 14, i);
    case 'MACD':            return calcMACD(closes, i)?.macd ?? null;
    case 'VOLUME':          return candles[i]?.volume ?? null;
    case 'BOLLINGER_UPPER': return calcBollinger(closes, params.period ?? 20, params.stdDev ?? 2, i)?.upper ?? null;
    case 'BOLLINGER_LOWER': return calcBollinger(closes, params.period ?? 20, params.stdDev ?? 2, i)?.lower ?? null;
    case 'BOLLINGER_MIDDLE':return calcBollinger(closes, params.period ?? 20, params.stdDev ?? 2, i)?.middle ?? null;
    case 'ADX':             return calcADX(candles, params.period ?? 14, i)?.adx ?? null;
    case 'DI_PLUS':         return calcADX(candles, params.period ?? 14, i)?.diPlus ?? null;
    case 'DI_MINUS':        return calcADX(candles, params.period ?? 14, i)?.diMinus ?? null;
    case 'CURRENT_HIGH':    return candles[i]?.high ?? null;
    case 'CURRENT_LOW':     return candles[i]?.low  ?? null;
    case 'PREVIOUS_HIGH':   return i > 0 ? candles[i - 1].high : null;
    case 'PREVIOUS_LOW':    return i > 0 ? candles[i - 1].low  : null;
    default:                return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Heikin Ashi pattern detector
// ─────────────────────────────────────────────────────────────────────────────

export type HAPattern = 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'WEAK_CANDLE' | null;

export function detectHAPattern(ha: HACandle[]): HAPattern {
  if (ha.length < 2) return null;
  const c = ha[ha.length - 1];
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0) return 'WEAK_CANDLE';

  const bodyRatio  = body / range;
  const lowerWick  = Math.min(c.open, c.close) - c.low;
  const upperWick  = c.high - Math.max(c.open, c.close);

  if (c.close > c.open && bodyRatio > 0.55 && lowerWick < body * 0.25)
    return 'STRONG_BULLISH';
  if (c.close < c.open && bodyRatio > 0.55 && upperWick < body * 0.25)
    return 'STRONG_BEARISH';
  return 'WEAK_CANDLE';
}

// ─────────────────────────────────────────────────────────────────────────────
// Single condition evaluator
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateCondition(
  cond: StrategyCondition,
  candles: Candle[],
  ha: HACandle[],
  i: number
): boolean {
  try {
    // Heikin Ashi pattern check
    if (cond.source === 'HEIKIN_ASHI_CANDLE' && cond.operator === 'PATTERN_MATCH') {
      const pattern = detectHAPattern(ha.slice(0, i + 1));
      return pattern === cond.pattern;
    }

    const sourceVal = getIndicatorValue(cond.source, candles, ha, i, cond.sourceParams ?? {});
    if (sourceVal === null) return false;

    // BETWEEN operator (uses minValue / maxValue)
    if (cond.operator === 'BETWEEN') {
      const lo = cond.minValue ?? -Infinity;
      const hi = cond.maxValue ??  Infinity;
      return sourceVal >= lo && sourceVal <= hi;
    }

    // Get the right-hand side
    let rhsVal: number | null = null;
    if (cond.targetType === 'VALUE') {
      rhsVal = cond.targetValue ?? null;
    } else if (cond.targetType === 'INDICATOR' && cond.targetIndicator) {
      rhsVal = getIndicatorValue(cond.targetIndicator, candles, ha, i, cond.targetParams ?? {});
    }
    if (rhsVal === null) return false;

    const NEAR_THRESHOLD = 0.003; // 0.3 % tolerance for NEAR

    switch (cond.operator as OperatorType) {
      case '>':         return sourceVal >  rhsVal;
      case '<':         return sourceVal <  rhsVal;
      case '>=':        return sourceVal >= rhsVal;
      case '<=':        return sourceVal <= rhsVal;
      case '==':        return Math.abs(sourceVal - rhsVal) < rhsVal * 0.001;
      case 'NEAR':      return Math.abs(sourceVal - rhsVal) / rhsVal < NEAR_THRESHOLD;
      case 'CROSSOVER': {
        // sourceVal just crossed ABOVE rhsVal → need prev values
        const prevSource = i > 0 ? getIndicatorValue(cond.source, candles, ha, i - 1, cond.sourceParams ?? {}) : null;
        const prevRHS    = i > 0 && cond.targetType === 'INDICATOR' && cond.targetIndicator
          ? getIndicatorValue(cond.targetIndicator, candles, ha, i - 1, cond.targetParams ?? {})
          : rhsVal;
        if (prevSource === null || prevRHS === null) return false;
        return prevSource <= prevRHS && sourceVal > rhsVal;
      }
      case 'CROSSUNDER': {
        const prevSource = i > 0 ? getIndicatorValue(cond.source, candles, ha, i - 1, cond.sourceParams ?? {}) : null;
        const prevRHS    = i > 0 && cond.targetType === 'INDICATOR' && cond.targetIndicator
          ? getIndicatorValue(cond.targetIndicator, candles, ha, i - 1, cond.targetParams ?? {})
          : rhsVal;
        if (prevSource === null || prevRHS === null) return false;
        return prevSource >= prevRHS && sourceVal < rhsVal;
      }
      default: return false;
    }
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-condition evaluator for a side (BUY or SELL)
// Returns true only when ALL relevant conditions pass
// ─────────────────────────────────────────────────────────────────────────────

export type TradeSide = 'BUY' | 'SELL';

export function evaluateConditions(
  conditions: StrategyCondition[],
  candles: Candle[],
  ha: HACandle[],
  i: number,
  side: TradeSide
): boolean {
  const relevant = conditions.filter(c => !c.side || c.side === side || c.side === 'ANY');
  if (relevant.length === 0) return false;
  return relevant.every(c => evaluateCondition(c, candles, ha, i));
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: evaluate entry signal at the LATEST candle
// Returns 'BUY' | 'SELL' | null
// ─────────────────────────────────────────────────────────────────────────────

export function getEntrySignal(
  strategy: TradingStrategy,
  candles: Candle[],
): TradeSide | null {
  if (candles.length < 25) return null;
  const ha = buildHeikinAshi(candles);
  const i  = candles.length - 1;
  if (evaluateConditions(strategy.entryConditions, candles, ha, i, 'BUY'))  return 'BUY';
  if (evaluateConditions(strategy.entryConditions, candles, ha, i, 'SELL')) return 'SELL';
  return null;
}

export function getExitSignal(
  strategy: TradingStrategy,
  candles: Candle[],
  openSide: TradeSide
): boolean {
  if (candles.length < 2) return false;
  const ha = buildHeikinAshi(candles);
  const i  = candles.length - 1;
  return evaluateConditions(strategy.exitConditions, candles, ha, i, openSide);
}
