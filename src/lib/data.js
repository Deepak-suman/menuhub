import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache for Menu Items
export const getCachedMenu = unstable_cache(
  async (restaurantId) => {
    return await prisma.menuItem.findMany({
      where: { restaurantId, isDeleted: false },
      orderBy: { category: "asc" }
    });
  },
  ['menu-items-cache'],
  { tags: ['menu'], revalidate: 3600 }
);

// Cache for Categories
export const getCachedCategories = unstable_cache(
  async (restaurantId) => {
    return await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "asc" }
    });
  },
  ['categories-cache'],
  { tags: ['categories'], revalidate: 3600 }
);

// Cache for Restaurant Settings/Metadata
export const getCachedRestaurantSettings = unstable_cache(
  async (restaurantId) => {
    return await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
      },
    });
  },
  ['restaurant-settings-cache'],
  { tags: ['settings'], revalidate: 86400 }
);

// Slug to ID resolution (from getTenant)
export const getCachedTenantIdBySlug = unstable_cache(
  async (slug) => {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug }
    });
    return restaurant ? restaurant.id : null;
  },
  ['tenant-by-slug'],
  { tags: ['tenants'], revalidate: 86400 }
);

// Get Table Status (Dynamic check for blocking/active orders)
export async function getTableStatus(restaurantId, tableNumber) {
  if (!restaurantId || !tableNumber) return null;

  const activeOrder = await prisma.order.findFirst({
    where: { 
      restaurantId,
      tableNumber: parseInt(tableNumber), 
      status: { in: ["ACTIVE", "PREPARING", "COMPLETED"] }
    }
  });

  if (activeOrder) {
    const isBlocked = activeOrder.isPaid || activeOrder.isBillRequested;
    return {
      hasActiveOrder: true,
      isBlocked,
      orderId: activeOrder.id,
      customerName: activeOrder.customerName
    };
  }

  return { hasActiveOrder: false, isBlocked: false };
}
