"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import OrderCard from "@/components/admin/OrderCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TableRequestBar from "@/components/admin/TableRequestBar";
import { LayoutDashboard } from "lucide-react";

export default function DashboardClient({ initialOrders, initialWaiterRequests }) {
  const [orders, setOrders] = useState(initialOrders);
  const [waiterRequests, setWaiterRequests] = useState(initialWaiterRequests);
  const [knownRequests, setKnownRequests] = useState(
    new Set(initialWaiterRequests.map((r) => r.id))
  );
  const eventSourceRef = useRef(null);

  const playAlert = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav");
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchWaiterRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/waiter-requests");
      if (res.ok) {
        const data = await res.json();
        setWaiterRequests(data);
        setKnownRequests((prev) => {
          let hasNew = false;
          const newKnown = new Set(prev);
          for (const req of data) {
            if (!prev.has(req.id)) {
              hasNew = true;
              newKnown.add(req.id);
            }
          }
          if (hasNew && prev.size > 0) playAlert();
          return newKnown;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateStatus = useCallback(
    async (id, newStatus) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders();
    },
    [fetchOrders]
  );

  // Use SSE for real-time order updates — no polling
  useEffect(() => {
    const connectSSE = () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      const es = new EventSource("/api/orders/live");
      eventSourceRef.current = es;

      es.addEventListener("update", () => {
        fetchOrders();
        fetchWaiterRequests();
      });

      es.onerror = () => {
        es.close();
        // Fallback: reconnect after 5s
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    // Also fetch waiter requests on mount since SSE only covers order events
    fetchWaiterRequests();

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [fetchOrders, fetchWaiterRequests]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <TableRequestBar
        waiterRequests={waiterRequests}
        onRefreshRequests={fetchWaiterRequests}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
            <LayoutDashboard size={28} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Live Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/coupons"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/></svg>
            Coupons
          </a>
          <a
            href="/admin/history"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            Order History
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={updateStatus}
            onRefresh={fetchOrders}
          />
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
    </div>
  );
}
