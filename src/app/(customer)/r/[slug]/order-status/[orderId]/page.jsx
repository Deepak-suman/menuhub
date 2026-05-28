"use client";
import React, { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import Navbar from "@/components/shared/Navbar";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { CheckCircle2, Clock, ChefHat, ArrowLeft, Trash2, Edit2, X, Check, Star } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audioCtx = new AudioContext();

  const strike = (delayMs) => {
    setTimeout(() => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    }, delayMs);
  };

  strike(0);
  strike(300);
  strike(600);
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function RatingModal({ orderId, onClose }) {
  const [ratings, setRatings] = React.useState({
    foodTaste: 0, service: 0, cleanliness: 0, chef: 0, staff: 0, seatingComfort: 0
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const submitRating = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem(`menuhub_order_token_${orderId}`);
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers,
        body: JSON.stringify(ratings)
      });
      if (res.ok) {
        toast.success("Thank you for your feedback!");
      }
      onClose();
    } catch {
      toast.error("Something went wrong.");
      onClose();
    }
  };

  const StarRow = ({ label, field }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="font-semibold text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={24}
            className={`cursor-pointer transition-all hover:scale-110 active:scale-95 ${ratings[field] >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
            onClick={() => setRatings(prev => ({ ...prev, [field]: star }))}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-slide-up relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Rate Your Experience 🌟</h2>
        <p className="text-sm text-gray-500 font-medium mb-6">Tap the stars to leave feedback.</p>

        <div className="flex flex-col mb-6 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
          <StarRow label="Food Taste" field="foodTaste" />
          <StarRow label="Service" field="service" />
          <StarRow label="Cleanliness" field="cleanliness" />
          <StarRow label="Chef" field="chef" />
          <StarRow label="Staff" field="staff" />
          <StarRow label="Comfort" field="seatingComfort" />
        </div>

        <button
          onClick={submitRating}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}

// Digital Waiter Calling Modal
function WaiterCallModal({ restaurantId, tableNumber, onClose }) {
  const [isCalling, setIsCalling] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleCall = async (type, label) => {
    setIsCalling(true);
    toast.loading(`Calling for ${label}...`, { id: "waiter-call" });
    try {
      const res = await fetch("/api/table/call-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, tableNumber, type })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request for "${label}" sent! A waiter is on their way.`, { id: "waiter-call", duration: 4000 });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        onClose();
      } else {
        toast.error(data.error || "Failed to call waiter.", { id: "waiter-call" });
      }
    } catch {
      toast.error("Failed to connect. Please try again.", { id: "waiter-call" });
    } finally {
      setIsCalling(false);
    }
  };

  const options = [
    { type: "WAITER", label: "Call Waiter", icon: "🙋‍♂️", color: "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-100" },
    { type: "WATER", label: "Request Water", icon: "🥛", color: "bg-sky-50 hover:bg-sky-100/80 text-sky-700 border-sky-100" },
    { type: "SPOONS", label: "Spoons / Plates", icon: "🍴", color: "bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-100" },
    { type: "BILL", label: "Request Bill", icon: "🧾", color: "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-100" }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-slide-up relative border border-gray-100">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Request Service 🔔</h2>
        <p className="text-sm text-gray-500 font-medium mb-6">Select what you need, and the waiter will serve you shortly.</p>

        <div className="grid grid-cols-2 gap-3 mb-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleCall(opt.type, opt.label)}
              disabled={isCalling}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${opt.color}`}
            >
              <span className="text-3xl mb-2">{opt.icon}</span>
              <span className="text-sm font-bold leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// VIP Diners Club Registration Modal
function VipClubModal({ order, onClose }) {
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState(order.customerName || "");
  const [birthday, setBirthday] = React.useState("");
  const [anniversary, setAnniversary] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsSubmitting(true);
    toast.loading("Joining Club...", { id: "vip-join" });
    try {
      const res = await fetch("/api/customer/register-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          birthday: birthday || null,
          anniversary: anniversary || null,
          restaurantId: order.restaurantId
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Welcome! You are now a VIP Club Member! 🎁🎉", { id: "vip-join", duration: 5000 });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 150]);
        onClose();
      } else {
        toast.error(data.error || "Failed to join VIP Club.", { id: "vip-join" });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "vip-join" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.25rem] shadow-2xl p-7 animate-slide-up relative border border-gray-100/50">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-full text-slate-400 hover:text-slate-600 transition-all border border-slate-100/50 shadow-sm cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
              {/* Lid (light yellow) */}
              <rect x="8" y="22" width="52" height="10" rx="3" fill="#FFE082" />
              <rect x="10" y="24" width="48" height="6" rx="1" fill="#FFD54F" />

              {/* Box (yellow) */}
              <rect x="12" y="32" width="44" height="28" rx="4" fill="#FFC107" />

              {/* Shadow detail on box right side */}
              <path d="M34 32H52V56C52 58.2091 50.2091 60 48 60H34V32Z" fill="#FFA000" fillOpacity="0.15" />

              {/* Vertical Ribbon (red) */}
              <rect x="31" y="22" width="6" height="38" fill="#D32F2F" />
              <rect x="32" y="22" width="4" height="38" fill="#E53935" />

              {/* Horizontal Ribbon on box (red) */}
              <rect x="12" y="43" width="44" height="6" fill="#D32F2F" />
              <rect x="12" y="44" width="44" height="4" fill="#E53935" />

              {/* Bow loops (red) */}
              {/* Left Loop */}
              <path d="M31.5 22C24.5 22 20.5 16 25.5 12C30.5 8 32.5 18 33.5 22Z" fill="#E53935" />
              <path d="M31.5 22C26.5 22 23.5 18.5 26.5 15.5C29.5 12.5 31.5 18.5 32.5 22Z" fill="#F44336" />

              {/* Right Loop */}
              <path d="M36.5 22C43.5 22 47.5 16 42.5 12C37.5 8 35.5 18 34.5 22Z" fill="#E53935" />
              <path d="M36.5 22C41.5 22 44.5 18.5 41.5 15.5C38.5 12.5 36.5 18.5 35.5 22Z" fill="#F44336" />

              {/* Center Knot (red) */}
              <circle cx="34" cy="22" r="4.5" fill="#D32F2F" />
              <circle cx="33.5" cy="21.5" r="2" fill="#E53935" />
            </svg>
          </div>
          <h2 className="text-[26px] font-extrabold text-slate-800 leading-tight tracking-tight">Join VIP Diners Club</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Unlock birthday/anniversary rewards & member deals!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5 block">Your Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/40 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5 block">Contact Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/40 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5 block">Birthday (Optional)</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/40 rounded-2xl px-3.5 py-3.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1.5 block">Anniversary (Optional)</label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/40 rounded-2xl px-3.5 py-3.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 mt-4 text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? "Joining Club..." : "Join & Unlock Rewards"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderItemRow({ item, orderId, now }) {
  const addedTime = new Date(item.addedAt).getTime();
  const isEditable = (now - addedTime) <= 30000;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editQty, setEditQty] = React.useState(item.quantity);

  const handleDelete = async () => {
    toast.loading("Removing...", { id: "del" });
    const token = localStorage.getItem(`menuhub_order_token_${orderId}`);
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
      method: "DELETE",
      headers
    });
    if (res.ok) toast.success("Item removed", { id: "del" });
    else toast.error("Too late to remove", { id: "del" });
  };

  const handleSaveEdit = async () => {
    toast.loading("Updating...", { id: "upd" });
    const token = localStorage.getItem(`menuhub_order_token_${orderId}`);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ quantity: editQty })
    });
    if (res.ok) {
      toast.success("Updated", { id: "upd" });
      setIsEditing(false);
    } else {
      toast.error("Update failed", { id: "upd" });
    }
  };

  return (
    <li className="flex justify-between items-start text-gray-700 font-medium bg-gray-50/50 p-2 rounded-lg relative overflow-hidden group">
      <div className="flex items-start gap-3 flex-1 relative z-10">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-indigo-200 p-1 shadow-sm">
              <button className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 font-bold" onClick={() => setEditQty(Math.max(1, editQty - 1))}>-</button>
              <span className="w-4 text-center text-sm font-bold">{editQty}</span>
              <button className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded font-bold" onClick={() => setEditQty(editQty + 1)}>+</button>
            </div>
            <div className="flex gap-1">
              <button onClick={handleSaveEdit} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14} /></button>
              <button onClick={() => setIsEditing(false)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <span className="bg-white text-gray-600 border border-gray-200 shadow-sm w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 mt-0.5">
            {item.quantity}
          </span>
        )}
        <div className="flex flex-col pr-8">
          <span className="text-gray-900 leading-tight">{item.menuItem.name}</span>
          <div className="flex items-center gap-2 mt-1">
            {item.size && (
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {item.size}
              </span>
            )}
            {item.status === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100/80">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Ready / Served
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50/50 text-indigo-500 text-[10px] font-bold rounded-md border border-indigo-100/50 animate-pulse">
                <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" /> Preparing
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 relative z-10 shrink-0 pl-2">
        <span className="text-gray-900 font-bold">
          ₹{(item.size === 'Half' && item.menuItem.halfPrice ? item.menuItem.halfPrice : item.menuItem.price) * item.quantity}
        </span>
        {isEditable && !isEditing && (
          <div className="flex gap-1 mt-1">
            <button onClick={() => setIsEditing(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-blue-100/50">
              <Edit2 size={13} />
            </button>
            <button onClick={handleDelete} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-red-100/50">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
      {isEditable && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-100 overflow-hidden">
          <div className="h-full bg-indigo-500 animate-[shrink_30s_linear]" style={{ animationPlayState: isEditing ? 'paused' : 'running', width: '100%', transformOrigin: 'left' }} />
        </div>
      )}
    </li>
  );
}

export default function OrderStatusPage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const [now, setNow] = React.useState(Date.now());
  const [hasRated, setHasRated] = React.useState(false);
  const [isPaidLocally, setIsPaidLocally] = React.useState(false);
  const [isCashLocally, setIsCashLocally] = React.useState(false);
  const [hasPlayedBell, setHasPlayedBell] = React.useState(false);
  const [isBellOpen, setIsBellOpen] = React.useState(false);
  const [isVipOpen, setIsVipOpen] = React.useState(false);
  const hasAutoOpenedVipRef = React.useRef(false);
  const wasPaidInitiallyRef = React.useRef(null);
  const [hasFinishedVip, setHasFinishedVip] = React.useState(false);
  const { order, loading, error } = useOrderPolling(unwrappedParams.orderId, 3000); // 3 sec poll

  if (order && wasPaidInitiallyRef.current === null) {
    wasPaidInitiallyRef.current = order.isPaid;
  }

  const handleRazorpayPayment = async () => {
    toast.loading("Initiating Secure Gateway...", { id: "p_init" });
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to load Razorpay SDK", { id: "p_init" });
      return;
    }

    try {
      const token = localStorage.getItem(`menuhub_order_token_${order.id}`);
      const createHeaders = { 'Content-Type': 'application/json' };
      if (token) createHeaders['Authorization'] = `Bearer ${token}`;
      const createRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: createHeaders,
        body: JSON.stringify({ orderId: order.id }),
      });
      const orderData = await createRes.json();

      if (orderData.error) {
        toast.error(orderData.error, { id: "p_init" });
        return;
      }

      toast.dismiss("p_init");

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.gatewayType === "VENDOR" && orderData.restaurantName ? orderData.restaurantName : "MenuHub Menu",
        description: `Payment for Order #${order.id}`,
        order_id: orderData.id,
        handler: async function (response) {
          toast.loading("Verifying payment...", { id: "p_verify" });
          try {
            const token = localStorage.getItem(`menuhub_order_token_${order.id}`);
            const verifyHeaders = { 'Content-Type': 'application/json' };
            if (token) verifyHeaders['Authorization'] = `Bearer ${token}`;
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: verifyHeaders,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment Verified & Successful!", { id: "p_verify" });
              setIsPaidLocally(true);
            } else {
              toast.error("Payment Verification Failed", { id: "p_verify" });
            }
          } catch (e) {
            toast.error("Network error during verification", { id: "p_verify" });
          }
        },
        prefill: {
          name: order.customerName || "Guest Admin",
          contact: "",
        },
        theme: {
          color: "#4f46e5"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error(response.error.description || "Payment Failed");
      });
      paymentObject.open();

    } catch (e) {
      toast.error("Payment setup failed", { id: "p_init" });
    }
  };

  // Prevent phone from sleeping using Wake Lock API
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) { }
    };
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) wakeLock.release();
    };
  }, []);

  // Play Bell and vibrate when bill arrives
  useEffect(() => {
    if (order?.isBillRequested && !order?.isBillApproved && !hasPlayedBell) {
      setHasPlayedBell(true);
      playChime();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, [order?.isBillRequested, order?.isBillApproved, hasPlayedBell]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (order?.status === "CLOSED") {
      toast.success("Table Reset! Session Complete.", { duration: 3000 });
      router.push(`/thank-you`);
    }
  }, [order?.status, router]);

  // Auto-open VIP Diners Club modal when payment is successfully completed (Cash or Online checkout complete)
  useEffect(() => {
    const isPaymentComplete = order?.isPaid || isPaidLocally || order?.paymentMode === "CASH" || isCashLocally;
    if (isPaymentComplete && !hasAutoOpenedVipRef.current) {
      hasAutoOpenedVipRef.current = true;
      // 1-second delay for smooth transitions and visual checkmark satisfaction
      const timer = setTimeout(() => {
        setIsVipOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order?.isPaid, isPaidLocally, order?.paymentMode, isCashLocally]);

  // Reload customer page in real-time immediately when payment status changes to paid
  useEffect(() => {
    const isPaymentDone = order?.isPaid || isPaidLocally;
    if (isPaymentDone && wasPaidInitiallyRef.current === false) {
      toast.success("Payment Received! Refreshing status...", { id: "pay-reload", duration: 3000 });
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [order?.isPaid, isPaidLocally]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4 font-semibold shadow-sm w-full max-w-sm">
          Failed to load order.
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-bold text-gray-700 bg-white border px-6 py-3 rounded-full shadow hover:bg-gray-50"
        >
          <ArrowLeft size={20} /> Go Back
        </button>
      </div>
    );
  }

  const steps = [
    { key: "ACTIVE", label: "Order Placed", icon: Clock },
    { key: "PREPARING", label: "Preparing", icon: ChefHat },
    { key: "COMPLETED", label: "Ready / Served", icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar tableNumber={order.tableNumber} restaurantName={order.restaurant?.name} restaurantLogo={order.restaurant?.logo} />
      <Toaster position="top-center" />

      <div className="pt-24 px-4 max-w-lg mx-auto pb-20">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 text-center animate-slide-up">
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div className="text-left">
              <h2 className="text-3xl font-black text-gray-900 mb-1">Order Tracking</h2>
              <p className="font-semibold text-gray-500 text-sm">
                Order ID: #{order.id} &bull; Name: {order.customerName || "Guest"}
              </p>
            </div>
            {order.status !== "CLOSED" && !order.isPaid && !order.isBillRequested && (
              <button
                onClick={() => router.push(`/r/${unwrappedParams.slug}/menu?table=${order.tableNumber}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap"
              >
                + Order More
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-500 z-10 
                    ${isPast || isCurrent
                      ? "bg-blue-600 border-blue-200 text-white"
                      : "bg-gray-100 border-white text-gray-400"}`}>
                    <Icon size={20} className={isCurrent ? "animate-pulse" : ""} />
                  </div>

                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-4 md:ml-0 p-4 rounded-xl shadow-sm border font-bold transition-all
                    ${isCurrent ? "bg-blue-50 border-blue-200 text-blue-800 scale-[1.02]" :
                      isPast ? "bg-white border-gray-100 text-gray-800" :
                        "bg-gray-50/50 border-gray-100 text-gray-400 opacity-70"}
                  `}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fade-in delay-150">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Order Summary</h3>
          <div className="space-y-6 mb-4">
            {Object.entries(
              order.items.reduce((acc, item) => {
                const round = item.roundNumber || 1;
                if (!acc[round]) acc[round] = [];
                acc[round].push(item);
                return acc;
              }, {})
            ).map(([round, itemsInRound]) => {
              const addedAtTime = new Date(itemsInRound[0].addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={round}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {round == 1 ? "1st" : round == 2 ? "2nd" : round == 3 ? "3rd" : `${round}th`} Order &bull; {addedAtTime}
                    </span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  <ul className="space-y-3">
                    {itemsInRound.map((item, idx) => (
                      <OrderItemRow key={item.id || idx} item={item} orderId={order.id} now={now} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center font-bold text-xl pt-4 border-t border-gray-100 text-gray-900">
            <span>Total</span>
            <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg">₹{order.totalAmount}</span>
          </div>
        </div>

        {order.status === "COMPLETED" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-up">
            {!order.isBillRequested ? (
              <div className="text-center">
                <h3 className="font-black text-xl mb-2 text-slate-800">Enjoy your meal!</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Your order is fully served.
                  Wait for the admin to send the final bill.
                </p>
              </div>
            ) : (!order.isBillApproved && !isCashLocally) ? (
              <div className="text-center animate-fade-in">
                <div className="bg-blue-50 text-blue-700 py-2 px-4 rounded-xl font-bold mb-4 inline-block border border-blue-100">
                  Total Bill: ₹{order.totalAmount}
                </div>
                <h3 className="font-black text-xl mb-2 text-slate-800">Please Confirm Bill & Choose Payment</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">
                  How would you like to pay?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      toast.loading("Approving...", { id: "bill" });
                      const token = localStorage.getItem(`menuhub_order_token_${order.id}`);
                      const headers = { 'Content-Type': 'application/json' };
                      if (token) headers['Authorization'] = `Bearer ${token}`;
                      await fetch(`/api/orders/${order.id}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ isBillApproved: true, paymentMode: "ONLINE" })
                      });
                      toast.success("Bill Approved!", { id: "bill" });
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                  >
                    Pay Online
                  </button>
                  <button
                    onClick={async () => {
                      toast.loading("Approving...", { id: "bill" });
                      const token = localStorage.getItem(`menuhub_order_token_${order.id}`);
                      const headers = { 'Content-Type': 'application/json' };
                      if (token) headers['Authorization'] = `Bearer ${token}`;
                      await fetch(`/api/orders/${order.id}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ isBillApproved: true, paymentMode: "CASH" })
                      });
                      toast.success("Cash Selected!", { id: "bill" });
                      setIsCashLocally(true);
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 font-bold py-4 rounded-xl transition-transform active:scale-95"
                  >
                    Pay Cash
                  </button>
                </div>
              </div>
            ) : (!order.isPaid && !isPaidLocally) ? (
              <div className="text-center">
                {order.paymentMode === "ONLINE" ? (
                  <>
                    <h3 className="font-black text-xl mb-4 text-slate-800">Online Checkout</h3>
                    <button
                      onClick={handleRazorpayPayment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      Pay ₹{order.totalAmount} Securely
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock size={32} />
                    </div>
                    <h3 className="font-black text-xl text-slate-800">Cash Payment Requested</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">Please pay ₹{order.totalAmount} to the waiter/counter.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-black text-xl text-slate-800">Payment Complete</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Waiting for admin to clear the table...</p>
              </div>
            )}
          </div>
        )}

      </div>

      {order.status === "COMPLETED" && (order.isPaid || isPaidLocally || order.paymentMode === "CASH" || isCashLocally) && !hasRated && hasFinishedVip && (
        <RatingModal orderId={order.id} onClose={() => setHasRated(true)} />
      )}

      {/* Dynamic Optional VIP Diners Club Loyalty Opt-In (Only on successful checkout payment) */}
      {(order.isPaid || isPaidLocally || order.paymentMode === "CASH" || isCashLocally) && (
        <div className="bg-gradient-to-r from-pink-50 to-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm text-center animate-slide-up mt-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">🎁</div>
          <h3 className="text-xl font-black text-slate-800 mb-1">🎁 Join our VIP Diners Club!</h3>
          <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto mb-5 leading-relaxed">
            Unlock exclusive rewards on your birthday or anniversary, and claim dynamic member discounts on your next visit!
          </p>
          <button
            onClick={() => setIsVipOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            Join & Claim Rewards
          </button>
        </div>
      )}

      {/* Floating Waiter Assistant Bell Button */}
      {order.status !== "CLOSED" && (
        <button
          onClick={() => setIsBellOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-5 py-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border border-indigo-500/20 group cursor-pointer"
        >
          <span className="animate-bounce group-hover:animate-none">🔔</span>
          <span className="text-sm tracking-wide">Call Waiter</span>
        </button>
      )}

      {isBellOpen && (
        <WaiterCallModal
          restaurantId={order.restaurantId}
          tableNumber={order.tableNumber}
          onClose={() => setIsBellOpen(false)}
        />
      )}

      {isVipOpen && (
        <VipClubModal
          order={order}
          onClose={() => {
            setIsVipOpen(false);
            setHasFinishedVip(true);
          }}
        />
      )}
    </div>
  );
}