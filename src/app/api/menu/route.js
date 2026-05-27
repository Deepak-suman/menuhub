import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadFile";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

// Helper function to fetch menu with Next.js Cache
const getCachedMenu = unstable_cache(
  async (restaurantId) => {
    return await prisma.menuItem.findMany({
      where: { restaurantId, isDeleted: false },
      orderBy: { category: "asc" }
    });
  },
  ['menu-items-cache'], 
  { tags: ['menu'] } // tag array can be overridden but we will use dynamic tags inside the GET
);

export async function GET(req) {
  try {
    const restaurantId = await getTenantId(req);
    if (!restaurantId) {
      return NextResponse.json({ error: "Tenant not identified" }, { status: 400 });
    }

    // Wrap the cache call to pass dynamic tags based on tenant
    const fetchMenuForTenant = unstable_cache(
      async () => {
        return await prisma.menuItem.findMany({
          where: { restaurantId, isDeleted: false },
          orderBy: { category: "asc" }
        });
      },
      [`menu-${restaurantId}`],
      { tags: [`menu-${restaurantId}`], revalidate: 3600 } // Cache for 1 hour, or until invalidated
    );

    const items = await fetchMenuForTenant();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("GET Menu Error:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin/Vendor only." }, { status: 401 });
    }

    const { restaurantId } = auth;
    if (!restaurantId && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Restaurant context missing from user session." }, { status: 403 });
    }

    const formData = await req.formData();
    let finalRestaurantId = restaurantId;

    if (auth.role === "SUPER_ADMIN" && !finalRestaurantId) {
      finalRestaurantId = formData.get("restaurantId");
    }

    if (!finalRestaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    const name = formData.get("name");
    const price = formData.get("price");
    const category = formData.get("category");
    const isAvailable = formData.get("isAvailable") === "true";
    const halfPriceRaw = formData.get("halfPrice");
    const imageFile = formData.get("image");

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let imageUrl = null;
    let uploadContext = finalRestaurantId; // fallback to ID if slug not found

    // Fetch restaurant slug to use as folder name
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: finalRestaurantId },
      select: { slug: true }
    });
    if (restaurant?.slug) {
      uploadContext = restaurant.slug;
    }

    if (imageFile && typeof imageFile === "object") {
        imageUrl = await saveUploadedFile(imageFile, uploadContext);
    } else if (imageFile && typeof imageFile === 'string' && imageFile.startsWith('http')) {
        imageUrl = imageFile;
    }

    const halfPrice = halfPriceRaw && !isNaN(parseFloat(halfPriceRaw))
      ? parseFloat(halfPriceRaw)
      : null;

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        price: parseFloat(price),
        halfPrice,
        image: imageUrl,
        category,
        isAvailable,
        restaurantId: finalRestaurantId, 
      }
    });
    
    // Invalidate the cache for this restaurant so the new item shows immediately
    revalidateTag(`menu-${finalRestaurantId}`);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("POST Menu Error:", error);
    return NextResponse.json({ error: "Failed to add menu item" }, { status: 500 });
  }
}
