import { Server } from 'socket.io';
import axios from 'axios';

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
  public currentPrice: number = 53841.40;
  private candles: Candle[] = [];
  
  constructor(io: Server) {
    this.io = io;
    this.initSimulation();
    this.startStreaming();
  }

  private initSimulation() {
    // Generate 60 initial candles leading up to the current price
    let basePrice = 53800.00;
    const now = new Date();
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  private generateNextTick() {
    const lastCandle = this.candles[this.candles.length - 1];
    const volatility = this.currentPrice * 0.00015; // Realistic Bank Nifty 1-second volatility
    const change = (Math.random() - 0.49) * volatility; // slight upward drift
    
    this.currentPrice = parseFloat((this.currentPrice + change).toFixed(2));
    
    // Update the last candle or create a new one every minute
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
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

  private startStreaming() {
    // 1. Fetch live BankNifty benchmark from Yahoo Finance
    axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK')
         .then(res => {
             const meta = res.data?.chart?.result?.[0]?.meta;
             if (meta && meta.regularMarketPrice) {
                 this.currentPrice = meta.regularMarketPrice;
                 console.log(`[MarketStreamer] Synced Bank Nifty with Live Market: ₹${this.currentPrice}`);
                 this.candles[this.candles.length - 1].close = this.currentPrice;
             }
         }).catch(err => {
             console.log(`[MarketStreamer] Live Market API offline, defaulting to high-fidelity local simulation at ₹${this.currentPrice}`);
         });

    // 2. Broadcast High-Frequency Ticks (1000ms / 1 second)
    setInterval(() => {
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
