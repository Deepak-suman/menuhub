import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/getTenant";

export async function POST(req) {
  try {
    const restaurantId = await getTenantId(req);
    const { code, cartTotal: rawCartTotal } = await req.json();

    if (!restaurantId || !code) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const cartTotal = parseFloat(rawCartTotal);
    if (isNaN(cartTotal) || cartTotal < 0) {
      return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        restaurantId,
        isActive: true,
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
    }

    if (cartTotal < coupon.minOrderValue) {
      return NextResponse.json({ 
        error: `Cart total must be at least ₹${coupon.minOrderValue} to use this coupon` 
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Don't discount more than cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return NextResponse.json({
      message: "Coupon applied successfully",
      coupon,
      discountAmount
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Failed to verify coupon" }, { status: 500 });
  }
}
