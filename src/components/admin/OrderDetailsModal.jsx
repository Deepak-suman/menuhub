import React from "react";
import { X, Calendar, Clock, Star } from "lucide-react";

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order #{order.id}</h2>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              Table {order.tableNumber} &bull; {order.customerName || "Guest"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
          <h4 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-4">Ordered Items</h4>
          <ul className="space-y-3 mb-6">
            {order.items.map((item, idx) => {
              const price = item.size === 'Half' && item.menuItem.halfPrice ? item.menuItem.halfPrice : item.menuItem.price;
              return (
                <li key={item.id || idx} className="flex justify-between items-start font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100">
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

          {order.rating && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs uppercase font-bold tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                <Star size={14} className="fill-indigo-500" /> Customer Feedback 
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Food Taste', value: order.rating.foodTaste },
                  { label: 'Service', value: order.rating.service },
                  { label: 'Cleanliness', value: order.rating.cleanliness },
                  { label: 'Chef', value: order.rating.chef },
                  { label: 'Staff', value: order.rating.staff },
                  { label: 'Comfort', value: order.rating.seatingComfort },
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
          <span className="text-2xl font-black text-green-600">₹{order.totalAmount}</span>
        </div>
      </div>
    </div>
  );
}
