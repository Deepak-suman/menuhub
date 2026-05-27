"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { CopyPlus, Trash2, Image as ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxWidth = 300;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type || "image/jpeg", lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, file.type || "image/jpeg", 0.8);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
         setCategories(await res.json());
      }
    } catch (e) {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Category name is required");
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    if (image) {
      try {
        const compressed = await compressImage(image);
        formData.append("image", compressed);
      } catch (err) {
        formData.append("image", image);
      }
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast.success("Category added!");
        setName("");
        setImage(null);
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add category");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!confirm(`Toh you want to delete "${catName}"? This will not delete the menu items, but will orphan them from their icons.`)) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error("Failed to delete");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-600 text-white rounded-xl shadow-lg shadow-pink-600/20">
          <CopyPlus size={28} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Category Setup</h1>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ADD CATEGORY FORM */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Category Name</label>
              <input 
                type="text" 
                placeholder="e.g. Starters"
                className="w-full bg-slate-50 border border-slate-200 outline-none p-3 rounded-xl focus:border-pink-500 font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Upload Icon</label>
              <div className="relative overflow-hidden w-full bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-gray-400 group hover:border-pink-500 transition-colors">
                <ImageIcon size={24} className="mb-2 group-hover:text-pink-500" />
                <span className="text-xs font-bold text-center">
                   {image ? image.name : "Click to select"}
                </span>
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-pink-600/20 active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "+ Create Category"}
            </button>
          </form>
        </div>

        {/* CATEGORY LIST */}
        <div className="md:col-span-2">
          {loading ? (
             <LoadingSpinner />
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {categories.map(cat => (
                 <div key={cat.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative group">
                   <button 
                     onClick={() => handleDelete(cat.id, cat.name)}
                     className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                   >
                     <Trash2 size={16} />
                   </button>
                   
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden mb-3 shadow-inner">
                     {cat.icon ? (
                       <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                     ) : (
                       <ImageIcon size={24} className="text-slate-300" />
                     )}
                   </div>
                   <h3 className="font-bold text-slate-800 text-sm text-center">{cat.name}</h3>
                 </div>
               ))}
               
               {categories.length === 0 && (
                 <div className="col-span-full py-10 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 font-medium">
                   No categories yet. Create some!
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
