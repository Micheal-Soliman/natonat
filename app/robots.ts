import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/studio/",
          "/en/studio/",
          "/ar/studio/",
          "/en/cart",
          "/ar/cart",
          "/en/checkout",
          "/ar/checkout",
          "/en/order-confirmed",
          "/ar/order-confirmed",
          "/en/payment/",
          "/ar/payment/",
          "/en/wishlist",
          "/ar/wishlist",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
