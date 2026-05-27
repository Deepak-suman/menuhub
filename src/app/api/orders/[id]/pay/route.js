import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const orderId = id;

    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin or Vendor access required." }, { status: 401 });
    }

    // Fetch order first to verify VENDOR context
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark order as paid
    await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true }
    });

    return NextResponse.json({ success: true, message: "Payment recorded successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
