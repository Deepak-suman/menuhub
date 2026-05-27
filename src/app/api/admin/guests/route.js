import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";

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

    const guests = await prisma.customerProfile.findMany({
      where: {
        restaurantId: finalRestaurantId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(guests, { status: 200 });
  } catch (error) {
    console.error("GET VIP Guests Error:", error);
    return NextResponse.json({ error: "Failed to fetch VIP guests directory" }, { status: 500 });
  }
}
