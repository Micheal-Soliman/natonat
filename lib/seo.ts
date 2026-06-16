import type { Metadata } from "next";

export const siteConfig = {
  name: "natOnat",
  title: "natOnat | Pack Smart. Travel Easy.",
  description:
    "Premium travel accessories in Egypt, including washable luggage covers, smart passport wallets, PackOnat organizers, and curated travel bundles.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.natonat.com").replace(/\/$/, ""),
  defaultLocale: "en",
  locales: ["en", "ar"] as const,
  ogImage: "/logo-after.png",
  twitterHandle: "@natonat",
};

export type SiteLocale = (typeof siteConfig.locales)[number];

export function isSiteLocale(locale: string): locale is SiteLocale {
  return siteConfig.locales.includes(locale as SiteLocale);
}

export function absoluteUrl(path = "") {
  if (!path) return siteConfig.url;
  return path.startsWith("http")
    ? path
    : `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localizedPath(locale: string, path = "") {
  const cleanPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `/${locale}${cleanPath}`;
}

export function localizedUrl(locale: string, path = "") {
  return absoluteUrl(localizedPath(locale, path));
}

export function languageAlternates(path = "") {
  return {
    en: localizedUrl("en", path),
    ar: localizedUrl("ar", path),
    "x-default": localizedUrl(siteConfig.defaultLocale, path),
  };
}

type PageMetadataInput = {
  locale: string;
  path?: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function createPageMetadata({
  locale,
  path = "",
  title,
  description,
  image = siteConfig.ogImage,
  type = "website",
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = localizedUrl(locale, path);
  const images = [absoluteUrl(image)];

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
        alternates: noIndex
      ? undefined
      : {
          canonical: url,
          languages: languageAlternates(path),
          types: {
            "application/rss+xml": `${siteConfig.url}/rss.xml`,
            "application/feed+json": `${siteConfig.url}/feed.json`,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images,
      type,
      locale,
      alternateLocale: siteConfig.locales.filter((item) => item !== locale),
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title,
      description,
      images,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
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
  };
}

export function createNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
