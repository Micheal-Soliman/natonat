"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useToast } from "@/app/components/toast-provider";
import {
  getAvailableStockQuantity,
  isProductOutOfStock,
  isProductSizeOutOfStock,
} from "@/lib/product-stock";

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
  priceOverride?: boolean;
  lockedVariant?: boolean;
  promotionLabel?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    item: Omit<CartItem, "quantity"> & { quantity?: number },
    options?: { openCart?: boolean }
  ) => boolean;
  validateQuantity: (
    item: Omit<CartItem, "quantity"> & { quantity?: number } | CartItem,
    requestedQuantity: number
  ) => boolean;
  removeFromCart: (id: number, size?: string, color?: string, bundleKey?: string) => void;
  updateQuantity: (id: number, delta: number, size?: string, color?: string, bundleKey?: string) => void;
  updateCartItem: (
    id: number,
    current: { size?: string; color?: string; bundleKey?: string },
    updates: Partial<Pick<CartItem, "size" | "color" | "image" | "price" | "originalPrice">>
  ) => void;
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
  const stockT = useTranslations("stock");
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cart');
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const isCartItemUnavailable = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number } | CartItem | null) => {
      if (!item) return false;

      const product = products.find((candidate) => candidate.id === item.id);
      if (product && isProductSizeOutOfStock(product, item.size)) return true;

      return Boolean(
        item.bundleSelections?.some((selection) => {
          const selectedProduct = products.find(
            (candidate) => candidate.id === selection.productId
          );
          return selectedProduct
            ? isProductOutOfStock(selectedProduct) ||
                isProductSizeOutOfStock(selectedProduct, selection.size)
            : false;
        })
      );
    },
    [products]
  );

  const getCartItemMaxQuantity = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number } | CartItem) => {
    const limits: number[] = [];
    const parentProduct = products.find((candidate) => candidate.id === item.id);
    if (parentProduct) {
      const parentAvailable = getAvailableStockQuantity(parentProduct, item.size);
      if (typeof parentAvailable === "number") limits.push(parentAvailable);
    }

    if (item.isBundle && item.bundleSelections?.length) {
      const componentLimits = item.bundleSelections.flatMap((selection) => {
        const product = products.find((candidate) => candidate.id === selection.productId);
        if (!product) return [];
        const available = getAvailableStockQuantity(product, selection.size);
        return typeof available === "number"
          ? [Math.floor(available / Math.max(1, selection.quantity || 1))]
          : [];
      });
      limits.push(...componentLimits);
    }

    return limits.length ? Math.min(...limits) : undefined;
  }, [products]);

  const validateQuantity = useCallback((
    item: Omit<CartItem, "quantity"> & { quantity?: number } | CartItem,
    requestedQuantity: number,
  ) => {
    const maxQuantity = getCartItemMaxQuantity(item);
    const unavailable = isCartItemUnavailable(item);

    if (!unavailable && (typeof maxQuantity !== "number" || requestedQuantity <= maxQuantity)) {
      return true;
    }

    const availableQuantity = Math.max(0, maxQuantity ?? 0);
    showToast({
      title: availableQuantity > 0
        ? stockT("limitTitle", { count: availableQuantity })
        : stockT("outOfStock"),
      description: availableQuantity > 0
        ? stockT("limitDescription", {
            product: item.name,
            requested: requestedQuantity,
            count: availableQuantity,
          })
        : stockT("unavailableDescription", { product: item.name }),
    });
    return false;
  }, [getCartItemMaxQuantity, isCartItemUnavailable, showToast, stockT]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cart', JSON.stringify(items));
      } catch {
        // Ignore storage quota/privacy errors; cart still works for the session.
      }
    }
  }, [items]);

  const addToCart = useCallback((
    newItem: Omit<CartItem, "quantity"> & { quantity?: number },
    options?: { openCart?: boolean }
  ) => {
    const qty = newItem.quantity || 1;
    const normalizedNewItem: Omit<CartItem, "quantity"> & { quantity?: number } = {
      ...newItem,
      bundleKey:
        newItem.isBundle
          ? newItem.bundleKey || JSON.stringify(newItem.bundleSelections || [])
          : newItem.bundleKey,
    };
    const existingItem = items.find((item) => {
      if (item.id !== normalizedNewItem.id) return false;

      if (normalizedNewItem.isBundle && item.isBundle) {
        return item.bundleKey === normalizedNewItem.bundleKey;
      }

      return item.size === normalizedNewItem.size &&
        item.color === normalizedNewItem.color &&
        item.bundleKey === normalizedNewItem.bundleKey;
    });
    const requestedQuantity = (existingItem?.quantity || 0) + qty;

    if (!validateQuantity(normalizedNewItem, requestedQuantity)) return false;

    setItems((currentItems) => {
      const maxQuantity = getCartItemMaxQuantity(normalizedNewItem);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id !== normalizedNewItem.id
            ? item
            : normalizedNewItem.isBundle && item.isBundle
              ? item.bundleKey === normalizedNewItem.bundleKey
                ? { ...item, quantity: Math.min(item.quantity + (normalizedNewItem.quantity || 1), maxQuantity ?? Number.POSITIVE_INFINITY) }
                : item
              : item.size === normalizedNewItem.size &&
                  item.color === normalizedNewItem.color &&
                  item.bundleKey === normalizedNewItem.bundleKey
                ? { ...item, quantity: Math.min(item.quantity + (normalizedNewItem.quantity || 1), maxQuantity ?? Number.POSITIVE_INFINITY) }
                : item
        );
      }

      return [...currentItems, { ...normalizedNewItem, quantity: Math.min(qty, maxQuantity ?? Number.POSITIVE_INFINITY) }];
    });

    if (options?.openCart !== false) {
      setIsOpen(true);
    }
    return true;
  }, [getCartItemMaxQuantity, items, validateQuantity]);

  const removeFromCart = useCallback((id: number, size?: string, color?: string, bundleKey?: string) => {
    setItems((currentItems) => 
      currentItems.filter((item) => 
        item.id !== id
          ? true
          : item.isBundle
            ? item.bundleKey !== bundleKey
            : !(item.size === size && item.color === color && item.bundleKey === bundleKey)
      )
    );
  }, []);

  const updateQuantity = useCallback((id: number, delta: number, size?: string, color?: string, bundleKey?: string) => {
    const targetItem = items.find(
      (item) =>
        item.id === id &&
        (item.isBundle
          ? item.bundleKey === bundleKey
          : item.size === size && item.color === color && item.bundleKey === bundleKey)
    );

    if (!targetItem) return;
    if (delta > 0 && !validateQuantity(targetItem, targetItem.quantity + delta)) return;

    setItems((currentItems) => {
      // If decreasing and quantity would become 0, remove the item
      if (delta < 0 && targetItem.quantity <= 1) {
        return currentItems.filter(
          (item) =>
            item.id !== id
              ? true
              : item.isBundle
                ? item.bundleKey !== bundleKey
                : !(item.size === size && item.color === color && item.bundleKey === bundleKey)
        );
      }
      
      return currentItems.map((item) => 
        item.id === id &&
        (item.isBundle
          ? item.bundleKey === bundleKey
          : item.size === size && item.color === color && item.bundleKey === bundleKey)
          ? {
              ...item,
              quantity: delta > 0
                ? Math.min(
                    item.quantity + delta,
                    getCartItemMaxQuantity(item) ?? Number.POSITIVE_INFINITY,
                  )
                : item.quantity + delta,
            }
          : item
      );
    });
  }, [getCartItemMaxQuantity, items, validateQuantity]);

  const updateCartItem = useCallback((
    id: number,
    current: { size?: string; color?: string; bundleKey?: string },
    updates: Partial<Pick<CartItem, "size" | "color" | "image" | "price" | "originalPrice">>
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id &&
        (item.isBundle
          ? item.bundleKey === current.bundleKey
          : item.size === current.size &&
            item.color === current.color &&
            item.bundleKey === current.bundleKey)
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(null);
  const setBuyNowItem = useCallback(
    (item: CartItem | null) => {
      if (!item || isCartItemUnavailable(item)) {
        setBuyNowItemState(null);
        return;
      }

      const maxQuantity = getCartItemMaxQuantity(item);
      if (typeof maxQuantity === "number" && maxQuantity <= 0) {
        setBuyNowItemState(null);
        return;
      }

      setBuyNowItemState({
        ...item,
        quantity: Math.min(item.quantity || 1, maxQuantity ?? Number.POSITIVE_INFINITY),
      });
    },
    [getCartItemMaxQuantity, isCartItemUnavailable]
  );

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
        const maxQuantity = getCartItemMaxQuantity({ ...item, bundleSelections });

        return {
          ...item,
          name: product.name,
          slug: product.slug,
          type: product.type,
          image: item.lockedVariant ? item.image : colorVariant?.image || product.image,
          price: item.isBundle || item.priceOverride ? item.price : sizePrice?.price ?? product.price,
          originalPrice: item.isBundle || item.priceOverride
            ? item.originalPrice
            : sizePrice?.originalPrice ?? product.originalPrice,
          bundleSelections,
          quantity: Math.min(item.quantity, maxQuantity ?? Number.POSITIVE_INFINITY),
        };
      }),
    [getCartItemMaxQuantity, items, products]
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
        validateQuantity,
        removeFromCart,
        updateQuantity,
        updateCartItem,
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
