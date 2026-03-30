import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const requestToken = process.argv[2];
  if (!requestToken) {
    console.error('❌ Error: Please provide the "request_token" as an argument.');
    console.log('Usage: node scripts/exchange_kite_token.mjs YOUR_REQUEST_TOKEN');
    process.exit(1);
  }

  try {
    const config = await prisma.marketDataConfig.findUnique({ where: { id: 'GLOBAL' } });
    
    if (!config || !config.appKey || !config.appSecret) {
      console.error('❌ Error: Kite API Key or Secret not found in database.');
      process.exit(1);
    }

    console.log(`📡 Exchanging request_token for access_token...`);

    const checksum = crypto
      .createHash('sha256')
      .update(`${config.appKey}${requestToken}${config.appSecret}`)
      .digest('hex');

    const body = new URLSearchParams({
      api_key: config.appKey,
      request_token: requestToken,
      checksum
    });

    const response = await axios.post('https://api.kite.trade/session/token', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3'
      }
    });

    const session = response.data?.data;
    if (!session?.access_token) {
      throw new Error(response.data?.message || 'Token exchange failed.');
    }

    await prisma.marketDataConfig.update({
      where: { id: 'GLOBAL' },
      data: {
        accessToken: session.access_token,
        accessTokenUpdatedAt: new Date(),
        isEnabled: true
      }
    });

    console.log('\x1b[32m✅ Successfully activated Kite Token via console!\x1b[0m');
    console.log(`User ID: ${session.user_id}`);
    console.log('You can now refresh the website to see live data.');

  } catch (error) {
    if (error.response?.data) {
      console.error('❌ Kite API error:', error.response.data.message);
    } else {
      console.error('❌ Failure:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
