import axios from 'axios';
import crypto from 'crypto';
import WebSocket from 'ws';

export interface BrokerCredentials {
  brokerName: string;
  apiKey: string;
  apiSecret: string;
  clientCode: string;
}

export class AliceBlueService {
  private config: BrokerCredentials;
  private sessionId: string | null = null;
  private ws: WebSocket | null = null;
  private listeners: ((tick: any) => void)[] = [];

  private static BASE_URL = 'https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api';

  constructor(config: BrokerCredentials) {
    this.config = config;
  }

  /**
   * 1. Get Session ID via SHA-256 Handshake
   */
  async generateSession() {
    try {
      console.log(`[AliceBlue] Initializing API v2 Handshake for ${this.config.clientCode}...`);
      
      // Step 1: Get Encryption Key
      const keyRes = await axios.post(`${AliceBlueService.BASE_URL}/customer/getAPIEncpkey`, {
         userId: this.config.clientCode
      });
      
      console.log(`[AliceBlue] getAPIEncpkey Response:`, JSON.stringify(keyRes.data));
      
      const encKey = (keyRes.data as any)?.encKey;
      if (!encKey) throw new Error("Failed to retrieve encryption key from AliceBlue");

      // Step 2: Generate SHA-256 Checksum
      const hashStr = this.config.clientCode + this.config.apiKey + encKey;
      const chksum = crypto.createHash('sha256').update(hashStr).digest('hex');

      // Step 3: Get Session ID
      const authRes = await axios.post(`${AliceBlueService.BASE_URL}/customer/getUserSID`, {
         userId: this.config.clientCode,
         userData: chksum
      });
      const data = authRes.data as any;

      if (data?.stat === 'Ok' && data?.sessionID) {
         this.sessionId = data.sessionID;
         console.log(`[AliceBlue] Authentication Successful. Session ID retrieved.`);
         return true;
      }
      
      throw new Error(data?.Emsg || "Invalid API Credentials");
    } catch (error: any) {
       console.error(`[AliceBlue] Login Handshake Failed:`, error.response?.data || error.message);
       return false;
    }
  }

  /**
   * 2. Initialize NorenWS Socket Feed
   */
  initWebSocket(onTick: (data: any) => void) {
      if (!this.sessionId) {
          console.error(`[AliceBlue] Cannot start WebSocket cleanly: No valid Session ID.`);
          return;
      }

      this.listeners.push(onTick);
      console.log(`[AliceBlue] Connecting to NorenWS wss://ws1.aliceblueonline.com/NorenWS/ ...`);

      this.ws = new WebSocket('wss://ws1.aliceblueonline.com/NorenWS/');

      this.ws.on('open', () => {
          console.log(`[AliceBlue] NorenWS Connected. Sending Authentication payload...`);
          
          const initPayload = {
             susertoken: this.sessionId,
             t: "c",
             actid: this.config.clientCode,
             uid: this.config.clientCode,
             source: "API"
          };
          this.ws?.send(JSON.stringify(initPayload));
      });

      this.ws.on('message', (data: WebSocket.Data) => {
          try {
             const message = JSON.parse(data.toString());
             
             // Check if connection acknowledged
             if (message.t === 'ck' && message.s === 'OK') {
                 console.log(`[AliceBlue] WebSocket Authorized. Subscribing to NSE:BANKNIFTY (Token: 26009)`);
                 
                 // Subscribe to Bank Nifty Touchline (Token 26009 or 26000 depending on Noren symbol map)
                 const subPayload = { k: "NSE|26009", t: "t" };
                 this.ws?.send(JSON.stringify(subPayload));
             }

             // Parse incoming Touchline Ticks
             if (message.t === 'tk' || message.t === 'tf') {
                 // Forward the raw tick to MarketStreamer
                 this.listeners.forEach(cb => cb(message));
             }
          } catch (e) {
             // Ignore malformed heartbeats
          }
      });

      this.ws.on('error', (err) => {
          console.error(`[AliceBlue WS Error]:`, err);
      });

      this.ws.on('close', () => {
          console.log(`[AliceBlue] WebSocket Disconnected`);
      });
  }
}
