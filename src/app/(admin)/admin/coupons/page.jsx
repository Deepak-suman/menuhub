"use client";
import { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, Power, PowerOff } from "lucide-react";
import toast from "react-hot-toast";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "", maxDiscount: ""
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      toast.success("Coupon created!");
      setFormData({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "", maxDiscount: "" });
      fetchCoupons();
    } else {
      toast.error("Failed to create coupon");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    if(!confirm("Delete this coupon?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    fetchCoupons();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
          <Ticket size={28} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Manage Coupons</h1>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-4">Create New</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Coupon Code</label>
              <input required value={formData.code} onChange={(e)=>setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. WELCOME10" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Discount Type</label>
              <select value={formData.discountType} onChange={(e)=>setFormData({...formData, discountType: e.target.value})} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Discount Value</label>
              <input required type="number" min="1" value={formData.discountValue} onChange={(e)=>setFormData({...formData, discountValue: e.target.value})} placeholder={formData.discountType === 'PERCENTAGE' ? "e.g. 10" : "e.g. 100"} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Min Order Value (₹)</label>
              <input type="number" min="0" value={formData.minOrderValue} onChange={(e)=>setFormData({...formData, minOrderValue: e.target.value})} placeholder="e.g. 499" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {formData.discountType === 'PERCENTAGE' && (
              <div>
                <label className="text-sm font-semibold text-gray-600">Max Discount (₹)</label>
                <input type="number" min="1" value={formData.maxDiscount} onChange={(e)=>setFormData({...formData, maxDiscount: e.target.value})} placeholder="e.g. 100" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={20} /> Add Coupon
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {loading ? <p>Loading...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className={`p-5 rounded-2xl border ${coupon.isActive ? 'bg-white border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-indigo-600 tracking-wider bg-indigo-50 px-3 py-1 rounded-lg inline-block mb-2">{coupon.code}</h3>
                      <p className="text-sm font-bold text-gray-700">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        {coupon.maxDiscount && ` (Upto ₹${coupon.maxDiscount})`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Min Order: ₹{coupon.minOrderValue}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={()=>toggleStatus(coupon.id, coupon.isActive)} className={`p-2 rounded-lg ${coupon.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        {coupon.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                      </button>
                      <button onClick={()=>deleteCoupon(coupon.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <p className="text-gray-500 col-span-full">No coupons created yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
