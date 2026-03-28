const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
async function main() {
  const username = 'admin';
  const password = 'adminpassword123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  await prisma.user.upsert({
    where: { username },
    update: { role: 'ADMIN', passwordHash },
    create: { username, passwordHash, role: 'ADMIN' }
  });
  console.log('Admin user "admin" created/updated with password "adminpassword123"');
}
main().catch(console.error).finally(() => prisma.$disconnect());
