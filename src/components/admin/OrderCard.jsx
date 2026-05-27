import { useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";

export default function OrderCard({ order, onUpdateStatus, onRefresh }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const handleCompleteRound = async (orderId, roundNumber) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/round`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundNumber })
      });
      if (res.ok && onRefresh) onRefresh();
    } catch (e) {
      console.error("Failed to complete round", e);
    }
  };

  const statusColors = {
    ACTIVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md h-full">
      <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Table {order.tableNumber}</h2>
            <Link 
              href={`/admin/bill/${order.id}`}
              className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
              title="View/Print Bill"
            >
              <Printer size={16} />
            </Link>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {order.customerName ? `Ordered by: ${order.customerName}` : "Guest Order"}
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[order.status] || "bg-gray-100"}`}>
          {order.status}
        </span>
      </div>
      
      <div className="flex-grow">
        <h4 className="text-xs uppercase text-gray-400 font-bold tracking-widest mb-3">Order Items</h4>
        <div className="space-y-4">
          {Object.entries(
            order.items.reduce((acc, item) => {
              const round = item.roundNumber || 1;
              if (!acc[round]) acc[round] = [];
              acc[round].push(item);
              return acc;
            }, {})
          ).map(([round, itemsInRound]) => {
            const addedAtTime = new Date(itemsInRound[0].addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const allCompleted = itemsInRound.every(i => i.status === "COMPLETED");
            return (
              <div key={round} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-gray-500 bg-gray-100/50 inline-block px-2 py-1 rounded-md border border-gray-100">
                     {round == 1 ? "1st" : round == 2 ? "2nd" : round == 3 ? "3rd" : `${round}th`} Order &bull; <span className="font-medium">{addedAtTime}</span>
                  </div>
                  <span className={`text-xs font-bold ${allCompleted ? "text-green-500" : "text-red-500"} lowercase tracking-wide`}>
                    {allCompleted ? "complete" : "pending"}
                  </span>
                </div>
                <ul className="space-y-2 relative">
                  {itemsInRound.map((item, index) => {
                    const variantPrice = item.size === 'Half' && item.menuItem.halfPrice ? item.menuItem.halfPrice : item.menuItem.price;
                    return (
                      <li key={index} className={`flex justify-between items-start font-medium bg-gray-50/50 p-2 rounded-lg gap-2 ${item.status === "COMPLETED" ? "text-gray-400 opacity-60" : "text-gray-800"}`}>
                        <span className="flex items-start gap-2">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold shadow-sm border shrink-0 mt-0.5 ${item.status === 'COMPLETED' ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-600 border-gray-200"}`}>
                            {item.quantity}
                          </span>
                          <div className="flex flex-col">
                            <span className="leading-tight">{item.menuItem.name}</span>
                            {item.size && (
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {item.size}
                              </span>
                            )}
                          </div>
                        </span>
                        <span className="font-bold shrink-0">₹{variantPrice * item.quantity}</span>
                      </li>
                    );
                  })}
                  {!allCompleted && order.status !== "CLOSED" && (
                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => handleCompleteRound(order.id, round)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                      >
                        ✓ Mark Round Served
                      </button>
                    </div>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between items-center font-bold text-xl pt-4 mt-6 border-t border-gray-100">
        <span className="text-gray-400 text-base font-medium">Total</span>
        <span className="text-gray-900 bg-green-50 px-3 py-1 rounded-lg text-green-700">₹{order.totalAmount}</span>
      </div>

      {order.status !== "COMPLETED" && (
        <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
          {order.status === "ACTIVE" && (
            <button 
              onClick={() => onUpdateStatus(order.id, "PREPARING")}
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-3 rounded-xl font-bold shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Start Preparing
            </button>
          )}
          {order.status === "PREPARING" && (
            <button 
              onClick={() => onUpdateStatus(order.id, "COMPLETED")}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-md shadow-green-500/20 active:scale-[0.98] transition-all"
            >
              Mark Order Ready
            </button>
          )}
        </div>
      )}

      {order.status === "COMPLETED" && (
        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col gap-4">
          {!order.isPaid ? (
            <div className="flex flex-col gap-3 text-center">
              {!order.isBillRequested ? (
                <button 
                  onClick={async () => {
                    const res = await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ isBillRequested: true })
                    });
                    if (res.ok && onRefresh) onRefresh();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  Send Final Bill to Customer
                </button>
              ) : !order.isBillApproved ? (
                <div className="bg-orange-50 text-orange-600 font-bold py-3 rounded-xl border border-orange-100 animate-pulse shadow-inner">
                  ⏳ Waiting for Customer Approval...
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="bg-indigo-50 text-indigo-700 font-bold py-2 rounded-xl text-sm border border-indigo-100">
                    Customer opted for: {order.paymentMode || "UNKNOWN"}
                  </div>
                  {order.paymentMode === 'CASH' && (
                     <button 
                      onClick={async () => {
                        const res = await fetch(`/api/orders/${order.id}`, {
                          method: 'PATCH',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ isPaid: true })
                        });
                        if (res.ok && onRefresh) onRefresh();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all"
                    >
                      Confirm Cash Received
                    </button>
                  )}
                  {order.paymentMode === 'ONLINE' && (
                     <div className="bg-blue-50 text-blue-600 font-bold py-3 rounded-xl border border-blue-100 animate-pulse shadow-inner">
                       ⏳ Waiting for Online Payment...
                     </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 text-green-700 font-bold py-2.5 rounded-xl border border-green-200 text-center flex items-center justify-center gap-2 shadow-sm">
              ✓ Payment Received (₹{order.totalAmount})
            </div>
          )}

          <button 
            onClick={() => setShowResetModal(true)}
            className={`w-full py-3 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all ${order.isPaid ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none'}`}
          >
            {order.isPaid ? 'Clear & Reset Table' : 'Force Reset Table'}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-slide-up">
            <h3 className="text-xl font-black text-gray-900 mb-2">Reset Table?</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Are you sure you want to reset Table {order.tableNumber}? This will mark the order as closed.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                No
              </button>
              <button 
                onClick={() => {
                  setShowResetModal(false);
                  onUpdateStatus(order.id, "CLOSED");
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-colors"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
