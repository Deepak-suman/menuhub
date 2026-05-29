"use client";
import React, { useState, useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Store, Users, ExternalLink, Activity, ShieldAlert, CheckCircle2, Settings2, CreditCard, X, Zap, Crown,RefreshCw } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

// --- Vendor Settings Modal ---
function VendorSettingsModal({ vendor, onClose, onSave }) {
  const [form, setForm] = useState({
    plan: vendor.plan || "FREE",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    platformFee: vendor.platformFee || 0,
    commissionPercent: vendor.commissionPercent || 0,
    gstPercent: vendor.gstPercent || 0,
    chargesNote: vendor.chargesNote || "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch full vendor details (including masked secret)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/super-admin/restaurants/${vendor.id}`);
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            plan: data.plan || "FREE",
            razorpayKeyId: data.razorpayKeyId || "",
            razorpayKeySecret: "",
            platformFee: data.platformFee || 0,
            commissionPercent: data.commissionPercent || 0,
            gstPercent: data.gstPercent || 0,
            chargesNote: data.chargesNote || "",
          }));
        }
      } catch (e) {
        console.error(e);
      }
      setFetching(false);
    })();
  }, [vendor.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        plan: form.plan,
        platformFee: parseFloat(form.platformFee) || 0,
        commissionPercent: parseFloat(form.commissionPercent) || 0,
        gstPercent: parseFloat(form.gstPercent) || 0,
        chargesNote: form.chargesNote,
      };
      // Only send gateway keys if user entered new values
      if (form.razorpayKeyId) payload.razorpayKeyId = form.razorpayKeyId;
      if (form.razorpayKeySecret) payload.razorpayKeySecret = form.razorpayKeySecret;
      // If switching to FREE, clear vendor keys
      if (form.plan === "FREE") {
        payload.razorpayKeyId = "";
        payload.razorpayKeySecret = "";
      }

      const res = await fetch(`/api/super-admin/restaurants/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success("Vendor settings saved!");
        onSave(updated);
        onClose();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e) {
      toast.error("Network error");
    }
    setLoading(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings2 size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">{vendor.name}</h2>
              <p className="text-slate-300 text-sm font-medium">{vendor.vendorEmail}</p>
            </div>
          </div>
        </div>

        {fetching ? (
          <div className="p-10 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* Plan Selection */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Payment Gateway Plan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plan: "FREE" })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.plan === "FREE" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={18} className={form.plan === "FREE" ? "text-emerald-600" : "text-slate-400"} />
                    <span className={`font-black text-lg ${form.plan === "FREE" ? "text-emerald-700" : "text-slate-700"}`}>Free</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Admin gateway used. Payments go to your account.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plan: "PAID" })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.plan === "PAID" ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={18} className={form.plan === "PAID" ? "text-indigo-600" : "text-slate-400"} />
                    <span className={`font-black text-lg ${form.plan === "PAID" ? "text-indigo-700" : "text-slate-700"}`}>Paid</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Vendor&apos;s own gateway. Payments go directly to vendor.</p>
                </button>
              </div>
            </div>

            {/* Vendor Gateway Keys (only for PAID) */}
            {form.plan === "PAID" && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3 animate-fade-in">
                <h4 className="font-bold text-indigo-800 flex items-center gap-2 text-sm"><CreditCard size={16} /> Vendor Razorpay Credentials</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Razorpay Key ID</label>
                  <input name="razorpayKeyId" value={form.razorpayKeyId} onChange={handleChange} placeholder="rzp_live_..." className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Razorpay Secret Key <span className="text-slate-400 font-normal">(leave blank to keep existing)</span></label>
                  <input name="razorpayKeySecret" value={form.razorpayKeySecret} onChange={handleChange} type="password" placeholder="Enter new secret or leave blank" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono" />
                </div>
              </div>
            )}

            {/* Charges Section */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Vendor Charges</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Platform Fee (₹)</label>
                  <input name="platformFee" type="number" step="0.01" min="0" value={form.platformFee} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Commission (%)</label>
                  <input name="commissionPercent" type="number" step="0.1" min="0" max="100" value={form.commissionPercent} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">GST (%)</label>
                  <input name="gstPercent" type="number" step="0.1" min="0" max="100" value={form.gstPercent} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold" />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Charges Note (optional)</label>
              <textarea name="chargesNote" value={form.chargesNote} onChange={handleChange} rows={2} placeholder="e.g. Special deal — first 3 months free" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none font-semibold text-slate-700" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || fetching} className="flex-1 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all disabled:opacity-50 active:scale-[0.98]">
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Register Restaurant Modal ---
function RegisterRestaurantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.restaurantName) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Restaurant registered successfully! 🎉");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to register restaurant.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up relative border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Store size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Register Restaurant</h2>
              <p className="text-emerald-100 text-xs font-semibold">Onboard a new SaaS tenant</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Owner Name</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="e.g. John Doe" 
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Email Address</label>
            <input 
              name="email" 
              type="email"
              value={form.email} 
              onChange={handleChange} 
              placeholder="owner@restaurant.com" 
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Restaurant/Cafe Name</label>
            <input 
              name="restaurantName" 
              value={form.restaurantName} 
              onChange={handleChange} 
              placeholder="e.g. The Italian Bistro" 
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Password</label>
            <input 
              name="password" 
              type="password"
              value={form.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex gap-3 bg-slate-50/20 -mx-6 -mb-6 p-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? "Registering..." : "Onboard Restaurant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function SuperAdminClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/restaurants");
      if (res.ok) {
        const parsed = await res.json();
        setData(parsed);
      }
    } catch (err) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? "Activating" : "Suspending";
    toast.loading(`${actionText}...`, { id: "status_update" });
    try {
      const res = await fetch(`/api/super-admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (res.ok) {
        toast.success(`Restaurant ${newStatus ? 'Activated' : 'Suspended'}!`, { id: "status_update" });
        setData(prev => ({
          ...prev,
          restaurants: prev.restaurants.map(r => r.id === id ? { ...r, isActive: newStatus } : r)
        }));
      } else {
        toast.error("Failed to update status", { id: "status_update" });
      }
    } catch (err) {
      toast.error("Network error. Try again.", { id: "status_update" });
    }
  };

  const handleVendorSettingsSave = (updated) => {
    setData(prev => ({
      ...prev,
      restaurants: prev.restaurants.map(r => r.id === updated.id ? {
        ...r,
        plan: updated.plan,
        platformFee: updated.platformFee,
        commissionPercent: updated.commissionPercent,
        gstPercent: updated.gstPercent,
        chargesNote: updated.chargesNote,
        hasGateway: updated.hasGateway !== undefined ? updated.hasGateway : !!updated.razorpayKeyId,
      } : r)
    }));
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Platform Overview
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage and monitor all SaaS tenants.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm active:scale-95"
          >
            <Store size={18} /> Register Restaurant
          </button>
          <button 
            onClick={fetchDashboard}
            className="p-3 bg-white border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Dashboard"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl shrink-0"><Store size={24} /></div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Tenants</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{data.stats.totalRestaurants}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0"><Users size={24} /></div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Vendors</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{data.stats.totalVendors}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-pink-50 text-pink-500 flex items-center justify-center rounded-2xl shrink-0"><Activity size={24} /></div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Orders</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{data.stats.platformOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-green-50 text-green-600 flex items-center justify-center rounded-2xl shrink-0"><Zap size={24} /></div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Free Plan</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{data.stats.freeVendors}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 flex items-center justify-center rounded-2xl shrink-0"><Crown size={24} /></div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Paid Plan</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{data.stats.paidVendors}</h3>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800">Registered Restaurants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold text-xs uppercase border-b border-slate-100 tracking-wider">
                <th className="p-4 pl-6">Restaurant</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Charges</th>
                <th className="p-4">Status</th>
                <th className="p-4">Orders</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700 text-sm">
              {data.restaurants.map(rest => (
                <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-bold text-slate-900 block">{rest.name}</span>
                    <span className="text-xs font-bold text-slate-400">/{rest.slug}</span>
                  </td>
                  <td className="p-4">
                    <span className="block font-bold text-slate-800">{rest.vendorName}</span>
                    <span className="text-xs text-slate-400">{rest.vendorEmail}</span>
                  </td>
                  <td className="p-4">
                    {rest.plan === "PAID" ? (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700">
                        <Crown size={12} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700">
                        <Zap size={12} /> Free
                      </span>
                    )}
                    {rest.plan === "PAID" && (
                      <span className={`block text-[10px] font-bold mt-1.5 ${rest.hasGateway ? "text-green-600" : "text-rose-500"}`}>
                        {rest.hasGateway ? "✓ Gateway Set" : "✗ No Gateway"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-xs space-y-0.5 font-bold text-slate-600">
                      {rest.platformFee > 0 && <div>Fee: <span className="font-black text-slate-800">₹{rest.platformFee}</span></div>}
                      {rest.commissionPercent > 0 && <div>Comm: <span className="font-black text-slate-800">{rest.commissionPercent}%</span></div>}
                      {rest.gstPercent > 0 && <div>GST: <span className="font-black text-slate-800">{rest.gstPercent}%</span></div>}
                      {!rest.platformFee && !rest.commissionPercent && !rest.gstPercent && <span className="text-slate-300 font-medium">No charges</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    {rest.isActive ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <ShieldAlert size={14} /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-800">
                    {rest.totalOrders} <span className="text-xs text-slate-400 font-medium">({rest.totalItems} items)</span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedVendor(rest)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Settings2 size={14} /> Manage
                      </button>
                      <button
                        onClick={() => toggleRestaurantStatus(rest.id, rest.isActive)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all active:scale-95 shadow-sm ${rest.isActive
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                      >
                        {rest.isActive ? "Suspend" : "Activate"}
                      </button>
                      <Link
                        href={`/r/${rest.slug}/menu?table=1`}
                        target="_blank"
                        className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shadow-sm"
                        title="View Live Menu"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {data.restaurants.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">No restaurants onboarded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Settings Modal */}
      {selectedVendor && (
        <VendorSettingsModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onSave={handleVendorSettingsSave}
        />
      )}

      {/* Register Restaurant Modal */}
      {showRegisterModal && (
        <RegisterRestaurantModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
}
