"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, Search } from "lucide-react";

import Navbar from "@/components/shared/Navbar";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import MenuCard from "@/components/customer/MenuCard";
import CategoryTabs from "@/components/customer/CategoryTabs";
import CartDrawer from "@/components/customer/CartDrawer";
import OrderForm from "@/components/customer/OrderForm";

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug } = useParams();
  const tableNumber = searchParams.get("table"); 
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLogo, setRestaurantLogo] = useState("");
  const [orderFormState, setOrderFormState] = useState({ show: false, couponCode: null });
  const [isBlocked, setIsBlocked] = useState(false);

  const { cart, addToCart, updateQuantity, getCartTotal, clearCart } = useCart();

  useEffect(() => {
    // If no table is specified in the URL, block the flow
    if (!tableNumber) {
      toast.error("Invalid Table! Please scan the QR code again.", { duration: Infinity });
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      try {
        const [menuRes, catsRes, statusRes] = await Promise.all([
          fetch(`/api/menu?slug=${slug}`),
          fetch(`/api/categories?slug=${slug}`),
          fetch(`/api/table/${tableNumber}/status?slug=${slug}`)
        ]);

        if (statusRes.ok) {
           const statusData = await statusRes.json();
           if (statusData.restaurantName) {
             setRestaurantName(statusData.restaurantName);
           }
           if (statusData.restaurantLogo) {
             setRestaurantLogo(statusData.restaurantLogo);
           }
           if (statusData.isBlocked) {
             setIsBlocked(true);
             setLoading(false);
             return;
           }
        }

        if (menuRes.ok && catsRes.ok) {
          const menuData = await menuRes.json();
          const catsData = await catsRes.json();
          setMenuItems(menuData);
          setCategories(catsData);
        } else {
          toast.error("Failed to load menu data");
        }
      } catch (error) {
        toast.error("Network error while connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [tableNumber]);

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
        // Redirect to order status page with the order ID safely
        router.push(`/r/${slug}/order-status/${data.orderId}`);
      } else {
        toast.error("Failed to place order. Try again.");
      }
    } catch (error) {
      toast.error("Network error. Try again.");
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!tableNumber) return <div className="h-screen flex items-center justify-center font-bold text-red-500">Missing Table Information in URL</div>;
  if (isBlocked) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 animate-fade-in">
       <div className="text-orange-500 mb-4 bg-orange-100 p-4 rounded-full"><CheckCircle2 size={48} /></div>
       <h2 className="text-2xl font-black text-slate-800">Checkout in Progress</h2>
       <p className="text-slate-500 font-medium mt-2 max-w-xs">New orders cannot be placed at this time. Please wait for the admin to clear your table.</p>
    </div>
  );

  // Filter items based on category selection and search term
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async (couponCode) => {
    try {
      const res = await fetch(`/api/table/${tableNumber}/status?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasActiveOrder) {
          // Skip modal, place order directly on existing customer name
          await submitOrder(data.customerName, couponCode);
        } else {
          // Show form for new order entry
          setOrderFormState({ show: true, couponCode });
        }
      } else {
        setOrderFormState({ show: true, couponCode });
      }
    } catch {
      setOrderFormState({ show: true, couponCode });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <Navbar tableNumber={tableNumber} restaurantName={restaurantName} restaurantLogo={restaurantLogo} />
      <Toaster position="top-center" />
      
      <div className="pt-24 px-4 max-w-xl mx-auto">
        <CategoryTabs 
          categories={categories} 
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
          {filteredItems.map(item => (
            <MenuCard key={item.id} item={item} onAdd={handleAddToCart} />
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
          totalAmount={getCartTotal()} // Note: OrderForm displays the un-discounted cart total or you can pass finalTotal. For now passing getCartTotal
          onCancel={() => setOrderFormState({ show: false, couponCode: null })}
          onSubmit={(name) => submitOrder(name, orderFormState.couponCode)}
        />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <MenuContent />
    </Suspense>
  );
}