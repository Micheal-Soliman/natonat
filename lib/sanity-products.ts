import { products as fallbackProducts, type Product } from "@/lib/products";
import { normalizeImageList, normalizeImageUrl } from "@/lib/image-url";
import { withLatestOctopusImages } from "@/lib/octopus-images";
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
  const stableId = sanityId.replace(/^drafts\./, "");
  let hash = 0;
  for (let index = 0; index < stableId.length; index += 1) {
    hash = (hash * 31 + stableId.charCodeAt(index)) >>> 0;
  }

  return 900000 + (hash % 900000);
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
    slug: product.slug.trim().toLowerCase(),
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

function isBundleProduct(product: Product) {
  const categories = Array.isArray(product.category) ? product.category : [product.category];
  return product.isBundle === true || categories.includes("bundles") || Boolean(product.bundleItems?.length);
}

function hidePublicBundles(products: Product[]) {
  return products
    .filter((product) => !isBundleProduct(product))
    .map(withLatestOctopusImages);
}

type CatalogProductsOptions = {
  live?: boolean;
};

export async function getCatalogProducts(options: CatalogProductsOptions = {}): Promise<Product[]> {
  try {
    const sanityProducts = await sanityClient.fetch<SanityProduct[]>(
      activeProductsQuery,
      {},
      options.live
        ? { cache: "no-store" }
        : { next: { revalidate: 60, tags: ["products"] } },
    );
    const normalized = hidePublicBundles(normalizeProducts(sanityProducts));
    return normalized.length > 0 ? normalized : hidePublicBundles(fallbackProducts);
  } catch (error) {
    console.error("Falling back to local products after Sanity fetch failed", error);
    return hidePublicBundles(fallbackProducts);
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
    if (normalized && !isBundleProduct(normalized)) return withLatestOctopusImages(normalized);

    const fallbackProduct = fallbackProducts.find((product) => product.slug === slug);
    return fallbackProduct && !isBundleProduct(fallbackProduct)
      ? withLatestOctopusImages(fallbackProduct)
      : undefined;
  } catch (error) {
    console.error("Falling back to local product after Sanity fetch failed", error);
    const fallbackProduct = fallbackProducts.find((product) => product.slug === slug);
    return fallbackProduct && !isBundleProduct(fallbackProduct)
      ? withLatestOctopusImages(fallbackProduct)
      : undefined;
  }
}
