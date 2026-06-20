import type { Metadata } from "next";
import { getArticlesByLocale } from "@/app/lib/articles-data";
import { createPageMetadata } from "@/lib/seo";
import { absoluteUrl, localizedUrl, siteConfig } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    locale,
    path: "articles",
    title: "Travel Tips & Product Guides",
    description:
      "Read natOnat guides about luggage cover sizing, travel protection, RFID passport wallets, packing tips, and smart travel accessories.",
  });
}

export default async function ArticlesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const articles = getArticlesByLocale(locale);
  const blogUrl = localizedUrl(locale, "articles");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        name: "natOnat Travel Tips & Product Guides",
        url: blogUrl,
        description:
          "Travel tips, product guides, luggage cover sizing, passport wallet advice, and packing ideas from natOnat.",
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${blogUrl}#itemlist`,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: localizedUrl(locale, `articles/${article.slug}`),
          name: article.title,
          image: absoluteUrl(article.image),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: localizedUrl(locale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articles",
            item: blogUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
