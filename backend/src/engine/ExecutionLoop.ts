import { AngelOneService, BrokerCredentials } from '../services/BrokerService';
import { QuantEngine, Candle, HeikinAshiCandle } from './QuantCalculations';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExecutionLoop {
  private isRunning: boolean = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private brokerService: AngelOneService | null = null;

  // State Tracking
  private currentCandles: Candle[] = [];
  private activeTrades: Map<string, {
    symbol: string;
    entryPrice: number;
    slPrice: number;
    riskPoints: number;
    isRRReached: boolean;
    side: 'BUY' | 'SELL';
    timestamp: number;
  }> = new Map();
  
  private dailyTradeCount: number = 0;
  private lastResetDate: string = new Date().toISOString().split('T')[0];

  constructor() {}

  async start(brokerConfig: BrokerCredentials) {
    if (this.isRunning) return;
    this.brokerService = new AngelOneService(brokerConfig);
    console.log('[Engine] Starting HA Trend Continuation (v1.0) Execution Loop...');
    this.isRunning = true;
    this.loopInterval = setInterval(() => this.tick(), 5000); 
  }

  stop() {
    this.isRunning = false;
    if (this.loopInterval) clearInterval(this.loopInterval);
  }

  private isTimeAllowed(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    // Allowed: 09:30-11:00, 12:45-14:50
    const allowed = [
      { start: 930, end: 1100 },
      { start: 1245, end: 1450 }
    ];
    
    return allowed.some(window => currentTime >= window.start && currentTime <= window.end);
  }

  private getInstrumentSL(symbol: string): number {
    if (symbol.includes('BANKNIFTY')) return 60;
    if (symbol.includes('NIFTY')) return 30;
    if (symbol.includes('CRUDE')) return 20;
    return 30; // Default
  }

  private async tick() {
    // Reset daily count if date changed
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.dailyTradeCount = 0;
      this.lastResetDate = today;
    }

    if (!this.isTimeAllowed()) return;
    if (this.currentCandles.length < 20) return;

    try {
      const haCandles = QuantEngine.generateHeikinAshi(this.currentCandles);
      const adxResult = QuantEngine.calculateADX(this.currentCandles, 10);
      
      const latestHA = haCandles[haCandles.length - 1];
      const prevHA = haCandles[haCandles.length - 2];
      const latestOriginal = this.currentCandles[this.currentCandles.length - 1];
      const prevOriginal = this.currentCandles[this.currentCandles.length - 2];
      
      const adxData = (adxResult as any)[adxResult.length - 1];
      if (!adxData) return;

      const symbol = "NIFTY-OPT"; // In production, this iterates over user subscriptions

      // 1. MANAGE ACTIVE TRADES (RR Logic & Trailing)
      const activeTrade = this.activeTrades.get(symbol);
      if (activeTrade) {
        await this.manageActiveTrade(symbol, activeTrade, latestOriginal, latestHA);
        return; // Only one trade at a time as per risk node
      }

      // 2. ENTRY logic (Gatekeepers: ADX + Risk Limits)
      if (this.dailyTradeCount >= 2) return;
      
      const hasStrongTrend = adxData.adx >= 18 && adxData.adx <= 50;
      if (!hasStrongTrend) return;

      // BULLISH Entry Node
      if (latestHA.isStrongBullish && adxData.pdi > adxData.mdi && latestOriginal.high > prevOriginal.high) {
        await this.executeEntry(symbol, 'BUY', latestOriginal.close);
      } 
      // BEARISH Entry Node
      else if (latestHA.isStrongBearish && adxData.mdi > adxData.pdi && latestOriginal.low < prevOriginal.low) {
        await this.executeEntry(symbol, 'SELL', latestOriginal.close);
      }

    } catch (error) {
      console.error("[Engine] Tick failed:", error);
    }
  }

  private async executeEntry(symbol: string, side: 'BUY' | 'SELL', price: number) {
    const riskPoints = this.getInstrumentSL(symbol);
    const slPrice = side === 'BUY' ? price - riskPoints : price + riskPoints;

    console.log(`[Engine] >>> ENTRY SIGNAL: ${side} @ ${price} (SL: ${slPrice}) <<<`);
    
    this.activeTrades.set(symbol, {
      symbol,
      entryPrice: price,
      slPrice,
      riskPoints,
      isRRReached: false,
      side,
      timestamp: Date.now()
    });
    
    this.dailyTradeCount++;
    await this.logTrade(symbol, `ENTRY_${side}`, price);
  }

  private async manageActiveTrade(symbol: string, trade: any, latest: Candle, latestHA: HeikinAshiCandle) {
    const pnlPoints = trade.side === 'BUY' ? latest.close - trade.entryPrice : trade.entryPrice - latest.close;

    // A. Check Hard Stop Loss
    const isSLHit = trade.side === 'BUY' ? latest.close <= trade.slPrice : latest.close >= trade.slPrice;
    if (isSLHit) {
      await this.closeTrade(symbol, 'EXIT_SL', latest.close);
      return;
    }

    // B. Activate RR 1:1 Logic
    if (!trade.isRRReached && pnlPoints >= trade.riskPoints) {
      console.log(`[Engine] RR 1:1 Hit for ${symbol}. Trailing & Sentiment exits ACTIVATED.`);
      trade.isRRReached = true;
      // When RR 1:1 hit, move SL to Entry (for protection)
      trade.slPrice = trade.entryPrice;
    }

    // C. Trailing SL Logic (ONLY after RR 1:1 is hit)
    if (trade.isRRReached) {
      const trailStep = 30; // 30 point step as per handwritten rules
      const currentPrice = latest.close;

      if (trade.side === 'BUY') {
        const potentialNewSL = currentPrice - trade.riskPoints; // Keep distance of 30 pts (or original risk)
        if (potentialNewSL > trade.slPrice + trailStep) {
           trade.slPrice += trailStep;
           console.log(`[Engine] Trailing Up: New SL @ ${trade.slPrice}`);
        }
      } else {
        const potentialNewSL = currentPrice + trade.riskPoints;
        if (potentialNewSL < trade.slPrice - trailStep) {
           trade.slPrice -= trailStep;
           console.log(`[Engine] Trailing Down: New SL @ ${trade.slPrice}`);
        }
      }

      // D. Exit Logic (ONLY after RR 1:1 is hit)
      const isOppositeCandle = trade.side === 'BUY' ? latestHA.isStrongBearish : latestHA.isStrongBullish;
      if (isOppositeCandle || latestHA.isWeak) {
        await this.closeTrade(symbol, 'EXIT_SENTIMENT', latest.close);
      }
    }
  }

  private async closeTrade(symbol: string, reason: string, price: number) {
    console.log(`[Engine] <<< EXIT: ${reason} @ ${price} <<<`);
    this.activeTrades.delete(symbol);
    await this.logTrade(symbol, reason, price);
  }

  private async logTrade(symbol: string, action: string, price: number) {
    await prisma.strategyLog.create({
      data: {
        userId: "system-admin",
        strategyId: "m3",
        action,
        symbol,
        price,
        qty: 1,
        status: "SUCCESS"
      }
    }).catch(() => {});
  }

  injectCandle(c: Candle) {
    this.currentCandles.push(c);
  }
}
