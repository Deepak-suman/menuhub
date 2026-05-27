import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import KitchenClient from "./KitchenClient";
import Link from "next/link";

export default async function KitchenPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.restaurantId) {
    return <div className="p-8 font-bold text-red-500">Unauthorized. Login required.</div>;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true }
  });

  if (restaurant?.plan !== "PAID") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-6 relative overflow-hidden">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
           <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Premium Feature Locked</h1>
        <p className="text-slate-500 text-lg max-w-md mb-8 leading-relaxed">
          The Kitchen Display System (KDS) is an advanced feature available only on the <strong className="text-slate-800 font-black px-2 py-1 bg-amber-100 rounded-lg text-amber-700">PAID</strong> plan. Upgrade your subscription to unlock a dedicated live order screen for your chefs!
        </p>
        <Link href="/admin/dashboard" className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-md shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-slate-200">
           Upgrade to Paid
        </Link>
      </div>
    );
  }

  return <KitchenClient />;
}
