import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { orderEvents } from "@/lib/orderEvents";
import { verifyOrder } from "@/lib/orderAuth";

// Order ka status update karne ke liye (PATCH request)
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    // Check if order exists and belongs to this restaurant
    const order = await prisma.order.findUnique({
      where: { id: id }
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, id);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, isBillRequested, isBillApproved, paymentMode, isPaid } = await req.json();

    // Client/Customer holding a valid token can ONLY modify safe properties: isBillApproved and paymentMode
    if (isClientAuthorized && !auth) {
      if (status !== undefined || isBillRequested !== undefined || isPaid !== undefined) {
        return NextResponse.json({ error: "Forbidden: Customer cannot modify restricted properties" }, { status: 403 });
      }
    }

    const dataToUpdate = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (isBillRequested !== undefined) dataToUpdate.isBillRequested = isBillRequested;
    if (isBillApproved !== undefined) dataToUpdate.isBillApproved = isBillApproved;
    if (paymentMode !== undefined) dataToUpdate.paymentMode = paymentMode;
    if (isPaid !== undefined) dataToUpdate.isPaid = isPaid;

    let updatedOrder;
    if (status === "COMPLETED") {
      // Cascading update: complete the order AND all individual order items in a transaction
      const [orderRes] = await prisma.$transaction([
        prisma.order.update({
          where: { id: id },
          data: dataToUpdate
        }),
        prisma.orderItem.updateMany({
          where: { orderId: id },
          data: { status: "COMPLETED" }
        })
      ]);
      updatedOrder = orderRes;
    } else {
      updatedOrder = await prisma.order.update({
        where: { id: id },
        data: dataToUpdate
      });
    }

    // Fetch the full updated order including items and menuItem to stream complete status sync to customer
    const fullUpdatedOrder = await prisma.order.findUnique({
      where: { id: id },
      include: {
        items: { include: { menuItem: true } }
      }
    });

    // Emit event for real-time customer tracking SSE stream
    orderEvents.emit(`update-${id}`, fullUpdatedOrder);

    // Emit restaurant event for KDS to fetch fresh orders
    try {
      orderEvents.emit(`restaurant-orders-${updatedOrder.restaurantId}`, { type: "update", orderId: id });
    } catch (e) {
      console.error("Failed to emit KDS orderEvent:", e);
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

// Single order ki detail laane ke liye (Customer tracking ke liye)
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const parsedId = id;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: parsedId },
      include: { 
        items: { include: { menuItem: true } },
        restaurant: { select: { name: true, logo: true } }
      }
    });
    
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, id);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}