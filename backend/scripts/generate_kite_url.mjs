import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const config = await prisma.marketDataConfig.findUnique({ where: { id: 'GLOBAL' } });
    
    if (!config || !config.appKey) {
      console.error('❌ Error: Kite API Key not found in database. Please set it in the Admin Panel or update the database directly.');
      process.exit(1);
    }

    const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${config.appKey}`;

    console.log('\n' + '═'.repeat(50));
    console.log('      KITE CONSOLE ACTIVATION');
    console.log('═'.repeat(50));
    console.log('\n1. Open this URL in your browser:');
    console.log(`\x1b[36m${loginUrl}\x1b[0m`);
    console.log('\n2. Log in with your Zerodha credentials.');
    console.log('3. After login, you will be redirected to a page that may not load.');
    console.log('4. Copy the "request_token" from the address bar.');
    console.log('5. Run the exchange script:');
    console.log('\x1b[33mnode scripts/exchange_kite_token.mjs YOUR_REQUEST_TOKEN\x1b[0m');
    console.log('\n' + '═'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
