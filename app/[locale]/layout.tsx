import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartProvider } from "../lib/cart-context";
import { CatalogProvider } from "../lib/catalog-context";
import { SiteSettingsProvider } from "../lib/site-settings-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { ToastProvider } from "../components/toast-provider";
import FloatingContactLoader from "../components/floating-contact-loader";
import { CartSliderWrapper } from "../components/cart-slider-wrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCatalogProducts } from "@/lib/sanity-products";
import { getSiteSettings } from "@/lib/sanity-site-settings";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return {
    ...createPageMetadata({
      locale,
      title: isArabic
        ? "نات أونات | مستلزمات سفر ذكية في مصر"
        : "natOnat | Pack Smart. Travel Easy.",
      description: isArabic
        ? "تسوق أغلفة شنط السفر ومحافظ الباسبور وباك أونات من نات أونات داخل مصر."
        : "Premium travel accessories - stretchy, washable luggage covers and smart passport wallets that protect your gear and make it stand out.",
    }),
    icons: {
      icon: "/favicon.ico",
    },
    verification: {
      google: "EUu-r19QGPFxdT77LqBBqvBBRtW6CfEJTLqc-8V6pKo",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, products, siteSettings] = await Promise.all([
    getMessages({ locale }),
    getCatalogProducts(),
    getSiteSettings(),
  ]);

  return (
    <div
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      style={{
        fontFamily:
          locale === "ar"
            ? "var(--font-arabic), var(--font-montserrat), sans-serif"
            : "var(--font-montserrat), sans-serif",
      }}
    >
        <NextIntlClientProvider messages={messages}>
          <SiteSettingsProvider settings={siteSettings}>
            <CatalogProvider products={products}>
              <ToastProvider>
                <CartProvider>
                  <WishlistProvider>
                    {children}
                    <FloatingContactLoader />
                    <CartSliderWrapper />
                  </WishlistProvider>
                </CartProvider>
              </ToastProvider>
            </CatalogProvider>
          </SiteSettingsProvider>
        </NextIntlClientProvider>
    </div>
  );
}
