const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.menuItem.createMany({
    data: [
      { name: "Paneer Tikka", price: 250, category: "Starters", isAvailable: true },
      { name: "Chicken Tikka", price: 300, category: "Starters", isAvailable: true },
      { name: "Butter Chicken", price: 350, category: "Main Course", isAvailable: true },
      { name: "Dal Makhani", price: 220, category: "Main Course", isAvailable: true },
      { name: "Garlic Naan", price: 60, category: "Main Course", isAvailable: true },
      { name: "Cold Coffee", price: 120, category: "Drinks", isAvailable: true },
      { name: "Fresh Lime Soda", price: 90, category: "Drinks", isAvailable: true },
      { name: "Gulab Jamun", price: 100, category: "Desserts", isAvailable: true },
    ]
  });
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
