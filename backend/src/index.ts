import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MarketStreamer } from './services/MarketStreamer';
import { KiteService } from './services/KiteService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'lakshita_fallback_secret';
export const systemErrors: any[] = [];
const MARKET_DATA_CONFIG_ID = 'GLOBAL';
const KITE_DEFAULT_REDIRECT = 'https://lakshitatradingacademy.com/kite/callback';

const getGlobalKiteClient = async () => {
  const config = await prisma.marketDataConfig.findUnique({ where: { id: MARKET_DATA_CONFIG_ID } });
  if (!config) throw new Error('Market data config not found.');
  if (config.brokerName !== 'Kite') throw new Error(`Unsupported broker ${config.brokerName}`);
  if (!config.appKey || !config.appSecret || !config.accessToken) {
    throw new Error('Kite credentials missing. Complete Kite login flow.');
  }
  return {
    client: new KiteService({
      apiKey: config.appKey,
      apiSecret: config.appSecret,
      accessToken: config.accessToken,
      instrumentToken: config.bankNiftyInstrumentToken
    }),
    config
  };
};

const formatKiteDateTime = (raw: string): string => {
  // Accept ISO and convert to Kite expected "YYYY-MM-DD HH:mm:ss"
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  return raw;
};

// Basic health check route
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({ status: 'live', message: 'Lakshita Trading Academy Engine Running' });
});

// JWT Middleware to protect routes
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    (req as any).user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post(['/api/auth/register', '/auth/register'], async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { username, passwordHash }
    });

    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post(['/api/auth/login', '/auth/login'], async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PROTECTED ROUTES ---

// Global market-data API config (shared for all users)
app.get(['/api/market-data/config', '/market-data/config'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const cfg = await prisma.marketDataConfig.upsert({
      where: { id: MARKET_DATA_CONFIG_ID },
      create: {
        id: MARKET_DATA_CONFIG_ID,
        brokerName: 'Kite',
        appKey: 'DUMMY_KITE_API_KEY',
        appSecret: 'DUMMY_KITE_API_SECRET',
        clientCode: null,
        redirectUrl: KITE_DEFAULT_REDIRECT,
        requestToken: null,
        accessToken: null,
        accessTokenUpdatedAt: null,
        bankNiftyInstrumentToken: 260105,
        isEnabled: false
      },
      update: {}
    });
    res.json(cfg);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch market data config.' });
  }
});

app.post(['/api/market-data/config', '/market-data/config'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const {
      brokerName = 'Kite',
      appKey,
      appSecret,
      clientCode = null,
      redirectUrl = KITE_DEFAULT_REDIRECT,
      requestToken = null,
      accessToken = null,
      bankNiftyInstrumentToken = 260105,
      isEnabled = true
    } = req.body;

    const updated = await prisma.marketDataConfig.upsert({
      where: { id: MARKET_DATA_CONFIG_ID },
      create: {
        id: MARKET_DATA_CONFIG_ID,
        brokerName,
        appKey,
        appSecret,
        clientCode,
        redirectUrl,
        requestToken,
        accessToken,
        accessTokenUpdatedAt: accessToken ? new Date() : null,
        bankNiftyInstrumentToken,
        isEnabled
      },
      update: {
        brokerName,
        appKey,
        appSecret,
        clientCode,
        redirectUrl,
        requestToken,
        accessToken,
        accessTokenUpdatedAt: accessToken ? new Date() : undefined,
        bankNiftyInstrumentToken,
        isEnabled
      }
    });

    await marketStreamer.rebootFeed();
    res.json({ success: true, config: updated });
  } catch (error: any) {
    systemErrors.push({ timestamp: new Date(), context: 'MarketDataConfig', error: error.message });
    res.status(500).json({ error: 'Failed to save market data config.' });
  }
});

app.get(['/api/market-data/kite/login-url', '/market-data/kite/login-url'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const config = await prisma.marketDataConfig.upsert({
      where: { id: MARKET_DATA_CONFIG_ID },
      create: {
        id: MARKET_DATA_CONFIG_ID,
        brokerName: 'Kite',
        appKey: 'DUMMY_KITE_API_KEY',
        appSecret: 'DUMMY_KITE_API_SECRET',
        redirectUrl: KITE_DEFAULT_REDIRECT,
        isEnabled: false
      },
      update: {}
    });

    if (!config.appKey) {
      return res.status(400).json({ error: 'Kite app key missing in market-data config.' });
    }

    const loginUrl = KiteService.buildLoginUrl(config.appKey);
    res.json({ loginUrl, redirectUrl: config.redirectUrl || KITE_DEFAULT_REDIRECT });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate Kite login URL.' });
  }
});

app.get(['/api/market-data/kite/callback', '/market-data/kite/callback'], async (req: Request, res: Response) => {
  try {
    const requestToken = String(req.query.request_token || '');
    const status = String(req.query.status || '');
    if (!requestToken || status.toLowerCase() !== 'success') {
      return res.status(400).send('Kite callback missing valid request_token.');
    }

    const config = await prisma.marketDataConfig.findUnique({ where: { id: MARKET_DATA_CONFIG_ID } });
    if (!config) {
      return res.status(400).send('Market data config not found.');
    }
    if (!config.appKey || !config.appSecret) {
      return res.status(400).send('Kite API credentials not configured.');
    }

    const session = await KiteService.exchangeRequestToken({
      apiKey: config.appKey,
      apiSecret: config.appSecret,
      requestToken
    });

    await prisma.marketDataConfig.update({
      where: { id: MARKET_DATA_CONFIG_ID },
      data: {
        brokerName: 'Kite',
        requestToken,
        accessToken: session.accessToken,
        accessTokenUpdatedAt: new Date(),
        clientCode: session.userId || config.clientCode,
        isEnabled: true
      }
    });

    await marketStreamer.rebootFeed();
    res.send('Kite authorization successful. You can close this tab and return to dashboard.');
  } catch (error: any) {
    console.error('[Kite Callback] Error:', error);
    res.status(500).send(`Kite authorization failed: ${error?.message || 'unknown error'}`);
  }
});

app.get(['/api/market-data/kite/token-status', '/market-data/kite/token-status'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const config = await prisma.marketDataConfig.findUnique({ where: { id: MARKET_DATA_CONFIG_ID } });
    if (!config) {
      return res.json({
        broker: 'Kite',
        isEnabled: false,
        hasAccessToken: false,
        accessTokenUpdatedAt: null,
        tokenAgeMinutes: null,
        shouldReconnect: true
      });
    }

    const updatedAt = config.accessTokenUpdatedAt;
    const tokenAgeMinutes = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000)) : null;
    const shouldReconnect = !updatedAt || tokenAgeMinutes === null || tokenAgeMinutes > 1440;
    
    res.json({
      broker: config.brokerName || 'Kite',
      isEnabled: config.isEnabled || false,
      hasAccessToken: Boolean(config.accessToken),
      accessTokenUpdatedAt: updatedAt,
      tokenAgeMinutes,
      shouldReconnect
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to get token status.' });
  }
});

app.get(['/api/market-data/wallet', '/market-data/wallet'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const { client } = await getGlobalKiteClient();
    const wallet = await client.fetchWallet();
    res.json({
      broker: 'Kite',
      wallet
    });
  } catch (error: any) {
    if (error?.message?.includes('credentials missing') || error?.message?.includes('config not found')) {
      return res.json({
        broker: 'Kite',
        wallet: { walletBalance: 0, availableMargin: 0, usedMargin: 0, collateral: 0, dayPnl: 0 }
      });
    }
    res.status(400).json({ error: error?.message || 'Failed to fetch broker wallet.' });
  }
});

app.get(['/api/market-data/kite/historical', '/market-data/kite/historical'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const { client, config } = await getGlobalKiteClient();
    const token = Number(req.query.instrumentToken || config.bankNiftyInstrumentToken || 260105);
    const interval = String(req.query.interval || '5minute') as
      | 'minute'
      | '3minute'
      | '5minute'
      | '15minute'
      | '30minute'
      | '60minute'
      | 'day';
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    const allowed = new Set(['minute', '3minute', '5minute', '15minute', '30minute', '60minute', 'day']);
    if (!allowed.has(interval)) return res.status(400).json({ error: 'Invalid interval.' });
    if (!from || !to) return res.status(400).json({ error: 'from and to query params are required.' });

    const candles = await client.fetchHistoricalCandles({
      instrumentToken: token,
      interval,
      from: formatKiteDateTime(from),
      to: formatKiteDateTime(to)
    });

    res.json({
      instrumentToken: token,
      interval,
      from,
      to,
      count: candles.length,
      candles
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to fetch historical candles.' });
  }
});

app.get(['/api/market-data/kite/option-chain', '/market-data/kite/option-chain'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const { client, config } = await getGlobalKiteClient();
    const spotLtp = await client.fetchLtp('NSE:NIFTY BANK');
    const spot = Number(req.query.spot || spotLtp || 0);
    if (!Number.isFinite(spot) || spot <= 0) {
      return res.status(400).json({ error: 'Unable to determine BANKNIFTY spot.' });
    }
    const expiry = req.query.expiry ? String(req.query.expiry) : undefined;
    const strikesAround = Number(req.query.strikesAround || 6);
    const chain = await client.fetchBankNiftyOptionChain({
      spot,
      expiry,
      strikesAround: Number.isFinite(strikesAround) ? strikesAround : 6
    });

    res.json({
      broker: config.brokerName,
      spot,
      expiry: chain.expiry,
      rows: chain.rows
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to fetch option chain.' });
  }
});

app.post(['/api/algo/order', '/algo/order'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const { client } = await getGlobalKiteClient();
    const {
      tradingsymbol = 'NIFTY BANK',
      exchange = 'NSE',
      transactionType,
      quantity,
      product = 'MIS',
      orderType = 'MARKET',
      price
    } = req.body || {};
    if (!transactionType || !quantity) {
      return res.status(400).json({ error: 'transactionType and quantity are required.' });
    }

    const placed = await client.placeOrder({
      tradingsymbol,
      exchange,
      transactionType,
      quantity: Number(quantity),
      product,
      orderType,
      price
    });

    res.json({ success: true, orderId: placed.orderId });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to place order.' });
  }
});

app.get(['/api/algo/orders', '/algo/orders'], authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { client } = await getGlobalKiteClient();
    const rows = await client.fetchOrders();
    const orders = rows.slice(0, 200).map((o: any) => ({
      order_id: o.order_id,
      symbol: `${o.exchange}:${o.tradingsymbol}`,
      transaction_type: o.transaction_type,
      quantity: Number(o.quantity),
      price: Number(o.average_price || o.price || 0),
      order_type: o.order_type,
      status: o.status,
      order_timestamp: o.order_timestamp || new Date().toISOString(),
      product: o.product === 'CNC' ? 'CNC' : 'MIS'
    }));
    res.json({ orders });
  } catch (error: any) {
    if (error?.message?.includes('credentials missing') || error?.message?.includes('config not found')) {
      return res.json({ orders: [] });
    }
    res.status(400).json({ error: error?.message || 'Failed to fetch orders.' });
  }
});

app.get(['/api/algo/positions', '/algo/positions'], authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { client } = await getGlobalKiteClient();
    const rows = await client.fetchPositions();
    const positions = rows.map((p: any) => ({
      symbol: `${p.exchange}:${p.tradingsymbol}`,
      quantity: Number(p.quantity || 0),
      avgPrice: Number(p.average_price || 0),
      ltp: Number(p.last_price || 0),
      pnl: Number(p.pnl || 0),
      product: p.product === 'CNC' ? 'CNC' : 'MIS'
    }));
    res.json({ positions });
  } catch (error: any) {
    if (error?.message?.includes('credentials missing') || error?.message?.includes('config not found')) {
      return res.json({ positions: [] });
    }
    res.status(400).json({ error: error?.message || 'Failed to fetch positions.' });
  }
});

// Get User Broker Config
app.get(['/api/config', '/config'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      brokerName: user.brokerName || 'AngelOne',
      apiKey: user.apiKey || '',
      apiSecret: user.apiSecret || '',
      clientCode: user.clientCode || '',
      isConnected: Boolean(user.apiKey && user.apiSecret && user.clientCode)
    });
  } catch (error) {
    console.error('[API Config GET] Fatal Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save User Broker Config
app.post(['/api/config', '/config'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { brokerName, apiKey, apiSecret, clientCode, isConnected } = req.body;

    if (isConnected) {
      if (!brokerName || !apiKey || !apiSecret || !clientCode) {
        return res.status(400).json({ error: 'brokerName, apiKey, apiSecret and clientCode are required.' });
      }
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        brokerName,
        apiKey: isConnected ? apiKey : null,
        apiSecret: isConnected ? apiSecret : null,
        clientCode: isConnected ? clientCode : null
      }
    });

    res.json({ success: true, message: isConnected ? 'Broker configuration saved.' : 'Broker disconnected.' });
  } catch (error: any) {
    console.error('[API Config POST] Fatal Error during Broker saving:', error);
    systemErrors.push({ timestamp: new Date(), context: 'Broker Config', error: error.message });
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Admin Error Report Endpoint
app.get(['/api/admin/errors', '/admin/errors'], authenticateToken, async (req: Request, res: Response) => {
  // Simple check for role if user object has it
  const user = (req as any).user;
  // For now return all, but in prod we'd check if user is admin
  res.json(systemErrors);
});

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/api/socket.io' });

// Mount the realtime ticker daemon
const marketStreamer = new MarketStreamer(io);

io.on('connection', (socket) => {
  console.log(`[WebSocket] Terminal Connected: ${socket.id}`);
  const latestFeed = marketStreamer.getLatestFeedStatus();
  socket.emit('feed_status', {
    source: latestFeed.source,
    message: latestFeed.message,
    at: new Date().toISOString()
  });
  socket.on('disconnect', () => console.log(`[WebSocket] Terminal Disconnected: ${socket.id}`));
});

server.listen(port, () => {
  console.log(`[Server] Execution Engine started at http://localhost:${port}`);
});
