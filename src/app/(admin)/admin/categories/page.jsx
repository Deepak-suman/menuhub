import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCachedCategories } from "@/lib/data";
import CategoriesClient from "./CategoriesClient";

export default async function ManageCategoriesPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session.user.restaurantId;

  const initialCategories = await getCachedCategories(restaurantId);

  return <CategoriesClient initialCategories={initialCategories} />;
}
