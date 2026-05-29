"use client";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-gray-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registration Locked</h1>
        <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">
          Public restaurant registration is currently disabled on MenuHub. 
          New accounts and restaurant profiles can only be registered directly by a Platform Super Admin.
        </p>
        
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
          <Link 
            href="/login" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            Go to Log In
          </Link>
          <Link 
            href="/" 
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
