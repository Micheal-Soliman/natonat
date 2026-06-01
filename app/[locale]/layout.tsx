import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Quicksand, Noto_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";

import "../globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { ToastProvider } from "../components/toast-provider";
import FloatingContactLoader from "../components/floating-contact-loader";
import { CartSliderWrapper } from "../components/cart-slider-wrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const arthaus = localFont({
  src: "../../public/Arthaus-Bold.ttf",
  variable: "--font-arthaus",
  display: "swap",
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
        className={`${montserrat.variable} ${quicksand.variable} ${notoSansArabic.variable} ${arthaus.variable} antialiased font-sans`}
        style={{
          fontFamily:
            locale === "ar"
              ? "var(--font-arabic), var(--font-montserrat), sans-serif"
              : "var(--font-montserrat), sans-serif",
        }}
      >
        {/* Meta Pixel Code — defer until user interaction to reduce third-party impact */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              var fired = false;
              function loadPixel(){
                if(fired) return; fired = true;
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://connect.facebook.net/en_US/fbevents.js';
                s.onload = function(){
                  try{
                    fbq('init', '1648230933094184');
                    fbq('track', 'PageView');
                  }catch(e){}
                };
                document.head.appendChild(s);
              }
              ['scroll','pointerdown','keydown','touchstart'].forEach(function(ev){
                window.addEventListener(ev, loadPixel, { once: true, passive: true });
              });
            })();
            `,
          }}
        />

        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <FloatingContactLoader />
                <CartSliderWrapper />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
