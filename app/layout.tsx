import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Noto_Sans_Arabic, Quicksand } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GoogleAnalyticsPageView } from "./components/google-analytics-page-view";
import { MetaPixelPageView } from "./components/meta-pixel-page-view";
import { TikTokPixelPageView } from "./components/tiktok-pixel-page-view";
import { YandexMetrikaPageView } from "./components/yandex-metrika-page-view";
import { absoluteUrl, siteConfig } from "@/lib/seo";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const arthaus = localFont({
  src: "../public/Arthaus-Bold.ttf",
  variable: "--font-arthaus",
  display: "swap",
});

const metaPixelId =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  process.env.META_PIXEL_ID ||
  "2086939301892626";
const tiktokPixelId =
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ||
  "D8SH7VRC77U9LDPEEDM0";
const googleAnalyticsId =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.GOOGLE_ANALYTICS_ID ||
  "G-MBR1BZMFVE";
const yandexMetrikaId =
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ||
  "110397858";
const yandexWebvisorEnabled = process.env.NEXT_PUBLIC_YANDEX_WEBVISOR === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: "%s | natOnat",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "Travel accessories",
  keywords: [
    "natOnat",
    "luggage covers Egypt",
    "suitcase cover",
    "passport wallet Egypt",
    "travel accessories Egypt",
    "PackOnat",
  ],
  alternates: {
    canonical: siteConfig.url,
    languages: {
      en: `${siteConfig.url}/en`,
      ar: `${siteConfig.url}/ar`,
      "x-default": `${siteConfig.url}/en`,
    },
    types: {
      "application/rss+xml": `${siteConfig.url}/rss.xml`,
      "application/feed+json": `${siteConfig.url}/feed.json`,
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [absoluteUrl(siteConfig.ogImage)],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: absoluteUrl("/logo-after.png"),
        sameAs: [
          "https://www.facebook.com/natonateg",
          "https://www.instagram.com/natonateg",
          "https://www.tiktok.com/@natonateg",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.url}/en/shop?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://analytics.tiktok.com" />
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body
        className={`${montserrat.variable} ${quicksand.variable} ${notoSansArabic.variable} ${arthaus.variable} antialiased font-sans`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            if (!window.location.pathname.startsWith('/studio')) {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            }
          `}
        </Script>

        <Script id="meta-pixel" strategy="lazyOnload">
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

              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            }
          `}
        </Script>

        <Script id="tiktok-pixel" strategy="lazyOnload">
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

                ttq.load('${tiktokPixelId}');
                ttq.page();
              }(window, document, 'ttq');
            }
          `}
        </Script>

        <Script id="yandex-metrika" strategy="lazyOnload">
          {`
            if (!window.location.pathname.startsWith('/studio')) {
              window.setTimeout(function(){
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${yandexMetrikaId}', 'ym');

                ym(${yandexMetrikaId}, 'init', {
                  ssr: true,
                  webvisor: ${yandexWebvisorEnabled ? "true" : "false"},
                  clickmap: ${yandexWebvisorEnabled ? "true" : "false"},
                  ecommerce: "dataLayer",
                  referrer: document.referrer,
                  url: location.href,
                  accurateTrackBounce: true,
                  trackLinks: true
                });
              }, 9000);
            }
          `}
        </Script>

        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>

        <GoogleAnalyticsPageView />
        <MetaPixelPageView />
        <TikTokPixelPageView />
        <YandexMetrikaPageView />
        {children}
      </body>
    </html>
  );
}
