import type { MetadataRoute } from "next";
import { articlesEn } from "@/app/lib/articles-data";
import { products as fallbackProducts } from "@/lib/products";
import { localizedUrl, siteConfig } from "@/lib/seo";
import { sanityClient } from "@/sanity/lib/client";

export const revalidate = 3600;

const staticRoutes = [
  "",
  "shop",
  "about",
  "how-it-works",
  "faqs",
  "reviews",
  "articles",
  "contact",
  "legal/privacy",
  "legal/shipping",
  "legal/terms",
  "legal/warranty",
];

type SitemapProduct = {
  slug?: string;
};

async function getSitemapProducts() {
  try {
    const sanityProducts = await sanityClient.fetch<SitemapProduct[]>(
      `*[_type == "product" && isActive != false] | order(sortOrder asc, legacyId asc) {
        "slug": slug.current
      }`,
      {},
      { next: { revalidate } }
    );

    const products = sanityProducts.filter((product) => product.slug);
    return products.length > 0 ? products : fallbackProducts;
  } catch (error) {
    console.error("Falling back to local product slugs for sitemap", error);
    return fallbackProducts;
  }
}

function localizedEntry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return siteConfig.locales.map((locale) => ({
    url: localizedUrl(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        en: localizedUrl("en", path),
        ar: localizedUrl("ar", path),
      },
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSitemapProducts();

  const staticEntries = staticRoutes.flatMap((route) =>
    localizedEntry(route, route ? 0.75 : 1, route === "" || route === "shop" ? "daily" : "monthly")
  );

  const productEntries = products.flatMap((product) =>
    localizedEntry(`product/${product.slug}`, 0.9, "daily")
  );

  const articleEntries = articlesEn.flatMap((article) =>
    localizedEntry(`articles/${article.slug}`, article.featured ? 0.72 : 0.65, "monthly")
  );

  return [...staticEntries, ...productEntries, ...articleEntries];
}
