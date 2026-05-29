"use client";
import React, { useState } from "react";
import { Ticket, Plus, Trash2, Power, PowerOff, Percent, DollarSign, ShoppingBag, Landmark } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function CouponsClient({ initialCoupons = [] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: ""
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null
        })
      });
      
      if (res.ok) {
        toast.success("Coupon created successfully!");
        setFormData({ 
          code: "", 
          discountType: "PERCENTAGE", 
          discountValue: "", 
          minOrderValue: "", 
          maxDiscount: "" 
        });
        fetchCoupons();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to create coupon");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}!`);
        fetchCoupons();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Coupon deleted!");
        fetchCoupons();
      } else {
        toast.error("Failed to delete coupon");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <Toaster />
      <div className="max-w-7xl mx-auto flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
          <Ticket size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Coupons & Offers</h1>
          <p className="text-slate-500 font-medium mt-1">Create and manage discounts for your customers.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="text-indigo-600" size={20} /> Create Coupon
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coupon Code</label>
              <input 
                required 
                type="text"
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                placeholder="e.g. EXTRA20" 
                className="w-full mt-1.5 p-3.5 bg-slate-50 border-0 rounded-2xl outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500/10 font-bold uppercase tracking-wider text-slate-800 placeholder-slate-400 transition-all" 
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discount Type</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: "PERCENTAGE" })}
                  className={`p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border ${
                    formData.discountType === "PERCENTAGE" 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Percent size={16} /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: "FIXED" })}
                  className={`p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border ${
                    formData.discountType === "FIXED" 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <DollarSign size={16} /> Fixed Amount
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Discount Value {formData.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
              </label>
              <input 
                required 
                type="number" 
                min="1" 
                value={formData.discountValue} 
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} 
                placeholder={formData.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 150"} 
                className="w-full mt-1.5 p-3.5 bg-slate-50 border-0 rounded-2xl outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-800 placeholder-slate-400 transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min Order (₹)</label>
                <input 
                  type="number" 
                  min="0" 
                  value={formData.minOrderValue} 
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} 
                  placeholder="e.g. 499" 
                  className="w-full mt-1.5 p-3.5 bg-slate-50 border-0 rounded-2xl outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-800 placeholder-slate-400 transition-all" 
                />
              </div>

              {formData.discountType === "PERCENTAGE" && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Discount (₹)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.maxDiscount} 
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} 
                    placeholder="e.g. 100" 
                    className="w-full mt-1.5 p-3.5 bg-slate-50 border-0 rounded-2xl outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-800 placeholder-slate-400 transition-all" 
                  />
                </div>
              )}
            </div>

            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95">
              <Plus size={20} /> Add Coupon
            </button>
          </form>
        </div>

        {/* Coupon Cards List */}
        <div className="lg:col-span-2">
          {loading && coupons.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                    coupon.isActive 
                      ? "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100" 
                      : "bg-slate-50/50 border-slate-200/60 opacity-70"
                  }`}
                >
                  {/* Decorative background circle */}
                  <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-all ${
                    coupon.isActive ? "bg-indigo-500/5 group-hover:bg-indigo-500/10" : "bg-slate-500/5"
                  }`} />

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-black text-indigo-600 tracking-wider bg-indigo-50 px-3 py-1 rounded-xl">
                          {coupon.code}
                        </span>
                        {!coupon.isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <p className="text-lg font-black text-slate-800">
                        {coupon.discountType === "PERCENTAGE" 
                          ? `${coupon.discountValue}% OFF` 
                          : `₹${coupon.discountValue} OFF`}
                        {coupon.maxDiscount && (
                          <span className="text-xs text-slate-400 font-medium block mt-0.5">
                            Upto ₹{coupon.maxDiscount} discount
                          </span>
                        )}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag size={13} className="text-slate-300" />
                          <span>Min Order: ₹{coupon.minOrderValue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-20">
                      <button 
                        onClick={() => toggleStatus(coupon.id, coupon.isActive)} 
                        className={`p-2.5 rounded-xl transition-all ${
                          coupon.isActive 
                            ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100" 
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200"
                        }`}
                        title={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                      >
                        {coupon.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                      </button>
                      <button 
                        onClick={() => deleteCoupon(coupon.id)} 
                        className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all border border-red-100"
                        title="Delete Coupon"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {coupons.length === 0 && (
                <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center shadow-sm">
                  <div className="text-slate-300 mb-3 flex justify-center">
                    <Ticket size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-500">No coupons created yet</h3>
                  <p className="text-slate-400 mt-1">Create your first coupon to offer discounts to customers.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
