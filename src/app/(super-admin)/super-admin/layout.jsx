"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navLinks = [
    { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
    { name: "Vendors & Tenants", href: "/super-admin/dashboard", icon: Users }, // Keep it simple and unified for now
    { name: "Platform Settings", href: "/super-admin/dashboard", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl hidden md:flex sticky top-0 h-screen">
        <div className="p-6 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-orange-500 shadow-lg shadow-pink-500/20 flex items-center justify-center text-white">
               <ShieldAlert size={22} />
            </div>
            <span className="text-xl font-black text-white tracking-tight">SuperAdmin</span>
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
                <Icon size={20} className={isActive ? "text-pink-500" : "text-slate-500"} />
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

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-orange-500 flex items-center justify-center text-white">
                <ShieldAlert size={16} />
             </div>
             <span className="text-xl font-black text-white">SuperAdmin</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 p-2"><LogOut size={20}/></button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           {children}
        </div>
      </main>
    </div>
  );
}
