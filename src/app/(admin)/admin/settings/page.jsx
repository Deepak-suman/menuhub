"use client";
import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Settings, Upload, X, Store, CheckCircle2, Camera } from "lucide-react";
import Image from "next/image";

export default function VendorSettingsPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/vendor/settings");
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
          setName(data.name || "");
          setLogoUrl(data.logo || "");
        } else {
          toast.error("Failed to load settings");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sirf image files allowed hain (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image 5MB se kam honi chahiye");
      return;
    }

    setUploading(true);
    toast.loading("Logo upload ho raha hai...", { id: "logo_upload" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        toast.success("Logo upload ho gaya!", { id: "logo_upload" });
      } else {
        toast.error(data.error || "Upload failed", { id: "logo_upload" });
      }
    } catch {
      toast.error("Network error during upload", { id: "logo_upload" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Restaurant naam required hai");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logo: logoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setRestaurant(data);
        toast.success("Settings save ho gayi! ✅");
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl("");
    toast("Logo remove ho jayega jab save karoge", { icon: "ℹ️" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Restaurant Settings</h1>
            <p className="text-slate-500 font-medium text-sm mt-0.5">Apna naam aur logo customize karein</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Logo Section */}
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-1">Restaurant Logo</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Ye logo customer ko menu page aur bill par dikhega
            </p>

            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Restaurant Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-blue-300">
                      <Store size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Logo</span>
                    </div>
                  )}
                </div>
                {logoUrl && (
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-blue-500 bg-blue-50 scale-[1.01]"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-xl transition-colors ${dragOver ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                      <Camera size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        {uploading ? "Upload ho raha hai..." : "Click karein ya drag & drop karein"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP — max 5MB</p>
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />

                {uploading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-semibold">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Restaurant Name Section */}
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-1">Restaurant Name</h2>
            <p className="text-sm text-slate-500 font-medium mb-5">
              Ye naam customer ko navbar aur bill par dikhega
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Restaurant ka naam..."
              className="w-full border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-xl px-4 py-3.5 font-bold text-slate-800 text-lg transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          {/* Info Row */}
          <div className="px-8 py-5 bg-slate-50/80 border-b border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Restaurant Slug</span>
              <span className="font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg font-mono">
                /{restaurant?.slug || "—"}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-8">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  Settings Save Karein
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Card */}
        {(logoUrl || name) && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Live Preview — Navbar</p>
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={20} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-none">{name || "Restaurant Name"}</p>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mt-0.5">Restaurant</p>
                </div>
              </div>
              <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-lg border border-orange-200 text-sm">
                Table 1
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
