"use client";
import { CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto">
        <CheckCircle2 size={48} />
      </div>
      <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-3">Thank You!</h1>
      <p className="text-slate-500 font-medium max-w-sm mb-8 text-lg">
        Your table session has been closed. We hope you enjoyed your meal!
      </p>
      <div className="bg-white p-4 px-6 rounded-2xl shadow-sm border border-gray-100 inline-block text-sm font-bold text-gray-400 uppercase tracking-widest">
        Session Complete
      </div>
    </div>
  );
}
