"use client";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ArrowLeft, Clock, History, Calendar, CheckCircle2, ChevronRight, Star, Printer } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const OrderDetailsModal = dynamic(() => import("@/components/admin/OrderDetailsModal"), {
  ssr: false
});

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // For modal

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/orders/history");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-blue-600 transition-colors border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            <History size={28} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Order History</h1>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="max-w-7xl mx-auto py-20 bg-white rounded-3xl border border-dashed border-gray-300 text-center shadow-sm">
          <div className="text-gray-300 mb-3 flex justify-center">
            <History size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-500">No Closed Orders Yet</h3>
          <p className="text-gray-400 mt-1">Past orders will appear here once billing is complete.</p>
        </div>
      ) : (
         <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold text-sm tracking-wider uppercase">
                   <th className="p-5 font-bold">Date & Time</th>
                   <th className="p-5 font-bold">Table</th>
                   <th className="p-5 font-bold">Customer</th>
                   <th className="p-5 font-bold">Total</th>
                   <th className="p-5 font-bold">Payment</th>
                   <th className="p-5 font-bold text-center">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {orders.map(order => {
                   const dateObj = new Date(order.createdAt);
                   const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                   const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                   return (
                     <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="p-5">
                         <div className="flex items-center gap-3">
                           <div className="bg-indigo-50 text-indigo-500 p-2 rounded-lg">
                             <Calendar size={18} />
                           </div>
                           <div>
                             <p className="font-bold text-gray-900 leading-tight">{formattedDate}</p>
                             <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mt-0.5">
                               <Clock size={12} /> {formattedTime}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="p-5">
                         <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">T-{order.tableNumber}</span>
                       </td>
                       <td className="p-5 font-semibold text-gray-700">
                         {order.customerName || <span className="text-gray-400 italic">Guest</span>}
                       </td>
                       <td className="p-5 font-black text-gray-900">
                         ₹{order.totalAmount}
                       </td>
                       <td className="p-5">
                         <div className="flex flex-col gap-1 items-start">
                            {order.isPaid ? (
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200">
                                <CheckCircle2 size={12} /> PAID
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200">
                                UNPAID
                              </span>
                            )}
                            {order.paymentMode && (
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                VIA {order.paymentMode}
                              </span>
                            )}
                         </div>
                       </td>
                       <td className="p-5 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <Link
                             href={`/admin/bill/${order.id}`}
                             className="inline-flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 w-10 h-10 rounded-xl transition-colors border border-green-100"
                             title="Print Bill"
                           >
                             <Printer size={18} />
                           </Link>
                           {order.rating && (
                             <button
                               onClick={() => setSelectedOrder(order)}
                               className="inline-flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-xl transition-colors font-bold text-xs border border-yellow-200 shadow-sm whitespace-nowrap"
                             >
                               <Star size={14} className="fill-yellow-500" /> Rating
                             </button>
                           )}
                           <button 
                             onClick={() => setSelectedOrder(order)}
                             className="inline-flex items-center justify-center bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 w-10 h-10 rounded-xl transition-colors"
                             title="View Details"
                           >
                             <ChevronRight size={20} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
