import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setToken() {
  const token = process.argv[2];
  if (!token) {
    console.error('Please provide an access_token as an argument.');
    console.log('Usage: node scripts/set_kite_token.mjs <TOKEN>');
    process.exit(1);
  }

  try {
    const config = await prisma.marketDataConfig.update({
      where: { id: 'GLOBAL' },
      data: {
        accessToken: token,
        accessTokenUpdatedAt: new Date(),
        isEnabled: true
      }
    });

    console.log('Successfully updated Kite Access Token!');
    console.log('Broker:', config.brokerName);
    console.log('App Key:', config.appKey);
    console.log('Updated At:', config.accessTokenUpdatedAt);
  } catch (error) {
    console.error('Failed to update config:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setToken();
