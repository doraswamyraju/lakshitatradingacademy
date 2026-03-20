import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MarketStreamer } from './services/MarketStreamer';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'live', message: 'Lakshita Trading Academy Engine Running' });
});

// JWT Middleware to protect routes
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET || 'lakshita_fallback_secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    (req as any).user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
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
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'lakshita_fallback_secret', { expiresIn: '24h' });
    
    res.json({ success: true, token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PROTECTED ROUTES ---

// Get User Broker Config
app.get('/api/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      brokerName: user.brokerName || 'AngelOne',
      apiKey: user.apiKey || '',
      apiSecret: user.apiSecret || '',
      clientCode: user.clientCode || '',
      isConnected: !!user.apiKey
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Save User Broker Config
app.post('/api/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { brokerName, apiKey, apiSecret, clientCode, isConnected } = req.body;
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        brokerName,
        apiKey: isConnected ? apiKey : null,
        apiSecret: isConnected ? apiSecret : null,
        clientCode: isConnected ? clientCode : null
      }
    });

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
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
