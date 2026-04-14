"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  slug: string;
  type: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: number, size?: string, color?: string) => void;
  updateQuantity: (id: number, delta: number, size?: string, color?: string) => void;
  clearCart: () => void;
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);

  const addToCart = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = newItem.quantity || 1;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => 
        item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      }

      return [...currentItems, { ...newItem, quantity: qty }];
    });

    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((id: number, size?: string, color?: string) => {
    setItems((currentItems) => 
      currentItems.filter((item) => 
        !(item.id === id && item.size === size && item.color === color)
      )
    );
  }, []);

  const updateQuantity = useCallback((id: number, delta: number, size?: string, color?: string) => {
    setItems((currentItems) => {
      const targetItem = currentItems.find(
        (item) => item.id === id && item.size === size && item.color === color
      );
      
      // If decreasing and quantity would become 0, remove the item
      if (delta < 0 && targetItem && targetItem.quantity <= 1) {
        return currentItems.filter(
          (item) => !(item.id === id && item.size === size && item.color === color)
        );
      }
      
      // Otherwise update quantity
      return currentItems.map((item) =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNowItem,
        setBuyNowItem,
        totalItems,
        subtotal,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
