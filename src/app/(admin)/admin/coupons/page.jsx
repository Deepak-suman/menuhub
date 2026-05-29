import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import CouponsClient from "./CouponsClient";

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const coupons = await prisma.coupon.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" }
  });

  return <CouponsClient initialCoupons={coupons} />;
}
