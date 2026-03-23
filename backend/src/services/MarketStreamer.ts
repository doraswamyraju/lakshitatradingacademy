import { Server } from 'socket.io';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { AliceBlueService } from './AliceBlueService';
import { systemErrors } from '../index';

const prisma = new PrismaClient();

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type FeedSource = 'BROKER_WS' | 'YAHOO_HTTP' | 'SIMULATED';

export class MarketStreamer {
  private io: Server;
  public currentPrice: number = 53427.05;
  private candles: Candle[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private feedSource: FeedSource = 'SIMULATED';

  constructor(io: Server) {
    this.io = io;
    this.initSimulation();
    this.startStreaming();
  }

  private initSimulation() {
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

  private generateNextTick(allowSyntheticDrift: boolean = false) {
    const lastCandle = this.candles[this.candles.length - 1];

    const now = new Date();
    const currentHourIST = now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60);
    const currentMinuteIST = (now.getUTCMinutes() + 30) % 60;
    const isMarketClosed = currentHourIST > 15 || (currentHourIST === 15 && currentMinuteIST >= 30) || currentHourIST < 9;

    if (allowSyntheticDrift && !isMarketClosed) {
      // Re-enabling a micro synthetic drift as Yahoo API is inherently slow and makes the UI appear frozen.
      // We tether this to the 5-second Yahoo polls so it never strays from reality.
      const volatility = this.currentPrice * 0.00005; 
      const change = (Math.random() - 0.5) * volatility;
      this.currentPrice = parseFloat((this.currentPrice + change).toFixed(2));
    }

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
    console.log('[MarketStreamer] Rebooting feed pipeline with latest credentials...');
    this.feedSource = 'SIMULATED';
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
        console.log(`[MarketStreamer] Found Broker Configuration: ${user.brokerName} for ${user.clientCode}`);
        
        if (user.brokerName === 'AliceBlue') {
          const ab = new AliceBlueService({
            brokerName: 'AliceBlue',
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            clientCode: user.clientCode
          });

          const success = await ab.generateSession();
          if (success) {
            this.feedSource = 'BROKER_WS';
            ab.initWebSocket((tick: any) => {
              if (tick.lp) {
                this.currentPrice = parseFloat(tick.lp);
                this.generateNextTick(false);
              }
            });
            console.log('[MarketStreamer] AliceBlue native WebSocket stream authorized.');
            this.io.emit('system_log', { message: '[FEED] LIVE Data active via AliceBlue WS', type: 'success' });
          } else {
            throw new Error('AliceBlue session generation failed.');
          }
        } else {
          // Fallback or placeholder for other brokers
          console.log(`[MarketStreamer] Broker ${user.brokerName} selected. WebSocket integration pending.`);
          this.io.emit('system_log', { message: `[FEED] ${user.brokerName} selected. Using Simulated data while integration is finalized.`, type: 'warning' });
        }
      }
    } catch (error: any) {
      this.feedSource = 'SIMULATED';
      console.error('[MarketStreamer] Broker connection failed. Falling back to Simulation.');
      systemErrors.push({ timestamp: new Date(), context: 'MarketStreamer', error: error.message });
      this.io.emit('system_log', { message: '[FEED] Connection failed. Falling back to SIMULATED data.', type: 'error' });
    }

    const pollYahoo = () => {
      axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK')
        .then(res => {
          const meta = (res.data as any)?.chart?.result?.[0]?.meta;
          if (meta && meta.regularMarketPrice) {
            if (this.feedSource !== 'BROKER_WS') {
              this.feedSource = 'YAHOO_HTTP';
            }
            this.currentPrice = meta.regularMarketPrice;
            this.candles[this.candles.length - 1].close = this.currentPrice;
          }
        })
        .catch(() => {
          if (this.feedSource !== 'BROKER_WS') {
            this.feedSource = 'SIMULATED';
          }
        });
    };
    pollYahoo();
    setInterval(() => {
      if (this.feedSource === 'YAHOO_HTTP' || this.feedSource === 'SIMULATED') {
         pollYahoo();
      }
    }, 5000);

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.generateNextTick(this.feedSource !== 'BROKER_WS');

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
        asks,
        feedSource: this.feedSource
      };

      this.io.emit('market_tick', marketState);
    }, 1000);
  }
}
