"use client";
import { useEffect, useState } from "react";
import MenuItemForm from "@/components/admin/MenuItemForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { PlusCircle, Pencil, Trash2, Utensils } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function MenuManagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/menu");
      if (res.ok) setItems(await res.json());
    } catch (e) {
      toast.error("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openForm = (item = null) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (formData) => {
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/menu/${editingItem.id}` : "/api/menu";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        toast.success(isEdit ? "Item updated!" : "Item added!");
        closeForm();
        fetchMenu();
      } else {
        toast.error("Process failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item deleted");
        fetchMenu();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            <Utensils size={28} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Menu Manager</h1>
        </div>
        <button 
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <PlusCircle size={20} /> Add New Item
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="py-4 px-6">Image</th>
                <th className="py-4 px-6">Item Name</th>
                <th className="py-4 px-6 text-center">Price (F/H)</th>
                <th className="py-4 px-6 text-center">Category</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 px-6">
                    {item.image ? (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Utensils size={18} />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-800">{item.name}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-green-600 text-[1.1rem]">₹{item.price}</span>
                      {item.halfPrice && (
                        <span className="text-xs font-semibold text-gray-400">Half: ₹{item.halfPrice}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">{item.category}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.isAvailable ? (
                      <span className="text-green-500 font-bold text-sm flex items-center justify-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Available</span>
                    ) : (
                      <span className="text-red-500 font-bold text-sm bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity items-center h-full pt-6">
                    <button 
                      onClick={() => openForm(item)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {items.length === 0 && (
                <tr>
                   <td colSpan="6" className="py-12 text-center text-gray-500 font-medium">
                     No menu items found. Start adding some delicious options!
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <MenuItemForm 
          item={editingItem} 
          onCancel={closeForm} 
          onSubmit={handleSubmit} 
        />
      )}
    </div>
  );
}