import React from "react";

export default function TableRequestBar({ waiterRequests, onRefreshRequests }) {
  if (waiterRequests.length === 0) return null;

  const optLabels = {
    WAITER: "Call Waiter 🙋‍♂️",
    WATER: "Needs Water 🥛",
    SPOONS: "Needs Spoons 🍴",
    BILL: "Needs Bill 🧾",
    OTHER: "Assistance 🔔"
  };

  const handleDismiss = async (requestId) => {
    const res = await fetch("/api/admin/waiter-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, status: "RESOLVED" })
    });
    if (res.ok && onRefreshRequests) onRefreshRequests();
  };

  return (
    <div className="max-w-7xl mx-auto mb-8 animate-fade-in transition-all">
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
                  onClick={() => handleDismiss(req.id)}
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
  );
}
