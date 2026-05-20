import type { Metadata } from "next";
import { Montserrat, Quicksand, Noto_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";

import "../globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { ToastProvider } from "../components/toast-provider";
import { FloatingContact } from "../components/floating-contact";
import { CartSliderWrapper } from "../components/cart-slider-wrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "natOnat | Pack Smart. Travel Easy.",
  description:
    "Premium travel accessories - stretchy, washable luggage covers and smart passport wallets that protect your gear and make it stand out.",
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "EUu-r19QGPFxdT77LqBBqvBBRtW6CfEJTLqc-8V6pKo",
  },
};

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

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        className={`${montserrat.variable} ${quicksand.variable} ${notoSansArabic.variable} antialiased font-sans`}
        style={{
          fontFamily:
            locale === "ar"
              ? "var(--font-arabic), var(--font-montserrat), sans-serif"
              : "var(--font-montserrat), sans-serif",
        }}
      >
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '1648230933094184');
            fbq('track', 'PageView');
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1648230933094184&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <FloatingContact />
                <CartSliderWrapper />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}