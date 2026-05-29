import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import HistoryClient from "./HistoryClient";

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const orders = await prisma.order.findMany({
    where: { status: "CLOSED", restaurantId },
    orderBy: { createdAt: "desc" },
    include: {
      rating: true,
      items: { include: { menuItem: true } },
    },
  });

  return <HistoryClient initialOrders={orders} />;
}
