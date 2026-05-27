import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { verifyOrder } from "@/lib/orderAuth";
import { orderEvents } from "@/lib/orderEvents";

export async function DELETE(req, { params }) {
  try {
    const { id, itemId } = await params;
    const pOrderId = id;
    const pItemId = itemId;

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, pOrderId);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the order and item
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: pItemId },
      include: { menuItem: true, order: true }
    });

    if (!orderItem || orderItem.orderId !== pOrderId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && orderItem.order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if within 30 seconds
    const timeDiff = Date.now() - new Date(orderItem.addedAt).getTime();
    if (timeDiff > 30000) {
      return NextResponse.json({ error: "Time window expired" }, { status: 400 });
    }

    // Recalculate price
    const itemPrice = orderItem.size === 'Half' && orderItem.menuItem.halfPrice 
      ? orderItem.menuItem.halfPrice 
      : orderItem.menuItem.price;
    const reductionAmount = itemPrice * orderItem.quantity;

    // Delete item and update total amount transactionally
    await prisma.$transaction([
      prisma.orderItem.delete({ where: { id: pItemId } }),
      prisma.order.update({
        where: { id: pOrderId },
        data: { totalAmount: { decrement: reductionAmount } }
      })
    ]);

    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: pOrderId },
        include: {
          items: { include: { menuItem: true } }
        }
      });
      orderEvents.emit(`restaurant-orders-${orderItem.order.restaurantId}`, { type: "update", orderId: pOrderId });
      orderEvents.emit(`update-${pOrderId}`, fullOrder);
    } catch (e) {
      console.error("Failed to emit order events on delete:", e);
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete Item Error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id, itemId } = await params;
    const pOrderId = id;
    const pItemId = itemId;
    const { quantity, status } = await req.json();

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, pOrderId);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: pItemId },
      include: { menuItem: true, order: true }
    });

    if (!orderItem || orderItem.orderId !== pOrderId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && orderItem.order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // CASE 1: Chef updating dish completion status
    if (status !== undefined) {
      const updatedItem = await prisma.orderItem.update({
        where: { id: pItemId },
        data: { status }
      });

      // Emit events for KDS and Customer real-time screens
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: pOrderId },
          include: {
            items: { include: { menuItem: true } }
          }
        });
        orderEvents.emit(`restaurant-orders-${orderItem.order.restaurantId}`, { type: "update", orderId: pOrderId });
        orderEvents.emit(`update-${pOrderId}`, fullOrder);
      } catch (e) {
        console.error("Failed to emit order events on item status update:", e);
      }

      return NextResponse.json({ message: "Item status updated successfully", item: updatedItem }, { status: 200 });
    }

    // CASE 2: Customer updating quantity (time-window checked)
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const timeDiff = Date.now() - new Date(orderItem.addedAt).getTime();
    if (timeDiff > 30000) {
      return NextResponse.json({ error: "Time window expired" }, { status: 400 });
    }

    const itemPrice = orderItem.size === 'Half' && orderItem.menuItem.halfPrice 
      ? orderItem.menuItem.halfPrice 
      : orderItem.menuItem.price;

    const oldTotal = itemPrice * orderItem.quantity;
    const newTotal = itemPrice * quantity;
    const amountDifference = newTotal - oldTotal;

    await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: pItemId },
        data: { quantity }
      }),
      prisma.order.update({
        where: { id: pOrderId },
        data: { totalAmount: { increment: amountDifference } }
      })
    ]);

    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: pOrderId },
        include: {
          items: { include: { menuItem: true } }
        }
      });
      orderEvents.emit(`restaurant-orders-${orderItem.order.restaurantId}`, { type: "update", orderId: pOrderId });
      orderEvents.emit(`update-${pOrderId}`, fullOrder);
    } catch (e) {
      console.error("Failed to emit order events on update:", e);
    }

    return NextResponse.json({ message: "Item updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Update Item Error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
