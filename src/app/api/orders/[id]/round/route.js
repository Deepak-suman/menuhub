import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";

// Order ke kisi specific round ko complete mark karne ke liye (VENDOR/SUPER_ADMIN only)
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const orderId = id;

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roundNumber } = await req.json();

    if (!roundNumber || !orderId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Fetch order to verify vendor access
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If VENDOR, check if restaurant matches
    if (auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update all items in this order that belong to this round
    await prisma.orderItem.updateMany({
      where: { 
        orderId: orderId,
        roundNumber: parseInt(roundNumber)
      },
      data: { status: "COMPLETED" }
    });

    // Check if ALL items in this order are now COMPLETED
    const remainingPendingItems = await prisma.orderItem.count({
      where: {
        orderId: orderId,
        status: "PENDING"
      }
    });

    if (remainingPendingItems === 0) {
      // Mark the entire order as COMPLETED
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED" }
      });
    }

    return NextResponse.json({ success: true, allCompleted: remainingPendingItems === 0 }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update round status" }, { status: 500 });
  }
}
