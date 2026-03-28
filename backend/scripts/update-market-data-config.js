const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [appKey, appSecret, clientCode, token = 'NSE|26009', isEnabled = 'true'] = process.argv.slice(2);
  if (!appKey || !appSecret || !clientCode) {
    console.error('Usage: node scripts/update-market-data-config.js <APP_KEY> <APP_SECRET> <CLIENT_CODE> [BANKNIFTY_TOKEN] [isEnabled]');
    process.exit(1);
  }

  const config = await prisma.marketDataConfig.upsert({
    where: { id: 'GLOBAL' },
    create: {
      id: 'GLOBAL',
      brokerName: 'AliceBlue',
      appKey,
      appSecret,
      clientCode,
      bankNiftySpotToken: token,
      isEnabled: isEnabled === 'true'
    },
    update: {
      brokerName: 'AliceBlue',
      appKey,
      appSecret,
      clientCode,
      bankNiftySpotToken: token,
      isEnabled: isEnabled === 'true'
    }
  });

  console.log('Updated:', {
    id: config.id,
    brokerName: config.brokerName,
    clientCode: config.clientCode,
    bankNiftySpotToken: config.bankNiftySpotToken,
    isEnabled: config.isEnabled
  });
}

main().finally(async () => prisma.$disconnect());
