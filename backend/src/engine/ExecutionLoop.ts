import { AngelOneService, BrokerCredentials } from '../services/BrokerService';
import { QuantEngine, Candle, HeikinAshiCandle } from './QuantCalculations';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExecutionLoop {
  private isRunning: boolean = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private brokerService: AngelOneService | null = null;

  // In production, this data comes live via WebSocket.
  // We mock the state here to represent the aggregation.
  private currentCandles: Candle[] = [];

  constructor() {
    // Boilerplate for singleton logic or config
  }

  async start(brokerConfig: BrokerCredentials) {
    if (this.isRunning) return;

    this.brokerService = new AngelOneService(brokerConfig);
    // await this.brokerService.generateSession("PIN", "TOTP");

    console.log('[Engine] Starting Strategy Execution Loop...');
    this.isRunning = true;
    
    // Evaluate every 5 minutes (mocked to 5s for dev logs)
    this.loopInterval = setInterval(() => this.tick(), 5000); 
  }

  stop() {
    console.log('[Engine] Stopping Strategy Execution Loop...');
    this.isRunning = false;
    if (this.loopInterval) clearInterval(this.loopInterval);
  }

  /**
   * Evaluates the core rules of "HA Trend Continuation"
   */
  private async tick() {
    if (this.currentCandles.length < 20) {
      console.log("[Engine] Waiting for sufficient candle data (Need 20+)...");
      return; 
    }

    try {
      console.log("[Engine] Evaluating HA Trend Continuation conditions...");

      // 1. Calculate base indicators
      const haCandles = QuantEngine.generateHeikinAshi(this.currentCandles);
      const adxResult = QuantEngine.calculateADX(this.currentCandles, 14);
      const bbResult = QuantEngine.calculateBollingerBands(this.currentCandles, 20, 2);

      const latestHA = haCandles[haCandles.length - 1];
      const latestOriginal = this.currentCandles[this.currentCandles.length - 1];
      
      const latestADX = adxResult.length > 0 ? adxResult[adxResult.length - 1] : null;
      const latestBB = bbResult.length > 0 ? bbResult[bbResult.length - 1] : null;

      // Ensure we have valid indicator data
      if (!latestADX || !latestBB) return;

      // 2. CHECK RULE: ADX > 18
      const hasStrongTrend = latestADX.adx >= 18 && latestADX.adx <= 50;
      
      // 3. CHECK RULE: Price near Bollinger Middle Band (1% tolerance)
      const nearMidBand = QuantEngine.isPriceNearMidBand(latestOriginal.close, latestBB.middle, 1);

      // 4. CHECK RULE: Strong Bullish Heikin Ashi Setup Candle
      const isStrongSetup = latestHA.isStrongBullish;

      if (hasStrongTrend && nearMidBand && isStrongSetup) {
        console.log(">>>>>>>> ENTRY SIGNAL CONFIRMED: BUY CALL <<<<<<<<");
        console.log(`[Details] ADX: ${latestADX.adx.toFixed(2)}, MidBand: ${latestBB.middle.toFixed(2)}, LTP: ${latestOriginal.close}`);
        
        await this.executeTradeFleet('BUY');
      }

    } catch (error) {
      console.error("[Engine] Execution tick failed:", error);
    }
  }

  /**
   * Triggers broker APIs for all subscribed users
   */
  private async executeTradeFleet(action: 'BUY' | 'SELL') {
    // 1. Query Prisma DB for all users with valid Broker Configs who subscribed to Strategy M3
    console.log(`[Engine] Scanning DB for active users to deploy ${action} signal...`);
    
    // Simulated fleet execution
    const simulatedUsers = [{ id: 'u1', name: 'Admin_Master', qty: 100 }];
    
    for (const user of simulatedUsers) {
      try {
        console.log(`[Engine] Placing ${action} order for User: ${user.name} | Qty: ${user.qty}`);
        // await this.brokerService?.placeOrder({ ... })
        
        // Log to database
        await prisma.strategyLog.create({
           data: {
             userId: "mock-id-because-users-not-synced-yet", // Placeholder
             strategyId: "m3",
             action: `ENTRY_${action}`,
             symbol: "NIFTY-OPT",
             price: 154.20,
             qty: user.qty,
             status: "SUCCESS"
           }
        }).catch((e: any) => console.log("[DB] Prisma log skipped during mock run"));

      } catch (err) {
        console.error(`[Engine] Order failed for User: ${user.name}`);
      }
    }
  }

  // Helper method for the simulation script to inject data
  injectCandle(c: Candle) {
    this.currentCandles.push(c);
  }
}
