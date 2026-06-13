"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";

import { useCatalogProducts } from "@/app/lib/catalog-context";

export interface BundleSelection {
  productId: number;
  productName: string;
  productSlug?: string;
  productType?: string;
  label?: string;
  size?: string;
  color?: string;
  quantity: number;
  price?: number;
  originalPrice?: number;
}

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
  isBundle?: boolean;
  bundleSelections?: BundleSelection[];
  bundleKey?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: number, size?: string, color?: string, bundleKey?: string) => void;
  updateQuantity: (id: number, delta: number, size?: string, color?: string, bundleKey?: string) => void;
  clearCart: () => void;
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  originalSubtotal: number;
  appliedDiscounts: string[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useCatalogProducts();
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
      const normalizedNewItem: Omit<CartItem, "quantity"> & { quantity?: number } = {
        ...newItem,
        bundleKey:
          newItem.isBundle
            ? newItem.bundleKey || JSON.stringify(newItem.bundleSelections || [])
            : undefined,
      };

      const existingItem = currentItems.find((item) => {
        if (item.id !== normalizedNewItem.id) return false;

        // Bundles: match by bundleSelections
        if (normalizedNewItem.isBundle && item.isBundle) {
          return item.bundleKey === normalizedNewItem.bundleKey;
        }

        // Regular items: match by size/color
        return item.size === normalizedNewItem.size && item.color === normalizedNewItem.color;
      });

      if (existingItem) {
        return currentItems.map((item) =>
          item.id !== normalizedNewItem.id
            ? item
            : normalizedNewItem.isBundle && item.isBundle
              ? item.bundleKey === normalizedNewItem.bundleKey
                ? { ...item, quantity: item.quantity + (normalizedNewItem.quantity || 1) }
                : item
              : item.size === normalizedNewItem.size && item.color === normalizedNewItem.color
                ? { ...item, quantity: item.quantity + (normalizedNewItem.quantity || 1) }
                : item
        );
      }

      return [...currentItems, { ...normalizedNewItem, quantity: qty }];
    });

    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((id: number, size?: string, color?: string, bundleKey?: string) => {
    setItems((currentItems) => 
      currentItems.filter((item) => 
        item.id !== id
          ? true
          : item.isBundle
            ? item.bundleKey !== bundleKey
            : !(item.size === size && item.color === color)
      )
    );
  }, []);

  const updateQuantity = useCallback((id: number, delta: number, size?: string, color?: string, bundleKey?: string) => {
    setItems((currentItems) => {
      const targetItem = currentItems.find(
        (item) =>
          item.id === id &&
          (item.isBundle ? item.bundleKey === bundleKey : item.size === size && item.color === color)
      );
      
      // If decreasing and quantity would become 0, remove the item
      if (delta < 0 && targetItem && targetItem.quantity <= 1) {
        return currentItems.filter(
          (item) =>
            item.id !== id
              ? true
              : item.isBundle
                ? item.bundleKey !== bundleKey
                : !(item.size === size && item.color === color)
        );
      }
      
      return currentItems.map((item) => 
        item.id === id && (item.isBundle ? item.bundleKey === bundleKey : item.size === size && item.color === color)
          ? { ...item, quantity: item.quantity + delta }
          : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  const catalogItems = useMemo(
    () =>
      items.map((item) => {
        const product = products.find((candidate) => candidate.id === item.id);
        if (!product) return item;

        const sizeKey = item.size?.toLowerCase() as keyof NonNullable<typeof product.sizePrices>;
        const sizePrice = sizeKey && product.sizePrices?.[sizeKey];
        const colorVariant = product.colors?.find(
          (variant) => variant.id === item.color || variant.name === item.color
        );
        const bundleSelections = item.bundleSelections?.map((selection) => {
          const selectedProduct = products.find(
            (candidate) => candidate.id === selection.productId
          );
          if (!selectedProduct) return selection;

          const selectionSizeKey =
            selection.size?.toLowerCase() as keyof NonNullable<typeof selectedProduct.sizePrices>;
          const selectionSizePrice =
            selectionSizeKey && selectedProduct.sizePrices?.[selectionSizeKey];

          return {
            ...selection,
            productName: selectedProduct.name,
            productSlug: selectedProduct.slug,
            productType: selectedProduct.type,
            price: selectionSizePrice?.price ?? selectedProduct.price,
            originalPrice:
              selectionSizePrice?.originalPrice ?? selectedProduct.originalPrice,
          };
        });

        return {
          ...item,
          name: product.name,
          slug: product.slug,
          type: product.type,
          image: colorVariant?.image || product.image,
          price: item.isBundle ? item.price : sizePrice?.price ?? product.price,
          originalPrice: item.isBundle
            ? item.originalPrice
            : sizePrice?.originalPrice ?? product.originalPrice,
          bundleSelections,
        };
      }),
    [items, products]
  );

  // Simple total calculation - bundle prices are already calculated by bundle-pricing system
  const calculateTotals = useCallback((cartItems: CartItem[]) => {
    let subtotal = 0;
    let originalSubtotal = 0;
    const appliedDiscounts: string[] = [];

    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
      if (item.originalPrice) {
        originalSubtotal += item.originalPrice * item.quantity;
      } else {
        originalSubtotal += item.price * item.quantity;
      }
    });

    const discount = originalSubtotal - subtotal;

    return { subtotal, discount, originalSubtotal, appliedDiscounts };
  }, []);

  const totalItems = catalogItems.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, discount, originalSubtotal, appliedDiscounts } = calculateTotals(catalogItems);

  return (
    <CartContext.Provider
      value={{
        items: catalogItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNowItem,
        setBuyNowItem,
        totalItems,
        subtotal,
        discount,
        originalSubtotal,
        appliedDiscounts,
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
