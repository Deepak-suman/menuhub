"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, Search } from "lucide-react";

import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import MenuCard from "@/components/customer/MenuCard";
import CategoryTabs from "@/components/customer/CategoryTabs";

const CartDrawer = dynamic(() => import("@/components/customer/CartDrawer"), { 
  ssr: false,
  loading: () => <div className="fixed bottom-0 left-0 right-0 h-16 bg-white animate-pulse" />
});

const OrderForm = dynamic(() => import("@/components/customer/OrderForm"), { 
  ssr: false 
});

export default function MenuClient({ 
  initialMenu, 
  initialCategories, 
  restaurantInfo, 
  tableNumber, 
  slug,
  initialTableStatus 
}) {
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFormState, setOrderFormState] = useState({ show: false, couponCode: null });
  const [isBlocked, setIsBlocked] = useState(initialTableStatus?.isBlocked || false);

  const { cart, addToCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleAddToCart = (item) => {
    addToCart(item);
    toast.success(`Added ${item.name} to cart`);
  };

  const submitOrder = async (customerName, couponCode = null) => {
    try {
      const payload = { 
        tableNumber: parseInt(tableNumber), 
        customerName, 
        cartItems: cart 
      };
      if (couponCode) payload.couponCode = couponCode;

      const res = await fetch(`/api/orders?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.orderToken) {
          localStorage.setItem(`menuhub_order_token_${data.orderId}`, data.orderToken);
        }
        clearCart();
        setOrderFormState({ show: false, couponCode: null });
        router.push(`/r/${slug}/order-status/${data.orderId}`);
      } else {
        toast.error("Failed to place order. Try again.");
      }
    } catch (error) {
      toast.error("Network error. Try again.");
    }
  };

  const handleCheckout = async (couponCode) => {
    try {
      const res = await fetch(`/api/table/${tableNumber}/status?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasActiveOrder) {
          await submitOrder(data.customerName, couponCode);
        } else {
          setOrderFormState({ show: true, couponCode });
        }
      } else {
        setOrderFormState({ show: true, couponCode });
      }
    } catch {
      setOrderFormState({ show: true, couponCode });
    }
  };

  const filteredItems = useMemo(() => {
    return initialMenu.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialMenu, selectedCategory, searchTerm]);

  if (isBlocked) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 animate-fade-in">
       <div className="text-orange-500 mb-4 bg-orange-100 p-4 rounded-full"><CheckCircle2 size={48} /></div>
       <h2 className="text-2xl font-black text-slate-800">Checkout in Progress</h2>
       <p className="text-slate-500 font-medium mt-2 max-w-xs">New orders cannot be placed at this time. Please wait for the admin to clear your table.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <Navbar tableNumber={tableNumber} restaurantName={restaurantInfo?.name} restaurantLogo={restaurantInfo?.logo} />
      <Toaster position="top-center" />
      
      <div className="pt-24 px-4 max-w-xl mx-auto">
        <CategoryTabs 
          categories={initialCategories} 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <div className="mt-1 relative z-10 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search for your favorite dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 outline-none py-2 pl-11 pr-4 rounded-2xl shadow-sm focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-bold text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          {filteredItems.map((item, index) => (
            <MenuCard key={item.id} item={item} onAdd={handleAddToCart} index={index} />
          ))}
          {filteredItems.length === 0 && (
             <div className="text-center py-10 text-gray-400 font-medium">No items found in this category.</div>
          )}
        </div>
      </div>

      <CartDrawer 
        cart={cart}
        updateQuantity={updateQuantity}
        getCartTotal={getCartTotal}
        onCheckout={handleCheckout}
        slug={slug}
      />

      {orderFormState.show && (
        <OrderForm 
          tableNumber={tableNumber}
          totalAmount={getCartTotal()}
          onCancel={() => setOrderFormState({ show: false, couponCode: null })}
          onSubmit={(name) => submitOrder(name, orderFormState.couponCode)}
        />
      )}
    </div>
  );
}
