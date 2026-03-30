import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { KiteService } from './KiteService';

const prisma = new PrismaClient();

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type FeedSource = 'BROKER_WS' | 'DISCONNECTED' | 'ERROR';

export class MarketStreamer {
  private io: Server;
  private candles: Candle[] = [];
  private currentPrice: number | null = null;
  private feedSource: FeedSource = 'DISCONNECTED';
  private lastFeedMessage = 'Market feed not initialized.';
  private lastTickAt: string | null = null;
  private lastTickLatencyMs: number | null = null;
  private reconnectCount = 0;
  private accessTokenUpdatedAt: Date | null = null;
  private kiteClient: KiteService | null = null;
  private ltpSyncInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscribedToken: number | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startStreaming();
  }

  public async rebootFeed() {
    this.stopStreaming();
    await this.startStreaming();
  }

  private stopStreaming() {
    if (this.kiteClient) {
      this.kiteClient.disconnect();
      this.kiteClient = null;
    }
    if (this.ltpSyncInterval) {
      clearInterval(this.ltpSyncInterval);
      this.ltpSyncInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.feedSource = 'DISCONNECTED';
    this.currentPrice = null;
    this.candles = [];
    this.lastTickAt = null;
    this.lastTickLatencyMs = null;
    this.reconnectCount = 0;
    this.accessTokenUpdatedAt = null;
    this.subscribedToken = null;
    this.emitFeedStatus('DISCONNECTED', 'Market feed stopped.');
  }

  private async startStreaming() {
    try {
      const config = await prisma.marketDataConfig.upsert({
        where: { id: 'GLOBAL' },
        create: {
          id: 'GLOBAL',
          brokerName: 'Kite',
          appKey: 'DUMMY_KITE_API_KEY',
          appSecret: 'DUMMY_KITE_API_SECRET',
          redirectUrl: 'https://lakshitatradingacademy.com/kite/callback',
          requestToken: null,
          accessToken: null,
          bankNiftyInstrumentToken: 260105,
          isEnabled: false
        },
        update: {}
      });

      if (!config.isEnabled) {
        this.feedSource = 'DISCONNECTED';
        this.emitFeedStatus('DISCONNECTED', 'Market data config is disabled.');
        return;
      }

      if (config.brokerName !== 'Kite') {
        this.feedSource = 'ERROR';
        this.emitFeedStatus('ERROR', `Unsupported market feed broker: ${config.brokerName}`);
        return;
      }

      if (!config.appKey || !config.appSecret || !config.accessToken) {
        this.feedSource = 'ERROR';
        this.emitFeedStatus('ERROR', 'Kite credentials missing. Complete Kite login flow.');
        return;
      }

      this.kiteClient = new KiteService({
        apiKey: config.appKey,
        apiSecret: config.appSecret,
        accessToken: config.accessToken,
        instrumentToken: config.bankNiftyInstrumentToken
      });
      this.accessTokenUpdatedAt = config.accessTokenUpdatedAt || null;
      this.subscribedToken = config.bankNiftyInstrumentToken;

      this.feedSource = 'BROKER_WS';
      this.emitFeedStatus('BROKER_WS', 'Kite websocket connecting...');

      this.kiteClient.connect({
        onTick: (tick) => this.handleLiveTick(tick),
        onStatus: (event, message) => {
          if (message) {
            console.log(`[MarketStreamer][Kite] ${event}: ${message}`);
          } else {
            console.log(`[MarketStreamer][Kite] ${event}`);
          }
          if (event === 'CONNECTED' || event === 'AUTHENTICATED') {
            this.feedSource = 'BROKER_WS';
            this.emitFeedStatus('BROKER_WS', message || 'Kite websocket active.');
          }
          if (event === 'DISCONNECTED') {
            this.feedSource = 'DISCONNECTED';
            this.emitFeedStatus('DISCONNECTED', message || 'Kite websocket disconnected.');
            this.scheduleReconnect();
          }
          if (event === 'ERROR') {
            this.feedSource = 'ERROR';
            this.emitFeedStatus('ERROR', message || 'Kite websocket error.');
            this.scheduleReconnect();
          }
        }
      });

      // Periodic REST-LTP sync to keep display aligned with Kite quote screen.
      this.ltpSyncInterval = setInterval(async () => {
        if (!this.kiteClient || this.feedSource !== 'BROKER_WS') return;
        const ltp = await this.kiteClient.fetchLtp('NSE:NIFTY BANK');
        if (!ltp) return;
        this.handleLiveTick({
          instrumentToken: this.subscribedToken || 260105,
          lp: ltp,
          bids: [],
          asks: [],
          receivedAt: new Date().toISOString()
        });
      }, 2000);
    } catch (error: any) {
      this.feedSource = 'ERROR';
      this.emitFeedStatus('ERROR', error?.message || 'Feed bootstrap failed.');
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.reconnectCount += 1;
      await this.rebootFeed();
    }, 5000);
  }

  private handleLiveTick(tick: { instrumentToken: number; lp: number; bids: any[]; asks: any[]; receivedAt: string }) {
    if (this.subscribedToken && tick.instrumentToken !== this.subscribedToken) return;

    const livePrice = Number(tick.lp);
    if (!Number.isFinite(livePrice) || livePrice <= 0) return;

    this.currentPrice = livePrice;
    this.lastTickAt = tick.receivedAt || new Date().toISOString();
    this.lastTickLatencyMs = Math.max(0, Date.now() - new Date(this.lastTickAt).getTime());
    this.upsertCandle(livePrice);

    const latestCandle = this.candles[this.candles.length - 1];

    this.io.emit('market_tick', {
      symbol: 'NSE:BANKNIFTY',
      price: livePrice,
      trend: latestCandle && livePrice >= latestCandle.open ? 'bullish' : 'bearish',
      candles: this.candles,
      bids: tick.bids,
      asks: tick.asks,
      feedSource: this.feedSource
    });
  }

  private upsertCandle(price: number) {
    const nowMs = Date.now();
    // Minute bucket start in epoch milliseconds (stable across locales/time formats).
    const candleTime = Math.floor(nowMs / 60000) * 60000;
    const last = this.candles[this.candles.length - 1];

    if (!last || last.time !== candleTime) {
      this.candles.push({
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1
      });
      if (this.candles.length > 500) this.candles.shift();
      return;
    }

    last.close = price;
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.volume += 1;
  }

  private emitFeedStatus(source: FeedSource, message: string) {
    this.feedSource = source;
    this.lastFeedMessage = message;
    this.io.emit('feed_status', {
      source,
      message,
      at: new Date().toISOString(),
      broker: 'Kite',
      lastTickAt: this.lastTickAt,
      latencyMs: this.lastTickLatencyMs,
      reconnectCount: this.reconnectCount,
      tokenAgeMinutes: this.accessTokenUpdatedAt
        ? Math.max(0, Math.round((Date.now() - this.accessTokenUpdatedAt.getTime()) / 60000))
        : null
    });
  }

  public getLatestFeedStatus() {
    return {
      source: this.feedSource,
      message: this.lastFeedMessage,
      broker: 'Kite',
      lastTickAt: this.lastTickAt,
      latencyMs: this.lastTickLatencyMs,
      reconnectCount: this.reconnectCount,
      tokenAgeMinutes: this.accessTokenUpdatedAt
        ? Math.max(0, Math.round((Date.now() - this.accessTokenUpdatedAt.getTime()) / 60000))
        : null
    };
  }
}
