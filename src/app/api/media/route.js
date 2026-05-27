import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = auth;
    if (!restaurantId && auth.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Restaurant context missing" }, { status: 403 });
    }

    // Determine target restaurant ID (Super Admin can pass ID)
    const { searchParams } = new URL(req.url);
    let targetId = restaurantId;
    if (auth.role === "SUPER_ADMIN") {
        const idParam = searchParams.get("restaurantId");
        if (idParam) targetId = idParam;
    }

    if (!targetId) {
        return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 });
    }

    // Get restaurant slug for folder path
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: targetId },
      select: { slug: true }
    });

    if (!restaurant?.slug) {
      return NextResponse.json({ error: "Restaurant slug not found" }, { status: 404 });
    }

    const mediaDir = path.join(process.cwd(), "uploads", restaurant.slug);

    // Ensure directory exists
    try {
      await fs.access(mediaDir);
    } catch {
      return NextResponse.json([]); // Return empty list if no uploads folder yet
    }

    const files = await fs.readdir(mediaDir);
    
    // Sort files by creation time (desc)
    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(mediaDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          url: `/api/uploads/${restaurant.slug}/${file}`,
          createdAt: stats.birthtime,
          size: stats.size
        };
      })
    );

    fileList.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json(fileList);
  } catch (error) {
    console.error("GET Media Error:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req) {
    try {
      const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
      if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  
      let targetId = auth.restaurantId;
      if (auth.role === "SUPER_ADMIN") {
          const idParam = formData.get("restaurantId");
          if (idParam) targetId = idParam;
      }
  
      if (!targetId) return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 });
  
      const restaurant = await prisma.restaurant.findUnique({
          where: { id: targetId },
          select: { slug: true }
      });
  
      if (!restaurant?.slug) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  
      const { saveUploadedFile } = await import("@/lib/uploadFile");
      const url = await saveUploadedFile(file, restaurant.slug);
  
      return NextResponse.json({ url, success: true });
    } catch (error) {
      console.error("POST Media Error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

export async function DELETE(req) {
    try {
      const auth = await getAuthorizedUser(["VENDOR", "SUPER_ADMIN"]);
      if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const { searchParams } = new URL(req.url);
      const filename = searchParams.get("filename");
      const restaurantIdParam = searchParams.get("restaurantId");
  
      if (!filename) return NextResponse.json({ error: "Filename required" }, { status: 400 });
  
      let targetId = auth.restaurantId;
      if (auth.role === "SUPER_ADMIN" && restaurantIdParam) {
          targetId = restaurantIdParam;
      }
  
      const restaurant = await prisma.restaurant.findUnique({
          where: { id: targetId },
          select: { slug: true }
      });
  
      if (!restaurant?.slug) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  
      const filePath = path.join(process.cwd(), "uploads", restaurant.slug, filename);
  
      try {
          await fs.unlink(filePath);
          return NextResponse.json({ success: true, message: "File deleted" });
      } catch (err) {
          return NextResponse.json({ error: "File not found or protected" }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }
