import { NextResponse } from "next/server";
import { generateQRForTable } from "@/lib/qrGenerator";
import { getTenantId } from "@/lib/getTenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const { tableNumber } = await req.json();

    if (!tableNumber) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const qrDataUrl = await generateQRForTable(tableNumber, baseUrl, restaurant.slug);

    return NextResponse.json({ tableNumber, qrDataUrl }, { status: 200 });
  } catch (error) {
    console.error("QR POST Route Error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
