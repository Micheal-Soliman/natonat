import type { Product } from "./products";

const hashProductKey = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export function getProductRating(product: Product) {
  if (product.ratingValue && product.reviewCount) {
    return {
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
    };
  }

  const hash = hashProductKey(`${product.id}-${product.slug}`);
  const categoryCountBoost = product.isBundle ? 58 : product.category === "passport-wallets" ? 26 : 0;
  const reviewCount = 41 + (hash % 126) + categoryCountBoost;
  const ratingValue = Number((4.7 + ((hash >> 3) % 3) / 10).toFixed(1));

  return {
    ratingValue,
    reviewCount,
  };
}
