import type { Product } from "@/lib/products";

export function getProductStockStatus(product: Product) {
  return product.stockStatus || "in_stock";
}

export function isProductOutOfStock(product: Product) {
  return getProductStockStatus(product) === "out_of_stock" || product.stockQuantity === 0;
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
