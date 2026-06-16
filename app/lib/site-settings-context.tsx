"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SiteSettings, SizeGuideItem } from "@/lib/sanity-site-settings";

type SiteSettingsContextValue = SiteSettings;

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const settings = useContext(SiteSettingsContext);

  if (!settings) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }

  return settings;
}

export function useSizeGuide() {
  return useSiteSettings().sizeGuide;
}

export function useSizeGuideSizes() {
  const sizeGuide = useSizeGuide();

  return useMemo(
    () =>
      sizeGuide.sizes.map((size: SizeGuideItem) => ({
        id: size.size.toLowerCase(),
        label: size.size,
        range: size.cm.includes("cm") ? size.cm : `${size.cm} cm`,
        height: size.type,
        cm: size.cm,
        inch: size.inch,
        note: size.note,
      })),
    [sizeGuide.sizes],
  );
}
