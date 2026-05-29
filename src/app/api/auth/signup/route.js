import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(req) {
  try {
    // 1. Session Protection: Enforce Super Admin only
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Super Admin access only." }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!await rateLimit(ip, 3, 60000)) { // Max 3 signups per minute per IP
      return NextResponse.json({ error: "Too many signup requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, password, restaurantName } = body;

    if (!name || !email || !password || !restaurantName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // Generate unique slug for restaurant
    let baseSlug = generateSlug(restaurantName);
    let slug = baseSlug;
    let counter = 1;

    // Check slug uniqueness
    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant (Restaurant) and User together
    // Using transaction to ensure either both are created or none
    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          slug,
          ownerId: "temp", // Will update after user creation
        }
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "VENDOR",
          restaurantId: restaurant.id
        }
      });

      // Update the restaurant's ownerId to point to this new user safely
      await tx.restaurant.update({
        where: { id: restaurant.id },
        data: { ownerId: user.id }
      });

      // Create a default category for the newly registered user
      await tx.category.create({
         data: {
             name: "Main Course",
             restaurantId: restaurant.id
         }
      })

      return { user, restaurant };
    });

    return NextResponse.json({
      message: "Signup successful",
      restaurantId: result.restaurant.id,
      slug: result.restaurant.slug
    }, { status: 201 });

  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
