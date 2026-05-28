"use client";
import React, { useEffect, useState, use } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Printer, ArrowLeft, ReceiptText } from "lucide-react";
import Link from "next/link";

export default function BillPreviewPage({ params }) {
  const unwrappedParams = use(params);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${unwrappedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [unwrappedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order) return <div className="p-10 text-center font-bold text-red-500">Order not found!</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 no-print">
      <div className="max-w-md mx-auto">
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/admin/history"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </Link>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Printer size={20} /> Print Bill
          </button>
        </div>

        {/* Thermal Bill Container */}
        <div className="bg-white shadow-2xl p-6 rounded-sm font-mono text-slate-800 print:shadow-none print:p-0 print:m-0" id="bill-content">
          <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
            {order.restaurant?.logo && (
              <img
                src={order.restaurant.logo}
                alt={order.restaurant.name || "Logo"}
                className="h-12 max-w-[120px] object-contain mx-auto mb-3"
              />
            )}
            <h1 className="text-2xl font-black uppercase tracking-tighter">{order.restaurant?.name || "RESTAURANT"}</h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Digital Tax Invoice</p>
          </div>

          <div className="text-[11px] space-y-1 mb-4 border-b border-slate-100 pb-4">
            <div className="flex justify-between">
              <span>ORDER ID:</span>
              <span className="font-bold">#{order.id.substring(order.id.length - 6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE/TIME:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>TABLE NO:</span>
              <span className="font-black text-sm">TABLE {order.tableNumber}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="uppercase">{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[12px] mb-4">
            <thead>
              <tr className="border-b-2 border-slate-900 font-black">
                <th className="py-2">ITEM</th>
                <th className="py-2 text-center">QTY</th>
                <th className="py-2 text-right">PRICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <span className="block font-bold leading-tight">{item.menuItem.name}</span>
                    {item.size && <span className="text-[9px] text-slate-400 capitalize">{item.size}</span>}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{(item.size === 'Half' ? item.menuItem.halfPrice : item.menuItem.price) * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-slate-900 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>₹{order.subTotal || order.totalAmount}</span>
            </div>
            {(order.taxAmount > 0) && (
              <div className="flex justify-between text-[11px]">
                <span>TAX/GST:</span>
                <span>+ ₹{order.taxAmount}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[11px] text-green-600">
                <span>DISCOUNT:</span>
                <span>- ₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg border-t border-slate-200 mt-2 pt-2">
              <span>GRAND TOTAL:</span>
              <span className="bg-slate-900 text-white px-2 rounded">₹{order.totalAmount}</span>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-dashed border-slate-200 pt-6">
            <div className="inline-block p-2 bg-slate-50 rounded-lg mb-2">
              <ReceiptText size={24} className="text-slate-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for visiting!</p>
            <p className="text-[9px] text-slate-300 mt-1">MenuHub - Digital Restaurant Partner</p>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; margin: 0; padding: 0; }
            #bill-content { 
              box-shadow: none !important; 
              width: 80mm !important; 
              margin: 0 auto !important; 
            }
          }
        `}</style>
      </div>
    </div>
  );
}
