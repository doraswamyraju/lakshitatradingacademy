import { AngelOneService, BrokerCredentials } from '../services/BrokerService';
import { QuantEngine, Candle, HeikinAshiCandle } from './QuantCalculations';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExecutionLoop {
  private isRunning = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private brokerService: AngelOneService | null = null;

  private currentCandles: Candle[] = [];

  private activeTrades = new Map<string, {
    symbol: string;
    entryPrice: number;
    slPrice: number;
    riskPoints: number;
    isRRReached: boolean;
    trailStepsDone: number;
    side: 'BUY' | 'SELL';
    timestamp: number;
  }>();

  private dailyTradeCount = 0;
  private lastResetDate = new Date().toISOString().split('T')[0];

  async start(brokerConfig: BrokerCredentials) {
    if (this.isRunning) return;

    this.brokerService = new AngelOneService(brokerConfig);
    this.isRunning = true;

    console.log('[Engine] 🚀 Strategy Started');

    this.loopInterval = setInterval(() => this.tick(), 5000);
  }

  stop() {
    this.isRunning = false;
    if (this.loopInterval) clearInterval(this.loopInterval);
  }

  // ---------------- TIME FILTER ----------------
  private isTimeAllowed(): boolean {
    const now = new Date();
    const time = now.getHours() * 100 + now.getMinutes();

    return (
      (time >= 930 && time <= 1100) ||
      (time >= 1245 && time <= 1450)
    );
  }

  // ---------------- SL LOGIC ----------------
  private getInstrumentSL(symbol: string): number {
    if (symbol.includes('BANKNIFTY')) return 60;
    if (symbol.includes('NIFTY')) return 30;
    if (symbol.includes('CRUDE')) return 20;
    return 30;
  }

  // ---------------- MAIN LOOP ----------------
  private async tick() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.dailyTradeCount = 0;
      this.lastResetDate = today;
    }

    if (!this.isTimeAllowed()) return;
    if (this.currentCandles.length < 20) return;

    try {
      const haCandles = QuantEngine.generateHeikinAshi(this.currentCandles);
      const adx = QuantEngine.calculateADX(this.currentCandles, 10);

      const latestHA = haCandles.at(-1)!;
      const latest = this.currentCandles.at(-1)!;
      const prev = this.currentCandles.at(-2)!;

      const adxData: any = adx.at(-1);
      if (!adxData) return;

      const symbol = "NIFTY-OPT";

      // ---------------- ACTIVE TRADE ----------------
      const trade = this.activeTrades.get(symbol);
      if (trade) {
        await this.manageTrade(symbol, trade, latest, latestHA);
        return;
      }

      // ---------------- ENTRY LIMIT ----------------
      if (this.dailyTradeCount >= 2) return;

      if (!(adxData.adx >= 18 && adxData.adx <= 50)) return;

      // ---------------- BUY ----------------
      if (
        latestHA.isStrongBullish &&
        adxData.pdi > adxData.mdi &&
        latest.high > prev.high
      ) {
        await this.enterTrade(symbol, 'BUY', latest.close);
      }

      // ---------------- SELL ----------------
      else if (
        latestHA.isStrongBearish &&
        adxData.mdi > adxData.pdi &&
        latest.low < prev.low
      ) {
        await this.enterTrade(symbol, 'SELL', latest.close);
      }

    } catch (err) {
      console.error('[Engine Error]', err);
    }
  }

  // ---------------- ENTRY ----------------
  private async enterTrade(symbol: string, side: 'BUY' | 'SELL', price: number) {
    const risk = this.getInstrumentSL(symbol);
    const sl = side === 'BUY' ? price - risk : price + risk;

    // Fetch user settings (Defaulting to system-admin for now)
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const isPaper = user?.isPaperTrading ?? true;

    console.log(`🚀 [${isPaper ? 'PAPER' : 'LIVE'}] ENTRY ${side} @ ${price} | SL: ${sl}`);

    if (!isPaper && this.brokerService) {
      // Real broker logic would go here: this.brokerService.placeOrder(...)
    }

    this.activeTrades.set(symbol, {
      symbol,
      entryPrice: price,
      slPrice: sl,
      riskPoints: risk,
      isRRReached: false,
      trailStepsDone: 0,
      side,
      timestamp: Date.now()
    });

    this.dailyTradeCount++;
    await this.logTrade(symbol, `ENTRY_${side}`, price, isPaper);
  }

  // ---------------- TRADE MANAGEMENT ----------------
  private async manageTrade(
    symbol: string,
    trade: any,
    latest: Candle,
    ha: HeikinAshiCandle
  ) {
    const pnl = trade.side === 'BUY'
      ? latest.close - trade.entryPrice
      : trade.entryPrice - latest.close;

    // -------- SL HIT --------
    const slHit = trade.side === 'BUY'
      ? latest.close <= trade.slPrice
      : latest.close >= trade.slPrice;

    if (slHit) {
      await this.exitTrade(symbol, 'SL', latest.close);
      return;
    }

    // -------- RR 1:1 --------
    if (!trade.isRRReached && pnl >= trade.riskPoints) {
      trade.isRRReached = true;
      trade.slPrice = trade.entryPrice;

      console.log(`✅ RR 1:1 achieved → SL moved to entry`);
    }

    // -------- TRAILING --------
    if (trade.isRRReached) {
      const step = 30;
      const steps = Math.floor(pnl / step);

      if (steps > trade.trailStepsDone) {
        trade.trailStepsDone = steps;

        if (trade.side === 'BUY') {
          trade.slPrice = trade.entryPrice + (steps - 1) * step;
        } else {
          trade.slPrice = trade.entryPrice - (steps - 1) * step;
        }

        console.log(`📈 Trailing SL → ${trade.slPrice}`);
      }

      // -------- EXIT LOGIC --------
      const opposite =
        trade.side === 'BUY'
          ? ha.isStrongBearish
          : ha.isStrongBullish;

      if (opposite || ha.isWeak) {
        await this.exitTrade(symbol, 'SIGNAL', latest.close);
      }
    }
  }

  // ---------------- EXIT ----------------
  private async exitTrade(symbol: string, reason: string, price: number) {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const isPaper = user?.isPaperTrading ?? true;

    console.log(`❌ [${isPaper ? 'PAPER' : 'LIVE'}] EXIT (${reason}) @ ${price}`);

    if (!isPaper && this.brokerService) {
      // Real broker logic would go here: this.brokerService.placeOrder(...)
    }

    this.activeTrades.delete(symbol);
    await this.logTrade(symbol, `EXIT_${reason}`, price, isPaper);
  }

  // ---------------- LOG ----------------
  private async logTrade(symbol: string, action: string, price: number, isSimulated: boolean = false) {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    await prisma.strategyLog.create({
      data: {
        userId: user?.id || "system-admin",
        strategyId: "m3",
        action,
        symbol,
        price,
        qty: 1,
        status: "SUCCESS",
        isSimulated
      }
    }).catch(() => { });
  }

  injectCandle(candle: Candle) {
    this.currentCandles.push(candle);
  }
}