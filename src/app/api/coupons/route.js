import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";

export async function GET(req) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const coupons = await prisma.coupon.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin/Vendor only." }, { status: 401 });
    }

    const { restaurantId } = auth;
    
    const body = await req.json();
    let finalRestaurantId = restaurantId;

    if (auth.role === "SUPER_ADMIN" && !finalRestaurantId) {
      finalRestaurantId = body.restaurantId;
    }

    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    const { code, discountType, discountValue, minOrderValue, maxDiscount } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        restaurantId: finalRestaurantId
      }
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
