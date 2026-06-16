import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import Link from "next/link";
import type { Metadata } from "next";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/sanity-products";
import ProductPageContent from "./product-content";

import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.natonat.com").replace(/\/$/, "");

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

  const title = `${product.name} ${product.type ? `| ${product.type}` : ""} | natOnat`;
  const description =
    product.description ||
    `Shop ${product.name} from natOnat. Premium travel accessories in Egypt with washable protection and easy ordering.`;
  const url = `${siteUrl}/${locale}/product/${product.slug}`;
  const images = [product.image, ...(product.images || [])]
    .filter(Boolean)
    .slice(0, 4)
    .map(absoluteUrl);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl}/en/product/${product.slug}`,
        ar: `${siteUrl}/ar/product/${product.slug}`,
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
  const currentProductIndex = products.findIndex((p) => p.id === product.id);
  const prevProduct = currentProductIndex > 0 ? products[currentProductIndex - 1] : null;
  const nextProduct = currentProductIndex < products.length - 1 ? products[currentProductIndex + 1] : null;
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image, ...(product.images || [])].filter(Boolean).map(absoluteUrl),
    sku: String(product.id),
    brand: {
      "@type": "Brand",
      name: "natOnat",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "EGP",
      price: product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
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
