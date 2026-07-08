"use client";

import { useTranslations } from "next-intl";

import { useQuantityDiscountSettings } from "@/app/lib/site-settings-context";

type QuantityDiscountRibbonProps = {
  className?: string;
  compact?: boolean;
  seed?: number;
};

export function QuantityDiscountRibbon({
  className = "",
  compact = false,
  seed = 0,
}: QuantityDiscountRibbonProps) {
  const t = useTranslations("quantityDiscount");
  const settings = useQuantityDiscountSettings();
  const firstTier = settings.enabled ? settings.tiers[0] : null;

  if (!firstTier) return null;

  const visibleTiers = settings.tiers.slice(0, 3);
  const selectedTier = visibleTiers[Math.abs(seed) % visibleTiers.length] || firstTier;

  return (
    <div
      className={`pointer-events-none inline-flex max-w-[calc(100%-1rem)] -rotate-2 animate-[discount-flag-wave_2.4s_ease-in-out_infinite] items-center overflow-hidden bg-[#EE3535] text-white shadow-[0_14px_24px_rgba(238,53,53,0.32)] ring-1 ring-white/45 [clip-path:polygon(0_8%,86%_8%,100%_50%,86%_92%,0_92%)] ${compact ? "h-9 min-w-[140px] px-3 py-1.5 pe-7 text-[9px] sm:min-w-[156px] sm:text-[10px]" : "h-12 min-w-[220px] px-5 py-2 pe-10 text-xs sm:min-w-[260px] sm:text-sm"} font-black uppercase tracking-[0.03em] ${className}`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.34)_22%,transparent_44%)] translate-x-[-140%] animate-[ribbon-shine_2.4s_ease-in-out_infinite]" />
      <span className="absolute end-[9%] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/70 shadow-inner" />
      <span className="relative min-w-0 leading-none drop-shadow-[0_1px_0_rgba(0,0,0,0.18)]">
        <span className="block truncate whitespace-nowrap">
          {t("ribbon", {
            count: selectedTier.minQuantity,
            percent: selectedTier.percent,
          })}
        </span>
      </span>
    </div>
  );
}
