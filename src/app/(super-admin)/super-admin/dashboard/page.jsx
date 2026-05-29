import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export default async function SuperAdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Fetch all restaurants with gateway & charges info
  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: {
        select: { orders: true, menuItems: true }
      },
      users: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Formatting response to be dashboard friendly
  const payload = restaurants.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isActive: r.isActive,
    vendorName: r.users[0]?.name || "Unassigned",
    vendorEmail: r.users[0]?.email || "Unknown",
    totalOrders: r._count.orders,
    totalItems: r._count.menuItems,
    createdAt: r.createdAt.toISOString(),
    // --- Hybrid Plan & Charges ---
    plan: r.plan || "FREE",
    hasGateway: !!(r.razorpayKeyId && r.razorpayKeySecret),
    platformFee: r.platformFee || 0,
    commissionPercent: r.commissionPercent || 0,
    gstPercent: r.gstPercent || 0,
    chargesNote: r.chargesNote || "",
  }));

  // Generate basic platform stats
  const totalVendors = await prisma.user.count({ where: { role: "VENDOR" }});
  const platformOrders = await prisma.order.count();
  const paidVendors = restaurants.filter(r => r.plan === "PAID").length;
  const freeVendors = restaurants.filter(r => r.plan !== "PAID").length;

  const initialData = {
    stats: { totalVendors, totalRestaurants: restaurants.length, platformOrders, paidVendors, freeVendors },
    restaurants: payload
  };

  return <SuperAdminClient initialData={initialData} />;
}
