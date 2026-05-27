import Link from "next/link";
import { UtensilsCrossed, ArrowRight, Store, QrCode, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 max-w-2xl w-full border border-white/40 text-center relative z-10 transition-transform duration-500 hover:scale-[1.01]">
        
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30 ring-8 ring-white">
          <UtensilsCrossed size={48} className="drop-shadow-sm" />
        </div>
        
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight mb-4">
          Jambo Platform
        </h1>
        <p className="text-xl text-slate-600 font-medium mb-10 max-w-lg mx-auto">
          The ultimate multi-tenant SaaS for restaurants to manage QR menus, live orders, and seamless payments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/login" className="group text-left px-6 py-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
            <div>
               <h3 className="font-bold text-slate-800 text-xl group-hover:text-blue-700 transition-colors">Vendor Login</h3>
               <p className="text-slate-500 font-medium mt-1">Manage your restaurant</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
               <ArrowRight size={24} />
            </div>
          </Link>
          
          <Link href="/signup" className="group text-left px-6 py-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
             <div>
               <h3 className="font-bold text-slate-800 text-xl group-hover:text-emerald-700 transition-colors">Get Started</h3>
               <p className="text-slate-500 font-medium mt-1">Register a new restaurant</p>
             </div>
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
               <Store size={24} />
             </div>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-100 pt-8 text-slate-500">
           <div className="flex flex-col items-center">
              <QrCode className="mb-2" />
              <span className="text-sm font-semibold">QR Menus</span>
           </div>
           <div className="flex flex-col items-center">
              <Settings className="mb-2" />
              <span className="text-sm font-semibold">Live Dashboard</span>
           </div>
           <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              <span className="text-sm font-semibold">UPI/Razorpay</span>
           </div>
        </div>
      </div>
    </div>
  );
}
