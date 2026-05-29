const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, slug: true }
  });
  console.log(JSON.stringify(restaurants, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
