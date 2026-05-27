"use client";
import { useEffect, useState } from "react";
import OrderCard from "@/components/admin/OrderCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [knownRequests, setKnownRequests] = useState(new Set());

  const playAlert = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav");
      audio.play().catch(e => console.log("Audio play deferred for user interaction"));
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // API se orders fetch karne ka function
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaiterRequests = async () => {
    try {
      const res = await fetch("/api/admin/waiter-requests");
      if (res.ok) {
        const data = await res.json();
        setWaiterRequests(data);

        setKnownRequests(prev => {
          let hasNew = false;
          const newKnown = new Set(prev);
          for (const req of data) {
            if (!prev.has(req.id)) {
              hasNew = true;
              newKnown.add(req.id);
            }
          }
          if (hasNew && prev.size > 0) {
            playAlert();
          }
          return newKnown;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchOrders(); 
  };

  useEffect(() => {
    fetchOrders(); 
    fetchWaiterRequests();
    const interval = setInterval(() => {
      fetchOrders();
      fetchWaiterRequests();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* Waiter Calling Requests Bar */}
      {waiterRequests.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8 animate-fade-in">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl animate-bounce">🔔</span>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Table Requests</h2>
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {waiterRequests.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {waiterRequests.map((req) => {
                const optLabels = {
                  WAITER: "Call Waiter 🙋‍♂️",
                  WATER: "Needs Water 🥛",
                  SPOONS: "Needs Spoons 🍴",
                  BILL: "Needs Bill 🧾",
                  OTHER: "Assistance 🔔"
                };
                const timeString = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={req.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-400 to-orange-400 w-full"></div>
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-lg font-black text-slate-900">Table {req.tableNumber}</span>
                        <span className="text-xs font-medium text-slate-400">{timeString}</span>
                      </div>
                      <p className="text-sm font-bold text-orange-600">{optLabels[req.type] || "Needs Help"}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/admin/waiter-requests", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: req.id, status: "RESOLVED" })
                        });
                        if (res.ok) fetchWaiterRequests();
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95"
                    >
                      ✓ Dismiss / Serve
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
            <LayoutDashboard size={28} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Live Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/coupons" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-100">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/></svg>
             Coupons
          </a>
          <a href="/admin/history" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-100">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
             Order History
          </a>
        </div>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} onRefresh={fetchOrders} />
          ))}

          {orders.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-300 text-center shadow-sm">
               <div className="text-gray-300 mb-3 flex justify-center">
                 <LayoutDashboard size={48} />
               </div>
               <h3 className="text-xl font-bold text-gray-500">No Active Orders</h3>
               <p className="text-gray-400 mt-1">Waiting for customers to scan and order...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}