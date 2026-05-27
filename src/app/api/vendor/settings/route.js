import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";

export const dynamic = "force-dynamic";

// GET: Vendor apni restaurant ki info fetch kare
export async function GET(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = auth;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant context missing" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("GET Vendor Settings Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH: Vendor apna naam aur logo update kare
export async function PATCH(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = auth;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant context missing" }, { status: 400 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.name && typeof body.name === "string" && body.name.trim().length > 0) {
      updateData.name = body.name.trim();
    }

    // logo: URL/path string (already uploaded via /api/media, vendor sends the url)
    if (body.logo !== undefined) {
      updateData.logo = body.logo || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Vendor Settings Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
