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

export class KiteService {
  private config: KiteConfig;
  private ws: WebSocket | null = null;

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
