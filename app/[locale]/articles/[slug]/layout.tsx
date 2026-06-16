import type { Metadata } from "next";
import { getArticleBySlug } from "@/app/lib/articles-data";
import { absoluteUrl, createPageMetadata, localizedUrl, siteConfig } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug, locale);

  if (!article) {
    return {
      title: "Article not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    ...createPageMetadata({
      locale,
      path: `articles/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      image: article.image,
      type: "article",
    }),
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: localizedUrl(locale, `articles/${article.slug}`),
      siteName: "natOnat",
      images: [absoluteUrl(article.image)],
      type: "article",
      locale,
      publishedTime: article.date,
      authors: [article.author],
      section: article.category,
    },
  };
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug, locale);

  if (!article) return children;

  const articleUrl = localizedUrl(locale, `articles/${article.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        headline: article.title,
        description: article.excerpt,
        image: [absoluteUrl(article.image)],
        datePublished: new Date(article.date).toISOString(),
        dateModified: new Date(article.date).toISOString(),
        author: {
          "@type": "Organization",
          name: article.author,
          url: siteConfig.url,
        },
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        articleSection: article.category,
        inLanguage: locale,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
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
            item: localizedUrl(locale, "articles"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: articleUrl,
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
