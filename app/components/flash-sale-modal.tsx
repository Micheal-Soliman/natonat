"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ShoppingBag, X } from "lucide-react";
import type { FlashSaleSettings } from "@/lib/sanity-site-settings";

function getRemainingTime(endsAt: string) {
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - Date.now());

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function FlashSaleModal({ settings }: { settings: FlashSaleSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingTime(settings.endsAt));

  const storageKey = useMemo(
    () => `natonat-flash-sale-dismissed:${settings._updatedAt || settings.endsAt || settings.title}`,
    [settings._updatedAt, settings.endsAt, settings.title],
  );

  const product = settings.product;
  const imageUrl = settings.imageUrl || product?.imageUrl || "/logo-after.png";
  const productHref = product?.slug ? `/product/${product.slug}` : null;
  const hasCountdown = Boolean(settings.endsAt);

  useEffect(() => {
    if (!settings.enabled) return;
    const forceShow = new URLSearchParams(window.location.search).get("flashSale") === "1";

    if (!forceShow && hasCountdown && getRemainingTime(settings.endsAt).total <= 0) return;

    let dismissed: string | null = null;
    try {
      dismissed = !forceShow ? window.sessionStorage.getItem(storageKey) : null;
    } catch {
      dismissed = null;
    }
    if (dismissed) return;

    const timer = window.setTimeout(() => setIsOpen(true), forceShow ? 100 : 1200);
    return () => window.clearTimeout(timer);
  }, [hasCountdown, settings.enabled, settings.endsAt, storageKey]);

  useEffect(() => {
    if (!isOpen || !hasCountdown) return;

    const timer = window.setInterval(() => {
      const next = getRemainingTime(settings.endsAt);
      setRemaining(next);

      if (next.total <= 0) {
        setIsOpen(false);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasCountdown, isOpen, settings.endsAt]);

  const closeModal = () => {
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage errors; closing the modal should still work.
    }
    setIsOpen(false);
  };

  if (!isOpen || !settings.enabled) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close sale modal"
        className="absolute inset-0 bg-[#0F1A26]/65 backdrop-blur-sm"
        onClick={closeModal}
      />

      <section className="relative w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/25">
        <button
          type="button"
          aria-label="Close sale modal"
          onClick={closeModal}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0F1A26] shadow-lg transition-colors hover:bg-[#EEBC3F]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[260px] bg-[#F1EBE3]">
            <Image
              src={imageUrl}
              alt={product?.name || settings.title}
              fill
              sizes="(max-width: 768px) 92vw, 360px"
              className="object-contain p-8"
              priority
            />
            {settings.badge && (
              <span className="absolute left-5 top-5 rounded-full bg-[#EEBC3F] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0F1A26]">
                {settings.badge}
              </span>
            )}
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            {settings.eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#EEBC3F]">
                {settings.eyebrow}
              </p>
            )}
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#0F1A26] md:text-4xl">
              {settings.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#0F1A26]/65 md:text-base">
              {settings.description}
            </p>

            {product && (
              <div className="mt-5 border-y border-[#0F1A26]/10 py-4">
                <p className="text-sm font-semibold text-[#0F1A26]/55">{product.type}</p>
                <p className="mt-1 text-lg font-bold text-[#0F1A26]">{product.name}</p>
                {typeof product.price === "number" && (
                  <div className="mt-2 flex items-center gap-3">
                    {typeof product.originalPrice === "number" && (
                      <span className="text-sm text-[#0F1A26]/35 line-through">
                        EGP {product.originalPrice}
                      </span>
                    )}
                    <span className="text-2xl font-black text-[#0F1A26]">EGP {product.price}</span>
                  </div>
                )}
              </div>
            )}

            {hasCountdown && (
              <div className="mt-5">
                {settings.discountLabel && (
                  <p className="mb-3 text-sm font-semibold text-[#B88300]">{settings.discountLabel}</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Days", value: remaining.days },
                    { label: "Hours", value: remaining.hours },
                    { label: "Min", value: remaining.minutes },
                    { label: "Sec", value: remaining.seconds },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[#0F1A26] px-2 py-3 text-center text-white">
                      <span className="block text-xl font-black">{formatNumber(item.value)}</span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productHref && (
              <div className="mt-6">
                <Link
                  href={productHref}
                  onClick={closeModal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EEBC3F] px-5 py-3 text-sm font-bold text-[#0F1A26] transition-colors hover:bg-[#0F1A26] hover:text-white"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {settings.ctaLabel || product?.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
