export const FREE_DELIVERY_THRESHOLD = 1600;
export const FREE_FIRST_EXCHANGE_THRESHOLD = 3000;
export const STANDARD_SHIPPING_FEE = 100;

export type CartValueTier = {
  minSubtotal: number;
  percent: number;
};

export const CART_VALUE_DISCOUNT_TIERS: CartValueTier[] = [
  { minSubtotal: 1400, percent: 5 },
  { minSubtotal: 1900, percent: 6 },
  { minSubtotal: 2500, percent: 8 },
  { minSubtotal: 3000, percent: 12 },
];

export type CartOfferMilestone = {
  threshold: number;
  amountRemaining: number;
  discountPercent: number;
  unlocksFreeDelivery: boolean;
  unlocksFreeFirstExchange: boolean;
};

export function getCartDiscountPercent(subtotal: number) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  return CART_VALUE_DISCOUNT_TIERS.reduce(
    (percent, tier) => (safeSubtotal >= tier.minSubtotal ? tier.percent : percent),
    0,
  );
}

export function getNextCartOfferMilestone(subtotal: number): CartOfferMilestone | null {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const thresholds = [1400, FREE_DELIVERY_THRESHOLD, 1900, 2500, FREE_FIRST_EXCHANGE_THRESHOLD];
  const threshold = thresholds.find((value) => safeSubtotal < value);
  if (!threshold) return null;

  return {
    threshold,
    amountRemaining: Math.max(0, threshold - safeSubtotal),
    discountPercent: getCartDiscountPercent(threshold),
    unlocksFreeDelivery:
      safeSubtotal < FREE_DELIVERY_THRESHOLD && threshold >= FREE_DELIVERY_THRESHOLD,
    unlocksFreeFirstExchange:
      safeSubtotal < FREE_FIRST_EXCHANGE_THRESHOLD && threshold >= FREE_FIRST_EXCHANGE_THRESHOLD,
  };
}

export function getCartOffer(subtotal: number) {
  const qualifyingSubtotal = Math.max(0, Number(subtotal) || 0);
  const discountPercent = getCartDiscountPercent(qualifyingSubtotal);
  const discountAmount = Math.round(qualifyingSubtotal * (discountPercent / 100));

  return {
    qualifyingSubtotal,
    discountPercent,
    discountAmount,
    discountedSubtotal: Math.max(0, qualifyingSubtotal - discountAmount),
    freeDelivery: qualifyingSubtotal >= FREE_DELIVERY_THRESHOLD,
    freeFirstExchange: qualifyingSubtotal >= FREE_FIRST_EXCHANGE_THRESHOLD,
    nextMilestone: getNextCartOfferMilestone(qualifyingSubtotal),
  };
}

export function applyCartDiscount(price: number, percent: number) {
  return Math.max(0, Math.round((Number(price) || 0) * (1 - percent / 100)));
}
