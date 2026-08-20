import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/sanity-products";
import ProductPageContent from "./product-content";

import { getTranslations } from 'next-intl/server';
import { siteConfig } from "@/lib/seo";
import { isProductOutOfStock } from "@/lib/product-stock";
import { getProductRating } from "@/lib/product-rating";

export const revalidate = 60;

const siteUrl = "https://www.natonat.com";

function getLocalizedProductType(type: string | undefined, locale: string) {
  if (locale !== "ar") return type || "Product";

  const normalized = type?.toLowerCase() || "";
  if (normalized.includes("luggage")) return "غطاء شنطة سفر";
  if (normalized.includes("passport")) return "محفظة باسبور";
  if (normalized.includes("packonat")) return "باك أونات";
  if (normalized.includes("bundle")) return "باقة سفر";
  return "منتج سفر";
}

function getProductCategories(product: { category: string | string[] }) {
  return Array.isArray(product.category) ? product.category : [product.category];
}

function absoluteUrl(path: string) {
  if (!path) return siteUrl;
  return path.startsWith("http") ? path : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | natOnat",
    };
  }

  const isArabic = locale === "ar";
  const localizedType = getLocalizedProductType(product.type, locale);
  const title = isArabic
    ? `${product.name} | ${localizedType} | نات أونات`
    : `${product.name} | natOnat`;
  const description = isArabic
    ? `تسوق ${product.name} من نات أونات. ${localizedType} بجودة عالية وتجربة طلب سهلة داخل مصر.`
    : product.description ||
      `Shop ${product.name} from natOnat. Premium travel accessories in Egypt with washable protection and easy ordering.`;
  const url = `${siteUrl}/${locale}/product/${product.slug}`;
  const images = [product.image, ...(product.images || [])]
    .filter(Boolean)
    .slice(0, 4)
    .map(absoluteUrl);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl}/en/product/${product.slug}`,
        ar: `${siteUrl}/ar/product/${product.slug}`,
        "x-default": `${siteUrl}/en/product/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "natOnat",
      images,
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const t = await getTranslations('product');
  const { locale, slug } = await params;
  const [product, products] = await Promise.all([
    getCatalogProductBySlug(slug),
    getCatalogProducts(),
  ]);
  
  // If product not found, show error or redirect
  if (!product) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-[#0F1A26] mb-4">{t('notFound')}</h1>
            <Link href="/shop" className="text-[#EEBC3F] hover:underline">
              {t('nav.backToShop')}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // Get prev/next products for navigation
  const currentProductIndex = products.findIndex((p) => p.slug === product.slug);
  const prevProduct = currentProductIndex > 0 ? products[currentProductIndex - 1] : null;
  const nextProduct = currentProductIndex < products.length - 1 ? products[currentProductIndex + 1] : null;
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;
  const schemaAvailability = isProductOutOfStock(product)
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";
  const productRating = getProductRating(product);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: productUrl,
    category: getProductCategories(product).join(", "),
    image: [product.image, ...(product.images || [])].filter(Boolean).map(absoluteUrl),
    sku: `NAT-${String(product.id).padStart(4, "0")}`,
    brand: {
      "@type": "Brand",
      name: "natOnat",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "EGP",
      price: product.price,
      availability: schemaAvailability,
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: productRating.ratingValue.toFixed(1),
      reviewCount: String(productRating.reviewCount),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
        }}
      />
      <ProductPageContent
        product={product}
        prevProduct={prevProduct}
        nextProduct={nextProduct}
        products={products}
      />
    </>
  );
}
