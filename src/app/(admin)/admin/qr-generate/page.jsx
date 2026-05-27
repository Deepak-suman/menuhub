"use client";
import { useState } from "react";
import { QrCode, Download, RefreshCcw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function QRGeneratePage() {
  const [tableNumber, setTableNumber] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQr = async (e) => {
    e.preventDefault();
    if (!tableNumber || tableNumber <= 0) return toast.error("Enter a valid table number");

    try {
      setLoading(true);
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrDataUrl);
        toast.success(`QR generated for Table ${tableNumber}`);
      } else {
        toast.error("Failed to generate QR Code");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md text-center group transition-all">
        <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white">
          <QrCode size={36} className="group-hover:scale-110 transition-transform" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">QR Generator</h1>
        <p className="text-slate-500 font-medium mb-8">Create table-specific QR ordering codes</p>

        <form onSubmit={generateQr} className="mb-8">
          <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-gray-100 shadow-inner">
            <span className="flex items-center justify-center pl-4 pr-2 text-gray-400 font-bold uppercase tracking-widest text-sm">Table</span>
            <input 
              type="number" 
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none p-3 font-bold text-gray-800 text-xl"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 5"
              min="1"
            />
            <button 
              type="submit" 
              disabled={loading || !tableNumber}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:hover:scale-100 text-white px-5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {loading ? <RefreshCcw className="animate-spin" size={20} /> : "Generate"}
            </button>
          </div>
        </form>

        {qrCode && (
          <div className="border border-dashed border-gray-300 rounded-2xl p-6 bg-slate-50 animate-fade-in flex flex-col items-center">
            <div className="bg-white p-4 shadow-sm rounded-xl mb-4 border border-gray-100">
              <img src={qrCode} alt={`QR Code for Table ${tableNumber}`} className="w-56 h-56 object-contain" />
            </div>
            
            <p className="font-bold text-gray-800 text-lg mb-4 opacity-90 tracking-tight">Table {tableNumber}</p>
            
            <a 
              href={qrCode} 
              download={`table-${tableNumber}-qr.png`}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-100"
            >
              <Download size={20} /> Download QR PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
}