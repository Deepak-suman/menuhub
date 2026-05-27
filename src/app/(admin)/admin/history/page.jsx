"use client";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ArrowLeft, Clock, History, Calendar, CheckCircle2, ChevronRight, X, Star, Printer } from "lucide-react";
import Link from "next/link";

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

      {/* Modal for Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order #{selectedOrder.id}</h2>
                 <p className="text-sm font-semibold text-gray-500 mt-1">Table {selectedOrder.tableNumber} &bull; {selectedOrder.customerName || "Guest"}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                 <X size={20} />
               </button>
            </div>
            
             <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
               <h4 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-4">Ordered Items</h4>
               <ul className="space-y-3 mb-6">
                 {selectedOrder.items.map((item, idx) => {
                    const price = item.size === 'Half' && item.menuItem.halfPrice ? item.menuItem.halfPrice : item.menuItem.price;
                    return (
                      <li key={idx} className="flex justify-between items-start font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-gray-600 shrink-0">
                            {item.quantity}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold">{item.menuItem.name}</span>
                            {item.size && <span className="text-xs uppercase font-bold text-gray-400 tracking-wider mt-0.5">{item.size}</span>}
                          </div>
                        </div>
                        <span className="font-black text-gray-900 shrink-0 pl-4">₹{price * item.quantity}</span>
                      </li>
                    );
                 })}
               </ul>

               {selectedOrder.rating && (
                 <div className="mt-6 pt-6 border-t border-gray-100">
                   <h4 className="text-xs uppercase font-bold tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                     <Star size={14} className="fill-indigo-500" /> Customer Feedback 
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: 'Food Taste', value: selectedOrder.rating.foodTaste },
                       { label: 'Service', value: selectedOrder.rating.service },
                       { label: 'Cleanliness', value: selectedOrder.rating.cleanliness },
                       { label: 'Chef', value: selectedOrder.rating.chef },
                       { label: 'Staff', value: selectedOrder.rating.staff },
                       { label: 'Comfort', value: selectedOrder.rating.seatingComfort },
                     ].map((feedback, idx) => (
                       <div key={idx} className="flex flex-col bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                         <span className="text-xs font-bold text-gray-500 mb-1">{feedback.label}</span>
                         <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                size={14} 
                                className={feedback.value >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Grand Total</span>
              <span className="text-2xl font-black text-green-600">₹{selectedOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
