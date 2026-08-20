"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useToast } from "@/app/components/toast-provider";
import {
  applyCartDiscount,
  getCartOffer,
  type CartOfferMilestone,
} from "@/lib/cart-offers";
import {
  getAvailableStockQuantity,
  isProductOutOfStock,
  isProductSizeOutOfStock,
} from "@/lib/product-stock";
import { isLegacyBundleCartItem } from "@/lib/legacy-bundles";

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
  basePrice?: number;
  originalPrice?: number;
  quantityDiscountPercent?: number;
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
  offerSubtotal: number;
  offerDiscount: number;
  offerDiscountPercent: number;
  freeDelivery: boolean;
  freeFirstExchange: boolean;
  nextOfferMilestone: CartOfferMilestone | null;
  appliedDiscounts: string[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "cart";
const BUY_NOW_STORAGE_KEY = "natonat-buy-now-item";

function readStoredCartItems() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => !isLegacyBundleCartItem(item))
      : [];
  } catch {
    return [];
  }
}

function readStoredBuyNowItem() {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) && !isLegacyBundleCartItem(parsed)
      ? parsed as CartItem
      : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useCatalogProducts();
  const stockT = useTranslations("stock");
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(readStoredCartItems);
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
      const componentLimits: number[] = [];
      item.bundleSelections.forEach((selection) => {
        const product = products.find((candidate) => candidate.id === selection.productId);
        if (!product) return;
        const available = getAvailableStockQuantity(product, selection.size);
        if (typeof available === "number") {
          componentLimits.push(Math.floor(available / Math.max(1, selection.quantity || 1)));
        }
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
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota/privacy errors; cart still works for the session.
    }
  }, [items]);

  const addToCart = useCallback((
    newItem: Omit<CartItem, "quantity"> & { quantity?: number },
    options?: { openCart?: boolean }
  ) => {
    if (isLegacyBundleCartItem(newItem)) return false;

    const qty = newItem.quantity || 1;
    const normalizedNewItem: Omit<CartItem, "quantity"> & { quantity?: number } = {
      ...newItem,
      basePrice: newItem.basePrice ?? newItem.price,
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

  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(readStoredBuyNowItem);

  useEffect(() => {
    try {
      if (buyNowItem) {
        window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(buyNowItem));
      } else {
        window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota/privacy errors; buy-now still works for this render.
    }
  }, [buyNowItem]);

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

      const quantity = Math.min(item.quantity || 1, maxQuantity ?? Number.POSITIVE_INFINITY);
      const basePrice = item.basePrice ?? item.price;
      const discountPercent = getCartOffer(basePrice * quantity).discountPercent;

      setBuyNowItemState({
        ...item,
        basePrice,
        price: applyCartDiscount(basePrice, discountPercent),
        originalPrice: Math.max(item.originalPrice ?? basePrice, basePrice),
        quantityDiscountPercent: discountPercent,
        quantity,
      });
    },
    [getCartItemMaxQuantity, isCartItemUnavailable]
  );

  const catalogItems = useMemo(
    () => {
      const refreshedItems = items.filter((item) => !isLegacyBundleCartItem(item)).map((item) => {
        const product = products.find((candidate) => candidate.id === item.id);
        if (!product) {
          return {
            ...item,
            basePrice: item.basePrice ?? item.price,
          };
        }

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
        const basePrice = item.isBundle || item.priceOverride
          ? item.basePrice ?? item.price
          : sizePrice?.price ?? product.price;
        const originalPrice = item.isBundle || item.priceOverride
          ? item.originalPrice
          : sizePrice?.originalPrice ?? product.originalPrice;

        return {
          ...item,
          name: product.name,
          slug: product.slug,
          type: product.type,
          image: item.lockedVariant ? item.image : colorVariant?.image || product.image,
          basePrice,
          price: basePrice,
          originalPrice,
          bundleSelections,
          quantity: Math.min(item.quantity, maxQuantity ?? Number.POSITIVE_INFINITY),
        };
      });

      const offerSubtotal = refreshedItems.reduce(
        (sum, item) => sum + (item.basePrice ?? item.price) * item.quantity,
        0,
      );
      const discountPercent = getCartOffer(offerSubtotal).discountPercent;

      return refreshedItems.map((item) => {
        const basePrice = item.basePrice ?? item.price;
        const discountedPrice = applyCartDiscount(basePrice, discountPercent);
        const originalPrice = Math.max(item.originalPrice ?? basePrice, basePrice);

        return {
          ...item,
          price: discountedPrice,
          originalPrice,
          quantityDiscountPercent: discountPercent,
        };
      });
    },
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

    const offerSubtotal = cartItems.reduce(
      (sum, item) => sum + (item.basePrice ?? item.price) * item.quantity,
      0,
    );
    const offer = getCartOffer(offerSubtotal);
    const discountPercent = offer.discountPercent;
    if (discountPercent > 0) {
      appliedDiscounts.push(`${discountPercent}%`);
    }

    const discount = originalSubtotal - subtotal;

    return {
      subtotal,
      discount,
      originalSubtotal,
      appliedDiscounts,
      offerSubtotal,
      offerDiscount: offer.discountAmount,
      offerDiscountPercent: offer.discountPercent,
      freeDelivery: offer.freeDelivery,
      freeFirstExchange: offer.freeFirstExchange,
      nextOfferMilestone: offer.nextMilestone,
    };
  }, []);

  const totalItems = catalogItems.reduce((sum, item) => sum + item.quantity, 0);
  const totals = calculateTotals(catalogItems);

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
        ...totals,
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
