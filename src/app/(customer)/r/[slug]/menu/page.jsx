import { Suspense } from "react";
import { 
  getCachedMenu, 
  getCachedCategories, 
  getCachedRestaurantSettings, 
  getCachedTenantIdBySlug,
  getTableStatus
} from "@/lib/data";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import MenuClient from "@/components/customer/MenuClient";

async function MenuDataFetcher({ slug, tableNumber }) {
  const restaurantId = await getCachedTenantIdBySlug(slug);
  
  if (!restaurantId) {
    return <div className="h-screen flex items-center justify-center font-bold text-red-500">Restaurant Not Found</div>;
  }

  // Fetch all required data in parallel on the server
  const [menu, categories, restaurant, tableStatus] = await Promise.all([
    getCachedMenu(restaurantId),
    getCachedCategories(restaurantId),
    getCachedRestaurantSettings(restaurantId),
    getTableStatus(restaurantId, tableNumber)
  ]);

  if (!restaurant?.isActive) {
    return <div className="h-screen flex items-center justify-center font-bold text-red-500">This restaurant is currently closed.</div>;
  }

  return (
    <MenuClient 
      initialMenu={menu}
      initialCategories={categories}
      restaurantInfo={restaurant}
      tableNumber={tableNumber}
      slug={slug}
      initialTableStatus={tableStatus}
    />
  );
}

export default async function MenuPage({ params, searchParams }) {
  const { slug } = await params;
  const { table } = await searchParams;

  if (!table) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4 font-bold shadow-sm">
          Missing Table Information!
        </div>
        <p className="text-gray-500 font-medium max-w-xs">
          Please scan the QR code on your table again to access the menu.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <MenuDataFetcher slug={slug} tableNumber={table} />
    </Suspense>
  );
}