import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.marketDataConfig.findUnique({ where: { id: 'GLOBAL' } });
  console.log(JSON.stringify(config, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
