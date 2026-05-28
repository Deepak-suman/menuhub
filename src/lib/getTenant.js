import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getCachedTenantIdBySlug } from "@/lib/data";

export async function getTenantId(req) {
  // 1. Check for logged-in admin session
  const session = await getServerSession(authOptions);
  if (session?.user?.restaurantId) {
    return session.user.restaurantId;
  }

  // 2. Check URL for slug or explicit restaurantId (for public/customer facing calls)
  if (req) {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    if (restaurantId) return restaurantId;

    const slug = searchParams.get("slug");
    if (slug) {
      return await getCachedTenantIdBySlug(slug);
    }
  }

  return null;
}
