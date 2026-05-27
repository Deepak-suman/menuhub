import { useState, useEffect } from "react";

export function useCart() {
  const [cart, setCart] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("restaurant_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("restaurant_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    const size = item.size || "Full";
    const cartItemId = `${item.id}-${size}`;

    setCart((prev) => {
      const existingItem = prev.find((i) => i.cartItemId === cartItemId);
      if (existingItem) {
        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, size, cartItemId, quantity: 1 }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) return removeFromCart(cartItemId);
    setCart((prev) =>
      prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  };
}
