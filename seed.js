const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'admin@jambo.com';
  const superAdminPassword = 'admin';

  console.log('Seeding Database...');

  // Check if super admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (existingAdmin) {
    console.log('Super Admin already exists. Skipping creation.');
  } else {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      }
    });
    console.log('✅ Super Admin created:');
    console.log(`Email: ${superAdminEmail} | Password: ${superAdminPassword}`);
  }

  console.log('Database Seeding Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
