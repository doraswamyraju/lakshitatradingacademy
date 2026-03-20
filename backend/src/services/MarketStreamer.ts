import { Server } from 'socket.io';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { AliceBlueService } from './AliceBlueService';

const prisma = new PrismaClient();

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketStreamer {
  private io: Server;
  public currentPrice: number = 53427.05;
  private candles: Candle[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(io: Server) {
    this.io = io;
    this.initSimulation();
    this.startStreaming();
  }

  private initSimulation() {
    // Generate 60 initial candles, locking the clock to 15:30 IST if the market is closed
    let basePrice = 53427.05;
    const now = new Date();
    const currentHourIST = now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60);
    const currentMinuteIST = (now.getUTCMinutes() + 30) % 60;
    const isMarketClosed = currentHourIST > 15 || (currentHourIST === 15 && currentMinuteIST >= 30) || currentHourIST < 9;
    
    const simTime = isMarketClosed ? (() => { const d = new Date(now); d.setUTCHours(10, 0, 0, 0); return d; })() : now;

    for (let i = 60; i >= 0; i--) {
      const time = new Date(simTime.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const volatility = basePrice * 0.0005;
      const change = (Math.random() - 0.5) * volatility;
      
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * (volatility / 2);
      const low = Math.min(open, close) - Math.random() * (volatility / 2);
      
      this.candles.push({ time, open, high, low, close, volume: Math.floor(Math.random() * 5000) + 1000 });
      basePrice = close;
    }
    this.currentPrice = basePrice;
  }

  private generateNextTick(isTrueLiveTick: boolean = false) {
    const lastCandle = this.candles[this.candles.length - 1];
    
    const now = new Date();
    const currentHourIST = now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60);
    const currentMinuteIST = (now.getUTCMinutes() + 30) % 60;
    const isMarketClosed = currentHourIST > 15 || (currentHourIST === 15 && currentMinuteIST >= 30) || currentHourIST < 9;

    if (!isTrueLiveTick && !isMarketClosed) {
        // Only drift the price if we are simulating AND the market is actively open
        const volatility = this.currentPrice * 0.00015; 
        const change = (Math.random() - 0.49) * volatility; 
        this.currentPrice = parseFloat((this.currentPrice + change).toFixed(2));
    }
    
    // Lock the clock to exactly 15:30 IST if after-hours
    const simTime = isMarketClosed ? (() => { const d = new Date(now); d.setUTCHours(10, 0, 0, 0); return d; })() : now;
    const timeStr = simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (lastCandle.time === timeStr) {
       lastCandle.close = this.currentPrice;
       lastCandle.high = Math.max(lastCandle.high, this.currentPrice);
       lastCandle.low = Math.min(lastCandle.low, this.currentPrice);
       lastCandle.volume += Math.floor(Math.random() * 5);
    } else {
       const newCandle: Candle = {
         time: timeStr,
         open: lastCandle.close,
         high: Math.max(lastCandle.close, this.currentPrice),
         low: Math.min(lastCandle.close, this.currentPrice),
         close: this.currentPrice,
         volume: Math.floor(Math.random() * 150) + 50
       };
       this.candles.push(newCandle);
       if (this.candles.length > 200) this.candles.shift();
    }
  }

  public async rebootFeed() {
    console.log(`[MarketStreamer] Executing zero-downtime feed injection for new AliceBlue credentials...`);
    if (this.intervalId) {
       clearInterval(this.intervalId);
       this.intervalId = null;
    }
    await this.startStreaming();
  }

  private async startStreaming() {
    try {
        const user = await prisma.user.findFirst({
            where: { apiKey: { not: null } }
        });

        if (user && user.apiKey && user.clientCode && user.apiSecret) {
            console.log(`[MarketStreamer] Found AliceBlue Configuration: ${user.clientCode}`);
            const ab = new AliceBlueService({
                brokerName: 'AliceBlue',
                apiKey: user.apiKey,
                apiSecret: user.apiSecret,
                clientCode: user.clientCode
            });

            // Attempt True API Handshake
            const success = await ab.generateSession();
            if (success) {
                ab.initWebSocket((tick: any) => {
                    // Inject raw exchange ticks directly into the pipeline
                    if (tick.lp) {
                        this.currentPrice = parseFloat(tick.lp);
                        this.generateNextTick(true);
                    }
                });
                console.log(`[MarketStreamer] AliceBlue Native Data Stream Authorized.`);
            }
        }
    } catch (error) {
        console.error(`[MarketStreamer] AliceBlue Native Connection Failed. Falling back to robust Yahoo API.`);
    }

    // 1. Fetch live BankNifty benchmark from Yahoo Finance as a resilient fallback base
    axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK')
         .then(res => {
             const meta = (res.data as any)?.chart?.result?.[0]?.meta;
             if (meta && meta.regularMarketPrice) {
                 this.currentPrice = meta.regularMarketPrice;
                 console.log(`[MarketStreamer] Synced Bank Nifty with Live Market: ₹${this.currentPrice}`);
                 this.candles[this.candles.length - 1].close = this.currentPrice;
             }
         }).catch(err => {
             console.log(`[MarketStreamer] Live Market API offline, defaulting to high-fidelity local simulation at ₹${this.currentPrice}`);
         });

    if (this.intervalId) clearInterval(this.intervalId);

    // 2. Broadcast High-Frequency Ticks (1000ms / 1 second)
    this.intervalId = setInterval(() => {
      this.generateNextTick();
      
      const bidBase = this.currentPrice - 0.5;
      const askBase = this.currentPrice + 0.5;
      
      const bids = Array.from({ length: 5 }, (_, i) => ({
        price: parseFloat((bidBase - i * 0.25).toFixed(2)),
        amount: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 10) + 1,
        total: Math.floor(Math.random() * 5000) + 1000
      }));
      
      const asks = Array.from({ length: 5 }, (_, i) => ({
        price: parseFloat((askBase + i * 0.25).toFixed(2)),
        amount: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 10) + 1,
        total: Math.floor(Math.random() * 5000) + 1000
      }));

      const lastCandle = this.candles[this.candles.length - 1];

      const marketState = {
        symbol: 'NSE:BANKNIFTY',
        price: this.currentPrice,
        trend: this.currentPrice > lastCandle.open ? 'bullish' : 'bearish',
        candles: this.candles,
        bids,
        asks
      };

      this.io.emit('market_tick', marketState);
    }, 1000);
  }
}
