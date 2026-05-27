import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const closedOrders = await prisma.order.findMany({
      where: { status: "CLOSED" },
      orderBy: { createdAt: "desc" },
      include: {
        rating: true,
        items: {
          include: {
            menuItem: true, 
          },
        },
      },
    });

    return NextResponse.json(closedOrders, { status: 200 });
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ error: "Failed to fetch order history" }, { status: 500 });
  }
}
