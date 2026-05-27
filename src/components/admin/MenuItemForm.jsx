import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Upload } from "lucide-react";

export default function MenuItemForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    halfPrice: "",
    category: "Main Course",
    isAvailable: true,
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) {
           setCategories(data);
           // Auto-select first category if no item is being edited and category isn't set
           if (data.length > 0 && !item && formData.category === "Main Course") {
             setFormData(prev => ({ ...prev, category: data[0].name }));
           }
         } else {
           console.error("Expected array for categories, got:", data);
         }
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        price: item.price,
        halfPrice: item.halfPrice || "",
        category: item.category,
        isAvailable: item.isAvailable,
      });
      if (item.image) setPreview(item.image);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (categories.length === 0) {
       alert("Please create a category first in the Admin Categories panel.");
       return;
    }
    
    setLoading(true);
    
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("price", formData.price);
    submitData.append("category", formData.category);
    submitData.append("isAvailable", formData.isAvailable);
    
    if (formData.halfPrice) {
      submitData.append("halfPrice", formData.halfPrice);
    }
    
    if (imageFile) {
      submitData.append("image", imageFile);
    }

    await onSubmit(submitData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {item ? "Edit Menu Item" : "Add New Item"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-5">
            
            {/* Image Upload Area */}
            <div className="flex justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${
                  preview ? 'border-transparent shadow-md' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                }`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white" size={24} />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" size={28} />
                    <span className="text-xs font-semibold text-gray-500 text-center px-2">Upload<br/>Photo</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Garlic Naan"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Price (₹)</label>
                <input
                  required
                  type="number"
                  name="price"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="250"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Half Price (₹) <span className="text-xs text-gray-400 font-normal">Optional</span></label>
                <input
                  type="number"
                  name="halfPrice"
                  min="0"
                  value={formData.halfPrice}
                  onChange={handleChange}
                  placeholder="150"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
              >
                {categories.map(c => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {categories.length === 0 && <option value="">Create a category first...</option>}
              </select>
            </div>

            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-transparent mt-2">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <span className="font-semibold text-gray-700 select-none">Available for order</span>
            </label>
          </div>

          <div className="mt-8 flex gap-3 pb-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
