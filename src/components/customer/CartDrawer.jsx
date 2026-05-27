import { ShoppingBag, X, Minus, Plus, Tag } from "lucide-react";
import { useState } from "react";

export default function CartDrawer({ cart, updateQuantity, getCartTotal, onCheckout, slug }) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const total = getCartTotal();
  const finalTotal = appliedCoupon ? total - appliedCoupon.discount : total;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setVerifying(true);
    setCouponError("");
    try {
      const res = await fetch(`/api/coupons/verify?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartTotal: total })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon({ code: data.coupon.code, discount: data.discountAmount });
      } else {
        setCouponError(data.error);
        setAppliedCoupon(null);
      }
    } catch (e) {
      setCouponError("Failed to apply coupon");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-3xl border-t border-gray-100 p-5 z-40 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
          <ShoppingBag className="text-blue-600" /> Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
        </h3>
        <div className="text-right">
          {appliedCoupon && <p className="text-sm text-gray-500 line-through">₹{total}</p>}
          <span className="font-bold text-2xl text-green-600">₹{finalTotal}</span>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto mb-4 pr-2 space-y-3 custom-scrollbar">
        {cart.map((item) => (
          <div key={item.cartItemId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div className="flex-1 pr-2">
              <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-sm text-gray-500">₹{item.price} each</p>
                 {item.size && (
                   <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.size}</span>
                 )}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1 px-2 shadow-sm shrink-0">
              <button 
                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                className="text-gray-500 hover:text-red-500 p-1"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold w-4 text-center">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                className="text-gray-500 hover:text-green-500 p-1"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        {!appliedCoupon ? (
          <div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <Tag className="text-gray-400 ml-2" size={18} />
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Have a coupon?" 
                className="bg-transparent outline-none flex-1 font-bold text-gray-700 py-2 uppercase"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={!couponCode || verifying}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-black transition-colors"
              >
                {verifying ? "..." : "APPLY"}
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">{couponError}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
            <div>
              <p className="text-green-700 font-bold text-sm flex items-center gap-1"><Tag size={14}/> {appliedCoupon.code} Applied</p>
              <p className="text-green-600 text-xs">You saved ₹{appliedCoupon.discount}</p>
            </div>
            <button onClick={handleRemoveCoupon} className="text-red-500 hover:bg-red-50 p-1 rounded-md text-xs font-bold uppercase tracking-wide">Remove</button>
          </div>
        )}
      </div>

      <button
        onClick={() => onCheckout(appliedCoupon?.code)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex justify-center items-center gap-2 text-lg"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
