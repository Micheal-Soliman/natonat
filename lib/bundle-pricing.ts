import { Product } from "./products";

export type PricingRuleType =
  | "percentage_off_item" // Percentage off on specific item(s)
  | "percentage_off_total" // Percentage off on total
  | "fixed_amount_off" // Fixed amount off total
  | "buy_x_get_y" // Buy X get Y discount
  | "second_cheapest_discount" // Discount on 2nd cheapest item
  | "custom"; // Custom pricing logic

export interface PricingRule {
  type: PricingRuleType;
  targetCategories?: string[]; // Categories to apply discount to
  targetProductIds?: number[]; // Specific product IDs to apply discount to
  discountPercentage?: number; // For percentage-based rules
  discountAmount?: number; // For fixed amount rules
  minItems?: number; // Minimum items for discount
  nthItem?: number; // For "nth item gets discount" rules
}

export interface BundlePricingConfig {
  rule: PricingRule;
}

// Pricing rule configurations for different bundle types
export const bundlePricingConfigs: Record<string, BundlePricingConfig> = {
  "packonat_10_percent_off": {
    rule: {
      type: "percentage_off_item",
      targetCategories: ["packonat"],
      discountPercentage: 10,
    },
  },
  "cover_8_percent_off": {
    rule: {
      type: "percentage_off_item",
      targetCategories: ["luggage-covers"],
      discountPercentage: 8,
    },
  },
  "passport_cover_15_percent_off": {
    rule: {
      type: "percentage_off_item",
      targetCategories: ["luggage-covers"],
      discountPercentage: 15,
    },
  },
  "total_8_percent_off": {
    rule: {
      type: "percentage_off_total",
      discountPercentage: 8,
    },
  },
  "total_10_percent_off": {
    rule: {
      type: "percentage_off_total",
      discountPercentage: 10,
    },
  },
  "second_cheapest_5_percent_off": {
    rule: {
      type: "second_cheapest_discount",
      discountPercentage: 5,
    },
  },
};

export interface BundleSelection {
  productId?: number;
  size?: string;
  color?: string;
  quantity: number;
}

export interface BundleItem {
  productId?: number;
  productIds?: number[];
  quantity: number;
  label?: string;
}

/**
 * Calculate the price for a bundle based on selections and pricing rule
 */
export function calculateBundlePrice(
  bundleItems: BundleItem[],
  selections: BundleSelection[],
  products: Product[],
  pricingRuleKey: string
): { price: number; originalPrice: number } {
  const config = bundlePricingConfigs[pricingRuleKey];
  if (!config) {
    return { price: 0, originalPrice: 0 };
  }

  const rule = config.rule;
  let totalPrice = 0;
  let totalOriginalPrice = 0;
  const itemPrices: { price: number; originalPrice: number; productId: number }[] = [];

  // Calculate base prices for all items
  bundleItems.forEach((item, index) => {
    const selection = selections[index] || {};
    const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
    const product = selectedProductId ? products.find((p) => p.id === selectedProductId) : undefined;

    if (product) {
      let itemPrice = product.price;
      let itemOriginalPrice = product.originalPrice;

      // Get price based on selected size if available
      if (selection.size && product.sizePrices) {
        const sizePrice = product.sizePrices[selection.size as keyof typeof product.sizePrices];
        if (sizePrice) {
          itemPrice = sizePrice.price;
          itemOriginalPrice = sizePrice.originalPrice;
        }
      }

      totalPrice += itemPrice * item.quantity;
      totalOriginalPrice += itemOriginalPrice * item.quantity;

      itemPrices.push({
        price: itemPrice * item.quantity,
        originalPrice: itemOriginalPrice * item.quantity,
        productId: product.id,
      });
    }
  });

  // Apply pricing rule
  let discount = 0;

  switch (rule.type) {
    case "percentage_off_item": {
      // Apply percentage discount to specific items
      itemPrices.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const shouldApply = rule.targetCategories?.includes(product.category as string) ||
            rule.targetProductIds?.includes(product.id);
          
          if (shouldApply && rule.discountPercentage) {
            discount += item.price * (rule.discountPercentage / 100);
          }
        }
      });
      break;
    }

    case "percentage_off_total": {
      // Apply percentage discount to total
      if (rule.discountPercentage) {
        discount = totalPrice * (rule.discountPercentage / 100);
      }
      break;
    }

    case "fixed_amount_off": {
      // Apply fixed amount discount
      if (rule.discountAmount) {
        discount = rule.discountAmount;
      }
      break;
    }

    case "second_cheapest_discount": {
      // Apply discount to 2nd cheapest item
      if (itemPrices.length >= 2 && rule.discountPercentage) {
        const sortedPrices = [...itemPrices].sort((a, b) => a.price - b.price);
        const secondCheapest = sortedPrices[1];
        discount = secondCheapest.price * (rule.discountPercentage / 100);
      }
      break;
    }

    case "buy_x_get_y": {
      // Buy X get Y discount logic
      if (rule.minItems && rule.discountPercentage) {
        const applicableItems = itemPrices.filter((item) => {
          const product = products.find((p) => p.id === item.productId);
          return rule.targetCategories?.includes(product?.category as string) ||
            rule.targetProductIds?.includes(product?.id || 0);
        });

        if (applicableItems.length >= rule.minItems) {
          const cheapestItem = applicableItems.sort((a, b) => a.price - b.price)[0];
          discount = cheapestItem.price * (rule.discountPercentage / 100);
        }
      }
      break;
    }

    case "custom": {
      // Custom pricing logic - can be extended
      break;
    }
  }

  const finalPrice = Math.max(0, Math.round(totalPrice - discount));
  const finalOriginalPrice = Math.round(totalOriginalPrice);

  return { price: finalPrice, originalPrice: finalOriginalPrice };
}

/**
 * Get pricing rule key from product
 */
export function getPricingRuleKey(product: Product): string | null {
  if (product.pricingRule) {
    return product.pricingRule;
  }
  return null;
}
