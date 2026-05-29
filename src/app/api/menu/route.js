import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadFile";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";
import { revalidateTag } from "next/cache";
import { getCachedMenu } from "@/lib/data";
import { logger, withTiming } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req) {
  return withTiming("/api/menu", "GET", async () => {
    try {
      const restaurantId = await getTenantId(req);
      if (!restaurantId) {
        return NextResponse.json({ error: "Tenant not identified" }, { status: 400 });
      }

      // Call the module-level cache helper from data.js
      const items = await getCachedMenu(restaurantId);
      return NextResponse.json(items, { status: 200 });
    } catch (error) {
      logger.error({ error: error.message || error, stack: error.stack }, "GET Menu Error");
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withTiming("/api/menu", "POST", async () => {
    try {
      const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
      if (!auth) {
        logger.warn("Security: Unauthorized access attempt to POST menu item");
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
      logger.info({ menuItemId: newItem.id, name }, "Menu item created successfully");

      return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
      logger.error({ error: error.message || error, stack: error.stack }, "POST Menu Error");
      return NextResponse.json({ error: "Failed to add menu item" }, { status: 500 });
    }
  });
}
