import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const { name, phone, birthday, anniversary, restaurantId } = await req.json();

    if (!phone || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields (phone and restaurant ID are required)" }, { status: 400 });
    }

    // 1. Anti-spam Rate Limiting (Max 5 attempts per 5 minutes per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    const allowed = await rateLimit(`vip-register-${restaurantId}-${ip}`, 5, 300000);
    if (!allowed) {
      return NextResponse.json(
        { error: "You are registering too frequently. Please wait a few minutes." },
        { status: 429 }
      );
    }

    // Validate phone number format (standard 10-digit check or basic length check)
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid contact number." }, { status: 400 });
    }

    // 2. Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true }
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Convert string dates to safe JS Date objects
    let parsedBirthday = null;
    if (birthday) {
      const bDate = new Date(birthday);
      if (!isNaN(bDate.getTime())) parsedBirthday = bDate;
    }

    let parsedAnniversary = null;
    if (anniversary) {
      const aDate = new Date(anniversary);
      if (!isNaN(aDate.getTime())) parsedAnniversary = aDate;
    }

    // 3. Upsert VIP customer profile
    const profile = await prisma.customerProfile.upsert({
      where: {
        phone_restaurantId: {
          phone: cleanPhone,
          restaurantId: restaurantId
        }
      },
      update: {
        name: name || undefined,
        birthday: parsedBirthday,
        anniversary: parsedAnniversary
      },
      create: {
        name,
        phone: cleanPhone,
        birthday: parsedBirthday,
        anniversary: parsedAnniversary,
        restaurantId
      }
    });

    return NextResponse.json({ success: true, message: "Welcome to our VIP Loyalty Club! 🎉", profile }, { status: 200 });
  } catch (error) {
    console.error("VIP Register POST Error:", error);
    return NextResponse.json({ error: "Failed to join VIP Loyalty Club." }, { status: 500 });
  }
}
