import { sanityClient } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";

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
  product?: {
    legacyId?: number;
    name?: string;
    slug?: string;
    price?: number;
    originalPrice?: number;
    type?: string;
    imageUrl?: string;
  };
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

export type SiteSettings = {
  flashSale: FlashSaleSettings;
  sizeGuide: SizeGuideSettings;
};

type SiteSettingsQueryResult = {
  legacy?: Partial<SiteSettings> | null;
  flashSale?: Partial<FlashSaleSettings> | null;
  sizeGuide?: Partial<SizeGuideSettings> | null;
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
  return {
    ...fallbackFlashSale,
    ...flashSale,
    enabled: Boolean(flashSale?.enabled),
    ctaLabel: flashSale?.ctaLabel || fallbackFlashSale.ctaLabel,
    secondaryLabel: flashSale?.secondaryLabel || fallbackFlashSale.secondaryLabel,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await sanityClient.fetch<SiteSettingsQueryResult | null>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 60 } },
    );

    return {
      flashSale: mergeFlashSale(settings?.flashSale || settings?.legacy?.flashSale),
      sizeGuide: mergeSizeGuide(settings?.sizeGuide || settings?.legacy?.sizeGuide),
    };
  } catch (error) {
    console.error("Falling back to local site settings after Sanity fetch failed", error);
    return {
      flashSale: fallbackFlashSale,
      sizeGuide: fallbackSizeGuide,
    };
  }
}
