import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getTenantId(req) {
  // 1. Check for logged-in admin session
  const session = await getServerSession(authOptions);
  if (session?.user?.restaurantId) {
    return session.user.restaurantId;
  }

  if (session?.user?.role === "SUPER_ADMIN") {
    // Super admins need to provide restaurantId manually 

  }

  // 2. Check URL for slug or explicit restaurantId (for public/customer facing calls)
  if (req) {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    if (restaurantId) return restaurantId;

    const slug = searchParams.get("slug");
    if (slug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug }
      });
      if (restaurant) return restaurant.id;
    }
  }

  return null;
}
