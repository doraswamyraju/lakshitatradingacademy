/**
 * executionEngine.ts
 * ──────────────────
 * Stateful auto-execution engine for live trading.
 *
 * How it works:
 * 1. On each socket tick, `evaluate()` is called with the latest candles + live price.
 * 2. If no position is open → checks entry conditions via strategyEngine.
 * 3. If a position IS open → checks SL / TP / trailing stop / exit conditions.
 * 4. Fires real orders via the backend API (or logs as Paper Trade).
 * 5. Respects NSE market hours: only trades 09:30–11:00 and 12:45–14:50 IST.
 *    (Force-exits any open position at 15:15 IST.)
 *
 * Usage in MarketDashboard:
 *   const engine = useRef(new ExecutionEngine());
 *   // inside socket handler:
 *   engine.current.evaluate({ candles, price, strategy, authHeaders, addLog, isPaper });
 */

import { Candle, TradingStrategy } from '../types';
import { getEntrySignal, getExitSignal, TradeSide } from './strategyEngine';

export interface OpenPosition {
  side:          TradeSide;
  entryPrice:    number;
  entryTime:     number;       // epoch-ms
  qty:           number;
  stopLoss:      number;       // absolute price
  target:        number;       // absolute price
  trailHigh:     number;       // for trailing stop on BUY
  trailLow:      number;       // for trailing stop on SELL
  isPaper:       boolean;
}

export interface ExecLog {
  time:    string;
  action:  'ENTRY' | 'EXIT' | 'SL' | 'TP' | 'TRAIL_SL' | 'FORCE_EXIT' | 'SIGNAL' | 'SKIP';
  side?:   TradeSide;
  price?:  number;
  pnl?:    number;
  reason:  string;
}

interface EvaluateOptions {
  candles:     Candle[];
  livePrice:   number;
  strategy:    TradingStrategy;
  authHeaders: Record<string, string> | undefined;
  addLog:      (msg: string) => void;
  isPaper:     boolean;
  onPositionChange?: (pos: OpenPosition | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// IST market hours helpers
// ─────────────────────────────────────────────────────────────────────────────

function nowIST(): { h: number; m: number } {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return { h: ist.getUTCHours(), m: ist.getUTCMinutes() };
}

function toMinutes(h: number, m: number): number { return h * 60 + m; }

/** Returns true if current IST time is within an NSE allowed trading window */
function isWithinTradingHours(): boolean {
  const { h, m } = nowIST();
  const cur = toMinutes(h, m);
  // Window 1: 09:30 – 11:00
  const w1Start = toMinutes(9, 30);
  const w1End   = toMinutes(11, 0);
  // Window 2: 12:45 – 14:50
  const w2Start = toMinutes(12, 45);
  const w2End   = toMinutes(14, 50);
  return (cur >= w1Start && cur <= w1End) || (cur >= w2Start && cur <= w2End);
}

/** Returns true if we are past the force-exit time (15:15 IST) */
function isPastForceExit(): boolean {
  const { h, m } = nowIST();
  return toMinutes(h, m) >= toMinutes(15, 15);
}

// ─────────────────────────────────────────────────────────────────────────────
// Execution Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ExecutionEngine {
  position: OpenPosition | null = null;
  private lastSignalBar = -1;  // prevents re-entering on the same bar
  private evaluationCount = 0;

  reset() {
    this.position = null;
    this.lastSignalBar = -1;
    this.evaluationCount = 0;
  }

  // ── Main evaluation entry point ────────────────────────────────────────────
  async evaluate(opts: EvaluateOptions): Promise<void> {
    const { candles, livePrice, strategy, authHeaders, addLog, isPaper, onPositionChange } = opts;
    if (!candles || candles.length < 25 || livePrice <= 0) return;

    this.evaluationCount++;

    // ── 1. Force-exit at end of day ──────────────────────────────────────────
    if (this.position && isPastForceExit()) {
      await this.closePosition(livePrice, 'FORCE_EXIT: 15:15 EOD', opts);
      onPositionChange?.(this.position);
      return;
    }

    // ── 2. Manage open position ──────────────────────────────────────────────
    if (this.position) {
      const pos    = this.position;
      const profit = pos.side === 'BUY'
        ? livePrice - pos.entryPrice
        : pos.entryPrice - livePrice;

      // Update trailing stop
      if (strategy.riskConfig.trailingStopLoss) {
        const step = strategy.riskConfig.trailStep ?? 30;
        if (pos.side === 'BUY'  && livePrice > pos.trailHigh) {
          pos.trailHigh = livePrice;
          pos.stopLoss  = pos.trailHigh - step;
        }
        if (pos.side === 'SELL' && livePrice < pos.trailLow) {
          pos.trailLow = livePrice;
          pos.stopLoss = pos.trailLow + step;
        }
      }

      // SL hit?
      const slHit = pos.side === 'BUY'
        ? livePrice <= pos.stopLoss
        : livePrice >= pos.stopLoss;

      // TP hit?
      const tpHit = strategy.riskConfig.pointBased
        ? (pos.side === 'BUY' ? livePrice >= pos.target : livePrice <= pos.target)
        : (pos.side === 'BUY' ? livePrice >= pos.target : livePrice <= pos.target);

      if (slHit) {
        await this.closePosition(livePrice, 'STOP_LOSS hit', opts);
      } else if (tpHit) {
        await this.closePosition(livePrice, 'TARGET hit', opts);
      } else {
        // Check rule-based exit conditions
        const shouldExit = getExitSignal(strategy, candles, pos.side);
        if (shouldExit) {
          await this.closePosition(livePrice, 'RULE_EXIT signal', opts);
        }
      }

      onPositionChange?.(this.position);
      return;
    }

    // ── 3. Look for entry ────────────────────────────────────────────────────
    // Only enter within allowed trading hours
    if (!isWithinTradingHours()) {
      if (this.evaluationCount % 60 === 0) {
        addLog('[AUTO] Outside trading window (09:30-11:00 or 12:45-14:50 IST). Waiting...');
      }
      return;
    }

    // Don't enter twice on the same bar
    const currentBarIdx = candles.length - 1;
    if (currentBarIdx === this.lastSignalBar) return;

    const signal = getEntrySignal(strategy, candles);
    if (!signal) return;

    // Check minimum RR if configured
    const rr = strategy.riskConfig.minRR ?? 1.0;
    const sl = strategy.riskConfig.pointBased
      ? (strategy.riskConfig.stopLossPoints ?? 30)
      : livePrice * (strategy.riskConfig.stopLossPct / 100);
    const tp = strategy.riskConfig.pointBased
      ? (strategy.riskConfig.stopLossPoints ?? 30) * rr
      : livePrice * (strategy.riskConfig.takeProfitPct / 100);

    if (tp < sl * rr) {
      addLog(`[AUTO] Signal ${signal} skipped — RR below minimum (${rr}:1)`);
      return;
    }

    await this.openPosition(signal, livePrice, sl, tp, strategy, opts);
    this.lastSignalBar = currentBarIdx;
    onPositionChange?.(this.position);
  }

  // ── Open a new position ────────────────────────────────────────────────────
  private async openPosition(
    side:     TradeSide,
    price:    number,
    slPoints: number,
    tpPoints: number,
    strategy: TradingStrategy,
    opts:     EvaluateOptions
  ): Promise<void> {
    const { addLog, authHeaders, isPaper, strategy: strat } = opts;
    const qty = Math.max(1, strat.qty ?? 1);

    const stopLoss = side === 'BUY'  ? price - slPoints : price + slPoints;
    const target   = side === 'BUY'  ? price + tpPoints : price - tpPoints;

    this.position = {
      side, entryPrice: price, entryTime: Date.now(), qty,
      stopLoss, target, trailHigh: price, trailLow: price,
      isPaper,
    };

    const tag = isPaper ? '[PAPER]' : '[LIVE]';
    addLog(`${tag} ENTRY ${side} @ ₹${price.toFixed(2)} | SL: ₹${stopLoss.toFixed(2)} | TP: ₹${target.toFixed(2)} | Qty: ${qty}`);

    if (!isPaper && authHeaders) {
      try {
        const res = await fetch('/api/orders/place', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            tradingsymbol: 'NIFTY BANK',
            exchange: 'NSE',
            transactionType: side,
            quantity: qty,
            product: strategy.productType ?? 'MIS',
            orderType: 'MARKET',
          }),
        });
        const json = await res.json();
        if (res.ok) {
          addLog(`[LIVE] Order placed: ${json.orderId}`);
        } else {
          addLog(`[LIVE] Order FAILED: ${json.error || 'Unknown error'}`);
          this.position = null; // rollback
        }
      } catch (e: any) {
        addLog(`[LIVE] Order error: ${e.message}`);
        this.position = null;
      }
    }
  }

  // ── Close the current position ─────────────────────────────────────────────
  private async closePosition(
    price:  number,
    reason: string,
    opts:   EvaluateOptions
  ): Promise<void> {
    if (!this.position) return;
    const { addLog, authHeaders, isPaper, strategy } = opts;
    const pos = this.position;

    const pnl = pos.side === 'BUY'
      ? (price - pos.entryPrice) * pos.qty
      : (pos.entryPrice - price) * pos.qty;

    const tag = isPaper ? '[PAPER]' : '[LIVE]';
    const sign = pnl >= 0 ? '+' : '';
    addLog(`${tag} EXIT ${pos.side} @ ₹${price.toFixed(2)} | PnL: ${sign}₹${pnl.toFixed(2)} | ${reason}`);

    if (!isPaper && authHeaders) {
      const exitSide: TradeSide = pos.side === 'BUY' ? 'SELL' : 'BUY';
      try {
        const res = await fetch('/api/orders/place', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            tradingsymbol: 'NIFTY BANK',
            exchange: 'NSE',
            transactionType: exitSide,
            quantity: pos.qty,
            product: strategy.productType ?? 'MIS',
            orderType: 'MARKET',
          }),
        });
        const json = await res.json();
        if (res.ok) addLog(`[LIVE] Exit order placed: ${json.orderId}`);
        else addLog(`[LIVE] Exit order FAILED: ${json.error || 'Unknown'}`);
      } catch (e: any) {
        addLog(`[LIVE] Exit order error: ${e.message}`);
      }
    }

    this.position = null;
  }
}
