import { normalizeImageUrl } from "@/lib/image-url";
import {
  fallbackQuantityDiscount,
  normalizeQuantityDiscountSettings,
  type QuantityDiscountSettings,
} from "@/lib/quantity-discount";
import { sanityClient } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";

export type FlashSaleProduct = {
    legacyId?: number;
    name?: string;
    slug?: string;
    price?: number;
    originalPrice?: number;
    type?: string;
    description?: string;
    features?: string[];
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

export type CheckoutPopupSettings = {
  _updatedAt?: string;
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  discountPercent: number;
  hint: string;
  acceptLabel: string;
  declineLabel: string;
  imageUrl?: string;
  product?: FlashSaleProduct;
};

export type PaymentDiscountSettings = {
  enabled: boolean;
  cardPercent: number;
  instapayPercent: number;
  codPercent: number;
};

export type ConversionRescueSettings = {
  _updatedAt?: string;
  enabled: boolean;
  delaySeconds: number;
  dismissDays: number;
  discountCode: string;
  discountPercent: number;
  codePrefix: string;
  codeValidityHours: number;
  discountLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  copyLabel: string;
  copiedLabel: string;
  declineLabel: string;
  targetPath: string;
};

export type SiteSettings = {
  flashSale: FlashSaleSettings;
  flashSaleSection: FlashSaleSectionSettings;
  conversionRescue: ConversionRescueSettings;
  quantityDiscount: QuantityDiscountSettings;
  paymentDiscounts: PaymentDiscountSettings;
  sizeGuide: SizeGuideSettings;
  discountAnnouncements: DiscountAnnouncement[];
  checkoutPopup: CheckoutPopupSettings;
};

type SiteSettingsQueryResult = {
  legacy?: Partial<SiteSettings> | null;
  flashSale?: Partial<FlashSaleSettings> | null;
  flashSaleSection?: Partial<FlashSaleSectionSettings> | null;
  conversionRescue?: Partial<ConversionRescueSettings> | null;
  quantityDiscount?: Partial<QuantityDiscountSettings> | null;
  paymentDiscounts?: Partial<PaymentDiscountSettings> | null;
  legacyFlashSaleSection?: Partial<FlashSaleSectionSettings> | null;
  sizeGuide?: Partial<SizeGuideSettings> | null;
  checkoutPopup?: Partial<CheckoutPopupSettings> | null;
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

const fallbackConversionRescue: ConversionRescueSettings = {
  enabled: false,
  delaySeconds: 30,
  dismissDays: 7,
  discountCode: "",
  discountPercent: 5,
  codePrefix: "NAT",
  codeValidityHours: 24,
  discountLabel: "",
  eyebrow: "",
  title: "",
  description: "",
  ctaLabel: "",
  copyLabel: "",
  copiedLabel: "",
  declineLabel: "",
  targetPath: "/shop",
};

const fallbackCheckoutPopup: CheckoutPopupSettings = {
  enabled: false,
  badge: "PackOnat",
  title: "\u062a\u062d\u0628 \u062a\u0636\u064a\u0641 PackOnat \u0645\u0639 \u0627\u0644\u0623\u0648\u0631\u062f\u0631\u061f",
  description: "\u0645\u0646\u0638\u0645 \u0634\u0646\u0637\u0629 \u0633\u0641\u0631 \u0639\u0645\u0644\u064a \u064a\u062e\u0644\u064a \u0647\u062f\u0648\u0645\u0643 \u0645\u062a\u0631\u062a\u0628\u0629 \u0648\u0633\u0647\u0644\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u062c\u0648\u0647 \u0627\u0644\u0634\u0646\u0637\u0629.",
  discountPercent: 7,
  hint: "\u0644\u0648 \u0636\u0641\u062a\u0647 \u062f\u0644\u0648\u0642\u062a\u064a \u0647\u064a\u0628\u0642\u0649 \u0639\u0646\u062f\u0643 \u0645\u0646\u062a\u062c\u064a\u0646 \u0648\u064a\u0638\u0647\u0631\u0644\u0643 \u062e\u0635\u0645 7%.",
  acceptLabel: "\u0623\u0648\u0627\u0641\u0642",
  declineLabel: "\u0644\u0627 \u0623\u0631\u064a\u062f",
};

const fallbackPaymentDiscounts: PaymentDiscountSettings = {
  enabled: true,
  cardPercent: 5,
  instapayPercent: 2,
  codPercent: 0,
};

function normalizePercent(value: unknown, fallback: number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? Math.max(0, Math.min(90, numericValue))
    : fallback;
}

function mergePaymentDiscounts(
  paymentDiscounts?: Partial<PaymentDiscountSettings> | null,
): PaymentDiscountSettings {
  return {
    enabled: paymentDiscounts?.enabled ?? fallbackPaymentDiscounts.enabled,
    cardPercent: normalizePercent(paymentDiscounts?.cardPercent, fallbackPaymentDiscounts.cardPercent),
    instapayPercent: normalizePercent(paymentDiscounts?.instapayPercent, fallbackPaymentDiscounts.instapayPercent),
    codPercent: normalizePercent(paymentDiscounts?.codPercent, fallbackPaymentDiscounts.codPercent),
  };
}

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

function mergeConversionRescue(
  conversionRescue?: Partial<ConversionRescueSettings> | null,
): ConversionRescueSettings {
  const delaySeconds = Math.max(
    10,
    Math.min(300, Number(conversionRescue?.delaySeconds) || fallbackConversionRescue.delaySeconds),
  );
  const dismissDays = Math.max(
    1,
    Math.min(60, Number(conversionRescue?.dismissDays) || fallbackConversionRescue.dismissDays),
  );

  return {
    ...fallbackConversionRescue,
    ...conversionRescue,
    enabled: Boolean(
      conversionRescue?.enabled &&
        (Number(conversionRescue.discountPercent) > 0 || conversionRescue.discountCode),
    ),
    delaySeconds,
    dismissDays,
    discountPercent: normalizePercent(
      conversionRescue?.discountPercent,
      fallbackConversionRescue.discountPercent,
    ),
    codePrefix: conversionRescue?.codePrefix?.trim().toUpperCase() || fallbackConversionRescue.codePrefix,
    codeValidityHours: Math.max(
      1,
      Math.min(168, Number(conversionRescue?.codeValidityHours) || fallbackConversionRescue.codeValidityHours),
    ),
    discountCode: conversionRescue?.discountCode?.trim().toUpperCase() || "",
    targetPath: conversionRescue?.targetPath?.trim() || fallbackConversionRescue.targetPath,
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

function mergeCheckoutPopup(
  checkoutPopup?: Partial<CheckoutPopupSettings> | null,
): CheckoutPopupSettings {
  const product = checkoutPopup?.product
    ? {
        ...checkoutPopup.product,
        imageUrl: normalizeImageUrl(checkoutPopup.product.imageUrl),
        colors: checkoutPopup.product.colors?.map((color) => ({
          ...color,
          imageUrl: normalizeImageUrl(color.imageUrl),
        })),
      }
    : undefined;

  return {
    ...fallbackCheckoutPopup,
    ...checkoutPopup,
    product,
    imageUrl: normalizeImageUrl(checkoutPopup?.imageUrl),
    enabled: Boolean(checkoutPopup?.enabled && product?.slug),
    badge: checkoutPopup?.badge?.trim() || fallbackCheckoutPopup.badge,
    title: checkoutPopup?.title?.trim() || fallbackCheckoutPopup.title,
    description: checkoutPopup?.description?.trim() || fallbackCheckoutPopup.description,
    discountPercent: Math.max(
      0,
      Math.min(95, Number(checkoutPopup?.discountPercent) || fallbackCheckoutPopup.discountPercent),
    ),
    hint: checkoutPopup?.hint?.trim() || fallbackCheckoutPopup.hint,
    acceptLabel: checkoutPopup?.acceptLabel?.trim() || fallbackCheckoutPopup.acceptLabel,
    declineLabel: checkoutPopup?.declineLabel?.trim() || fallbackCheckoutPopup.declineLabel,
  };
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
      conversionRescue: mergeConversionRescue(settings?.conversionRescue),
      quantityDiscount: normalizeQuantityDiscountSettings(
        settings?.quantityDiscount || settings?.legacy?.quantityDiscount,
      ),
      paymentDiscounts: mergePaymentDiscounts(settings?.paymentDiscounts),
      sizeGuide: mergeSizeGuide(settings?.sizeGuide || settings?.legacy?.sizeGuide),
      discountAnnouncements: mergeDiscountAnnouncements(settings?.discountAnnouncements),
      checkoutPopup: mergeCheckoutPopup(settings?.checkoutPopup),
    };
  } catch (error) {
    console.error("Falling back to local site settings after Sanity fetch failed", error);
    return {
      flashSale: fallbackFlashSale,
      flashSaleSection: fallbackFlashSaleSection,
      conversionRescue: fallbackConversionRescue,
      quantityDiscount: fallbackQuantityDiscount,
      paymentDiscounts: fallbackPaymentDiscounts,
      sizeGuide: fallbackSizeGuide,
      discountAnnouncements: [],
      checkoutPopup: fallbackCheckoutPopup,
    };
  }
}
