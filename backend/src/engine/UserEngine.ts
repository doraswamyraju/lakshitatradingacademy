/**
 * backend/src/engine/UserEngine.ts
 * ────────────────────────────────
 * Stateful engine that runs a strategy for a specific user.
 */
import { PrismaClient } from '@prisma/client';
import { Candle, buildHeikinAshi, detectHAPattern, calcADX } from './StrategyEngine';
import { KiteService } from '../services/KiteService';

const prisma = new PrismaClient();

export class UserEngine {
  public userId: string;
  public username: string;
  private isPaper: boolean;
  private kite: KiteService | null = null;
  
  private position: any = null;
  private lastSignalBar = -1;
  private lastHeartbeat = 0;
  private logCallback: (msg: string) => void;

  constructor(userId: string, username: string, isPaper: boolean, logCallback: (msg: string) => void, kite?: KiteService) {
    this.userId = userId;
    this.username = username;
    this.isPaper = isPaper;
    this.logCallback = logCallback;
    if (kite) this.kite = kite;

    this.addLog(`SYSTEM: Engine initialized for user ${this.username}. Waiting for market ticks...`);
  }

  private addLog(msg: string) {
    const time = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    const logMsg = msg.startsWith('SYSTEM:') ? msg : `[${time}] [USER: ${this.username}] ${this.isPaper ? '[PAPER] ' : ''}${msg}`;
    console.log(logMsg);
    
    // Broadcast via callback
    this.logCallback(msg);
    
    // Save to Database
    prisma.strategyLog.create({
      data: {
        userId: this.userId,
        strategyId: 'm3_v2',
        action: 'LOG',
        symbol: 'BANKNIFTY',
        price: 0,
        qty: 0,
        status: 'INFO',
        isSimulated: this.isPaper,
        message: logMsg
      }
    }).catch(err => {
      console.error(`[UserEngine][DB_ERROR] Failed to save log for ${this.username}:`, err);
    });
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const h = ist.getUTCHours();
    const m = ist.getUTCMinutes();
    const cur = h * 60 + m;
    
    // 09:30 - 11:00 or 12:45 - 14:50
    return (cur >= 570 && cur <= 660) || (cur >= 765 && cur <= 890);
  }

  async processTick(candles: Candle[], price: number) {
    if (candles.length < 25 || price <= 0) return;
    const currentBarIdx = candles.length - 1;

    // Heartbeat every 5 mins
    const now = Date.now();
    if (now - this.lastHeartbeat > 300000) {
      this.lastHeartbeat = now;
      this.addLog("SYSTEM: Strategical logic linked & monitoring market...");
    }

    // 1. Manage Position
    if (this.position) {
      await this.managePosition(candles, price);
      return;
    }

    // 2. Check Market Hours for Entry
    if (!this.isMarketHours()) return;
    if (this.lastSignalBar === currentBarIdx) return;

    // 3. Evaluate Signal (HA Trend Continuation)
    const ha = buildHeikinAshi(candles);
    const pattern = detectHAPattern(ha);
    const adxData = calcADX(candles, 14, currentBarIdx);
    const prev = candles[currentBarIdx - 1];

    if (pattern === 'STRONG_BULLISH' && adxData && adxData.adx > 18 && price > prev.high) {
      await this.enter('BUY', price);
      this.lastSignalBar = currentBarIdx;
    } else if (pattern === 'STRONG_BEARISH' && adxData && adxData.adx > 18 && price < prev.low) {
      await this.enter('SELL', price);
      this.lastSignalBar = currentBarIdx;
    }
  }

  private async enter(side: 'BUY' | 'SELL', price: number) {
    const slPoints = 60; // Fixed for BankNifty
    const tpPoints = 60;
    const qty = 15; // default lot size

    this.position = {
      side,
      entryPrice: price,
      sl: side === 'BUY' ? price - slPoints : price + slPoints,
      tp: side === 'BUY' ? price + tpPoints : price - tpPoints,
      trailHigh: price,
      trailLow: price,
    };

    this.addLog(`ENTRY ${side} @ ₹${price.toFixed(2)} | SL: ₹${this.position.sl.toFixed(2)}`);

    if (!this.isPaper && this.kite) {
      this.kite.placeOrder({
        tradingsymbol: 'NIFTY BANK', exchange: 'NSE',
        transactionType: side, quantity: qty, product: 'MIS', orderType: 'MARKET'
      }).catch(e => this.addLog(`ORDER FAILED: ${e.message}`));
    }
  }

  private async managePosition(candles: Candle[], price: number) {
    const pos = this.position;
    const slHit = pos.side === 'BUY' ? price <= pos.sl : price >= pos.sl;
    const tpHit = pos.side === 'BUY' ? price >= pos.tp : price <= pos.tp;

    if (slHit) {
      this.addLog(`EXIT SL hit @ ₹${price.toFixed(2)}`);
      await this.close('SL', price);
    } else if (tpHit) {
      this.addLog(`EXIT TARGET hit @ ₹${price.toFixed(2)}`);
      await this.close('TP', price);
    } else {
      // Trailing SL
      const step = 30;
      if (pos.side === 'BUY' && price > pos.trailHigh) {
        pos.trailHigh = price;
        const newSL = price - step;
        if (newSL > pos.sl) {
          pos.sl = newSL;
          this.addLog(`TRAIL SL locked @ ₹${newSL.toFixed(2)}`);
        }
      }
      if (pos.side === 'SELL' && price < pos.trailLow) {
        pos.trailLow = price;
        const newSL = price + step;
        if (newSL < pos.sl) {
          pos.sl = newSL;
          this.addLog(`TRAIL SL locked @ ₹${newSL.toFixed(2)}`);
        }
      }
    }
  }

  private async close(reason: string, price: number) {
    const side = this.position.side === 'BUY' ? 'SELL' : 'BUY';
    const qty = 15;

    if (!this.isPaper && this.kite) {
      this.kite.placeOrder({
        tradingsymbol: 'NIFTY BANK', exchange: 'NSE',
        transactionType: side, quantity: qty, product: 'MIS', orderType: 'MARKET'
      }).catch(e => this.addLog(`EXIT ORDER FAILED: ${e.message}`));
    }
    
    this.position = null;
  }
}
