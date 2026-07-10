export type QuantityDiscountTier = {
  minQuantity: number;
  percent: number;
  label?: string;
};

export type QuantityDiscountSettings = {
  enabled: boolean;
  title: string;
  description: string;
  ribbonLabel: string;
  tiers: QuantityDiscountTier[];
};

export const fallbackQuantityDiscount: QuantityDiscountSettings = {
  enabled: true,
  title: "Bundle more, save more",
  description: "Add more products to unlock automatic order discounts.",
  ribbonLabel: "Buy more, save more",
  tiers: [
    { minQuantity: 2, percent: 7, label: "2 items" },
    { minQuantity: 3, percent: 10, label: "3 items" },
    { minQuantity: 4, percent: 15, label: "4+ items" },
  ],
};

export function normalizeQuantityDiscountSettings(
  settings?: Partial<QuantityDiscountSettings> | null,
): QuantityDiscountSettings {
  const tiers = (settings?.tiers || fallbackQuantityDiscount.tiers)
    .map((tier) => ({
      minQuantity: Math.max(2, Math.floor(Number(tier.minQuantity) || 0)),
      percent: Math.max(0, Math.min(90, Number(tier.percent) || 0)),
      label: tier.label?.trim(),
    }))
    .filter((tier) => tier.minQuantity > 1 && tier.percent > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity);

  return {
    ...fallbackQuantityDiscount,
    ...settings,
    enabled: settings?.enabled ?? fallbackQuantityDiscount.enabled,
    title: settings?.title?.trim() || fallbackQuantityDiscount.title,
    description: settings?.description?.trim() || fallbackQuantityDiscount.description,
    ribbonLabel: settings?.ribbonLabel?.trim() || fallbackQuantityDiscount.ribbonLabel,
    tiers: tiers.length ? tiers : fallbackQuantityDiscount.tiers,
  };
}

export function getQuantityDiscountPercent(
  quantity: number,
  settings: QuantityDiscountSettings,
) {
  if (!settings.enabled || quantity <= 0) return 0;

  return settings.tiers.reduce(
    (highest, tier) => (quantity >= tier.minQuantity ? Math.max(highest, tier.percent) : highest),
    0,
  );
}

export function getNextQuantityDiscount(
  quantity: number,
  settings: QuantityDiscountSettings,
) {
  if (!settings.enabled) return null;
  return settings.tiers.find((tier) => quantity < tier.minQuantity) || null;
}

export function applyQuantityDiscount(price: number, percent: number) {
  return Math.max(0, Math.round(price * (1 - percent / 100)));
}
