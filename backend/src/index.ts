import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

// Get User Broker Config
app.get('/api/config', async (req: Request, res: Response) => {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { username: 'Admin_Master', role: 'ADMIN' } });
    }
    
    res.json({
      brokerName: user.brokerName || 'AngelOne',
      apiKey: user.apiKey || '',
      apiSecret: user.apiSecret || '',
      clientCode: user.clientCode || '',
      isConnected: !!user.apiKey // simplified check
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Save User Broker Config
app.post('/api/config', async (req: Request, res: Response) => {
  try {
    const { brokerName, apiKey, apiSecret, clientCode, isConnected } = req.body;
    
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { username: 'Admin_Master', role: 'ADMIN' } });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
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

app.listen(port, () => {
  console.log(`[Server] Execution Engine started at http://localhost:${port}`);
});
