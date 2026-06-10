import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Noto_Sans_Arabic, Quicksand } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GoogleAnalyticsPageView } from "./components/google-analytics-page-view";
import { MetaPixelPageView } from "./components/meta-pixel-page-view";
import { TikTokPixelPageView } from "./components/tiktok-pixel-page-view";

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
  src: "../public/Arthaus-Bold.ttf",
  variable: "--font-arthaus",
  display: "swap",
});

export const metadata: Metadata = {
  title: "natOnat | Pack Smart. Travel Easy.",
  description: "Premium travel accessories - stretchy, washable luggage covers and smart passport wallets that protect your gear and make it stand out.",
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "EUu-r19QGPFxdT77LqBBqvBBRtW6CfEJTLqc-8V6pKo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${quicksand.variable} ${notoSansArabic.variable} ${arthaus.variable} antialiased font-sans`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MBR1BZMFVE"
          strategy="afterInteractive"
        />

        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            if (!window.location.pathname.startsWith('/studio')) {
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
            }
          `}
        </Script>

        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            if (!window.location.pathname.startsWith('/studio')) {
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;
                var ttq=w[t]=w[t]||[];
                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){
                  for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);
                  return e
                };
                ttq.load=function(e,n){
                  var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
                  ttq._i=ttq._i||{};
                  ttq._i[e]=[];
                  ttq._i[e]._u=r;
                  ttq._t=ttq._t||{};
                  ttq._t[e]=+new Date;
                  ttq._o=ttq._o||{};
                  ttq._o[e]=n||{};
                  n=document.createElement("script");
                  n.type="text/javascript";
                  n.async=!0;
                  n.src=r+"?sdkid="+e+"&lib="+t;
                  e=document.getElementsByTagName("script")[0];
                  e.parentNode.insertBefore(n,e)
                };

                ttq.load('D8KAHABC77U29JSH68JG');
                ttq.page();
              }(window, document, 'ttq');
            }
          `}
        </Script>

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

        <GoogleAnalyticsPageView />
        <MetaPixelPageView />
        <TikTokPixelPageView />
        {children}
      </body>
    </html>
  );
}
