import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  // Fetch both datasets in parallel on the server — zero client waterfall
  const [orders, waiterRequests] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: "CLOSED" }, restaurantId },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { menuItem: true } } },
    }),
    prisma.waiterRequest.findMany({
      where: { restaurantId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <DashboardClient
      initialOrders={orders}
      initialWaiterRequests={waiterRequests}
    />
  );
}