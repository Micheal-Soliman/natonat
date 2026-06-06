import { products as fallbackProducts, type Product } from "@/lib/products";
import { sanityClient } from "@/sanity/lib/client";
import { activeProductsQuery, productBySlugQuery } from "@/sanity/lib/queries";

type SanityColor = {
  id?: string;
  name?: string;
  imageUrl?: string;
};

type SanityBundleItem = {
  legacyProductIds?: number[];
  quantity?: number;
  label?: string;
};

type SanityProduct = Omit<Product, "id" | "image" | "images" | "colors" | "bundleItems"> & {
  legacyId?: number;
  imageUrl?: string;
  mainImageUrl?: string;
  galleryUrls?: string[];
  galleryImageUrls?: string[];
  colors?: SanityColor[];
  bundleItems?: SanityBundleItem[];
};

function normalizeProduct(product: SanityProduct): Product | null {
  if (!product.legacyId || !product.slug || !product.name) {
    return null;
  }

  return {
    ...product,
    id: product.legacyId,
    image: product.mainImageUrl || product.imageUrl || "",
    images:
      product.galleryImageUrls?.filter(Boolean) ||
      product.galleryUrls?.filter(Boolean) ||
      undefined,
    colors: product.colors?.map((color) => ({
      id: color.id || color.name || "",
      name: color.name || color.id || "",
      image: color.imageUrl || "",
    })),
    bundleItems: product.bundleItems?.map((item) => ({
      productIds: item.legacyProductIds,
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
      { cache: "no-store" },
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
    const sanityProduct = await sanityClient.fetch<SanityProduct | null>(productBySlugQuery, { slug });
    const normalized = sanityProduct ? normalizeProduct(sanityProduct) : null;
    return normalized || fallbackProducts.find((product) => product.slug === slug);
  } catch (error) {
    console.error("Falling back to local product after Sanity fetch failed", error);
    return fallbackProducts.find((product) => product.slug === slug);
  }
}
