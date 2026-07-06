import { normalizeImageUrl } from "@/lib/image-url";
import { sanityClient } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";

export type FlashSaleProduct = {
    legacyId?: number;
    name?: string;
    slug?: string;
    price?: number;
    originalPrice?: number;
    type?: string;
    imageUrl?: string;
    size?: string | null;
    sizePrices?: {
      s?: { price?: number; originalPrice?: number };
      m?: { price?: number; originalPrice?: number };
      l?: { price?: number; originalPrice?: number };
      xl?: { price?: number; originalPrice?: number };
    };
    stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
    stockQuantity?: number;
    sizeStock?: {
      s?: { status?: "in_stock" | "low_stock" | "out_of_stock"; quantity?: number };
      m?: { status?: "in_stock" | "low_stock" | "out_of_stock"; quantity?: number };
      l?: { status?: "in_stock" | "low_stock" | "out_of_stock"; quantity?: number };
      xl?: { status?: "in_stock" | "low_stock" | "out_of_stock"; quantity?: number };
    };
    color?: string;
    colors?: Array<{ id?: string; name?: string; imageUrl?: string }>;
};

export type FlashSaleSettings = {
  _updatedAt?: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  discountLabel: string;
  endsAt: string;
  ctaLabel: string;
  secondaryLabel: string;
  imageUrl?: string;
  product?: FlashSaleProduct;
};

export type FlashSaleOffer = {
  _key?: string;
  selectedSize?: string;
  selectedColor?: string;
  imageUrl?: string;
  product?: FlashSaleProduct;
};

export type FlashSaleSectionSettings = {
  _updatedAt?: string;
  sectionEnabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  discountLabel: string;
  endsAt: string;
  selectedSize?: string;
  selectedColor?: string;
  addToCartLabel?: string;
  buyNowLabel?: string;
  imageUrl?: string;
  product?: FlashSaleProduct;
  offers: FlashSaleOffer[];
};

export type SizeGuideItem = {
  size: string;
  cm: string;
  inch: string;
  type: string;
  note: string;
};

export type SizeGuideSettings = {
  label: string;
  title: string;
  subtitle: string;
  videoTitle: string;
  videoSubtitle: string;
  videoDuration: string;
  videoUrl: string;
  videoFileUrl?: string;
  posterUrl?: string;
  tips: string[];
  sizes: SizeGuideItem[];
  note: string;
};

export type DiscountAnnouncement = {
  _id?: string;
  code: string;
  text: string;
  href: string;
};

export type SiteSettings = {
  flashSale: FlashSaleSettings;
  flashSaleSection: FlashSaleSectionSettings;
  sizeGuide: SizeGuideSettings;
  discountAnnouncements: DiscountAnnouncement[];
};

type SiteSettingsQueryResult = {
  legacy?: Partial<SiteSettings> | null;
  flashSale?: Partial<FlashSaleSettings> | null;
  flashSaleSection?: Partial<FlashSaleSectionSettings> | null;
  legacyFlashSaleSection?: Partial<FlashSaleSectionSettings> | null;
  sizeGuide?: Partial<SizeGuideSettings> | null;
  discountAnnouncements?: Array<{
    _id?: string;
    code?: string;
    discountType?: "percentage" | "fixed" | "free_shipping";
    value?: number;
    announcementText?: string;
    announcementLink?: string;
  }> | null;
};

const fallbackSizeGuide: SizeGuideSettings = {
  label: "Size video",
  title: "Size Guide",
  subtitle: "Measure your suitcase height only, excluding wheels.",
  videoTitle: "How to measure your suitcase",
  videoSubtitle: "Measure height only, excluding wheels.",
  videoDuration: "20 sec",
  videoUrl: "/size.mp4",
  tips: ["Measure height only", "Exclude wheels"],
  sizes: [
    { size: "S", cm: "45-53", inch: "18-21", type: "Carry-on", note: "Height only" },
    { size: "M", cm: "55-63", inch: "22-25", type: "Medium", note: "Height only" },
    { size: "L", cm: "65-70", inch: "26-28", type: "Large", note: "Height only" },
    { size: "XL", cm: "72-81", inch: "29-32", type: "Extra Large", note: "Height only" },
  ],
  note: "Measure height only, excluding wheels.",
};

const fallbackFlashSale: FlashSaleSettings = {
  enabled: false,
  eyebrow: "Limited time",
  title: "Flash Sale",
  description: "Save on selected natOnat travel essentials before the offer ends.",
  badge: "Sale",
  discountLabel: "Limited offer",
  endsAt: "",
  ctaLabel: "Shop offer",
  secondaryLabel: "Not now",
};

const fallbackFlashSaleSection: FlashSaleSectionSettings = {
  sectionEnabled: false,
  eyebrow: "Limited time",
  title: "Flash Sale",
  description: "One selected option at a special price for a limited time.",
  badge: "Sale",
  discountLabel: "Offer ends in",
  endsAt: "",
  addToCartLabel: "Add offer to cart",
  buyNowLabel: "Buy offer now",
  offers: [],
};

function mergeSizeGuide(sizeGuide?: Partial<SizeGuideSettings>): SizeGuideSettings {
  return {
    ...fallbackSizeGuide,
    ...sizeGuide,
    videoUrl: sizeGuide?.videoFileUrl || sizeGuide?.videoUrl || fallbackSizeGuide.videoUrl,
    tips: sizeGuide?.tips?.filter(Boolean).length ? sizeGuide.tips.filter(Boolean) : fallbackSizeGuide.tips,
    sizes: sizeGuide?.sizes?.filter((item) => item.size && item.cm).length
      ? sizeGuide.sizes
          .filter((item) => item.size && item.cm)
          .map((item) => ({
            size: item.size,
            cm: item.cm,
            inch: item.inch || "",
            type: item.type || item.size,
            note: item.note || fallbackSizeGuide.sizes[0].note,
          }))
      : fallbackSizeGuide.sizes,
  };
}

function mergeFlashSale(flashSale?: Partial<FlashSaleSettings>): FlashSaleSettings {
  const product = flashSale?.product
    ? {
        ...flashSale.product,
        imageUrl: normalizeImageUrl(flashSale.product.imageUrl),
        colors: flashSale.product.colors?.map((color) => ({
          ...color,
          imageUrl: normalizeImageUrl(color.imageUrl),
        })),
      }
    : undefined;

  return {
    ...fallbackFlashSale,
    ...flashSale,
    imageUrl: normalizeImageUrl(flashSale?.imageUrl),
    product,
    enabled: Boolean(flashSale?.enabled),
    ctaLabel: flashSale?.ctaLabel || fallbackFlashSale.ctaLabel,
    secondaryLabel: flashSale?.secondaryLabel || fallbackFlashSale.secondaryLabel,
  };
}

function mergeFlashSaleSection(
  flashSaleSection?: Partial<FlashSaleSectionSettings>,
): FlashSaleSectionSettings {
  const legacyOffer = flashSaleSection?.product
    ? [{
        _key: "legacy-offer",
        product: flashSaleSection.product,
        selectedSize: flashSaleSection.selectedSize,
        selectedColor: flashSaleSection.selectedColor,
        imageUrl: flashSaleSection.imageUrl,
      }]
    : [];
  const validOffers = flashSaleSection?.offers?.filter((offer) => offer.product) || [];
  const offers = validOffers.length ? validOffers : legacyOffer;

  return {
    ...fallbackFlashSaleSection,
    ...flashSaleSection,
    imageUrl: normalizeImageUrl(flashSaleSection?.imageUrl),
    sectionEnabled: Boolean(flashSaleSection?.sectionEnabled),
    addToCartLabel:
      flashSaleSection?.addToCartLabel || fallbackFlashSaleSection.addToCartLabel,
    buyNowLabel: flashSaleSection?.buyNowLabel || fallbackFlashSaleSection.buyNowLabel,
    offers: offers.map((offer) => ({
      ...offer,
      imageUrl: normalizeImageUrl(offer.imageUrl),
      product: offer.product
        ? {
            ...offer.product,
            imageUrl: normalizeImageUrl(offer.product.imageUrl),
            colors: offer.product.colors?.map((color) => ({
              ...color,
              imageUrl: normalizeImageUrl(color.imageUrl),
            })),
          }
        : undefined,
    })),
  };
}

function getDiscountAnnouncementFallbackText(announcement: NonNullable<SiteSettingsQueryResult["discountAnnouncements"]>[number]) {
  const code = announcement.code || "";

  if (announcement.discountType === "free_shipping") {
    return `Use code ${code} for free shipping`;
  }

  if (announcement.discountType === "fixed") {
    return `Use code ${code} for EGP ${announcement.value || 0} off`;
  }

  return `Use code ${code} for ${announcement.value || 0}% off`;
}

function mergeDiscountAnnouncements(
  announcements?: SiteSettingsQueryResult["discountAnnouncements"],
): DiscountAnnouncement[] {
  return (announcements || [])
    .filter((announcement) => announcement.code)
    .map((announcement) => ({
      _id: announcement._id,
      code: announcement.code || "",
      text: announcement.announcementText?.trim() || getDiscountAnnouncementFallbackText(announcement),
      href: announcement.announcementLink?.trim() || "/shop",
    }));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await sanityClient.fetch<SiteSettingsQueryResult | null>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 60, tags: ["site-settings", "products"] } },
    );

    return {
      flashSale: mergeFlashSale(settings?.flashSale || settings?.legacy?.flashSale),
      flashSaleSection: mergeFlashSaleSection(
        settings?.flashSaleSection || settings?.legacyFlashSaleSection || undefined,
      ),
      sizeGuide: mergeSizeGuide(settings?.sizeGuide || settings?.legacy?.sizeGuide),
      discountAnnouncements: mergeDiscountAnnouncements(settings?.discountAnnouncements),
    };
  } catch (error) {
    console.error("Falling back to local site settings after Sanity fetch failed", error);
    return {
      flashSale: fallbackFlashSale,
      flashSaleSection: fallbackFlashSaleSection,
      sizeGuide: fallbackSizeGuide,
      discountAnnouncements: [],
    };
  }
}
