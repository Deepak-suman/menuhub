import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploadFile";
import { getTenantId } from "@/lib/getTenant";
import { getAuthorizedUser } from "@/lib/authorize";
import { revalidateTag } from "next/cache";

export async function PUT(req, { params }) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if item exists and belongs to this restaurant
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: id }
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (auth.role !== "SUPER_ADMIN" && existingItem.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden. This item does not belong to your restaurant." }, { status: 403 });
    }

    const formData = await req.formData();
    
    const name = formData.get("name");
    const priceRaw = formData.get("price");
    const category = formData.get("category");
    const isAvailableRaw = formData.get("isAvailable");
    const halfPriceRaw = formData.get("halfPrice");
    const imageFile = formData.get("image");

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (priceRaw) dataToUpdate.price = parseFloat(priceRaw);
    if (category) dataToUpdate.category = category;
    if (isAvailableRaw !== null) dataToUpdate.isAvailable = isAvailableRaw === "true";
    
    if (halfPriceRaw !== null) {
        dataToUpdate.halfPrice = halfPriceRaw && !isNaN(parseFloat(halfPriceRaw)) ? parseFloat(halfPriceRaw) : null;
    }

    if (imageFile && imageFile.name) {
        let uploadContext = existingItem.restaurantId;
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: existingItem.restaurantId },
          select: { slug: true }
        });
        if (restaurant?.slug) {
          uploadContext = restaurant.slug;
        }
        dataToUpdate.image = await saveUploadedFile(imageFile, uploadContext);
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id: id },
      data: dataToUpdate
    });

    // Invalidate cache for the correct restaurant
    revalidateTag(`menu-${existingItem.restaurantId}`);

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingItem = await prisma.menuItem.findUnique({
      where: { id: id }
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (auth.role !== "SUPER_ADMIN" && existingItem.restaurantId !== auth.restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Soft delete: Mark as deleted and unavailable instead of hard deleting
    await prisma.menuItem.update({
      where: { id: id },
      data: { isDeleted: true, isAvailable: false }
    });

    revalidateTag(`menu-${existingItem.restaurantId}`);

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}