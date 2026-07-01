import { products as fallbackProducts, type Product } from "@/lib/products";
import { sanityClient } from "@/sanity/lib/client";
import { activeProductsQuery, productBySlugQuery } from "@/sanity/lib/queries";

type SanityColor = {
  id?: string;
  name?: string;
  imageUrl?: string;
  imageAssetUrl?: string;
};

type SanityBundleItem = {
  legacyProductIds?: number[];
  referencedLegacyId?: number;
  quantity?: number;
  label?: string;
};

type SanityProduct = Omit<Product, "id" | "image" | "images" | "colors" | "bundleItems"> & {
  _id?: string;
  legacyId?: number;
  imageUrl?: string;
  mainImageUrl?: string;
  galleryUrls?: string[];
  galleryImageUrls?: string[];
  colors?: SanityColor[];
  bundleItems?: SanityBundleItem[];
};

function getGeneratedProductId(sanityId: string) {
  let hash = 0;
  for (let index = 0; index < sanityId.length; index += 1) {
    hash = (hash * 31 + sanityId.charCodeAt(index)) >>> 0;
  }

  return 900000 + (hash % 900000);
}

function normalizeImageUrl(url?: string) {
  const trimmed = url?.trim();
  if (!trimmed) return "";

  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
    trimmed.match(/[?&]id=([^&]+)/);
  if (driveMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  if (trimmed.includes("cdn.sanity.io/images/")) {
    try {
      const sanityUrl = new URL(trimmed);
      if (!sanityUrl.searchParams.has("w")) sanityUrl.searchParams.set("w", "1600");
      if (!sanityUrl.searchParams.has("auto")) sanityUrl.searchParams.set("auto", "format");
      return sanityUrl.toString();
    } catch {
      const separator = trimmed.includes("?") ? "&" : "?";
      return `${trimmed}${separator}w=1600&auto=format`;
    }
  }

  return trimmed;
}

function normalizeImageList(urls?: string[]) {
  return (urls || []).map(normalizeImageUrl).filter(Boolean);
}

function normalizeProduct(product: SanityProduct): Product | null {
  if (!product._id || !product.slug || !product.name) {
    return null;
  }

  const galleryImageUrls = normalizeImageList(product.galleryImageUrls);
  const galleryUrls = normalizeImageList(product.galleryUrls);
  const images = galleryImageUrls.length > 0 ? galleryImageUrls : galleryUrls;
  const mainImage = normalizeImageUrl(product.mainImageUrl) || normalizeImageUrl(product.imageUrl) || images[0] || "/logo-after.png";

  return {
    ...product,
    id: product.legacyId || getGeneratedProductId(product._id),
    category:
      Array.isArray(product.category) && product.category.length === 1
        ? product.category[0]
        : product.category,
    image: mainImage,
    stockStatus: product.stockStatus || "in_stock",
    images: images.length > 0 ? images : undefined,
    colors: product.colors?.map((color) => ({
      id: color.id || color.name || "",
      name: color.name || color.id || "",
      image: normalizeImageUrl(color.imageAssetUrl) || normalizeImageUrl(color.imageUrl) || mainImage,
    })),
    bundleItems: product.bundleItems?.map((item) => ({
      productId: item.referencedLegacyId,
      productIds:
        item.legacyProductIds ||
        (item.referencedLegacyId ? [item.referencedLegacyId] : undefined),
      quantity: item.quantity || 1,
      label: item.label,
    })),
  };
}

function normalizeProducts(products: SanityProduct[]): Product[] {
  return products.map(normalizeProduct).filter((product): product is Product => Boolean(product));
}

export async function getCatalogProducts(): Promise<Product[]> {
  try {
    const sanityProducts = await sanityClient.fetch<SanityProduct[]>(
      activeProductsQuery,
      {},
      { next: { revalidate: 60, tags: ["products"] } },
    );
    const normalized = normalizeProducts(sanityProducts);
    return normalized.length > 0 ? normalized : fallbackProducts;
  } catch (error) {
    console.error("Falling back to local products after Sanity fetch failed", error);
    return fallbackProducts;
  }
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const sanityProduct = await sanityClient.fetch<SanityProduct | null>(
      productBySlugQuery,
      { slug },
      { next: { revalidate: 60, tags: ["products"] } },
    );
    const normalized = sanityProduct ? normalizeProduct(sanityProduct) : null;
    return normalized || fallbackProducts.find((product) => product.slug === slug);
  } catch (error) {
    console.error("Falling back to local product after Sanity fetch failed", error);
    return fallbackProducts.find((product) => product.slug === slug);
  }
}
