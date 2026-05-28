"use client";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
    >
      <Printer size={20} /> Print Bill
    </button>
  );
}
