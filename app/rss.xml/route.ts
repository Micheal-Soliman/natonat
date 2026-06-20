import { articlesEn } from "@/app/lib/articles-data";
import { absoluteUrl, localizedUrl, siteConfig } from "@/lib/seo";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function GET() {
  const items = [...articlesEn]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((article) => {
      const url = localizedUrl("en", `articles/${article.slug}`);
      const description = stripMarkdown(article.excerpt || article.content).slice(0, 500);

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(description)}</description>
          <category>${escapeXml(article.category)}</category>
          <author>support@natonat.com (${escapeXml(article.author)})</author>
          <pubDate>${new Date(article.date).toUTCString()}</pubDate>
          <media:content url="${escapeXml(absoluteUrl(article.image))}" medium="image" />
        </item>`;
    })
    .join("");

  const latestDate = articlesEn
    .map((article) => new Date(article.date).getTime())
    .sort((a, b) => b - a)[0];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <title>${escapeXml(siteConfig.name)} Blog</title>
        <link>${escapeXml(localizedUrl("en", "articles"))}</link>
        <description>${escapeXml("Travel tips, product guides, luggage cover sizing, passport wallet advice, and packing ideas from natOnat.")}</description>
        <language>en</language>
        <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>
        <ttl>60</ttl>
        <image>
          <url>${escapeXml(absoluteUrl("/logo-after.png"))}</url>
          <title>${escapeXml(siteConfig.name)}</title>
          <link>${escapeXml(siteConfig.url)}</link>
        </image>
        ${items}
      </channel>
    </rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
