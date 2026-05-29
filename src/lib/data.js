import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache for Menu Items
export const getCachedMenu = (restaurantId) => unstable_cache(
  async () => {
    console.log("CACHE MISS: menu");
    return await prisma.menuItem.findMany({
      where: { restaurantId, isDeleted: false },
      orderBy: { category: "asc" }
    });
  },
  ['menu-items-cache', restaurantId],
  { tags: [`menu-${restaurantId}`], revalidate: 86400 }
)();

// Cache for Categories
export const getCachedCategories = (restaurantId) => unstable_cache(
  async () => {
    console.log("CACHE MISS: categories");
    return await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "asc" }
    });
  },
  ['categories-cache', restaurantId],
  { tags: [`categories-${restaurantId}`] }
)();

// Cache for Restaurant Settings/Metadata
export const getCachedRestaurantSettings = (restaurantId) => unstable_cache(
  async () => {
    console.log("CACHE MISS: settings");
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
  ['restaurant-settings-cache', restaurantId],
  { tags: [`settings-${restaurantId}`] }
)();

// Slug to ID resolution (from getTenant)
export const getCachedTenantIdBySlug = (slug) => unstable_cache(
  async () => {
    console.log("CACHE MISS: tenant");
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug }
    });
    return restaurant ? restaurant.id : null;
  },
  ['tenant-by-slug', slug],
  { tags: [`tenant-slug-${slug}`], revalidate: 86400 }
)();

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
