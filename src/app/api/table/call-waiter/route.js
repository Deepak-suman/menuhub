import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { orderEvents } from "@/lib/orderEvents";

export async function POST(req) {
  try {
    const { tableNumber, type, restaurantId } = await req.json();

    if (!tableNumber || !type || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Anti-spam Rate Limiting per table/IP (Max 3 calls per 3 minutes)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    const allowed = await rateLimit(`waiter-call-${restaurantId}-${tableNumber}-${ip}`, 3, 180000);
    if (!allowed) {
      return NextResponse.json(
        { error: "You are calling the waiter too frequently. Please wait a moment." },
        { status: 429 }
      );
    }

    // 2. Verify restaurant exists and is active
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, isActive: true, isDeleted: false },
      select: { id: true }
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found or inactive." }, { status: 404 });
    }

    // 3. Create Waiter Request in DB
    const waiterRequest = await prisma.waiterRequest.create({
      data: {
        tableNumber: parseInt(tableNumber),
        type,
        status: "PENDING",
        restaurantId
      }
    });

    // 4. Emit event for real-time admin propagation
    try {
      orderEvents.emit(`waiter-call-${restaurantId}`, waiterRequest);
    } catch (err) {
      console.error("Failed to emit waiter-call event:", err);
    }

    return NextResponse.json({ success: true, message: "Waiter called successfully!" }, { status: 201 });
  } catch (error) {
    console.error("Call Waiter POST Error:", error);
    return NextResponse.json({ error: "Failed to place call request" }, { status: 500 });
  }
}
