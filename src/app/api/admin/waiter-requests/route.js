import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { orderEvents } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = auth;
    let finalRestaurantId = restaurantId;

    if (auth.role === "SUPER_ADMIN" && !finalRestaurantId) {
      const { searchParams } = new URL(req.url);
      finalRestaurantId = searchParams.get("restaurantId");
    }

    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant context missing." }, { status: 400 });
    }

    const requests = await prisma.waiterRequest.findMany({
      where: {
        restaurantId: finalRestaurantId,
        status: "PENDING"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("GET Waiter Requests Error:", error);
    return NextResponse.json({ error: "Failed to fetch waiter requests" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const waiterRequest = await prisma.waiterRequest.findUnique({
      where: { id }
    });

    if (!waiterRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Verify vendor context
    if (auth.role !== "SUPER_ADMIN" && waiterRequest.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.waiterRequest.update({
      where: { id },
      data: { status }
    });

    // Notify KDS / stream of updates
    try {
      orderEvents.emit(`waiter-call-${waiterRequest.restaurantId}`, { type: "resolve", id });
    } catch (e) {
      console.error("Failed to emit waiter resolve event:", e);
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH Waiter Request Error:", error);
    return NextResponse.json({ error: "Failed to update waiter request" }, { status: 500 });
  }
}
