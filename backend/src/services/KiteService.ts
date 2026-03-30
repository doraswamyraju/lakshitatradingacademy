import axios from 'axios';
import crypto from 'crypto';
import WebSocket from 'ws';

type StatusEvent = 'CONNECTED' | 'AUTHENTICATED' | 'DISCONNECTED' | 'ERROR';

interface KiteConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  instrumentToken: number;
}

export interface KiteWalletSnapshot {
  walletBalance: number;
  availableMargin: number;
  usedMargin: number;
  collateral: number;
  dayPnl: number;
}

export interface KiteHistoricalCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KiteOptionRow {
  strike: number;
  ceSymbol: string | null;
  peSymbol: string | null;
  ceLtp: number | null;
  peLtp: number | null;
  ceOi: number | null;
  peOi: number | null;
}

export class KiteService {
  private config: KiteConfig;
  private ws: WebSocket | null = null;
  private static instrumentsCache: { at: number; rows: any[] } | null = null;

  constructor(config: KiteConfig) {
    this.config = config;
  }

  static buildLoginUrl(apiKey: string): string {
    return `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(apiKey)}`;
  }

  static async exchangeRequestToken(params: {
    apiKey: string;
    apiSecret: string;
    requestToken: string;
  }): Promise<{ accessToken: string; userId?: string }> {
    const checksum = crypto
      .createHash('sha256')
      .update(`${params.apiKey}${params.requestToken}${params.apiSecret}`)
      .digest('hex');

    const body = new URLSearchParams({
      api_key: params.apiKey,
      request_token: params.requestToken,
      checksum
    });

    const response = await axios.post('https://api.kite.trade/session/token', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3'
      }
    });

    const data = (response.data as any)?.data;
    if (!data?.access_token) {
      throw new Error((response.data as any)?.message || 'Kite token exchange failed.');
    }

    return {
      accessToken: data.access_token,
      userId: data.user_id
    };
  }

  connect(options: {
    onTick: (tick: { instrumentToken: number; lp: number; bids: any[]; asks: any[]; receivedAt: string }) => void;
    onStatus?: (event: StatusEvent, message?: string) => void;
  }) {
    const wsUrl = `wss://ws.kite.trade?api_key=${encodeURIComponent(this.config.apiKey)}&access_token=${encodeURIComponent(this.config.accessToken)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      options.onStatus?.('CONNECTED', 'Kite websocket connected.');
      this.ws?.send(JSON.stringify({ a: 'subscribe', v: [this.config.instrumentToken] }));
      // Use LTP mode for robust index ticks (full mode packet layouts vary by instrument type).
      this.ws?.send(JSON.stringify({ a: 'mode', v: ['ltp', [this.config.instrumentToken]] }));
      options.onStatus?.('AUTHENTICATED', `Kite subscription active for token ${this.config.instrumentToken}.`);
    });

    this.ws.on('message', (payload: WebSocket.RawData) => {
      if (!(payload instanceof Buffer)) return;
      const ticks = this.parseBinaryTicks(payload);
      for (const tick of ticks) {
        options.onTick(tick);
      }
    });

    this.ws.on('close', () => {
      options.onStatus?.('DISCONNECTED', 'Kite websocket disconnected.');
    });

    this.ws.on('error', (error: any) => {
      options.onStatus?.('ERROR', error?.message || 'Kite websocket error.');
    });
  }

  disconnect() {
    if (!this.ws) return;
    try {
      this.ws.removeAllListeners();
      this.ws.close();
    } catch {
      // ignore
    }
    this.ws = null;
  }

  async fetchLtp(exchangeSymbol: string): Promise<number | null> {
    try {
      const response = await axios.get(`https://api.kite.trade/quote/ltp?i=${encodeURIComponent(exchangeSymbol)}`, {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
        }
      });
      const node = (response.data as any)?.data?.[exchangeSymbol];
      const ltp = Number(node?.last_price);
      return Number.isFinite(ltp) && ltp > 0 ? ltp : null;
    } catch {
      return null;
    }
  }

  async fetchWallet(): Promise<KiteWalletSnapshot> {
    const response = await axios.get('https://api.kite.trade/user/margins', {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });

    const equity = (response.data as any)?.data?.equity || {};
    const liveBalance = Number(equity.live_balance || 0);
    const available = Number(equity.available?.live_balance ?? liveBalance);
    const used = Number(equity.utilised?.debits || 0);
    const collateral = Number(equity.available?.collateral || 0);
    const net = Number(equity.net || liveBalance);
    const dayPnl = net - liveBalance;

    return {
      walletBalance: Number.isFinite(liveBalance) ? liveBalance : 0,
      availableMargin: Number.isFinite(available) ? available : 0,
      usedMargin: Number.isFinite(used) ? used : 0,
      collateral: Number.isFinite(collateral) ? collateral : 0,
      dayPnl: Number.isFinite(dayPnl) ? dayPnl : 0
    };
  }

  async fetchHistoricalCandles(params: {
    instrumentToken: number;
    interval: 'minute' | '3minute' | '5minute' | '15minute' | '30minute' | '60minute' | 'day';
    from: string;
    to: string;
  }): Promise<KiteHistoricalCandle[]> {
    const url = `https://api.kite.trade/instruments/historical/${params.instrumentToken}/${params.interval}`;
    const response = await axios.get(url, {
      params: {
        from: params.from,
        to: params.to,
        oi: 0
      },
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });

    const raw = (response.data as any)?.data?.candles;
    if (!Array.isArray(raw)) return [];

    return raw.map((item: any[]) => ({
      time: String(item[0]),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5] || 0)
    }));
  }

  async placeOrder(params: {
    tradingsymbol: string;
    exchange: 'NSE' | 'NFO';
    transactionType: 'BUY' | 'SELL';
    quantity: number;
    product: 'MIS' | 'CNC';
    orderType: 'MARKET' | 'LIMIT';
    price?: number;
  }): Promise<{ orderId: string }> {
    const body = new URLSearchParams({
      variety: 'regular',
      exchange: params.exchange,
      tradingsymbol: params.tradingsymbol,
      transaction_type: params.transactionType,
      quantity: String(params.quantity),
      product: params.product,
      order_type: params.orderType,
      validity: 'DAY'
    });
    if (params.orderType === 'LIMIT' && typeof params.price === 'number') {
      body.set('price', String(params.price));
    }

    const response = await axios.post('https://api.kite.trade/orders/regular', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });
    const orderId = (response.data as any)?.data?.order_id;
    if (!orderId) {
      throw new Error((response.data as any)?.message || 'Failed to place order.');
    }
    return { orderId };
  }

  async fetchOrders(): Promise<any[]> {
    const response = await axios.get('https://api.kite.trade/orders', {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });
    return Array.isArray((response.data as any)?.data) ? (response.data as any).data : [];
  }

  async fetchPositions(): Promise<any[]> {
    const response = await axios.get('https://api.kite.trade/portfolio/positions', {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });
    return Array.isArray((response.data as any)?.data?.net) ? (response.data as any).data.net : [];
  }

  private async fetchInstruments(): Promise<any[]> {
    const now = Date.now();
    if (KiteService.instrumentsCache && now - KiteService.instrumentsCache.at < 15 * 60 * 1000) {
      return KiteService.instrumentsCache.rows;
    }

    const response = await axios.get('https://api.kite.trade/instruments', {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });
    const csv = String(response.data || '');
    const lines = csv.split('\n').filter(Boolean);
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        instrumentToken: Number(cols[0]),
        tradingsymbol: String(cols[2] || '').trim(),
        name: String(cols[3] || '').trim(),
        expiry: String(cols[5] || '').trim(),
        strike: Number(cols[6]),
        lotSize: Number(cols[8]),
        instrumentType: String(cols[9] || '').trim(),
        segment: String(cols[10] || '').trim(),
        exchange: String(cols[11] || '').trim()
      };
    });
    KiteService.instrumentsCache = { at: now, rows };
    return rows;
  }

  async fetchBankNiftyOptionChain(params: {
    spot: number;
    expiry?: string;
    strikesAround?: number;
  }): Promise<{ expiry: string; rows: KiteOptionRow[] }> {
    const instruments = await this.fetchInstruments();
    const candidates = instruments.filter((i) => {
      const symbol = String(i.tradingsymbol || '').toUpperCase();
      const name = String(i.name || '').toUpperCase();
      const segment = String(i.segment || '').toUpperCase();
      const instrumentType = String(i.instrumentType || '').toUpperCase();
      const isBankNifty =
        symbol.startsWith('BANKNIFTY') ||
        symbol.startsWith('NIFTYBANK') ||
        name.includes('BANKNIFTY') ||
        name.includes('NIFTY BANK');
      const isOptionsSegment = segment.includes('NFO-OPT') || i.exchange === 'NFO';
      const isOptionType = instrumentType === 'CE' || instrumentType === 'PE';
      return isBankNifty && isOptionsSegment && isOptionType;
    });
    if (candidates.length === 0) {
      throw new Error('BANKNIFTY option instruments not found.');
    }

    const uniqueExpiries = [...new Set(candidates.map(c => c.expiry).filter(Boolean))].sort();
    const today = new Date().toISOString().slice(0, 10);
    const nearest = uniqueExpiries.find(e => e >= today) || uniqueExpiries[0];
    const chosenExpiry = params.expiry && uniqueExpiries.includes(params.expiry) ? params.expiry : nearest;
    const expiryRows = candidates.filter(c => c.expiry === chosenExpiry);

    const atm = Math.round(params.spot / 100) * 100;
    const around = params.strikesAround ?? 6;
    const strikes: number[] = [];
    for (let s = -around; s <= around; s++) strikes.push(atm + s * 100);

    const selected = expiryRows.filter(r => strikes.includes(r.strike));
    const quoteKeys = selected.map(r => `NFO:${r.tradingsymbol}`);
    if (quoteKeys.length === 0) return { expiry: chosenExpiry, rows: [] };

    const query = quoteKeys.map(i => `i=${encodeURIComponent(i)}`).join('&');
    const quoteResp = await axios.get(`https://api.kite.trade/quote?${query}`, {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.config.apiKey}:${this.config.accessToken}`
      }
    });
    const quoteData = (quoteResp.data as any)?.data || {};

    const map = new Map<number, KiteOptionRow>();
    for (const r of selected) {
      const key = `NFO:${r.tradingsymbol}`;
      const q = quoteData[key];
      const asNullableNumber = (value: any) => (value === null || value === undefined ? null : Number(value));
      if (!map.has(r.strike)) {
        map.set(r.strike, {
          strike: r.strike,
          ceSymbol: null,
          peSymbol: null,
          ceLtp: null,
          peLtp: null,
          ceOi: null,
          peOi: null
        });
      }
      const row = map.get(r.strike)!;
      if (r.instrumentType === 'CE') {
        row.ceSymbol = r.tradingsymbol;
        row.ceLtp = asNullableNumber(q?.last_price);
        row.ceOi = asNullableNumber(q?.oi);
      } else {
        row.peSymbol = r.tradingsymbol;
        row.peLtp = asNullableNumber(q?.last_price);
        row.peOi = asNullableNumber(q?.oi);
      }
    }

    return {
      expiry: chosenExpiry,
      rows: [...map.values()].sort((a, b) => a.strike - b.strike)
    };
  }

  private parseBinaryTicks(buffer: Buffer): { instrumentToken: number; lp: number; bids: any[]; asks: any[]; receivedAt: string }[] {
    const ticks: { instrumentToken: number; lp: number; bids: any[]; asks: any[]; receivedAt: string }[] = [];
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    if (buffer.byteLength < 2) return ticks;
    const packetCount = view.getInt16(0, false);
    let offset = 2;

    for (let i = 0; i < packetCount; i++) {
      if (offset + 2 > buffer.byteLength) break;
      const packetLength = view.getInt16(offset, false);
      offset += 2;
      if (offset + packetLength > buffer.byteLength) break;

      const packet = new DataView(buffer.buffer, buffer.byteOffset + offset, packetLength);
      offset += packetLength;

      // Kite index/equity derivatives can emit different packet sizes depending on mode/instrument.
      if (packetLength !== 184 && packetLength !== 44 && packetLength !== 28 && packetLength !== 8) continue;

      const instrumentToken = packet.getInt32(0, false);
      const lastPrice = packet.getInt32(4, false) / 100;
      if (!Number.isFinite(lastPrice) || lastPrice <= 0) continue;

      const bids: any[] = [];
      const asks: any[] = [];

      if (packetLength === 184) {
        let depthOffset = 64;
        for (let level = 0; level < 10; level++) {
          const qty = packet.getInt32(depthOffset, false);
          const price = packet.getInt32(depthOffset + 4, false) / 100;
          const orders = packet.getInt16(depthOffset + 8, false);
          const item = { price, amount: qty, orders, total: price * qty };
          if (level < 5) bids.push(item);
          else asks.push(item);
          depthOffset += 12;
        }
      }

      ticks.push({ instrumentToken, lp: lastPrice, bids, asks, receivedAt: new Date().toISOString() });
    }

    return ticks;
  }
}
