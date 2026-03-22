import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MarketStreamer } from './services/MarketStreamer';
import { AliceBlueService } from './services/AliceBlueService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'lakshita_fallback_secret';
export const systemErrors: any[] = [];

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

      if (brokerName === 'AliceBlue') {
        const verifier = new AliceBlueService({
          brokerName,
          apiKey,
          apiSecret,
          clientCode
        });
        const verified = await verifier.generateSession();
        if (!verified) {
          return res.status(400).json({ error: 'Broker authentication failed. Invalid API credentials or broker session unavailable.' });
        }
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

    marketStreamer?.rebootFeed();

    res.json({ success: true, message: isConnected ? 'Broker connected and verified.' : 'Broker disconnected.' });
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
  socket.on('disconnect', () => console.log(`[WebSocket] Terminal Disconnected: ${socket.id}`));
});

server.listen(port, () => {
  console.log(`[Server] Execution Engine started at http://localhost:${port}`);
});
