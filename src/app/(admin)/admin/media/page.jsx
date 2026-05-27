"use client";
import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Trash2, Copy, ExternalLink, RefreshCw, Search, Plus } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      } else {
        toast.error("Failed to load media items");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      toast.loading("Uploading image...", { id: "up_media" });
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Image uploaded successfully!", { id: "up_media" });
        fetchMedia(); // Refresh list
      } else {
        const error = await res.json();
        toast.error(error.error || "Upload failed", { id: "up_media" });
      }
    } catch (err) {
      toast.error("Network error during upload", { id: "up_media" });
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm("Are you sure you want to delete this image? It will be permanently removed from the server.")) return;

    try {
      toast.loading("Deleting...", { id: "del_media" });
      const res = await fetch(`/api/media?filename=${filename}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Image deleted", { id: "del_media" });
        setMedia(media.filter((m) => m.name !== filename));
      } else {
        toast.error("Failed to delete image", { id: "del_media" });
      }
    } catch (e) {
      toast.error("Error connecting to server", { id: "del_media" });
    }
  };

  const copyPath = (url) => {
    // Get full absolute URL
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Full path copied to clipboard!");
  };

  const filteredMedia = media.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <ImageIcon size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Media Library</h1>
            <p className="text-slate-500 font-medium">Manage all your uploaded images in one place</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search images..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <label className={`cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
             <Plus size={20} />
             <span>Upload</span>
             <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
           </label>

           <button 
             onClick={fetchMedia}
             className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
             title="Refresh"
           >
             <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="max-w-7xl mx-auto">
          {filteredMedia.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <ImageIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No images found</h3>
              <p className="text-slate-400 mt-1">Upload images in Menu or Category manage to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredMedia.map((item) => (
                <div key={item.name} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative">
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                     <img 
                       src={item.url} 
                       alt={item.name} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                     />
                     
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => window.open(item.url, '_blank')}
                          className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 transition-colors"
                          title="View Full Image"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          onClick={() => copyPath(item.url)}
                          className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 transition-colors"
                          title="Copy Full Path"
                        >
                          <Copy size={18} />
                        </button>
                     </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 truncate mb-1" title={item.name}>{item.name}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                       <span>{(item.size / 1024).toFixed(1)} KB</span>
                       <button 
                         onClick={() => handleDelete(item.name)}
                         className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                         title="Delete Image"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
