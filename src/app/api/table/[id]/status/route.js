import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/getTenant";
import { getCachedRestaurantSettings } from "@/lib/data";

export async function GET(req, { params }) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) return NextResponse.json({ error: "Missing restaurant context" }, { status: 400 });

    const { id } = await params;
    const tableNumber = parseInt(id);
    if (isNaN(tableNumber) || tableNumber < 0) {
      return NextResponse.json({ error: "Invalid table number" }, { status: 400 });
    }

    const restaurant = await getCachedRestaurantSettings(restaurantId);

    const activeOrder = await prisma.order.findFirst({
      where: { 
        restaurantId,
        tableNumber: tableNumber, 
        status: { in: ["ACTIVE", "PREPARING", "COMPLETED"] }
      }
    });

    const baseResponse = {
      restaurantName: restaurant?.name || "Restaurant",
      restaurantLogo: restaurant?.logo || null
    };

    if (activeOrder) {
      if (activeOrder.isPaid || activeOrder.isBillRequested) {
        return NextResponse.json({
          ...baseResponse,
          hasActiveOrder: true,
          isBlocked: true,
          orderId: activeOrder.id,
          customerName: activeOrder.customerName
        }, { status: 200 });
      }

      return NextResponse.json({ 
        ...baseResponse,
        hasActiveOrder: true, 
        orderId: activeOrder.id,
        customerName: activeOrder.customerName
      }, { status: 200 });
    }

    return NextResponse.json({ ...baseResponse, hasActiveOrder: false }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch table status" }, { status: 500 });
  }
}
