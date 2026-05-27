import React from "react";
import Sidebar from "@/components/admin/Sidebar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.restaurantId) {
    redirect("/login");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { name: true, logo: true }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar restaurantName={restaurant?.name} restaurantLogo={restaurant?.logo} />

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto relative">
           {children}
        </div>
      </main>
    </div>
  );
}
