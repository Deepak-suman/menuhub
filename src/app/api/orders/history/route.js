import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { logger, withTiming } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req) {
  return withTiming("/api/orders/history", "GET", async () => {
    try {
      const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
      if (!auth) {
        logger.warn("Security: Unauthorized access attempt to order history API");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { role, restaurantId } = auth;
      let orders;

      if (role === "SUPER_ADMIN") {
        // Super Admin can retrieve global history, or optionally isolate by restaurant ID in search params
        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("restaurantId");
        if (targetId) {
          orders = await prisma.order.findMany({
            where: { status: "CLOSED", restaurantId: targetId },
            orderBy: { createdAt: "desc" },
            include: {
              rating: true,
              items: { include: { menuItem: true } }
            }
          });
        } else {
          orders = await prisma.order.findMany({
            where: { status: "CLOSED" },
            orderBy: { createdAt: "desc" },
            include: {
              rating: true,
              items: { include: { menuItem: true } }
            }
          });
        }
      } else {
        // Vendor is strictly isolated to their own restaurant
        if (!restaurantId) {
          logger.warn({ userId: auth.id }, "Vendor user missing restaurant ID context");
          return NextResponse.json({ error: "Restaurant context missing" }, { status: 403 });
        }

        orders = await prisma.order.findMany({
          where: { status: "CLOSED", restaurantId },
          orderBy: { createdAt: "desc" },
          include: {
            rating: true,
            items: { include: { menuItem: true } }
          }
        });
      }

      return NextResponse.json(orders, { status: 200 });
    } catch (error) {
      logger.error({ error: error.message || error, stack: error.stack }, "Fetch order history API error");
      return NextResponse.json({ error: "Failed to fetch order history" }, { status: 500 });
    }
  });
}
