import type { Product } from "@/lib/products";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getProductStockStatus(product: Product) {
  return product.stockStatus || "in_stock";
}

export function isProductOutOfStock(product: Product) {
  return getProductStockStatus(product) === "out_of_stock" || product.stockQuantity === 0;
}

export function getProductSizeStockStatus(product: Product, size?: string | null): StockStatus {
  if (isProductOutOfStock(product)) {
    return "out_of_stock";
  }

  const sizeKey = size?.toLowerCase() as keyof NonNullable<Product["sizeStock"]> | undefined;
  if (!sizeKey) {
    return getProductStockStatus(product);
  }

  const sizeStock = product.sizeStock?.[sizeKey];
  if (sizeStock?.quantity === 0) {
    return "out_of_stock";
  }

  return sizeStock?.status || getProductStockStatus(product);
}

export function isProductSizeOutOfStock(product: Product, size?: string | null) {
  return getProductSizeStockStatus(product, size) === "out_of_stock";
}

export function getAvailableStockQuantity(product: Product, size?: string | null) {
  const sizeKey = size?.toLowerCase() as keyof NonNullable<Product["sizeStock"]> | undefined;
  const sizeQuantity = sizeKey ? product.sizeStock?.[sizeKey]?.quantity : undefined;

  if (typeof sizeQuantity === "number") return Math.max(0, sizeQuantity);
  if (typeof product.stockQuantity === "number") return Math.max(0, product.stockQuantity);
  return undefined;
}

type StockLabels = {
  inStock: string;
  lowStock: string;
  outOfStock: string;
};

export function getStockLabel(product: Product, labels: StockLabels) {
  const status = getProductStockStatus(product);

  if (status === "out_of_stock") {
    return labels.outOfStock;
  }

  if (status === "low_stock") {
    return labels.lowStock;
  }

  return labels.inStock;
}

export function getSizeStockLabel(product: Product, size: string | undefined, labels: StockLabels) {
  const status = getProductSizeStockStatus(product, size);

  if (status === "out_of_stock") {
    return labels.outOfStock;
  }

  if (status === "low_stock") {
    return labels.lowStock;
  }

  return labels.inStock;
}
