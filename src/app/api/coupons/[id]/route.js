import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";

export async function DELETE(req, { params }) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    if (auth.role !== "SUPER_ADMIN" && coupon.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    if (auth.role !== "SUPER_ADMIN" && coupon.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: body.isActive }
    });

    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
