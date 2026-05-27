import { useState } from "react";
import { X } from "lucide-react";

export default function OrderForm({ tableNumber, totalAmount, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(name || "Guest");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative z-50">
        <button 
          onClick={onCancel}
          className="absolute right-4 top-4 text-gray-400 hover:bg-gray-100 rounded-full p-1"
        >
          <X size={24} />
        </button>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white pt-8">
          <h2 className="text-2xl font-bold mb-1">Confirm Order</h2>
          <p className="opacity-90">Table #{tableNumber}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Your Name (Optional)
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-100">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-gray-900">₹{totalAmount}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-bold text-lg py-4 rounded-xl shadow-lg disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
