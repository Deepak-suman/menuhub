import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { verifyOrder } from "@/lib/orderAuth";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const orderId = id;

    // Extract token
    let token = req.headers.get("authorization");
    if (!token) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("token");
    }

    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    const isClientAuthorized = token && verifyOrder(token, orderId);

    if (!auth && !isClientAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the order exists
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If VENDOR, check if restaurant matches
    if (auth && auth.role !== "SUPER_ADMIN" && order.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate only once
    const existingRating = await prisma.orderRating.findUnique({ where: { orderId } });
    if (existingRating) {
      return NextResponse.json({ error: "Rating already submitted" }, { status: 400 });
    }

    const data = await req.json();
    const { foodTaste, service, cleanliness, chef, staff, seatingComfort } = data;

    // Save rating
    const rating = await prisma.orderRating.create({
      data: {
        orderId,
        foodTaste: parseInt(foodTaste) || 0,
        service: parseInt(service) || 0,
        cleanliness: parseInt(cleanliness) || 0,
        chef: parseInt(chef) || 0,
        staff: parseInt(staff) || 0,
        seatingComfort: parseInt(seatingComfort) || 0,
      }
    });

    return NextResponse.json({ message: "Rating submitted successfully!", rating }, { status: 201 });
  } catch (error) {
    console.error("Submit Rating Error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
