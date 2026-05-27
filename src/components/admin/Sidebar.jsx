"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Tags, 
  QrCode, 
  History, 
  Ticket,
  LogOut, 
  Store,
  ChefHat,
  Image as ImageIcon,
  Settings,
  Users
} from "lucide-react";
import { signOut } from "next-auth/react";

export default function Sidebar({ restaurantName, restaurantLogo }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Menu Manage", href: "/admin/menu-manage", icon: UtensilsCrossed },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "VIP Guests", href: "/admin/guests", icon: Users },
    { name: "QR Generate", href: "/admin/qr-generate", icon: QrCode },
    { name: "Media Library", href: "/admin/media", icon: ImageIcon },
    { name: "Order History", href: "/admin/history", icon: History },
    { name: "Kitchen Screen", href: "/admin/kitchen", icon: ChefHat },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const LogoBlock = ({ size = "lg" }) => {
    const isLg = size === "lg";
    const boxClass = isLg
      ? "w-11 h-11 rounded-xl shrink-0 overflow-hidden"
      : "w-9 h-9 rounded-lg shrink-0 overflow-hidden";

    return (
      <div className={`${boxClass} bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white`}>
        {restaurantLogo ? (
          <img
            src={restaurantLogo}
            alt={restaurantName || "Logo"}
            className="w-full h-full object-cover"
          />
        ) : (
          <Store size={isLg ? 22 : 18} />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl hidden md:flex sticky top-0 h-screen shrink-0">
        <div className="p-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-5">
            <LogoBlock size="lg" />
            <span className="text-lg font-black text-white tracking-tight line-clamp-2 leading-tight">
              {restaurantName || "Vendor Panel"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive 
                    ? "bg-slate-800 text-white shadow-inner" 
                    : "hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-500" : "text-slate-500"} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
           <LogoBlock size="sm" />
           <span className="text-lg font-black text-white line-clamp-1">{restaurantName || "Vendor Panel"}</span>
        </div>
        <button onClick={handleLogout} className="text-slate-400 p-2"><LogOut size={20}/></button>
      </header>
    </>
  );
}
