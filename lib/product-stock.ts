import type { Product } from "@/lib/products";

export function getProductStockStatus(product: Product) {
  return product.stockStatus || "in_stock";
}

export function isProductOutOfStock(product: Product) {
  return getProductStockStatus(product) === "out_of_stock";
}

export function getStockLabel(product: Product, locale: string) {
  const status = getProductStockStatus(product);

  if (status === "out_of_stock") {
    return locale === "ar" ? "غير متاح حاليًا" : "Out of stock";
  }

  if (status === "low_stock") {
    return locale === "ar" ? "كمية محدودة" : "Low stock";
  }

  return locale === "ar" ? "متاح" : "In stock";
}

