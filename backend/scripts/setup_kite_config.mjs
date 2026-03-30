import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apiKey = process.argv[2];
  const apiSecret = process.argv[3];

  if (!apiKey || !apiSecret) {
    console.error('❌ Error: Missing arguments.');
    console.log('Usage: node scripts/setup_kite_config.mjs YOUR_API_KEY YOUR_API_SECRET');
    process.exit(1);
  }

  try {
    const config = await prisma.marketDataConfig.upsert({
      where: { id: 'GLOBAL' },
      update: {
        appKey: apiKey,
        appSecret: apiSecret,
        brokerName: 'Kite',
        isEnabled: true
      },
      create: {
        id: 'GLOBAL',
        appKey: apiKey,
        appSecret: apiSecret,
        brokerName: 'Kite',
        isEnabled: true
      }
    });

    console.log('\n\x1b[32m✅ Kite Configuration Initialized!\x1b[0m');
    console.log(`API Key: ${config.appKey}`);
    console.log('API Secret: ********');
    console.log('\nYou can now run: \x1b[33mnode scripts/generate_kite_url.mjs\x1b[0m\n');

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
