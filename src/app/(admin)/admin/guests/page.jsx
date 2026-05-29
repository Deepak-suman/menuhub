import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import GuestsClient from "./GuestsClient";

export default async function AdminGuestsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const guests = await prisma.customerProfile.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" }
  });

  return <GuestsClient initialGuests={guests} />;
}
