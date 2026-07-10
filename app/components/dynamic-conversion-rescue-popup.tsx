"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, ShoppingBag, X } from "lucide-react";

type ConversionRescueSettings = {
  _updatedAt?: string;
  enabled: boolean;
  delaySeconds: number;
  dismissDays: number;
  discountCode: string;
  discountPercent: number;
  codePrefix: string;
  codeValidityHours: number;
  discountLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  copyLabel: string;
  copiedLabel: string;
  declineLabel: string;
  targetPath: string;
};

type SiteSettingsResponse = {
  conversionRescue?: ConversionRescueSettings;
};

type RescueCodeResponse = {
  success?: boolean;
  code?: string;
  percent?: number;
  label?: string;
};

const storagePrefix = "natonat-conversion-rescue";

function getStoredNumber(key: string) {
  try {
    return Number(window.localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is a convenience only; never block the shopping flow.
  }
}

function getDismissUntil(storageKey: string) {
  return getStoredNumber(`${storagePrefix}:${storageKey}:dismissUntil`);
}

function isShopPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.endsWith("/en") ||
    pathname.endsWith("/ar") ||
    pathname.includes("/shop") ||
    pathname.includes("/product/")
  );
}

function getLocalePrefix(pathname: string) {
  const match = pathname.match(/^\/(ar|en)(\/|$)/);
  return match ? `/${match[1]}` : "";
}

function localizeTargetPath(pathname: string, targetPath: string) {
  if (/^https?:\/\//i.test(targetPath)) return targetPath;

  const normalizedPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  if (/^\/(ar|en)(\/|$)/.test(normalizedPath)) return normalizedPath;

  return `${getLocalePrefix(pathname)}${normalizedPath}`;
}

function getStorageKey(settings: ConversionRescueSettings) {
  return `${settings.codePrefix || "NAT"}:${settings.discountPercent || 0}:${settings._updatedAt || "current"}`;
}

function isReady(settings?: ConversionRescueSettings | null) {
  return Boolean(
    settings?.enabled &&
      (settings.discountPercent > 0 || settings.discountCode) &&
      settings.discountLabel &&
      settings.eyebrow &&
      settings.title &&
      settings.ctaLabel,
  );
}

export function DynamicConversionRescuePopup() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<ConversionRescueSettings | null>(null);
  const [offerCode, setOfferCode] = useState("");
  const [offerLabel, setOfferLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shouldRunOnPath = useMemo(() => {
    if (!pathname) return false;
    if (
      pathname.includes("/checkout") ||
      pathname.includes("/cart") ||
      pathname.includes("/order-confirmed") ||
      pathname.includes("/studio")
    ) {
      return false;
    }

    return isShopPath(pathname);
  }, [pathname]);

  const storageKey = useMemo(() => (settings ? getStorageKey(settings) : ""), [settings]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/site-settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteSettingsResponse | null) => {
        if (!cancelled) setSettings(data?.conversionRescue || null);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openPopup = useCallback(async () => {
    if (!settings || !isReady(settings) || !shouldRunOnPath || !storageKey) return;
    if (Date.now() < getDismissUntil(storageKey)) return;

    let nextCode = "";
    let nextLabel = settings.discountLabel;

    try {
      const res = await fetch("/api/discounts/rescue-code", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await res.json()) as RescueCodeResponse;
      if (res.ok && data.success && data.code) {
        nextCode = data.code;
        nextLabel = data.label || settings.discountLabel;
      }
    } catch {
      nextCode = "";
    }

    if (!nextCode && settings.discountCode) {
      nextCode = settings.discountCode;
    }

    if (!nextCode) return;

    setOfferCode(nextCode);
    setOfferLabel(nextLabel);
    setCopied(false);

    window.gtag?.("event", "discount_rescue_popup_show", {
      offer_code: nextCode,
      reason: "time-on-site",
    });
    window.fbq?.("trackCustom", "DiscountRescuePopupShow", {
      offer_code: nextCode,
      reason: "time-on-site",
    });
    setIsOpen(true);
  }, [settings, shouldRunOnPath, storageKey]);

  useEffect(() => {
    if (!settings || !isReady(settings) || !shouldRunOnPath || !storageKey) return;
    if (Date.now() < getDismissUntil(storageKey)) return;

    const delayMs = Math.max(10, settings.delaySeconds || 30) * 1000;
    const timer = window.setTimeout(openPopup, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [openPopup, settings, shouldRunOnPath, storageKey]);

  const closePopup = useCallback(() => {
    if (!settings || !storageKey) {
      setIsOpen(false);
      return;
    }

    const dismissDays = Math.max(1, settings.dismissDays || 7);
    const dismissUntil = Date.now() + dismissDays * 24 * 60 * 60 * 1000;
    setStoredValue(`${storagePrefix}:${storageKey}:dismissUntil`, String(dismissUntil));
    setIsOpen(false);
  }, [settings, storageKey]);

  const saveCode = async () => {
    if (!settings || !offerCode) return;

    setStoredValue("natonat-saved-discount-code", offerCode);

    try {
      await navigator.clipboard.writeText(offerCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const claimCode = async () => {
    if (!settings || !pathname) return;

    await saveCode();
    setStoredValue(`${storagePrefix}:${storageKey}:claimedAt`, new Date().toISOString());
    window.gtag?.("event", "discount_rescue_claim", {
      offer_code: offerCode,
    });
    window.fbq?.("trackCustom", "DiscountRescueClaim", {
      offer_code: offerCode,
    });

    const targetUrl = new URL(localizeTargetPath(pathname, settings.targetPath || "/shop"), window.location.origin);
    targetUrl.searchParams.set("discount", offerCode);
    window.location.assign(targetUrl.toString());
    setIsOpen(false);
  };

  if (!settings || !isReady(settings) || !isOpen || !offerCode) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close discount popup"
        className="absolute inset-0 bg-[#0F1A26]/55 backdrop-blur-md"
        onClick={closePopup}
      />

      <section
        dir="auto"
        className="relative w-full max-w-[430px] overflow-hidden rounded-[30px] border border-[#EEBC3F]/35 bg-[#F8F2EA] p-2 text-center shadow-2xl shadow-black/25"
      >
        <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white px-5 pb-6 pt-7 sm:px-7 sm:pb-8 sm:pt-8">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-1 rounded-b-full bg-[#EEBC3F]" />

        <button
          type="button"
          aria-label="Close discount popup"
          onClick={closePopup}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#0F1A26]/10 bg-[#F1EBE3] text-[#0F1A26] shadow-sm transition hover:bg-[#EEBC3F]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="mx-auto inline-flex rounded-full border border-[#EEBC3F]/45 bg-[#FFF7DF] px-4 py-2 text-sm font-black text-[#0F1A26] shadow-sm">
          {settings.eyebrow}
        </p>
        <h2 className="mt-5 text-2xl font-black leading-snug text-[#0F1A26] sm:text-3xl">
          {settings.title}
        </h2>
        {settings.description ? (
          <p className="mx-auto mt-3 max-w-[330px] text-sm font-semibold leading-6 text-[#0F1A26]/60">
            {settings.description}
          </p>
        ) : null}

        <div className="relative mx-auto my-7 w-full max-w-[310px] rounded-[24px] border border-dashed border-[#EEBC3F] bg-[#FFF9EA] px-5 py-5 shadow-[0_18px_45px_rgba(15,26,38,0.08)]">
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#EEBC3F]/35 bg-white" />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#EEBC3F]/35 bg-white" />
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">
            Code
          </span>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-4xl font-black tracking-[0.12em] text-[#0F1A26]">
              {offerCode}
            </span>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-[#0F1A26] px-4 py-1.5 text-xs font-black text-[#EEBC3F]">
            {offerLabel || settings.discountLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={claimCode}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#EEBC3F] px-5 py-4 text-sm font-black text-[#0F1A26] shadow-lg shadow-[#EEBC3F]/25 transition hover:scale-[1.02] hover:bg-[#F5C84A]"
        >
          <ShoppingBag className="h-4 w-4" />
          {settings.ctaLabel}
        </button>

        {settings.copyLabel ? (
          <button
            type="button"
            onClick={saveCode}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#0F1A26]/15 bg-white text-sm font-black text-[#0F1A26] transition hover:border-[#EEBC3F]"
          >
            <Copy className="h-4 w-4" />
            {copied ? settings.copiedLabel || settings.copyLabel : settings.copyLabel}
          </button>
        ) : null}

        {settings.declineLabel ? (
          <button
            type="button"
            onClick={closePopup}
            className="mt-3 text-sm font-bold text-[#0F1A26]/55 underline-offset-4 hover:text-[#0F1A26] hover:underline"
          >
            {settings.declineLabel}
          </button>
        ) : null}
        </div>
      </section>
    </div>
  );
}
