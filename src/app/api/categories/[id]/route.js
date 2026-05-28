import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/authorize";
import { revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";

export async function DELETE(req, { params }) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const category = await prisma.category.findUnique({ where: { id: id } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    if (auth.role !== "SUPER_ADMIN" && category.restaurantId !== auth.restaurantId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // delete image file from disk if it was uploaded
    if (category.icon && category.icon.startsWith("/api/uploads/")) {
       // Extract the path after /api/uploads/ which includes [context]/[filename]
       const relativePath = category.icon.replace("/api/uploads/", "");
       const filePath = path.join(process.cwd(), "uploads", relativePath);
       if (fs.existsSync(filePath)) {
         fs.unlinkSync(filePath);
       }
    }

    await prisma.category.delete({ where: { id: id } });

    revalidateTag('categories');

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
