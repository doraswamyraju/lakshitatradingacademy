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
import { sendContactEmail, sendEnrollmentEmail } from './services/mailer';
import { EngineCoordinator } from './engine/EngineCoordinator';
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
  try {
    const config = await prisma.marketDataConfig.findUnique({ where: { id: MARKET_DATA_CONFIG_ID } });
    if (!config || config.brokerName !== 'Kite' || !config.appKey || !config.appSecret || !config.accessToken) {
      return null;
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
  } catch (error) {
    return null;
  }
};

const getUserKiteClient = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.brokerName !== 'Kite' || !user.apiKey || !user.apiSecret || !user.accessToken) {
      return null;
    }
    const config = await prisma.marketDataConfig.findUnique({ where: { id: MARKET_DATA_CONFIG_ID } });
    return {
      client: new KiteService({
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        accessToken: user.accessToken,
        instrumentToken: config?.bankNiftyInstrumentToken || 260105
      }),
      user
    };
  } catch (error) {
    return null;
  }
};

const formatKiteDateTime = (raw: string): string => {
  // Kite API expects datetime strings in IST (UTC+5:30).
  // The VPS runs in UTC, so getHours() would give UTC hours — wrong.
  // We must shift the UTC timestamp to IST before formatting.
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
    const ist = new Date(dt.getTime() + IST_OFFSET_MS);
    const y = ist.getUTCFullYear();
    const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const d = String(ist.getUTCDate()).padStart(2, '0');
    const hh = String(ist.getUTCHours()).padStart(2, '0');
    const mm = String(ist.getUTCMinutes()).padStart(2, '0');
    const ss = String(ist.getUTCSeconds()).padStart(2, '0');
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

    // Hardcoded Admin Fallback for emergency access
    if (username === 'admin' && password === 'adminpassword123') {
      let adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        adminUser = await prisma.user.create({
          data: { username: 'admin', passwordHash, role: 'ADMIN' }
        });
      } else if (adminUser.role !== 'ADMIN') {
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { role: 'ADMIN' }
        });
      }

      const token = jwt.sign({ id: adminUser.id, username: adminUser.username, role: adminUser.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ 
        success: true, 
        token, 
        user: { 
          id: adminUser.id, 
          username: adminUser.username, 
          role: adminUser.role,
          isPaperTrading: adminUser.isPaperTrading 
        } 
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        isPaperTrading: user.isPaperTrading 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- USER ROUTES ---

// Update paper trading mode
app.put(['/api/user/mode', '/user/mode'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { isPaperTrading } = req.body;

    if (typeof isPaperTrading !== 'boolean') {
      return res.status(400).json({ error: 'isPaperTrading must be a boolean' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isPaperTrading }
    });

    res.json({ 
      success: true, 
      isPaperTrading: updatedUser.isPaperTrading,
      message: `Trading mode updated to ${updatedUser.isPaperTrading ? 'PAPER' : 'LIVE'}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trading mode' });
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
    const kite = await getGlobalKiteClient();
    if (!kite) {
      return res.json({
        broker: 'Kite',
        isEnabled: false,
        hasAccessToken: false,
        accessTokenUpdatedAt: null,
        tokenAgeMinutes: null,
        shouldReconnect: true
      });
    }
    const { config } = kite;
    const updatedAt = config.accessTokenUpdatedAt;
    const tokenAgeMinutes = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000)) : null;
    const shouldReconnect = !updatedAt || tokenAgeMinutes === null || tokenAgeMinutes > 1440;
    res.json({
      broker: config.brokerName,
      isEnabled: config.isEnabled,
      hasAccessToken: Boolean(config.accessToken),
      accessTokenUpdatedAt: updatedAt,
      tokenAgeMinutes,
      shouldReconnect
    });
  } catch (error: any) {
    res.json({ error: 'Failed to get token status', isEnabled: false });
  }
});

app.get(['/api/market-data/strategies', '/api/algo/strategies'], authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return the master HA Trend Continuation strategy (id 'm3')
    // Users can copy it to their namespace — but for engine start we need this id
    res.json({
      strategies: [
        {
          id: 'm3',
          name: 'HA Trend Continuation',
          description: 'Handwritten Rules v1.0: Trade only 09:30-11:00 & 12:45-14:50. Entry on [BUY: +DI>-DI & High Breakout] or [SELL: -DI>+DI & Low Breakdown]. Exit only after 1:1 RR.',
          version: '1.0',
          mode: 'INTRADAY',
          instruments: ['NIFTY', 'BANKNIFTY', 'CRUDEOIL'],
          timeframe: '5m',
          qty: 1,
          productType: 'MIS',
          isActive: true,
          isMaster: true,
          createdBy: 'admin'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

app.get(['/api/market-data/wallet', '/api/algo/wallet'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const kite = await getUserKiteClient(userId);
    if (!kite) {
      return res.json({ broker: 'Kite', wallet: { walletBalance: 0, availableMargin: 0, usedMargin: 0, collateral: 0, dayPnl: 0 } });
    }
    const wallet = await kite.client.fetchWallet();
    res.json({
      broker: 'Kite',
      wallet
    });
  } catch (error: any) {
    res.json({ error: 'Failed to fetch wallet', wallet: { walletBalance: 0, availableMargin: 0, usedMargin: 0, collateral: 0, dayPnl: 0 } });
  }
});

app.get(['/api/market-data/kite/historical', '/market-data/kite/historical'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const kite = await getGlobalKiteClient();
    if (!kite) {
      return res.json({ candles: [], count: 0, message: 'Broker not linked' });
    }
    const { client, config } = kite;
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
    if (!allowed.has(interval)) return res.json({ error: 'Invalid interval.', candles: [] });
    if (!from || !to) return res.json({ error: 'from and to required.', candles: [] });

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
    res.json({ error: 'Failed to fetch historical data', candles: [] });
  }
});

app.get(['/api/market-data/kite/option-chain', '/market-data/kite/option-chain'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const kite = await getGlobalKiteClient();
    if (!kite) {
      return res.json({ rows: [], message: 'Broker not linked' });
    }
    const { client, config } = kite;
    const spotLtp = await client.fetchLtp('NSE:NIFTY BANK');
    const spot = Number(req.query.spot || spotLtp || 0);
    if (!Number.isFinite(spot) || spot <= 0) {
      return res.json({ error: 'Unable to determine spot.', rows: [] });
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
    res.json({ error: 'Failed to fetch option chain', rows: [] });
  }
});

app.post(['/api/algo/order', '/algo/order'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const kite = await getUserKiteClient(userId);
    if (!kite) {
      return res.status(400).json({ error: 'Personal Broker not linked. Please connect Kite first.' });
    }
    const { client } = kite;
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

// Place option orders by strike/CE/PE type (resolves symbol from option chain)
app.post(['/api/algo/order-option', '/algo/order-option'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const kite = await getUserKiteClient(userId);
    if (!kite) {
      return res.status(400).json({ error: 'Personal Broker not linked. Please connect Kite first.' });
    }
    const { client } = kite;
    const {
      side,       // 'BUY' | 'SELL'
      quantity,
      type,       // 'MARKET' | 'LIMIT'
      product,
      optionType, // 'CE' | 'PE'
      strike,
      price,
      isPaper
    } = req.body;

    if (!side || !quantity || !optionType || !strike) {
      return res.status(400).json({ error: 'side, quantity, optionType, and strike are required.' });
    }

    if (isPaper) {
      // Simulate a paper trade — log it but don't call the broker
      const logMsg = `[PAPER] ${side} ${strike} ${optionType} x${quantity} @ ${price ?? 'MARKET'}`;
      await prisma.strategyLog.create({
        data: {
          userId,
          strategyId: 'm3_v2',
          action: 'PAPER_ORDER',
          symbol: `BANKNIFTY ${strike} ${optionType}`,
          price: price ?? 0,
          qty: Number(quantity),
          status: 'SUCCESS',
          isSimulated: true,
          message: logMsg
        }
      });
      return res.json({ success: true, orderId: `PAPER-${Date.now()}`, isPaper: true });
    }

    // Resolve the trading symbol from option chain
    const spot = await client.fetchLtp('NSE:NIFTY BANK');
    const chain = await client.fetchBankNiftyOptionChain({ spot: spot ?? 50000, strikesAround: 5 });
    const row = chain.rows.find((r: any) => r.strike === Number(strike));
    const tradingsymbol = optionType === 'CE' ? row?.ceSymbol : row?.peSymbol;
    if (!tradingsymbol) {
      return res.status(400).json({ error: `Could not find ${optionType} ${strike} symbol in option chain.` });
    }

    const placed = await client.placeOrder({
      tradingsymbol,
      exchange: 'NFO' as any,
      transactionType: side,
      quantity: Number(quantity),
      product: product || 'MIS',
      orderType: type || 'MARKET',
      price
    });

    res.json({ success: true, orderId: placed.orderId });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to place option order.' });
  }
});

app.get(['/api/algo/orders', '/algo/orders'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const kite = await getUserKiteClient(userId);
    if (!kite) {
      return res.json({ orders: [], message: 'Personal Broker not linked' });
    }
    const rows = await kite.client.fetchOrders();
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
    res.json({ orders: [], error: 'Failed to fetch orders' });
  }
});

// --- ALGO ENGINE ROUTES ---

app.post(['/api/algo/toggle', '/algo/toggle'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { enabled, strategyId } = req.body;
    await engineCoordinator.toggleAutomation(userId, !!enabled, strategyId);
    res.json({ success: true, enabled: !!enabled });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle automation' });
  }
});

app.get(['/api/algo/status', '/algo/status'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { automationEnabled: true, activeStrategyId: true } as any
    }) as any;
    res.json({ enabled: user?.automationEnabled || false, activeStrategyId: user?.activeStrategyId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

app.get(['/api/algo/logs', '/algo/logs'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userData = (req as any).user;
    const { limit = '50', all = 'false' } = req.query;

    // If 'all=true', verify admin
    if (all === 'true' && userData.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required for global logs.' });
    }

    const whereClause = (all === 'true') ? {} : { userId: userData.id };
    const logs = await prisma.strategyLog.findMany({
      where: whereClause,
      take: parseInt(String(limit)),
      orderBy: { timestamp: 'desc' },
      include: (all === 'true') ? { user: { select: { username: true } } } : undefined
    });

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.post(['/api/algo/logs', '/algo/logs'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userData = (req as any).user;
    const { strategyId = 'm3_v2', action = 'LOG', symbol = 'BANKNIFTY', price = 0, qty = 0, status = 'INFO', message = '' } = req.body;

    await prisma.strategyLog.create({
      data: {
        userId: userData.id,
        strategyId,
        action,
        symbol,
        price: Number(price),
        qty: Number(qty),
        status,
        isSimulated: false,
        message
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save log' });
  }
});

app.get(['/api/algo/positions', '/algo/positions'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const kite = await getUserKiteClient(userId);
    if (!kite) {
      return res.json({ positions: [], message: 'Personal Broker not linked' });
    }
    const rows = await kite.client.fetchPositions();
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
    res.json({ positions: [], error: 'Failed to fetch positions' });
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

// User Kite Authentication
app.get(['/api/user/kite/login-url', '/user/kite/login-url'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.brokerName !== 'Kite' || !user.apiKey) {
      return res.status(400).json({ error: 'Kite API key missing in your profile.' });
    }
    // We pass userId in state so the callback knows who this is
    const loginUrl = KiteService.buildLoginUrl(user.apiKey, userId);
    res.json({ loginUrl });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate User login URL.' });
  }
});

// Since the callback from Kite will just hit /api/user/kite/callback directly from the browser, we CANNOT use authenticateToken.
// We must extract the userId from the 'state' query param instead.
app.get(['/api/user/kite/callback', '/user/kite/callback'], async (req: Request, res: Response) => {
  try {
    const requestToken = String(req.query.request_token || '');
    const state = String(req.query.state || '');
    const status = String(req.query.status || '');
    
    if (!requestToken || status.toLowerCase() !== 'success') {
      return res.status(400).send('Kite callback missing valid request_token or status is not success.');
    }
    if (!state) {
      return res.status(400).send('Missing user state parameter in redirect.');
    }

    const userId = state;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.apiKey || !user.apiSecret) {
      return res.status(400).send('API credentials not configured for this user.');
    }

    const session = await KiteService.exchangeRequestToken({
      apiKey: user.apiKey,
      apiSecret: user.apiSecret,
      requestToken
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        requestToken,
        accessToken: session.accessToken,
        accessTokenUpdatedAt: new Date(),
        clientCode: session.userId || user.clientCode
      }
    });

    res.redirect('/#settings');
  } catch (error: any) {
    console.error('[User Kite Callback] Error:', error);
    res.status(500).send(`Authentication failed: ${error?.message || 'unknown error'}`);
  }
});

app.get(['/api/user/kite/token-status', '/user/kite/token-status'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.brokerName !== 'Kite') {
      return res.json({ hasAccessToken: false, tokenAgeMinutes: null, shouldReconnect: true });
    }
    const updatedAt = user.accessTokenUpdatedAt;
    const tokenAgeMinutes = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000)) : null;
    const shouldReconnect = !updatedAt || tokenAgeMinutes === null || tokenAgeMinutes > 1440;
    res.json({
      hasAccessToken: Boolean(user.accessToken),
      accessTokenUpdatedAt: updatedAt,
      tokenAgeMinutes,
      shouldReconnect
    });
  } catch (error: any) {
    res.json({ error: 'Failed to get token status', hasAccessToken: false });
  }
});

// Admin Error Report Endpoint
app.get(['/api/admin/errors', '/admin/errors'], authenticateToken, async (req: Request, res: Response) => {
  // Simple check for role if user object has it
  const user = (req as any).user;
  // For now return all, but in prod we'd check if user is admin
  res.json(systemErrors);
});

// Front-End Form Endpoints
app.post(['/api/contact', '/contact'], async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Name, phone, and message are required.' });
    }
    const inquiry = await prisma.contactInquiry.create({
      data: { name, email, phone, message }
    });
    // Fire and forget email
    sendContactEmail({ name, email, phone, message }).catch(console.error);
    res.json({ success: true, inquiry });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

app.post(['/api/enroll', '/enroll'], async (req: Request, res: Response) => {
  try {
    const { name, email, phone, course } = req.body;
    if (!name || !email || !phone || !course) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const lead = await prisma.admissionLead.create({
      data: { name, email, phone, course }
    });
    // Fire and forget email
    sendEnrollmentEmail({ name, email, phone, course }).catch(console.error);
    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit enrollment.' });
  }
});

app.post(['/api/aliceblue', '/aliceblue'], async (req: Request, res: Response) => {
  try {
    const { name, email, phone, pan } = req.body;
    if (!name || !email || !phone || !pan) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const lead = await (prisma as any).aliceBlueLead.create({
        data: { name, email, phone, pan }
    });
    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit Alice Blue lead.' });
  }
});

app.get(['/api/admin/inquiries', '/admin/inquiries'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const inquiries = await prisma.contactInquiry.findMany({ orderBy: { createdAt: 'desc' }});
    res.json(inquiries);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

app.get(['/api/admin/admissions', '/admin/admissions'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const leads = await (prisma as any).admissionLead.findMany({ orderBy: { createdAt: 'desc' }});
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admissions' });
  }
});

app.get(['/api/admin/aliceblue', '/admin/aliceblue'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const leads = await (prisma as any).aliceBlueLead.findMany({ orderBy: { createdAt: 'desc' }});
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch Alice Blue leads' });
  }
});

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' }, path: '/api/socket.io' });

// Mount the realtime ticker daemon
const marketStreamer = new MarketStreamer(io);
const engineCoordinator = new EngineCoordinator(marketStreamer, io);

io.on('connection', (socket) => {
  console.log(`[WebSocket] Terminal Connected: ${socket.id}`);
  
  // Join private room for user-specific updates
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`[Socket] User ${userId} joined room.`);
    socket.emit('strategy_log', `SYSTEM: Live connection established. Monitoring active.`);
  });
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
