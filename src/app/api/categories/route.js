import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadFile";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";
import { revalidateTag } from "next/cache";
import { getCachedCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) return NextResponse.json({ error: "Tenant not found" }, { status: 400 });

    const categories = await getCachedCategories(restaurantId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin/Vendor only." }, { status: 401 });
    }

    const { restaurantId } = auth;
    
    const formData = await req.formData();
    let finalRestaurantId = restaurantId;

    if (auth.role === "SUPER_ADMIN" && !finalRestaurantId) {
      finalRestaurantId = formData.get("restaurantId");
    }

    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    const name = formData.get("name");
    const imageText = formData.get("imageText");

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    let iconPath = imageText || null;
    const iconFile = formData.get("image");

    if (iconFile && typeof iconFile === "object") {
        let uploadContext = finalRestaurantId;
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: finalRestaurantId },
          select: { slug: true }
        });
        if (restaurant?.slug) {
          uploadContext = restaurant.slug;
        }
        iconPath = await saveUploadedFile(iconFile, uploadContext);
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: iconPath,
        restaurantId: finalRestaurantId
      }
    });

    revalidateTag('categories');

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category name already exists in this restaurant" }, { status: 400 });
    }
    console.error("POST category error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
