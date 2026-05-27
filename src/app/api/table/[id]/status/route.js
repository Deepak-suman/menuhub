import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/getTenant";

export async function GET(req, { params }) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) return NextResponse.json({ error: "Missing restaurant context" }, { status: 400 });

    const { id } = await params;
    const tableNumber = parseInt(id);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, logo: true }
    });

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
