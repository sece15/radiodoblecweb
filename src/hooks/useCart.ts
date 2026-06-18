import { useState, useCallback } from "react";
import { CartItem, Product } from "@/types";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  const addToCart = useCallback((product: Product, color: string, size: string) => {
    const cartItemId = `${product.id}-${color}-${size}`;
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIdx > -1) {
        const newCart = [...prevCart];
        newCart[existingIdx].quantity += 1;
        return newCart;
      }
      return [
        ...prevCart,
        {
          id: cartItemId,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.variantImages?.[color] || product.imageUrl,
          },
          color,
          size,
          quantity: 1,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  }, []);

  const updateCartItemQuantity = useCallback((cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    setCart,
    isCartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
  };
}
export type { CartItem };

