import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import MediaClient from "./MediaClient";

export default async function MediaLibraryPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { slug: true }
  });

  let initialMedia = [];
  if (restaurant?.slug) {
    const mediaDir = path.join(process.cwd(), "uploads", restaurant.slug);
    try {
      await fs.access(mediaDir);
      const files = await fs.readdir(mediaDir);
      initialMedia = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(mediaDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            url: `/api/uploads/${restaurant.slug}/${file}`,
            createdAt: stats.birthtime.toISOString(),
            size: stats.size
          };
        })
      );
      initialMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      // directory doesn't exist yet
    }
  }

  return <MediaClient initialMedia={initialMedia} />;
}
