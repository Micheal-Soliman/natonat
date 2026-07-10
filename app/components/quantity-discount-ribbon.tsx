"use client";

import { useQuantityDiscountSettings } from "@/app/lib/site-settings-context";

type QuantityDiscountRibbonProps = {
  className?: string;
  compact?: boolean;
  seed?: number;
};

export function QuantityDiscountRibbon({
  className = "",
  compact = false,
}: QuantityDiscountRibbonProps) {
  const settings = useQuantityDiscountSettings();
  const firstTier = settings.enabled ? settings.tiers[0] : null;

  if (!firstTier) return null;

  const label = settings.ribbonLabel;

  return (
    <div
      className={`pointer-events-none inline-flex max-w-[calc(100%-1rem)] -rotate-2 animate-[discount-flag-wave_2.4s_ease-in-out_infinite] items-center overflow-hidden bg-[#EE3535] text-white shadow-[0_10px_18px_rgba(238,53,53,0.28)] ring-1 ring-white/45 [clip-path:polygon(0_8%,86%_8%,100%_50%,86%_92%,0_92%)] ${compact ? "h-7 min-w-[104px] px-2.5 py-1 pe-5 text-[8px] sm:h-8 sm:min-w-[122px] sm:text-[9px]" : "h-9 min-w-[150px] px-3 py-1.5 pe-7 text-[10px] sm:h-10 sm:min-w-[180px] sm:text-xs"} font-black uppercase tracking-[0.02em] ${className}`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.34)_22%,transparent_44%)] translate-x-[-140%] animate-[ribbon-shine_2.4s_ease-in-out_infinite]" />
      <span className="absolute end-[9%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/70 shadow-inner" />
      <span className="relative min-w-0 leading-none drop-shadow-[0_1px_0_rgba(0,0,0,0.18)]">
        <span className="block truncate whitespace-nowrap">
          {label}
        </span>
      </span>
    </div>
  );
}
