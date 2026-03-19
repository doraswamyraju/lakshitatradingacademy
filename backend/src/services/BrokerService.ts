import axios from 'axios';

export interface BrokerCredentials {
  apiKey: string;
  clientCode: string;
  apiSecret: string;
  totpSecret?: string;
}

export interface PlaceOrderParams {
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: 'BUY' | 'SELL';
  exchange: 'NFO' | 'NSE';
  ordertype: 'MARKET' | 'LIMIT';
  producttype: 'INTRADAY' | 'CARRYFORWARD' | 'MARGIN';
  duration: 'DAY' | 'IOC';
  price?: number;
  squareoff?: number;
  stoploss?: number;
  quantity: number;
}

/**
 * AngelOne (SmartAPI) Integration Service
 */
export class AngelOneService {
  private config: BrokerCredentials;
  private jwtToken: string | null = null;
  private refreshToken: string | null = null;
  private feedToken: string | null = null;

  private static BASE_URL = 'https://apiconnect.angelbroking.com';

  constructor(config: BrokerCredentials) {
    this.config = config;
  }

  /**
   * 1. Login & Generate Session
   * Requires implementing TOTP logic if fully automated.
   */
  async generateSession(clientPin: string, dynamicTotp: string) {
    try {
      console.log(`[Broker] Attempting login for ${this.config.clientCode}`);
      const payload = {
        clientcode: this.config.clientCode,
        password: clientPin,
        totp: dynamicTotp
      };

      const res = await axios.post(`${AngelOneService.BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '147.93.107.21', // Replace dynamically in prod
          'X-ClientPublicIP': '147.93.107.21', 
          'X-MACAddress': 'MAC_ADDRESS',
          'X-PrivateKey': this.config.apiKey
        }
      });

      if (res.data.status) {
        this.jwtToken = res.data.data.jwtToken;
        this.refreshToken = res.data.data.refreshToken;
        this.feedToken = res.data.data.feedToken;
        console.log(`[Broker] Login Successful for ${this.config.clientCode}`);
        return true;
      }
      return false;
    } catch (error) {
       console.error(`[Broker] Login failed:`, error);
       return false;
    }
  }

  /**
   * 2. Place Order Payload
   */
  async placeOrder(params: PlaceOrderParams) {
    if (!this.jwtToken) throw new Error("Not logged in to broker");

    try {
      const res = await axios.post(`${AngelOneService.BASE_URL}/rest/secure/angelbroking/order/v1/placeOrder`, params, {
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '147.93.107.21',
          'X-ClientPublicIP': '147.93.107.21',
          'X-MACAddress': 'MAC_ADDRESS',
          'X-PrivateKey': this.config.apiKey
        }
      });
      console.log(`[Broker] Order Placed:`, res.data);
      return res.data;
    } catch (error) {
      console.error(`[Broker] Order Placement error:`, error);
      throw error;
    }
  }

  /**
   * 3. WebSocket Data Feed Boilerplate
   */
  initWebSocket() {
     // Will be integrated using AngelOne SmartAPI WebSocket 2.0
     console.log(`[Broker] WebSocket stream initializing for ${this.config.clientCode}...`);
  }
}
