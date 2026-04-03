import { PrismaClient } from '@prisma/client';
import { MarketStreamer } from '../services/MarketStreamer';
import { UserEngine } from './UserEngine';
import { KiteService } from '../services/KiteService';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export class EngineCoordinator {
  private engines: Map<string, UserEngine> = new Map();
  private streamer: MarketStreamer;
  private io: Server;

  constructor(streamer: MarketStreamer, io: Server) {
    this.streamer = streamer;
    this.io = io;
    this.init();
  }

  private async init() {
    console.log('[EngineCoordinator] Initializing...');
    
    // Subscribe to live ticks
    this.streamer.on('tick', ({ price, candles }) => {
      this.engines.forEach(engine => {
        engine.processTick(candles, price).catch(err => {
          console.error(`[EngineCoordinator] Error in UserEngine ${engine.username}:`, err);
        });
      });
    });

    // Boot active automations from DB
    const activeUsers = await prisma.user.findMany({
      where: { automationEnabled: true }
    });

    console.log(`[EngineCoordinator] Restoring ${activeUsers.length} active sessions...`);
    for (const user of activeUsers) {
      await this.startUserEngine(user.id);
    }
  }

  public async toggleAutomation(userId: string, enabled: boolean) {
    await prisma.user.update({
      where: { id: userId },
      data: { automationEnabled: enabled }
    });

    if (enabled) {
      await this.startUserEngine(userId);
    } else {
      this.stopUserEngine(userId);
    }
    
    this.io.to(userId).emit('automation_change', { enabled });
  }

  private async startUserEngine(userId: string) {
    if (this.engines.has(userId)) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let kite: KiteService | undefined;
    if (user.apiKey && user.apiSecret && user.accessToken) {
       kite = new KiteService({
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        accessToken: user.accessToken,
        instrumentToken: 260105 // Default to BankNifty
      });
    }

    const engine = new UserEngine(user.id, user.username, user.isPaperTrading, kite);
    this.engines.set(userId, engine);
    console.log(`[EngineCoordinator] Started engine for ${user.username}`);
  }

  private stopUserEngine(userId: string) {
    const engine = this.engines.get(userId);
    if (engine) {
      this.engines.delete(userId);
      console.log(`[EngineCoordinator] Stopped engine for user ${userId}`);
    }
  }

  public isUserActive(userId: string): boolean {
    return this.engines.has(userId);
  }
}
