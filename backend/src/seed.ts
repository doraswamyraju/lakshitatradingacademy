import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. Create GLOBAL MarketDataConfig if missing
  const globalConfig = await prisma.marketDataConfig.findUnique({
    where: { id: 'GLOBAL' }
  });

  if (!globalConfig) {
    console.log('Creating global MarketDataConfig...');
    await prisma.marketDataConfig.create({
      data: {
        id: 'GLOBAL',
        brokerName: 'Kite',
        appKey: 'your_api_key',
        appSecret: 'your_api_secret',
        isEnabled: false
      }
    });
  }

  // 2. Ensure admin user exists and has ADMIN role
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (existingAdmin) {
    console.log(`User ${adminUsername} exists. Updating role to ADMIN...`);
    await prisma.user.update({
      where: { username: adminUsername },
      data: { role: 'ADMIN' }
    });
  } else {
    console.log(`Creating new ${adminUsername} user with ADMIN role...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('Default admin created: admin / admin123');
  }

  console.log('✅ Seed Finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
