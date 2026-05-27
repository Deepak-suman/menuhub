import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { encrypt, decrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Super Admin Access only." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Build update data dynamically — only update fields that are provided
    const updateData = {};

    // Status toggle (existing)
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }

    // Plan toggle (FREE / PAID)
    if (body.plan === "FREE" || body.plan === "PAID") {
      updateData.plan = body.plan;
    }

    // Vendor Razorpay Gateway Credentials
    if (body.razorpayKeyId !== undefined) {
      updateData.razorpayKeyId = body.razorpayKeyId || null;
    }
    if (body.razorpayKeySecret !== undefined) {
      updateData.razorpayKeySecret = body.razorpayKeySecret ? encrypt(body.razorpayKeySecret) : null;
    }

    // Charges
    if (typeof body.platformFee === "number") {
      updateData.platformFee = body.platformFee;
    }
    if (typeof body.commissionPercent === "number") {
      updateData.commissionPercent = body.commissionPercent;
    }
    if (typeof body.gstPercent === "number") {
      updateData.gstPercent = body.gstPercent;
    }
    if (body.chargesNote !== undefined) {
      updateData.chargesNote = body.chargesNote || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        isActive: true,
        plan: true,
        razorpayKeyId: true,
        platformFee: true,
        commissionPercent: true,
        gstPercent: true,
        chargesNote: true,
      }
    });

    return NextResponse.json(updatedRestaurant, { status: 200 });
  } catch (error) {
    console.error("Super Admin Update Error:", error);
    return NextResponse.json({ error: "Failed to update restaurant" }, { status: 500 });
  }
}

// GET endpoint to fetch single restaurant's full settings
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
        platformFee: true,
        commissionPercent: true,
        gstPercent: true,
        chargesNote: true,
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Mask the secret for security — only show last 4 chars
    const decryptedSecret = decrypt(restaurant.razorpayKeySecret);
    const maskedSecret = decryptedSecret
      ? "••••••••" + decryptedSecret.slice(-4)
      : null;

    return NextResponse.json({
      ...restaurant,
      razorpayKeySecret: maskedSecret,
    });
  } catch (error) {
    console.error("Super Admin Restaurant Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant details" }, { status: 500 });
  }
}
