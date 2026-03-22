const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const username = 'admin';
  const password = 'adminpassword123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.upsert({
    where: { username },
    update: { role: 'ADMIN', passwordHash },
    create: {
      username,
      passwordHash,
      role: 'ADMIN'
    }
  });

  console.log('Admin user created/updated:', admin.username);
  console.log('Login with:');
  console.log('Username:', username);
  console.log('Password:', password);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
