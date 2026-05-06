"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface BundleSelection {
  productId: number;
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
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

  // Helper to calculate complex discounts based on Tarek's rules
  const calculateTotals = useCallback((cartItems: CartItem[]) => {
    let currentSubtotal = 0;
    let totalDiscount = 0;
    const appliedDiscounts: string[] = [];
    
    // 1. Create a flat list of all items for easier rule application
    interface FlatItem {
      id: number;
      type: string;
      price: number;
      name: string;
    }
    
    const flatItems: FlatItem[] = [];
    cartItems.forEach(item => {
      let type = item.type?.toLowerCase() || "";
      const name = item.name.toLowerCase();
      
      if (!type) {
        if (name.includes("cover")) type = "cover";
        else if (name.includes("packonat")) type = "packonat";
        else if (name.includes("passport")) type = "passport";
        else if (name.includes("bundle") || name.includes("set")) type = "bundle";
      }

      for (let i = 0; i < item.quantity; i++) {
        flatItems.push({
          id: item.id,
          type,
          price: item.price,
          name: item.name
        });
      }
    });

    const usedIndices = new Set<number>();
    let finalTotal = 0;

    // RULE 1: All Set Bundle = 2889 (Fixed Price)
    let allSetCount = 0;
    flatItems.forEach((item, idx) => {
      if (!usedIndices.has(idx) && item.name.toLowerCase().includes("all set")) {
        const discount = item.price - 2889;
        if (discount > 0) {
          totalDiscount += discount;
          allSetCount++;
        }
        finalTotal += 2889;
        usedIndices.add(idx);
      }
    });
    if (allSetCount > 0) appliedDiscounts.push("All Set Bundle Offer");

    // RULE 2: 2 Passport Wallets = 3149 (Fixed Price)
    const passportIndices = flatItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) => !usedIndices.has(idx) && item.type.includes("passport"))
      .map(({ idx }) => idx);
    
    let passportBundles = 0;
    while (passportIndices.length >= 2) {
      const idx1 = passportIndices.shift()!;
      const idx2 = passportIndices.shift()!;
      usedIndices.add(idx1); usedIndices.add(idx2);
      const pairOriginalPrice = flatItems[idx1].price + flatItems[idx2].price;
      const discount = pairOriginalPrice - 3149;
      if (discount > 0) {
        totalDiscount += discount;
        passportBundles++;
      }
      finalTotal += 3149;
    }
    if (passportBundles > 0) appliedDiscounts.push(`2 Passport Wallets Offer x${passportBundles}`);

    // RULE 3: 2 PackOnat Bundle = 1669 (Fixed Price)
    const packOnatIndices = flatItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) => !usedIndices.has(idx) && item.type.includes("packonat"))
      .map(({ idx }) => idx);
    
    let packOnatBundles = 0;
    while (packOnatIndices.length >= 2) {
      const idx1 = packOnatIndices.shift()!;
      const idx2 = packOnatIndices.shift()!;
      usedIndices.add(idx1); usedIndices.add(idx2);
      const pairOriginalPrice = flatItems[idx1].price + flatItems[idx2].price;
      const discount = pairOriginalPrice - 1669;
      if (discount > 0) {
        totalDiscount += discount;
        packOnatBundles++;
      }
      finalTotal += 1669;
    }
    if (packOnatBundles > 0) appliedDiscounts.push(`2 PackOnat Bundle Offer x${packOnatBundles}`);

    // RULE 4: 4 covers = 10% off on total covers
    const coverIndices = flatItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) => !usedIndices.has(idx) && item.type.includes("cover"))
      .map(({ idx }) => idx);
    
    if (coverIndices.length >= 4) {
      let coversPrice = 0;
      coverIndices.forEach(idx => {
        coversPrice += flatItems[idx].price;
        usedIndices.add(idx);
      });
      const discount = coversPrice * 0.10;
      totalDiscount += discount;
      finalTotal += (coversPrice - discount);
      appliedDiscounts.push("4 Covers: 10% Off on Total");
    } 
    // RULE 5: 2 covers = 5% off on 2nd cheapest one
    else if (coverIndices.length >= 2) {
      coverIndices.sort((a, b) => flatItems[a].price - flatItems[b].price);
      const cheapestIdx = coverIndices[0];
      const otherIdx = coverIndices[1];
      usedIndices.add(cheapestIdx); usedIndices.add(otherIdx);
      const discount = flatItems[cheapestIdx].price * 0.05;
      totalDiscount += discount;
      finalTotal += (flatItems[cheapestIdx].price + flatItems[otherIdx].price - discount);
      appliedDiscounts.push("2 Covers: 5% Off Cheapest");
    }

    // RULE 6: Three Sizes Bundle = 8% OFF ON TOTAL
    let threeSizesCount = 0;
    flatItems.forEach((item, idx) => {
      if (!usedIndices.has(idx) && item.name.toLowerCase().includes("three sizes")) {
        const discount = item.price * 0.08;
        totalDiscount += discount;
        finalTotal += (item.price - discount);
        usedIndices.add(idx);
        threeSizesCount++;
      }
    });
    if (threeSizesCount > 0) appliedDiscounts.push("Three Sizes Bundle: 8% Off");

    // RULE 7: Passport + Cover = 15% off on cover
    // RULE 8: PackOnat + Cover = 8% OFF ON COVER
    const remainingCovers = flatItems.map((item, idx) => ({ item, idx })).filter(({ idx }) => !usedIndices.has(idx) && flatItems[idx].type.includes("cover"));
    const remainingPassports = flatItems.map((item, idx) => ({ item, idx })).filter(({ idx }) => !usedIndices.has(idx) && flatItems[idx].type.includes("passport"));
    const remainingPackOnats = flatItems.map((item, idx) => ({ item, idx })).filter(({ idx }) => !usedIndices.has(idx) && flatItems[idx].type.includes("packonat"));

    let passportCoverMatches = 0;
    while (remainingPassports.length > 0 && remainingCovers.length > 0) {
      const pIdx = remainingPassports.shift()!.idx;
      const cIdx = remainingCovers.shift()!.idx;
      usedIndices.add(pIdx); usedIndices.add(cIdx);
      const discount = flatItems[cIdx].price * 0.15;
      totalDiscount += discount;
      finalTotal += (flatItems[pIdx].price + flatItems[cIdx].price - discount);
      passportCoverMatches++;
    }
    if (passportCoverMatches > 0) appliedDiscounts.push(`Passport + Cover: 15% Off Cover x${passportCoverMatches}`);

    let packOnatCoverMatches = 0;
    while (remainingPackOnats.length > 0 && remainingCovers.length > 0) {
      const poIdx = remainingPackOnats.shift()!.idx;
      const cIdx = remainingCovers.shift()!.idx;
      usedIndices.add(poIdx); usedIndices.add(cIdx);
      const discount = flatItems[cIdx].price * 0.08;
      totalDiscount += discount;
      finalTotal += (flatItems[poIdx].price + flatItems[cIdx].price - discount);
      packOnatCoverMatches++;
    }
    if (packOnatCoverMatches > 0) appliedDiscounts.push(`PackOnat + Cover: 8% Off Cover x${packOnatCoverMatches}`);

    // Add remaining items
    flatItems.forEach((item, idx) => {
      currentSubtotal += item.price;
      if (!usedIndices.has(idx)) {
        finalTotal += item.price;
      }
    });

    return { subtotal: currentSubtotal, discount: totalDiscount, total: finalTotal, appliedDiscounts };
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal: originalSubtotal, discount, total: subtotal, appliedDiscounts } = calculateTotals(items);

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
