import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCachedMenu } from "@/lib/data";
import MenuManageClient from "./MenuManageClient";

export default async function MenuManagePage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const initialItems = await getCachedMenu(restaurantId);

  return <MenuManageClient initialItems={initialItems} />;
}