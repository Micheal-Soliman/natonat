import { articlesEn } from "@/app/lib/articles-data";
import { absoluteUrl, localizedUrl, siteConfig } from "@/lib/seo";

export const revalidate = 3600;

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function GET() {
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: `${siteConfig.name} Blog`,
    home_page_url: localizedUrl("en", "articles"),
    feed_url: `${siteConfig.url}/feed.json`,
    description:
      "Travel tips, product guides, luggage cover sizing, passport wallet advice, and packing ideas from natOnat.",
    language: "en",
    icon: absoluteUrl("/logo-after.png"),
    favicon: absoluteUrl("/favicon.ico"),
    authors: [
      {
        name: "natOnat Team",
      },
    ],
    items: [...articlesEn]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((article) => ({
        id: localizedUrl("en", `articles/${article.slug}`),
        url: localizedUrl("en", `articles/${article.slug}`),
        title: article.title,
        summary: article.excerpt,
        content_text: stripMarkdown(article.content),
        image: absoluteUrl(article.image),
        date_published: new Date(article.date).toISOString(),
        tags: [article.category],
        authors: [
          {
            name: article.author,
          },
        ],
      })),
  };

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
