const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const [
    appKey,
    appSecret,
    redirectUrl = 'https://lakshitatradingacademy.com/kite/callback',
    bankNiftyInstrumentToken = '260105',
    isEnabled = 'true'
  ] = process.argv.slice(2);

  if (!appKey || !appSecret) {
    console.error('Usage: node scripts/update-market-data-config.js <KITE_API_KEY> <KITE_API_SECRET> [REDIRECT_URL] [BANKNIFTY_INSTRUMENT_TOKEN] [isEnabled]');
    process.exit(1);
  }

  const config = await prisma.marketDataConfig.upsert({
    where: { id: 'GLOBAL' },
    create: {
      id: 'GLOBAL',
      brokerName: 'Kite',
      appKey,
      appSecret,
      redirectUrl,
      requestToken: null,
      accessToken: null,
      accessTokenUpdatedAt: null,
      bankNiftyInstrumentToken: Number(bankNiftyInstrumentToken),
      isEnabled: isEnabled === 'true'
    },
    update: {
      brokerName: 'Kite',
      appKey,
      appSecret,
      redirectUrl,
      bankNiftyInstrumentToken: Number(bankNiftyInstrumentToken),
      isEnabled: isEnabled === 'true'
    }
  });

  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(appKey)}`;

  console.log('Market data config updated:', {
    id: config.id,
    brokerName: config.brokerName,
    redirectUrl: config.redirectUrl,
    bankNiftyInstrumentToken: config.bankNiftyInstrumentToken,
    isEnabled: config.isEnabled
  });
  console.log('Open this URL to get request_token and complete login:');
  console.log(loginUrl);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
