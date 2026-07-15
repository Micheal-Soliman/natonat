"use client";

import { Suspense, useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Truck, Check, MapPin, Phone, Store, Package, Search, ChevronDown, ShoppingBag, ShieldCheck, TicketPercent } from "lucide-react";
import { useCart, type CartItem } from "@/app/lib/cart-context";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSiteSettings } from "@/app/lib/site-settings-context";
import { isLegacyBundleCartItem } from "@/lib/legacy-bundles";

const INSTAPAY_PROOF_MAX_BYTES = 5 * 1024 * 1024;

type InstaPayProofState = {
  file: File;
  dataUrl: string;
} | null;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read payment proof"));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read payment proof"));
    reader.readAsDataURL(file);
  });
}


function generateOrderRef() {
  return `NAT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const CHECKOUT_LOCK_KEY = "natonat-checkout-lock";
const CHECKOUT_LOCK_TTL_MS = 10 * 60 * 1000;
const CHECKOUT_PROCESSING_BLOCK_MS = 2 * 60 * 1000;

type CheckoutLock = {
  signature: string;
  orderRef: string;
  createdAt: number;
  status: "processing" | "submitted";
  successPath?: string;
  redirectUrl?: string;
};

function readCheckoutLock(signature: string): CheckoutLock | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_LOCK_KEY);
    if (!raw) return null;

    const lock = JSON.parse(raw) as CheckoutLock;
    if (!lock?.signature || lock.signature !== signature || !lock.orderRef) return null;
    if (Date.now() - lock.createdAt > CHECKOUT_LOCK_TTL_MS) {
      window.sessionStorage.removeItem(CHECKOUT_LOCK_KEY);
      return null;
    }

    return lock;
  } catch {
    return null;
  }
}

function writeCheckoutLock(lock: CheckoutLock) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(CHECKOUT_LOCK_KEY, JSON.stringify(lock));
  } catch {
    // Checkout must keep working even if session storage is unavailable.
  }
}

function clearCheckoutLock(signature: string) {
  if (typeof window === "undefined") return;

  try {
    const current = readCheckoutLock(signature);
    if (current?.signature === signature) {
      window.sessionStorage.removeItem(CHECKOUT_LOCK_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

function getExistingAramexPayload(order: unknown) {
  if (!order || typeof order !== "object") return null;

  const record = order as Record<string, unknown>;
  const aramex = record.aramex && typeof record.aramex === "object"
    ? record.aramex as Record<string, unknown>
    : {};
  const trackingNumber =
    (typeof aramex.trackingNumber === "string" && aramex.trackingNumber) ||
    (typeof record["Aramex Tracking Number"] === "string" && record["Aramex Tracking Number"]) ||
    "";

  if (!trackingNumber) return null;

  return {
    trackingNumber,
    labelUrl: typeof aramex.labelUrl === "string" ? aramex.labelUrl : undefined,
    guid: typeof aramex.guid === "string" ? aramex.guid : undefined,
  };
}

const popularCityNames = [
  "Cairo",
  "New Cairo",
  "Nasr City",
  "Maadi",
  "Giza",
  "Sheikh Zayed City",
  "October City",
  "Alexandria",
  "Mansoura",
  "Tanta",
  "Zagazig",
  "Ismailia",
  "Port Said",
];

const egyptGovernorates = [
  { value: "Cairo", ar: "القاهرة", en: "Cairo" },
  { value: "Giza", ar: "الجيزة", en: "Giza" },
  { value: "Alexandria", ar: "الإسكندرية", en: "Alexandria" },
  { value: "Dakahlia", ar: "الدقهلية", en: "Dakahlia" },
  { value: "Red Sea", ar: "البحر الأحمر", en: "Red Sea" },
  { value: "Beheira", ar: "البحيرة", en: "Beheira" },
  { value: "Fayoum", ar: "الفيوم", en: "Fayoum" },
  { value: "Gharbia", ar: "الغربية", en: "Gharbia" },
  { value: "Ismailia", ar: "الإسماعيلية", en: "Ismailia" },
  { value: "Menofia", ar: "المنوفية", en: "Menofia" },
  { value: "Minya", ar: "المنيا", en: "Minya" },
  { value: "Qaliubiya", ar: "القليوبية", en: "Qaliubiya" },
  { value: "New Valley", ar: "الوادي الجديد", en: "New Valley" },
  { value: "Suez", ar: "السويس", en: "Suez" },
  { value: "Aswan", ar: "أسوان", en: "Aswan" },
  { value: "Assiut", ar: "أسيوط", en: "Assiut" },
  { value: "Beni Suef", ar: "بني سويف", en: "Beni Suef" },
  { value: "Port Said", ar: "بورسعيد", en: "Port Said" },
  { value: "Damietta", ar: "دمياط", en: "Damietta" },
  { value: "Sharkia", ar: "الشرقية", en: "Sharkia" },
  { value: "South Sinai", ar: "جنوب سيناء", en: "South Sinai" },
  { value: "Kafr El Sheikh", ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { value: "Matrouh", ar: "مطروح", en: "Matrouh" },
  { value: "Luxor", ar: "الأقصر", en: "Luxor" },
  { value: "Qena", ar: "قنا", en: "Qena" },
  { value: "North Sinai", ar: "شمال سيناء", en: "North Sinai" },
  { value: "Sohag", ar: "سوهاج", en: "Sohag" },
];

const arabicCityNames: Record<string, string> = {
  Cairo: "القاهرة",
  "New Cairo": "القاهرة الجديدة / التجمع",
  "Nasr City": "مدينة نصر",
  Maadi: "المعادي",
  Giza: "الجيزة",
  "Sheikh Zayed City": "الشيخ زايد",
  "October City": "6 أكتوبر",
  Alexandria: "الإسكندرية",
  Mansoura: "المنصورة",
  Tanta: "طنطا",
  Zagazig: "الزقازيق",
  Ismailia: "الإسماعيلية",
  "Port Said": "بورسعيد",
};

void arabicCityNames;

const ARAMEX_CITIES_CACHE_KEY = "natonat-aramex-cities-eg-v2";
const ARAMEX_CITIES_CACHE_TTL = 24 * 60 * 60 * 1000;
const citySearchAliases: Record<string, string[]> = {
  cairo: ["cairo", "القاهرة", "قاهره", "القاهره", "el qahera", "alqahira"],
  "new cairo": ["new cairo", "التجمع", "القاهرة الجديدة", "القاهره الجديده", "tagamoa", "tagamo3", "newcairo"],
  "nasr city": ["nasr city", "مدينة نصر", "مدينه نصر", "nasr", "madinet nasr"],
  maadi: ["maadi", "المعادي", "معادي"],
  giza: ["giza", "الجيزة", "الجيزه", "جيزة", "جيزه"],
  "sheikh zayed city": ["sheikh zayed", "sheikh zayed city", "زايد", "الشيخ زايد", "zayed"],
  "october city": ["october", "october city", "6 october", "6th october", "اكتوبر", "أكتوبر", "٦ اكتوبر", "6 اكتوبر"],
  alexandria: ["alexandria", "alex", "اسكندرية", "اسكندريه", "الإسكندرية", "الاسكندرية"],
  mansoura: ["mansoura", "المنصورة", "المنصوره"],
  tanta: ["tanta", "طنطا"],
  zagazig: ["zagazig", "الزقازيق", "زقازيق"],
  ismailia: ["ismailia", "الإسماعيلية", "الاسماعيلية", "اسماعيليه"],
  "port said": ["port said", "portsaid", "بورسعيد"],
};

const arabicCitySearchAliases: Record<string, string[]> = {
  cairo: ["\u0627\u0644\u0642\u0627\u0647\u0631\u0629", "\u0642\u0627\u0647\u0631\u0629"],
  "new cairo": ["\u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629", "\u0627\u0644\u062a\u062c\u0645\u0639", "\u0627\u0644\u062a\u062c\u0645\u0639 \u0627\u0644\u062e\u0627\u0645\u0633"],
  "nasr city": ["\u0645\u062f\u064a\u0646\u0629 \u0646\u0635\u0631", "\u0646\u0635\u0631"],
  heliopolis: ["\u0645\u0635\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629", "\u0647\u064a\u0644\u064a\u0648\u0628\u0648\u0644\u064a\u0633"],
  maadi: ["\u0627\u0644\u0645\u0639\u0627\u062f\u064a", "\u0645\u0639\u0627\u062f\u064a"],
  zamalek: ["\u0627\u0644\u0632\u0645\u0627\u0644\u0643", "\u0632\u0645\u0627\u0644\u0643"],
  giza: ["\u0627\u0644\u062c\u064a\u0632\u0629", "\u062c\u064a\u0632\u0629"],
  dokki: ["\u0627\u0644\u062f\u0642\u064a", "\u062f\u0642\u064a"],
  mohandiseen: ["\u0627\u0644\u0645\u0647\u0646\u062f\u0633\u064a\u0646", "\u0645\u0647\u0646\u062f\u0633\u064a\u0646"],
  "sheikh zayed city": ["\u0627\u0644\u0634\u064a\u062e \u0632\u0627\u064a\u062f", "\u0632\u0627\u064a\u062f"],
  "october city": ["\u0627\u0643\u062a\u0648\u0628\u0631", "\u0623\u0643\u062a\u0648\u0628\u0631", "6 \u0627\u0643\u062a\u0648\u0628\u0631", "6 \u0623\u0643\u062a\u0648\u0628\u0631"],
  alexandria: ["\u0627\u0644\u0627\u0633\u0643\u0646\u062f\u0631\u064a\u0629", "\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629", "\u0627\u0633\u0643\u0646\u062f\u0631\u064a\u0629"],
  mansoura: ["\u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629", "\u0645\u0646\u0635\u0648\u0631\u0629"],
  tanta: ["\u0637\u0646\u0637\u0627"],
  zagazig: ["\u0627\u0644\u0632\u0642\u0627\u0632\u064a\u0642", "\u0632\u0642\u0627\u0632\u064a\u0642"],
  zakazik: ["\u0627\u0644\u0632\u0642\u0627\u0632\u064a\u0642", "\u0632\u0642\u0627\u0632\u064a\u0642"],
  ismailia: ["\u0627\u0644\u0627\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629", "\u0627\u0644\u0625\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629", "\u0627\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629"],
  "port said": ["\u0628\u0648\u0631\u0633\u0639\u064a\u062f", "\u0628\u0648\u0631 \u0633\u0639\u064a\u062f"],
  suez: ["\u0627\u0644\u0633\u0648\u064a\u0633", "\u0633\u0648\u064a\u0633"],
  fayoum: ["\u0627\u0644\u0641\u064a\u0648\u0645", "\u0641\u064a\u0648\u0645"],
  assiut: ["\u0627\u0633\u064a\u0648\u0637", "\u0623\u0633\u064a\u0648\u0637"],
  aswan: ["\u0627\u0633\u0648\u0627\u0646", "\u0623\u0633\u0648\u0627\u0646"],
  qena: ["\u0642\u0646\u0627"],
  luxour: ["\u0627\u0644\u0627\u0642\u0635\u0631", "\u0627\u0644\u0623\u0642\u0635\u0631", "\u0627\u0642\u0635\u0631"],
  hurghada: ["\u0627\u0644\u063a\u0631\u062f\u0642\u0629", "\u063a\u0631\u062f\u0642\u0629"],
  "sharm el sheikh": ["\u0634\u0631\u0645 \u0627\u0644\u0634\u064a\u062e", "\u0634\u0631\u0645"],
  damanhour: ["\u062f\u0645\u0646\u0647\u0648\u0631"],
  damietta: ["\u062f\u0645\u064a\u0627\u0637"],
  dumiatta: ["\u062f\u0645\u064a\u0627\u0637"],
  "bani swif": ["\u0628\u0646\u064a \u0633\u0648\u064a\u0641", "\u0628\u0646\u0649 \u0633\u0648\u064a\u0641"],
  "menia city": ["\u0627\u0644\u0645\u0646\u064a\u0627", "\u0645\u0646\u064a\u0627"],
  "sohag city": ["\u0633\u0648\u0647\u0627\u062c"],
  "new sohag city": ["\u0633\u0648\u0647\u0627\u062c \u0627\u0644\u062c\u062f\u064a\u062f\u0629", "\u0633\u0648\u0647\u0627\u062c"],
  "markaz tama": ["\u0637\u0645\u0627", "\u0645\u0631\u0643\u0632 \u0637\u0645\u0627"],
  "markaz tahta": ["\u0637\u0647\u0637\u0627", "\u0645\u0631\u0643\u0632 \u0637\u0647\u0637\u0627"],
  "markaz girga": ["\u062c\u0631\u062c\u0627", "\u0645\u0631\u0643\u0632 \u062c\u0631\u062c\u0627"],
  "markaz akhmim": ["\u0627\u062e\u0645\u064a\u0645", "\u0623\u062e\u0645\u064a\u0645"],
  "markaz al maraghah": ["\u0627\u0644\u0645\u0631\u0627\u063a\u0629", "\u0645\u0631\u0627\u063a\u0629"],
  "markaz al belina": ["\u0627\u0644\u0628\u0644\u064a\u0646\u0627", "\u0628\u0644\u064a\u0646\u0627"],
};

function normalizeCitySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");
}

function getCitySearchTerms(city: string) {
  const cityKey = normalizeCitySearch(city);
  const aliasTerms = Object.entries({ ...citySearchAliases, ...arabicCitySearchAliases }).flatMap(([key, aliases]) =>
    cityKey === normalizeCitySearch(key) || aliases.some((alias) => cityKey.includes(normalizeCitySearch(alias)))
      ? aliases
      : []
  );

  return [city, ...aliasTerms].map(normalizeCitySearch);
}

function findExactAramexCity(cities: string[], value: string) {
  const normalizedValue = normalizeCitySearch(value);
  if (!normalizedValue) return "";

  return cities.find((city) =>
    getCitySearchTerms(city).some((term) => term === normalizedValue)
  ) || "";
}

function isDiscountShippingCity(city: string) {
  const cityLower = normalizeCitySearch(city);
  const cairoDistricts = [
    "cairo",
    "new cairo",
    "nasr city",
    "maadi",
    "heliopolis",
    "zamalek",
    "down town",
    "ain shams",
    "abasya",
    "el rehab",
  ];
  const gizaDistricts = [
    "giza",
    "dokki",
    "mohandiseen",
    "agouza",
    "imbaba",
    "sheikh zayed city",
    "october city",
  ];
  const alexDistricts = ["alexandria"];

  return (
    cairoDistricts.includes(cityLower) ||
    gizaDistricts.includes(cityLower) ||
    alexDistricts.includes(cityLower)
  );
}

function getShippingRule({
  deliveryMethod,
  subtotal,
  city,
}: {
  deliveryMethod: string;
  subtotal: number;
  city: string;
}) {
  if (deliveryMethod === "pickup") return "pickup_free";
  if (subtotal > 1000) return "subtotal_over_1000_free";
  return isDiscountShippingCity(city)
    ? "cairo_giza_alex_75"
    : "other_governorates_100";
}

function normalizeCitiesPayload(data: unknown) {
  return Array.from(new Set(Array.isArray(data) ? data : []))
    .filter((city): city is string => typeof city === "string" && city.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
}

function readCachedAramexCities() {
  try {
    const raw = window.localStorage.getItem(ARAMEX_CITIES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      cachedAt?: number;
      cities?: unknown;
    };

    if (
      !parsed.cachedAt ||
      Date.now() - parsed.cachedAt > ARAMEX_CITIES_CACHE_TTL
    ) {
      return null;
    }

    const cities = normalizeCitiesPayload(parsed.cities);
    return cities.length > 0 ? cities : null;
  } catch {
    return null;
  }
}

function writeCachedAramexCities(cities: string[]) {
  try {
    window.localStorage.setItem(
      ARAMEX_CITIES_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        cities,
      })
    );
  } catch {
    // Ignore storage errors; checkout can still fetch cities normally.
  }
}

function serializeOrderItem(item: CartItem, products: Product[]) {
  const catalogProduct = products.find((product) => product.id === item.id);
  const color =
    catalogProduct?.colors?.find((variant) => variant.id === item.color)?.name ||
    item.color ||
    catalogProduct?.color;
  const lineId = [
    item.id,
    item.slug,
    item.size || "no-size",
    item.color || "no-color",
    item.isBundle ? item.bundleKey || "bundle" : "",
  ]
    .filter(Boolean)
    .join(":");

  const bundleSelections = item.bundleSelections?.map((selection, index) => {
    const selectedProduct = products.find((product) => product.id === selection.productId);
    const selectedSizePrice =
      selection.size && selectedProduct?.sizePrices
        ? selectedProduct.sizePrices[selection.size as keyof typeof selectedProduct.sizePrices]
        : undefined;
    const selectionPrice =
      selection.price ?? selectedSizePrice?.price ?? selectedProduct?.price;
    const selectionQuantity = selection.quantity || 1;

    return {
      ...selection,
      selection_id: `${lineId}:selection:${index + 1}`,
      bundle_index: index + 1,
      productName: selection.productName || selectedProduct?.name || "",
      productSlug: selection.productSlug || selectedProduct?.slug,
      productType: selection.productType || selectedProduct?.type,
      color:
        selectedProduct?.colors?.find((variant) => variant.id === selection.color)?.name ||
        selection.color ||
        selectedProduct?.color,
      price: selectionPrice,
      unit_price_egp: selectionPrice,
      line_total_egp: selectionPrice ? selectionPrice * selectionQuantity : undefined,
      originalPrice:
        selection.originalPrice ??
        selectedSizePrice?.originalPrice ??
        selectedProduct?.originalPrice,
    };
  });

  return {
    line_id: lineId,
    id: item.id,
    name: item.name,
    slug: item.slug,
    price_egp: item.price,
    unit_price_egp: item.price,
    line_total_egp: item.price * item.quantity,
    currency: "EGP",
    original_price_egp: item.originalPrice,
    quantity: item.quantity,
    size: item.size,
    color,
    category: catalogProduct?.category,
    type: catalogProduct?.type || item.type || "Product",
    image: item.image,
    isBundle: item.isBundle,
    bundleSelections,
  };
}

type PaymentLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type AppliedDiscountCode = {
  code: string;
  discountId?: string;
  title?: string;
  discountType?: "percentage" | "fixed" | "free_shipping";
  value?: number | null;
  discountAmount: number;
  eligibleSubtotal?: number;
  combineWithPaymentDiscount: boolean;
  message: string;
  isReferral?: boolean;
  referralRecordId?: string;
  referrerName?: string;
};

function PaymentLogoBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`h-8 min-w-[52px] px-2 rounded-md border border-[#0F1A26]/10 bg-white flex items-center justify-center shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function PaymentLogoImage({ logo }: { logo: PaymentLogo }) {
  return (
    <PaymentLogoBox>
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        className="object-contain max-h-[22px] w-auto"
        loading="lazy"
        quality={35}
      />
    </PaymentLogoBox>
  );
}

function PaymentLogoStrip({
  logos,
  className = "",
}: {
  logos: PaymentLogo[];
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 flex-wrap justify-start sm:justify-end max-w-[420px] ${className}`}
    >
      {logos.map((logo) => (
        <PaymentLogoImage key={logo.alt} logo={logo} />
      ))}
    </div>
  );
}

const cardPaymentLogos: PaymentLogo[] = [
  {
    src: "/visa.png",
    alt: "Visa",
    width: 34,
    height: 18,
  },
  {
    src: "/master.png",
    alt: "Mastercard",
    width: 34,
    height: 18,
  },
  {
    src: "/mezza.png",
    alt: "Meeza",
    width: 38,
    height: 18,
  },
  {
    src: "/apple.png",
    alt: "Apple Pay",
    width: 42,
    height: 18,
  },
  {
    src: "/etisalat.png",
    alt: "etisalat",
    width: 54,
    height: 20,
  },
  {
    src: "/vodafone.png",
    alt: "vodafone",
    width: 54,
    height: 20,
  },
  {
    src: "/orange.png",
    alt: "orange",
    width: 54,
    height: 20,
  }
];

const instapayPaymentLogos: PaymentLogo[] = [
  {
    src: "/instapay.png",
    alt: "InstaPay",
    width: 54,
    height: 20,
  }
];

function CardPaymentLogoImages() {
  return <PaymentLogoStrip logos={cardPaymentLogos} />;
}

function InstaPayLogoImages() {
  return <PaymentLogoStrip logos={instapayPaymentLogos} />;
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const t = useTranslations('checkout');
  const products = useCatalogProducts();
  const { checkoutPopup, paymentDiscounts } = useSiteSettings();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, addToCart, subtotal, discount: cartDiscount, originalSubtotal, appliedDiscounts, clearCart, buyNowItem, setBuyNowItem } = useCart();
  const checkoutTracked = useRef(false);
  const autoAppliedDiscountRef = useRef("");
  const getPaymentDiscountPercent = useCallback(
    (method: string) => {
      if (!paymentDiscounts.enabled) return 0;
      if (method === "card") return paymentDiscounts.cardPercent;
      if (method === "instapay") return paymentDiscounts.instapayPercent;
      if (method === "cod") return paymentDiscounts.codPercent;
      return 0;
    },
    [paymentDiscounts],
  );

  // Group duplicate items (same id + size + color) and sum quantities
  const checkoutItems = useMemo(() => {
    const rawCheckoutItems = (buyNowItem ? [buyNowItem] : items).filter(
      (item) => !isLegacyBundleCartItem(item),
    );

    return rawCheckoutItems.reduce((acc: typeof rawCheckoutItems, item) => {
      const existing = acc.find(
        (i) =>
          i.id === item.id &&
          i.size === item.size &&
          i.color === item.color &&
          i.bundleKey === item.bundleKey
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }

      return acc;
    }, []);
  }, [buyNowItem, items]);

  const checkoutSubtotal = buyNowItem
    ? (buyNowItem.price || 0) * (buyNowItem.quantity || 1)
    : subtotal;
  const checkoutItemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutPopupProduct = checkoutPopup.product;
  const checkoutPopupImage = checkoutPopup.imageUrl || checkoutPopupProduct?.imageUrl || "/placeholder.svg";
  const checkoutPopupPrice = Number(checkoutPopupProduct?.price || 0);
  const serializedCheckoutItems = useMemo(
    () => checkoutItems.map((item) => serializeOrderItem(item, products)),
    [checkoutItems, products]
  );
  const checkoutProductIds = useMemo(() => new Set(checkoutItems.map((item) => item.id)), [checkoutItems]);
  const checkoutPackOnat = useMemo(() => {
    const isPackOnat = (product: Product) => {
      const categories = Array.isArray(product.category) ? product.category : [product.category];
      return categories.includes("packonat") || product.slug.toLowerCase().includes("packonat");
    };

    return products.find((product) => isPackOnat(product) && !checkoutProductIds.has(product.id));
  }, [checkoutProductIds, products]);
  const checkoutPackOnatColor = checkoutPackOnat?.colors?.[0];

  const addCheckoutPackOnat = () => {
    if (!checkoutPackOnat) return;

    addToCart({
      id: checkoutPackOnat.id,
      name: checkoutPackOnat.name,
      slug: checkoutPackOnat.slug,
      type: checkoutPackOnat.type,
      price: checkoutPackOnat.price,
      basePrice: checkoutPackOnat.price,
      originalPrice: checkoutPackOnat.originalPrice,
      quantity: 1,
      image: checkoutPackOnatColor?.image || checkoutPackOnat.image,
      color: checkoutPackOnatColor?.name,
    }, { openCart: false });
    setBuyNowItem(null);
  };

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    address: "",
    governorate: "",
    city: "",
    phone: "",
  });
  const [aramexCities, setAramexCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityListOpen, setCityListOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const cachedCities = readCachedAramexCities();
    const controller = new AbortController();

    if (cachedCities) {
      setAramexCities(cachedCities);
    }

    async function getCities() {
      if (!cachedCities) {
        setLoadingCities(true);
      }

      try {
        const res = await fetch("/api/aramex/cities?countryCode=EG", {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const uniqueCities = normalizeCitiesPayload(data);

          writeCachedAramexCities(uniqueCities);
          setAramexCities(uniqueCities);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error fetching Aramex cities:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false);
        }
      }
    }

    getCities();

    return () => controller.abort();
  }, []);

  const filteredCities = useMemo(() => {
    const query = normalizeCitySearch(citySearch);
    const popularCities = popularCityNames
      .map((name) => aramexCities.find((city) => normalizeCitySearch(city) === normalizeCitySearch(name)))
      .filter(Boolean) as string[];
    const uniquePopularCities = Array.from(new Set(popularCities));

    if (!query) {
      return [
        ...uniquePopularCities,
        ...aramexCities.filter((city) => !uniquePopularCities.includes(city)),
      ];
    }

    return aramexCities
      .filter((city) => getCitySearchTerms(city).some((term) => term.includes(query)))
      .sort((a, b) => {
        const aTerms = getCitySearchTerms(a);
        const bTerms = getCitySearchTerms(b);
        const aStartsWith = aTerms.some((term) => term.startsWith(query));
        const bStartsWith = bTerms.some((term) => term.startsWith(query));
        const aPopular = uniquePopularCities.includes(a);
        const bPopular = uniquePopularCities.includes(b);
        if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
        if (aPopular !== bPopular) return aPopular ? -1 : 1;
        return a.localeCompare(b);
      });
  }, [aramexCities, citySearch]);

  const selectedAramexCity = useMemo(
    () => findExactAramexCity(aramexCities, formData.city),
    [aramexCities, formData.city]
  );

  const selectCity = (city: string) => {
    setFormData((current) => ({ ...current, city }));
    setCitySearch(city);
    setFieldErrors((current) => ({ ...current, city: "" }));
    setCityListOpen(false);
  };

  const validateCitySearch = () => {
    if (deliveryMethod !== "delivery" || loadingCities) return;

    const exactCity = findExactAramexCity(aramexCities, citySearch);

    if (exactCity) {
      selectCity(exactCity);
      return;
    }

    if (citySearch.trim()) {
      setFieldErrors((current) => ({
        ...current,
        city: t("validation.invalidCity"),
      }));
    }
  };

  useEffect(() => {
    if (!formData.city || aramexCities.length === 0) return;
    const exactCity = findExactAramexCity(aramexCities, formData.city);
    if (exactCity) return;

    setFormData((current) => ({ ...current, city: "" }));
    setCitySearch("");
  }, [aramexCities, formData.city]);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [instapayProof, setInstapayProof] = useState<InstaPayProofState>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess] = useState(false);
  const [orderId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [aramexStatus, setAramexStatus] = useState<"idle" | "pending" | "success" | "failed" | "skipped">("idle");
  const [aramexError, setAramexError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [pendingSuccessPath, setPendingSuccessPath] = useState("");
  const [showPackonatUpsell, setShowPackonatUpsell] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<AppliedDiscountCode | null>(null);
  const [discountCodeStatus, setDiscountCodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [discountCodeMessage, setDiscountCodeMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const bottomOrderCtaRef = useRef<HTMLDivElement | null>(null);
  const [isBottomOrderCtaVisible, setIsBottomOrderCtaVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasCheckoutItems = checkoutItems.length > 0;
  const showCheckoutActions = mounted && hasCheckoutItems;

  useEffect(() => {
    if (!showCheckoutActions) return;

    const target = bottomOrderCtaRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsBottomOrderCtaVisible(entry.isIntersecting),
      {
        root: null,
        rootMargin: "0px 0px -120px 0px",
        threshold: 0.2,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [showCheckoutActions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError("");

    if (!hasCheckoutItems) {
      setSubmitError(t("emptyCart.submitError"));
      return;
    }

    const nextErrors: Record<string, string> = {};
    const requiredMessage = t("validation.required");
    const invalidEmailMessage = t("validation.invalidEmail");
    const invalidPhoneMessage = t("validation.invalidPhone");
    const invalidCityMessage = t("validation.invalidCity");
    const emailValue = formData.email.trim();
    const phoneDigits = formData.phone.replace(/\D/g, "");
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    const isValidEgyptPhone =
      /^01[0125]\d{8}$/.test(phoneDigits) ||
      /^201[0125]\d{8}$/.test(phoneDigits);

    if (emailValue && !isValidEmail) nextErrors.email = invalidEmailMessage;

    if (!deliveryMethod) nextErrors.deliveryMethod = requiredMessage;

    if (deliveryMethod) {
      if (!formData.firstName.trim()) nextErrors.firstName = requiredMessage;
      if (!formData.phone.trim()) nextErrors.phone = requiredMessage;
      else if (!isValidEgyptPhone) nextErrors.phone = invalidPhoneMessage;
    }

    if (deliveryMethod === "delivery") {
      if (!formData.address.trim()) nextErrors.address = requiredMessage;
      if (!formData.governorate) nextErrors.governorate = requiredMessage;
      if (!selectedAramexCity) {
        nextErrors.city = invalidCityMessage;
      }
    }

    if (!paymentMethod) nextErrors.paymentMethod = requiredMessage;
    if (paymentMethod === "instapay" && !instapayProof) {
      nextErrors.instapayProof = t("validation.instapayProofRequired");
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError(t("validation.reviewFields"));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const stockResponse = await fetch("/api/orders/validate-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: serializedCheckoutItems,
        }),
        cache: "no-store",
      });

      if (!stockResponse.ok) {
        setIsSubmitting(false);
        setSubmitError(t("validation.stockChanged"));
        return;
      }
    } catch (error) {
      console.error("Checkout stock validation failed", error);
      setIsSubmitting(false);
      setSubmitError(t("validation.stockChanged"));
      return;
    }

    let confirmedAppliedDiscountCode = appliedDiscountCode;
    if (appliedDiscountCode?.code) {
      const validatedDiscount = await validateDiscountCode(appliedDiscountCode.code, { silent: true });

      if (!validatedDiscount) {
        setIsSubmitting(false);
        setSubmitError(t("discount.reapply"));
        return;
      }

      confirmedAppliedDiscountCode = validatedDiscount;
    }

    const confirmedCodeDiscountAmount = confirmedAppliedDiscountCode?.discountAmount || 0;
    const confirmedPaymentDiscount = getPaymentDiscountAmount(confirmedAppliedDiscountCode);
    const confirmedFinalTotal = Math.max(
      0,
      total - confirmedCodeDiscountAmount - confirmedPaymentDiscount
    );
    const confirmedDiscountPayload = confirmedAppliedDiscountCode
      ? {
          code: confirmedAppliedDiscountCode.code,
          discount_id: confirmedAppliedDiscountCode.discountId,
          title: confirmedAppliedDiscountCode.title,
          type: confirmedAppliedDiscountCode.discountType,
          value: confirmedAppliedDiscountCode.value,
          amount_egp: confirmedAppliedDiscountCode.discountAmount,
          eligible_subtotal_egp: confirmedAppliedDiscountCode.eligibleSubtotal,
          combine_with_payment_discount: confirmedAppliedDiscountCode.combineWithPaymentDiscount,
          is_referral: confirmedAppliedDiscountCode.isReferral === true,
          referral_record_id: confirmedAppliedDiscountCode.referralRecordId,
          referrer_name: confirmedAppliedDiscountCode.referrerName,
        }
      : null;

    const checkoutSignature = JSON.stringify({
      items: serializedCheckoutItems.map((item) => ({
        id: item.id,
        slug: item.slug,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price_egp,
        lineTotal: item.line_total_egp,
      })),
      customer: {
        phone: formData.phone.replace(/\D/g, ""),
        name: formData.firstName.trim().toLowerCase(),
        city: formData.city,
        governorate: formData.governorate,
        address: formData.address.trim().toLowerCase(),
      },
      paymentMethod,
      deliveryMethod,
      total: confirmedFinalTotal,
      discountCode: confirmedAppliedDiscountCode?.code || "",
    });
    const existingCheckoutLock = readCheckoutLock(checkoutSignature);

    if (
      existingCheckoutLock?.status === "submitted" &&
      (existingCheckoutLock.successPath || existingCheckoutLock.redirectUrl)
    ) {
      if (existingCheckoutLock.redirectUrl) {
        window.location.href = existingCheckoutLock.redirectUrl;
        return;
      }

      setIsSubmitting(false);
      router.push(existingCheckoutLock.successPath || "/order-confirmed");
      return;
    }

    if (
      existingCheckoutLock?.status === "processing" &&
      Date.now() - existingCheckoutLock.createdAt < CHECKOUT_PROCESSING_BLOCK_MS
    ) {
      setIsSubmitting(false);
      setSubmitError(
        locale === "ar"
          ? "طلبك بيتسجل بالفعل. استنى لحظات، متعملش الطلب مرة تانية."
          : "Your order is already being processed. Please wait and do not place it again.",
      );
      return;
    }

    const orderRef = existingCheckoutLock?.orderRef || generateOrderRef();
    writeCheckoutLock({
      signature: checkoutSignature,
      orderRef,
      createdAt: existingCheckoutLock?.createdAt || Date.now(),
      status: "processing",
    });

    try {
      window.sessionStorage.setItem(
        `meta-purchase-payload-${orderRef}`,
        JSON.stringify({
          value: confirmedFinalTotal,
          currency: "EGP",
          content_ids: checkoutItems.map((item) => String(item.id)),
          contents: checkoutItems.map((item) => ({
            id: String(item.id),
            quantity: item.quantity,
            item_price: item.price,
          })),
          content_type: "product",
          num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
        }),
      );
    } catch {
      // Pixel enrichment is optional; checkout must continue if storage is unavailable.
    }

    if (paymentMethod === "card") {
      try {
        const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY;
        const paymobBaseUrl = process.env.NEXT_PUBLIC_PAYMOB_BASE_URL || "https://accept.paymob.com";

        if (!publicKey) {
          throw new Error("NEXT_PUBLIC_PAYMOB_PUBLIC_KEY is not set");
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        const intentionItems = checkoutItems.map((item) => ({
          name: item.name,
          amount: Math.round(item.price * item.quantity * 100),
          description: item.slug,
          quantity: item.quantity,
        }));

        if (deliveryMethod === "delivery" && shipping > 0) {
          intentionItems.push({
            name: "Shipping",
            amount: Math.round(shipping * 100),
            description: "delivery",
            quantity: 1,
          });
        }

        const paymentDiscountPercent = getPaymentDiscountPercent(paymentMethod);
        const amountCents = Math.round(confirmedFinalTotal * 100);
        const itemsSum = intentionItems.reduce((sum, it) => sum + it.amount, 0);
        const shouldSendPaymobItems = confirmedPaymentDiscount <= 0 && confirmedCodeDiscountAmount <= 0;
        const orderSnapshot = {
          locale,
          delivery_method: deliveryMethod,
          amount_egp: confirmedFinalTotal,
          amount_cents: amountCents,
          shipping_egp: shipping,
          discount: confirmedDiscountPayload,
          payment_discount_egp: confirmedPaymentDiscount,
          customer: {
            email: formData.email,
            phone: formData.phone,
            first_name: formData.firstName,
            last_name: "",
            city: formData.city,
            governorate: formData.governorate,
            address: formData.address,
          },
          items: serializedCheckoutItems,
        };
        if (shouldSendPaymobItems && itemsSum !== amountCents) {
          throw new Error("Invalid amount: items sum does not match total");
        }

        const res = await fetch("/api/paymob/intention", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountCents,
            currency: "EGP",
            items: shouldSendPaymobItems ? intentionItems : undefined,
            billing_data: {
              apartment: "NA",
              first_name: formData.firstName || "Customer",
              last_name: "NA",
              street: formData.address || "NA",
              building: "NA",
              phone_number: formData.phone,
              city: formData.city || "NA",
              country: "EG",
              email: formData.email,
              floor: "NA",
              state: "NA",
            },
            extras: {
              locale,
              delivery_method: deliveryMethod,
              order_ref: orderRef,
              customer_email: formData.email,
              customer_phone: formData.phone,
              total_egp: confirmedFinalTotal,
              order_snapshot: orderSnapshot,
              discount_code: confirmedAppliedDiscountCode?.code || null,
              discount_amount: confirmedCodeDiscountAmount > 0 ? confirmedCodeDiscountAmount : null,
              discount: confirmedDiscountPayload,
              payment_discount: confirmedPaymentDiscount > 0 ? confirmedPaymentDiscount : null,
              payment_discount_percent: confirmedPaymentDiscount > 0 ? paymentDiscountPercent : null,
            },
            special_reference: orderRef,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create intention");
        }

        const clientSecret = data?.client_secret;
        if (!clientSecret) {
          throw new Error("Paymob response missing client_secret");
        }

        const shippingRule = getShippingRule({
          deliveryMethod,
          subtotal: checkoutSubtotal,
          city: formData.governorate,
        });

        const orderLogRes = await fetch("/api/orders/log?fast=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "checkout",
            order_ref: orderRef,
            locale,
            payment_method: "paymob_card",
            status: "created",
            payment_status: "Pending",
            amount_egp: confirmedFinalTotal,
            amount_cents: amountCents,
            shipping_egp: shipping,
            discount_egp: confirmedCodeDiscountAmount,
            discount_code: confirmedAppliedDiscountCode?.code || null,
            discount: confirmedDiscountPayload,
            payment_discount_egp: confirmedPaymentDiscount,
            delivery_method: deliveryMethod,
            customer: {
              email: formData.email,
              phone: formData.phone,
              first_name: formData.firstName,
              last_name: "",
              city: formData.city,
              governorate: formData.governorate,
              address: formData.address,
            },
            items: serializedCheckoutItems,
            paymob: {
              client_secret: clientSecret,
              intention_order_id: data?.intention_order_id,
              id: data?.id,
              special_reference: orderRef,
            },
            extras: {
              shipping_rule: shippingRule,
              city_key: formData.city,
              subtotal_egp: checkoutSubtotal,
              free_shipping_threshold: 1000,
              order_url: `${origin}/${locale}/orders/${orderRef}`,
              discount: confirmedDiscountPayload,
              payment_discount: confirmedPaymentDiscount > 0 ? confirmedPaymentDiscount : null,
              payment_discount_percent: confirmedPaymentDiscount > 0 ? paymentDiscountPercent : null,
            },
            created_at: new Date().toISOString(),
          }),
        });
        if (!orderLogRes.ok) {
          const logError = await orderLogRes.json().catch(() => null);
          throw new Error(logError?.error || "Could not save order before payment");
        }

        const checkoutUrl = `${paymobBaseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
        writeCheckoutLock({
          signature: checkoutSignature,
          orderRef,
          createdAt: existingCheckoutLock?.createdAt || Date.now(),
          status: "submitted",
          redirectUrl: checkoutUrl,
        });
        window.location.href = checkoutUrl;
        return;
      } catch (err) {
        clearCheckoutLock(checkoutSignature);
        setIsSubmitting(false);
        setSubmitError(err instanceof Error ? err.message : "Payment initialization failed");
        return;
      }
    }

    if (paymentMethod === "instapay") {
      if (!instapayProof) {
        setIsSubmitting(false);
        setFieldErrors((current) => ({
          ...current,
          instapayProof: t("validation.instapayProofRequired"),
        }));
        setSubmitError(t("validation.instapayProofRequired"));
        return;
      }

      const shippingRuleInstaPay = getShippingRule({
        deliveryMethod,
        subtotal: checkoutSubtotal,
        city: formData.governorate,
      });

      try {
        const logRes = await fetch("/api/orders/log?fast=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "checkout_instapay_proof",
            order_ref: orderRef,
            locale,
            payment_method: "instapay",
            status: "pending_instapay_approval",
            payment_status: "Pending InstaPay Approval",
            amount_egp: confirmedFinalTotal,
            amount_cents: Math.round(confirmedFinalTotal * 100),
            shipping_egp: shipping,
            discount_egp: confirmedCodeDiscountAmount,
            discount_code: confirmedAppliedDiscountCode?.code || null,
            discount: confirmedDiscountPayload,
            payment_discount_egp: confirmedPaymentDiscount,
            delivery_method: deliveryMethod,
            aramex: null,
            customer: {
              email: formData.email,
              phone: formData.phone,
              first_name: formData.firstName,
              last_name: "",
              city: formData.city,
              governorate: formData.governorate,
              address: formData.address,
            },
            items: serializedCheckoutItems,
            instapay_proof: {
              file_name: instapayProof.file.name,
              file_type: instapayProof.file.type,
              file_size: instapayProof.file.size,
              data_url: instapayProof.dataUrl,
              uploaded_at: new Date().toISOString(),
            },
            extras: {
              shipping_rule: shippingRuleInstaPay,
              city_key: formData.city,
              subtotal_egp: checkoutSubtotal,
              free_shipping_threshold: 1000,
              discount: confirmedDiscountPayload,
              payment_discount: confirmedPaymentDiscount > 0 ? confirmedPaymentDiscount : null,
              payment_discount_percent: confirmedPaymentDiscount > 0 ? getPaymentDiscountPercent(paymentMethod) : null,
              instapay_requires_admin_approval: true,
            },
            created_at: new Date().toISOString(),
          }),
        });

        const logData = await logRes.json();

        if (!logRes.ok) {
          throw new Error(logData?.error || "Failed to log InstaPay order");
        }
      } catch (error) {
        console.error("Failed to log InstaPay order:", error);
        clearCheckoutLock(checkoutSignature);
        setIsSubmitting(false);
        setSubmitError(error instanceof Error ? error.message : "Failed to log InstaPay order");
        return;
      }

      setIsSubmitting(false);
      clearCart();
      setBuyNowItem(null);
      const successPath = `/order-confirmed?order_ref=${encodeURIComponent(orderRef)}&method=instapay&success=true`;
      writeCheckoutLock({
        signature: checkoutSignature,
        orderRef,
        createdAt: existingCheckoutLock?.createdAt || Date.now(),
        status: "submitted",
        successPath,
      });
      router.push(successPath);
      return;
    }

    // --- Delivery Order Flow ---

    let aramexPayload: {
      trackingNumber: string;
      labelUrl?: string;
      guid?: string;
    } | null = null;

    const shippingRuleCOD = getShippingRule({
      deliveryMethod,
      subtotal: checkoutSubtotal,
      city: formData.governorate,
    });

    // Step 1: Persist the COD order before creating any external shipment.
    // This avoids an Aramex shipment existing without a matching dashboard order.
    try {
      const preLogRes = await fetch("/api/orders/log?fast=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "checkout",
          order_ref: orderRef,
          locale,
          payment_method: paymentMethod,
          status: "created",
          payment_status: paymentMethod === "cod" ? "Cash on Delivery" : "Pending",
          amount_egp: confirmedFinalTotal,
          amount_cents: Math.round(confirmedFinalTotal * 100),
          shipping_egp: shipping,
          discount_egp: confirmedCodeDiscountAmount,
          discount_code: confirmedAppliedDiscountCode?.code || null,
          discount: confirmedDiscountPayload,
          payment_discount_egp: confirmedPaymentDiscount,
          delivery_method: deliveryMethod,
          aramex: null,
          customer: {
            email: formData.email,
            phone: formData.phone,
            first_name: formData.firstName,
            last_name: "",
            city: formData.city,
            governorate: formData.governorate,
            address: formData.address,
          },
          items: serializedCheckoutItems,
          extras: {
            shipping_rule: shippingRuleCOD,
            city_key: formData.city,
            subtotal_egp: checkoutSubtotal,
            free_shipping_threshold: 1000,
            discount: confirmedDiscountPayload,
            payment_discount: confirmedPaymentDiscount > 0 ? confirmedPaymentDiscount : null,
            payment_discount_percent: confirmedPaymentDiscount > 0 ? getPaymentDiscountPercent(paymentMethod) : null,
          },
          created_at: new Date().toISOString(),
        }),
      });

      const preLogData = await preLogRes.json().catch(() => null);
      if (!preLogRes.ok) {
        throw new Error(preLogData?.error || "Could not save order before shipment");
      }
    } catch (error) {
      clearCheckoutLock(checkoutSignature);
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Could not save order before shipment");
      return;
    }

    // Step 2: Create Aramex shipment after storage succeeds
    if (deliveryMethod === "delivery") {
      setAramexStatus("pending");

      try {
        const existingOrderRes = await fetch(`/api/orders/log?order_ref=${encodeURIComponent(orderRef)}`, {
          cache: "no-store",
        }).catch(() => null);
        const existingOrderData = existingOrderRes?.ok
          ? await existingOrderRes.json().catch(() => null)
          : null;
        const existingAramexPayload = getExistingAramexPayload(existingOrderData?.order);

        if (existingAramexPayload) {
          setTrackingNumber(existingAramexPayload.trackingNumber);
          setAramexStatus("success");
          aramexPayload = existingAramexPayload;
        } else {
        const shipmentPayload = {
          orderRef,
          customer: {
            first_name: formData.firstName,
            last_name: "",
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            governorate: formData.governorate,
            city: formData.city,
          },
          items: checkoutItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })),
          totalValue: confirmedFinalTotal,
          cod: paymentMethod === "cod",
          codAmount: paymentMethod === "cod" ? confirmedFinalTotal : 0,
        };

        const shipmentRes = await fetch("/api/aramex/shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shipmentPayload),
        });

        const shipmentData = await shipmentRes.json();

        if (shipmentData.success) {
          setTrackingNumber(shipmentData.trackingNumber);
          setAramexStatus("success");

          aramexPayload = {
            trackingNumber: shipmentData.trackingNumber,
            labelUrl: shipmentData.labelUrl,
            guid: shipmentData.guid,
          };

        } else {
          setAramexStatus("failed");
          setAramexError(shipmentData.details || shipmentData.error || "Unknown error");
          throw new Error(shipmentData.details || shipmentData.error || "Aramex shipment failed");
        }
        }
      } catch (err) {
        setAramexStatus("failed");
        setAramexError(err instanceof Error ? err.message : "Network error");
        clearCheckoutLock(checkoutSignature);
        setIsSubmitting(false);
        setSubmitError(err instanceof Error ? err.message : "Aramex shipment failed");
        return;
      }
    } else {
      setAramexStatus("skipped");
    }

    // Step 3: Confirm the order and attach Aramex data
    try {
      const logRes = await fetch("/api/orders/log?fast=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "checkout",
          order_ref: orderRef,
          locale,
          payment_method: paymentMethod,
          status: "confirmed",
          payment_status: paymentMethod === "cod" ? "Cash on Delivery" : "Confirmed",
          amount_egp: confirmedFinalTotal,
          amount_cents: Math.round(confirmedFinalTotal * 100),
          shipping_egp: shipping,
          discount_egp: confirmedCodeDiscountAmount,
          discount_code: confirmedAppliedDiscountCode?.code || null,
          discount: confirmedDiscountPayload,
          payment_discount_egp: confirmedPaymentDiscount,
          delivery_method: deliveryMethod,

          aramex: aramexPayload,

          customer: {
            email: formData.email,
            phone: formData.phone,
            first_name: formData.firstName,
            last_name: "",
            city: formData.city,
            governorate: formData.governorate,
            address: formData.address,
          },

          items: serializedCheckoutItems,

          extras: {
            shipping_rule: shippingRuleCOD,
            city_key: formData.city,
            subtotal_egp: checkoutSubtotal,
            free_shipping_threshold: 1000,
            discount: confirmedDiscountPayload,
            payment_discount: confirmedPaymentDiscount > 0 ? confirmedPaymentDiscount : null,
            payment_discount_percent: confirmedPaymentDiscount > 0 ? getPaymentDiscountPercent(paymentMethod) : null,
          },

          created_at: new Date().toISOString(),
        }),
      });

      const logData = await logRes.json();

      if (!logRes.ok) {
        throw new Error(logData?.error || "Failed to log order");
      }

    } catch (error) {
      console.error("Failed to log order to Google Sheets:", error);
      clearCheckoutLock(checkoutSignature);
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Failed to log order");
      return;
    }


    // Step 3: Redirect to Order Confirmed page for tracking
    setIsSubmitting(false);
    clearCart();
    setBuyNowItem(null);

    const successPath = `/order-confirmed?order_ref=${encodeURIComponent(orderRef)}&method=${encodeURIComponent(paymentMethod)}&success=true`;
    setPendingSuccessPath(successPath);
    writeCheckoutLock({
      signature: checkoutSignature,
      orderRef,
      createdAt: existingCheckoutLock?.createdAt || Date.now(),
      status: "submitted",
      successPath,
    });

    const shouldShowCheckoutPopup =
      checkoutPopup.enabled &&
      Boolean(checkoutPopupProduct?.slug);

    if (shouldShowCheckoutPopup) {
      setShowPackonatUpsell(true);
      return;
    }

    router.push(successPath);
  };

  const continueToSuccessPage = useCallback(() => {
    setShowPackonatUpsell(false);
    router.push(pendingSuccessPath || "/order-confirmed?success=true");
  }, [pendingSuccessPath, router]);

  const goToPackonatProduct = useCallback(() => {
    setShowPackonatUpsell(false);
    router.push(checkoutPopupProduct?.slug ? `/product/${checkoutPopupProduct.slug}` : "/shop");
  }, [checkoutPopupProduct?.slug, router]);

  // Shipping: 75 EGP for Cairo, Giza & Alexandria, 100 EGP for other cities, free for orders > 1000, pickup = 0
  const shipping = useMemo(() => {
    if (!deliveryMethod) return 0;
    if (deliveryMethod === "pickup") return 0;
    if (checkoutSubtotal > 1000) return 0;

    return isDiscountShippingCity(formData.governorate) ? 75 : 100;
  }, [
    deliveryMethod,
    checkoutSubtotal,
    formData.governorate
  ]);
  const total = useMemo(
    () => checkoutSubtotal + shipping,
    [checkoutSubtotal, shipping]
  );

  const codeDiscountAmount = appliedDiscountCode?.discountAmount || 0;
  const getPaymentDiscountAmount = useCallback(
    (discountCode: AppliedDiscountCode | null = appliedDiscountCode) => {
      if (discountCode && !discountCode.combineWithPaymentDiscount) return 0;

      const discountPercent = getPaymentDiscountPercent(paymentMethod);
      const discountBase = Math.max(0, total - (discountCode?.discountAmount || 0));

      return discountPercent > 0
        ? Math.round(discountBase * (discountPercent / 100))
        : 0;
    },
    [appliedDiscountCode, getPaymentDiscountPercent, paymentMethod, total]
  );

  // Discount for non-COD payment methods
  const paymentDiscount = useMemo(
    () => getPaymentDiscountAmount(appliedDiscountCode),
    [appliedDiscountCode, getPaymentDiscountAmount]
  );

  const finalTotal = useMemo(
    () => Math.max(0, total - codeDiscountAmount - paymentDiscount),
    [total, codeDiscountAmount, paymentDiscount]
  );
  const totalBeforeShipping = useMemo(() => {
    const paymentDiscountPercent = getPaymentDiscountPercent(paymentMethod);
    const canApplyPaymentDiscount =
      !appliedDiscountCode || appliedDiscountCode.combineWithPaymentDiscount;
    const discountBase = Math.max(0, checkoutSubtotal - codeDiscountAmount);
    const paymentDiscountBeforeShipping =
      canApplyPaymentDiscount && paymentDiscountPercent > 0
        ? Math.round(discountBase * (paymentDiscountPercent / 100))
        : 0;

    return Math.max(0, checkoutSubtotal - codeDiscountAmount - paymentDiscountBeforeShipping);
  }, [appliedDiscountCode, checkoutSubtotal, codeDiscountAmount, getPaymentDiscountPercent, paymentMethod]);
  const displayedTotal = deliveryMethod === "delivery" && !formData.city
    ? totalBeforeShipping
    : finalTotal;
  const hasAppliedDiscountCode = Boolean(appliedDiscountCode && codeDiscountAmount > 0);
  const displayedDiscountAmount = hasAppliedDiscountCode
    ? cartDiscount + codeDiscountAmount + paymentDiscount
    : cartDiscount;
  const displayedDiscountLabel = hasAppliedDiscountCode && appliedDiscountCode
    ? `${t("summary.discount")} (${appliedDiscountCode.code})`
    : t("summary.discount");
  const cardPaymentDiscountPercent = getPaymentDiscountPercent("card");
  const instapayPaymentDiscountPercent = getPaymentDiscountPercent("instapay");
  const codPaymentDiscountPercent = getPaymentDiscountPercent("cod");

  const validateDiscountCode = useCallback(
    async (rawCode: string, options: { silent?: boolean } = {}) => {
      const code = rawCode.trim();
      if (!code) {
        setDiscountCodeStatus("error");
        setDiscountCodeMessage(t("discount.enterCode"));
        return null;
      }

      if (!options.silent) {
        setDiscountCodeStatus("loading");
        setDiscountCodeMessage("");
      }

      try {
        const res = await fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            subtotal: checkoutSubtotal,
            shipping,
            paymentMethod,
            items: serializedCheckoutItems,
          }),
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.valid) {
          setAppliedDiscountCode((current) =>
            current?.code === code.toUpperCase() ? null : current
          );
          setDiscountCodeStatus("error");
          setDiscountCodeMessage(data?.message || t("discount.invalid"));
          return null;
        }

        const validatedDiscount: AppliedDiscountCode = {
          code: data.code,
          discountId: data.discountId,
          title: data.title,
          discountType: data.discountType,
          value: data.value,
          discountAmount: data.discountAmount,
          eligibleSubtotal: data.eligibleSubtotal,
          combineWithPaymentDiscount: data.combineWithPaymentDiscount === true,
          message: data.message || t("discount.applied"),
          isReferral: data.isReferral === true,
          referralRecordId: data.referralRecordId,
          referrerName: data.referrerName,
        };

        setAppliedDiscountCode(validatedDiscount);
        setDiscountCodeInput(validatedDiscount.code);
        setDiscountCodeStatus("success");
        setDiscountCodeMessage(validatedDiscount.message);
        return validatedDiscount;
      } catch (error) {
        console.error("Discount code validation failed", error);
        setDiscountCodeStatus("error");
        setDiscountCodeMessage(t("discount.unavailable"));
        return null;
      }
    },
    [checkoutSubtotal, paymentMethod, serializedCheckoutItems, shipping, t]
  );

  useEffect(() => {
    if (!appliedDiscountCode?.code) return;

    const timeout = window.setTimeout(() => {
      validateDiscountCode(appliedDiscountCode.code, { silent: true });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    appliedDiscountCode?.code,
    checkoutSubtotal,
    paymentMethod,
    serializedCheckoutItems,
    shipping,
    validateDiscountCode,
  ]);

  const handleApplyDiscountCode = () => {
    void validateDiscountCode(discountCodeInput);
  };

  const handleRemoveDiscountCode = () => {
    setAppliedDiscountCode(null);
    setDiscountCodeInput("");
    setDiscountCodeStatus("idle");
    setDiscountCodeMessage("");
  };

  useEffect(() => {
    let savedCode = "";
    try {
      savedCode = window.localStorage.getItem("natonat-saved-discount-code") || "";
    } catch {
      savedCode = "";
    }

    const autoCode = (
      searchParams.get("discount") ||
      searchParams.get("code") ||
      searchParams.get("coupon") ||
      searchParams.get("ref") ||
      searchParams.get("referral") ||
      savedCode ||
      ""
    ).trim();
    if (!autoCode || autoAppliedDiscountRef.current === autoCode || appliedDiscountCode) return;

    autoAppliedDiscountRef.current = autoCode;
    setDiscountCodeInput(autoCode.toUpperCase());
    void validateDiscountCode(autoCode);
  }, [appliedDiscountCode, searchParams, validateDiscountCode]);

  useEffect(() => {
    if (checkoutTracked.current || !hasCheckoutItems) return;

    checkoutTracked.current = true;
    trackMetaPixelEvent("InitiateCheckout", {
      content_ids: checkoutItems.map((item) => String(item.id)),
      contents: checkoutItems.map((item) => ({
        id: String(item.id),
        quantity: item.quantity,
        item_price: item.price,
      })),
      content_type: "product",
      num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
      value: finalTotal,
      currency: "EGP",
    });
  }, [checkoutItems, finalTotal, hasCheckoutItems]);

  const controlBase =
    "border border-[#0F1A26]/10 bg-white text-[#0F1A26] placeholder:text-[#0F1A26]/40 caret-[#0F1A26] focus:border-[#EEBC3F] focus:outline-none transition-colors [color-scheme:light]";

  const inputClass = `w-full px-4 py-3 rounded-xl ${controlBase}`;
  const inputIconClass = `w-full px-4 py-3 pl-11 rounded-xl ${controlBase}`;
  const inputSmallClass = `w-full px-3 py-2.5 rounded-lg text-sm ${controlBase}`;
  const inputSmallIconClass = `w-full px-3 py-2.5 pl-10 rounded-lg text-sm ${controlBase}`;
  const getInputClass = (field: string, baseClass: string) =>
    fieldErrors[field] ? `${baseClass} border-red-400 focus:border-red-500` : baseClass;
  const renderFieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors[field]}</p>
    ) : null;

  if (isSuccess) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-[#EEBC3F]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-[#EEBC3F]" />
              </div>
              <h1 className="text-3xl font-bold text-[#0F1A26] mb-2">{t('success.title')}</h1>
              <p className="text-[#0F1A26]/60 mb-6">
                {t('success.subtitle')}
              </p>
              <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 mb-6">
                <p className="text-sm text-[#0F1A26]/60 mb-1">{t('success.orderNumber')}</p>
                <p className="text-lg font-semibold text-[#0F1A26] mb-4">#NAT-{orderId}</p>

                {/* Aramex Status Indicator */}
                {aramexStatus !== "idle" && aramexStatus !== "skipped" && (
                  <div className={`border-t border-[#0F1A26]/10 pt-4 ${aramexStatus === "success" ? "" : aramexStatus === "pending" ? "animate-pulse" : ""
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${aramexStatus === "success"
                        ? "bg-green-100 text-green-600"
                        : aramexStatus === "pending"
                          ? "bg-[#EEBC3F]/20 text-[#EEBC3F]"
                          : "bg-red-100 text-red-600"
                        }`}>
                        {aramexStatus === "success" ? "\u2713" : aramexStatus === "pending" ? "\u2022" : "\u2717"}
                      </div>
                      <p className={`text-sm font-semibold ${aramexStatus === "success"
                        ? "text-green-600"
                        : aramexStatus === "pending"
                          ? "text-[#EEBC3F]"
                          : "text-red-600"
                        }`}>
                        {aramexStatus === "success"
                          ? t("aramexStatus.success")
                          : aramexStatus === "pending"
                            ? t("aramexStatus.pending")
                            : t("aramexStatus.failed")
                        }
                      </p>
                    </div>
                    {trackingNumber && (
                      <>
                        <p className="text-sm text-[#0F1A26]/60 mb-0.5">{t("aramexStatus.trackingNumber")}</p>
                        <p className="text-lg font-semibold text-[#EEBC3F]">{trackingNumber}</p>
                      </>
                    )}
                    {aramexStatus === "failed" && aramexError && (
                      <p className="text-xs text-red-500 mt-1">{aramexError}</p>
                    )}
                    {aramexStatus === "failed" && (
                      <p className="text-xs text-[#0F1A26]/40 mt-1">{t("aramexStatus.manualShipment")}</p>
                    )}
                  </div>
                )}
              </div>
              <Link href="/shop">
                <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                  {t('success.continueShopping')}
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (mounted && !hasCheckoutItems) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] px-4 py-32">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#0F1A26]/5 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEBC3F]/15">
              <ShoppingBag className="h-8 w-8 text-[#EEBC3F]" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-[#0F1A26]">
              {t("emptyCart.title")}
            </h1>
            <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-[#0F1A26]/60">
              {t("emptyCart.description")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/shop">
                <Button className="h-12 w-full rounded-full bg-[#EEBC3F] px-8 font-bold text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white sm:w-auto">
                  {t("emptyCart.shopNow")}
                </Button>
              </Link>
              <Link href="/cart">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-[#0F1A26]/10 px-8 font-bold text-[#0F1A26] hover:bg-[#F1EBE3] sm:w-auto"
                >
                  {t("emptyCart.viewCart")}
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] pb-28">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              {t('header.title').split(' ')[0]}<span className="text-[#EEBC3F]">{t('header.title').split(' ')[1] || ''}</span>
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-base md:text-lg">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/cart"
            className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] font-medium flex items-center gap-2 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToCart')}
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout Form */}
            <div className="flex-1">
              <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                {/* Delivery Method */}
                <div className="order-2 bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#EEBC3F]" />
                    {t("form.delivery.title")}
                  </h2>

                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === "delivery"
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/5"
                        : "border-[#0F1A26]/10"
                        }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryMethod === "delivery"}
                        onChange={(e) => {
                          setDeliveryMethod(e.target.value);
                          setFieldErrors((current) => ({ ...current, deliveryMethod: "" }));
                        }}
                        className="w-4 h-4 accent-[#EEBC3F] [color-scheme:light]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">
                          {t("form.delivery.deliveryOption.title")}
                        </span>
                        <p className="text-xs text-[#0F1A26]/50">
                          {t("form.delivery.deliveryOption.subtitle")}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === "pickup"
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/5"
                        : "border-[#0F1A26]/10"
                        }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === "pickup"}
                        onChange={(e) => {
                          setDeliveryMethod(e.target.value);
                          setFieldErrors((current) => ({ ...current, deliveryMethod: "" }));
                        }}
                        className="w-4 h-4 accent-[#EEBC3F] [color-scheme:light]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#0F1A26]">
                          {t("form.delivery.pickupOption.title")}
                        </span>
                        <p className="text-xs text-[#0F1A26]/50">
                          {t("form.delivery.pickupOption.subtitle")}
                        </p>
                      </div>
                    </label>

                    {/* Pickup Customer Details */}
                    {deliveryMethod === "pickup" && (
                      <div className="mx-4 md:ml-7 p-4 md:p-5 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">
                            {t("form.delivery.pickupLocation.title")}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                                {t("form.shipping.fullName")}
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => {
                                  setFormData({ ...formData, firstName: e.target.value });
                                  setFieldErrors((current) => ({ ...current, firstName: "" }));
                                }}
                                className={getInputClass("firstName", inputSmallClass)}
                                placeholder={t("form.shipping.fullNamePlaceholder")}
                              />
                              {renderFieldError("firstName")}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                              {t("form.shipping.phone")}
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-[#0F1A26]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => {
                                  setFormData({ ...formData, phone: e.target.value });
                                  setFieldErrors((current) => ({ ...current, phone: "" }));
                                }}
                                className={getInputClass("phone", inputSmallIconClass)}
                                placeholder={t("form.shipping.phonePlaceholder")}
                              />
                              {renderFieldError("phone")}
                            </div>
                          </div>

                          <div className="flex flex-col p-3 bg-white rounded-lg mt-3">
                            <span className="text-sm text-[#0F1A26]/60 mb-1">
                              {t("form.delivery.pickupLocation.addressLabel")}
                            </span>
                            <span className="text-sm font-medium text-[#0F1A26]">
                              {t("form.pickupLocation.name")}
                            </span>
                            <span className="text-sm font-medium text-[#0F1A26]">
                              {t("form.pickupLocation.address")}
                            </span>
                          </div>

                          <a
                            href={t("form.pickupLocation.mapUrl")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2 bg-white rounded-lg text-sm font-medium text-[#0F1A26] hover:bg-[#EEBC3F]/20 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-[#EEBC3F]" />
                            {t("form.delivery.pickupLocation.viewOnMap")}
                          </a>

                          <p className="text-xs text-[#0F1A26]/60 text-center">
                            {t("form.delivery.pickupLocation.instruction")}
                          </p>
                        </div>
                      </div>
                    )}
                    {renderFieldError("deliveryMethod")}
                  </div>
                </div>

                {/* Shipping - only show when delivery is selected */}
                {deliveryMethod === "delivery" && (
                  <div id="checkout-shipping" className="order-1 scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/5 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#EEBC3F]" />
                      {t("form.shipping.title")}
                    </h2>

                    <p className="text-sm text-[#EEBC3F] mb-4 font-medium">
                      {t("form.shipping.egyptOnly")}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="order-1 sm:col-span-2">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.fullName")}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => {
                            setFormData({ ...formData, firstName: e.target.value });
                            setFieldErrors((current) => ({ ...current, firstName: "" }));
                          }}
                          className={getInputClass("firstName", inputClass)}
                          placeholder={t("form.shipping.fullNamePlaceholder")}
                        />
                        {renderFieldError("firstName")}
                      </div>

                      <div className="order-5 sm:col-span-2">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.address")}
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <MapPin className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={formData.address}
                              onChange={(e) => {
                                setFormData({ ...formData, address: e.target.value });
                                setFieldErrors((current) => ({ ...current, address: "" }));
                              }}
                              className={getInputClass("address", inputIconClass)}
                              placeholder={t("form.shipping.addressPlaceholder")}
                            />
                          </div>

                          {/* <button
                            type="button"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    setFormData({
                                      ...formData,
                                      address: `Lat: ${position.coords.latitude.toFixed(
                                        6
                                      )}, Lng: ${position.coords.longitude.toFixed(6)}`,
                                    });
                                  },
                                  (error) => {
                                    console.error("Error getting location:", error);
                                    alert(t("form.location.error"));
                                  }
                                );
                              } else {
                                alert(t("form.location.notSupported"));
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-3 rounded-xl border-2 border-[#EEBC3F]/30 bg-[#EEBC3F]/5 hover:bg-[#EEBC3F]/10 hover:border-[#EEBC3F] transition-all flex items-center justify-center gap-2 whitespace-nowrap text-[#0F1A26]"
                          >
                            <MapPin className="w-4 h-4 text-[#EEBC3F]" />
                            <span className="text-sm font-medium text-[#0F1A26]">
                              {t("form.location.detect")}
                            </span>
                          </button> */}
                        </div>
                        <p className="mt-2 rounded-lg bg-[#EEBC3F]/10 px-3 py-2 text-xs font-semibold text-[#0F1A26]/65">
                          {t("hints.address")}
                        </p>
                        {renderFieldError("address")}
                      </div>

                      <div className="order-4">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.city")}
                        </label>
                        <div className="relative">
                          <Search className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                          <input
                            type="search"
                            required
                            role="combobox"
                            aria-expanded={cityListOpen}
                            aria-controls="checkout-city-list"
                            aria-autocomplete="list"
                            autoComplete="off"
                            value={citySearch}
                            onFocus={() => setCityListOpen(true)}
                            onBlur={() => {
                              window.setTimeout(() => {
                                validateCitySearch();
                                setCityListOpen(false);
                              }, 150);
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              const exactCity = findExactAramexCity(aramexCities, value);

                              setCitySearch(value);
                              setFormData((current) => ({
                                ...current,
                                city: exactCity || "",
                              }));
                              setFieldErrors((current) => ({ ...current, city: "" }));
                              setCityListOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && cityListOpen && filteredCities[0]) {
                                e.preventDefault();
                                selectCity(filteredCities[0]);
                              }
                              if (e.key === "Escape") setCityListOpen(false);
                            }}
                            className={`${getInputClass("city", inputIconClass)} pr-11 disabled:opacity-50`}
                            disabled={loadingCities}
                            placeholder={
                              loadingCities
                                ? t("form.shipping.loadingCities")
                                : t("form.shipping.citySearchPlaceholder")
                            }
                          />
                          <ChevronDown
                            className={`w-4 h-4 text-[#0F1A26]/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${
                              cityListOpen ? "rotate-180" : ""
                            }`}
                          />

                          {cityListOpen && !loadingCities && (
                            <div
                              id="checkout-city-list"
                              role="listbox"
                              className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#0F1A26]/10 bg-white p-1.5 shadow-xl"
                            >
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city) => (
                                  <button
                                    key={city}
                                    type="button"
                                    role="option"
                                    aria-selected={formData.city === city}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectCity(city)}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#EEBC3F]/15 ${
                                      formData.city === city
                                        ? "bg-[#EEBC3F]/20 font-semibold text-[#0F1A26]"
                                        : "text-[#0F1A26]/75"
                                    }`}
                                  >
                                    <span>{city}</span>
                                    {formData.city === city && (
                                      <Check className="h-4 w-4 shrink-0 text-[#EEBC3F]" />
                                    )}
                                  </button>
                                ))
                              ) : (
                                <p className="px-3 py-4 text-center text-sm text-[#0F1A26]/50">
                                  {t("form.shipping.noCitiesFound")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {!fieldErrors.city && (
                          <p className="mt-1.5 text-xs font-semibold text-[#0F1A26]/45">
                            {t("hints.city")}
                          </p>
                        )}
                        {renderFieldError("city")}
                      </div>

                      <div className="order-3">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.governorate")}
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            required
                            value={formData.governorate}
                            onChange={(e) => {
                              setFormData({ ...formData, governorate: e.target.value, city: "" });
                              setCitySearch("");
                              setFieldErrors((current) => ({ ...current, governorate: "", city: "" }));
                            }}
                            className={`${getInputClass("governorate", inputIconClass)} appearance-none pr-11`}
                          >
                            <option value="">{t("form.shipping.governoratePlaceholder")}</option>
                            {egyptGovernorates.map((governorate) => (
                              <option key={governorate.value} value={governorate.value}>
                                {locale === "ar" ? governorate.ar : governorate.en}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#0F1A26]/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {renderFieldError("governorate")}
                      </div>

                      <div className="order-2">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.phone")}
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData({ ...formData, phone: e.target.value });
                              setFieldErrors((current) => ({ ...current, phone: "" }));
                            }}
                            className={getInputClass("phone", inputIconClass)}
                            placeholder={t("form.shipping.phonePlaceholder")}
                          />
                        </div>
                        {renderFieldError("phone")}
                      </div>

                      <div className="order-6 sm:col-span-2">
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.contact.emailOptional")}
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            setFieldErrors((current) => ({ ...current, email: "" }));
                          }}
                          className={getInputClass("email", inputClass)}
                          placeholder="your@email.com"
                        />
                        {renderFieldError("email")}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div id="checkout-payment" className="order-3 scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/10 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#EEBC3F]" />
                    {t("form.payment.title")}
                  </h2>


                  <div className="flex flex-col gap-3">
                    <label
                      className={`order-3 flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "card"
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/10"
                        : "border-[#0F1A26]/20 hover:border-[#0F1A26]/30"
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setFieldErrors((current) => ({ ...current, paymentMethod: "" }));
                        }}
                        className="w-5 h-5 mt-1 accent-[#EEBC3F] [color-scheme:light]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <span className="font-semibold text-[#0F1A26] text-base">
                              {t("form.payment.card.title")}
                            </span>
                            <p className="text-sm text-[#0F1A26]/70 mt-1">
                              {t("form.payment.card.subtitle")}
                            </p>
                            {cardPaymentDiscountPercent > 0 && (
                              <p className="text-sm text-green-600 font-bold mt-1">{cardPaymentDiscountPercent}% OFF</p>
                            )}
                          </div>

                          <CardPaymentLogoImages />

                        </div>
                      </div>
                    </label>

                    <label
                      className={`order-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod"
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/10"
                        : "border-[#0F1A26]/20 hover:border-[#0F1A26]/30"
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setFieldErrors((current) => ({ ...current, paymentMethod: "" }));
                        }}
                        className="w-5 h-5 accent-[#EEBC3F] [color-scheme:light]"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-[#0F1A26] text-base">
                          {t("form.payment.cod.title")}
                        </span>
                        <p className="text-sm text-[#0F1A26]/70 mt-1">
                          {t("form.payment.cod.subtitle")}
                        </p>
                        {codPaymentDiscountPercent > 0 && (
                          <p className="text-sm text-green-600 font-bold mt-1">{codPaymentDiscountPercent}% OFF</p>
                        )}
                      </div>
                    </label>

                    <label
                      className={`order-2 flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "instapay"
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/10"
                        : "border-[#0F1A26]/20 hover:border-[#0F1A26]/30"
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="instapay"
                        checked={paymentMethod === "instapay"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setFieldErrors((current) => ({ ...current, paymentMethod: "" }));
                        }}
                        className="w-5 h-5 mt-1 accent-[#EEBC3F] [color-scheme:light]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <span className="font-semibold text-[#0F1A26] text-base">
                              {t("form.payment.instapay.title")}
                            </span>
                            <p className="text-sm text-[#0F1A26]/70 mt-1">
                              {t("form.payment.instapay.subtitle")}
                            </p>
                            {instapayPaymentDiscountPercent > 0 && (
                              <p className="text-sm text-green-600 font-bold mt-1">{instapayPaymentDiscountPercent}% OFF</p>
                            )}
                          </div>

                          <InstaPayLogoImages />
                        </div>
                      </div>
                    </label>

                    {/* InstaPay Account Details Dropdown */}
                    {paymentMethod === "instapay" && (
                      <div className="order-2 mx-4 md:ml-7 p-3 md:p-4 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEBC3F] flex items-center justify-center">
                            <span className="text-white text-sm font-bold">i</span>
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A26]">
                            {t("form.payment.instapay.transferDetails")}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 bg-white rounded-lg">
                            <span className="text-sm text-[#0F1A26]/60">
                              {t("form.payment.instapay.accountName")}
                            </span>
                            <span className="text-sm font-medium text-[#0F1A26]">
                              {t("form.instapayAccount.name")}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 bg-white rounded-lg">
                            <span className="text-sm text-[#0F1A26]/60">
                              {t("form.payment.instapay.accountNumber")}
                            </span>
                            <span className="text-sm font-medium text-[#0F1A26] dir-ltr">
                              {t("form.instapayAccount.number")}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#0F1A26]/60 mt-3 text-center">
                          {t("form.payment.instapay.instruction")}
                        </p>

                        <div className="mt-4 rounded-2xl border border-dashed border-[#0F1A26]/20 bg-white p-3">
                          <label className="block text-sm font-black text-[#0F1A26]">
                            {t("form.payment.instapay.proofLabel")}
                          </label>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#0F1A26]/55">
                            {t("form.payment.instapay.proofHint")}
                          </p>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="mt-3 block w-full rounded-xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 py-2 text-sm font-semibold text-[#0F1A26] file:me-3 file:rounded-full file:border-0 file:bg-[#EEBC3F] file:px-4 file:py-2 file:text-sm file:font-black file:text-[#0F1A26]"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              setFieldErrors((current) => ({ ...current, instapayProof: "" }));

                              if (!file) {
                                setInstapayProof(null);
                                return;
                              }

                              if (!file.type.startsWith("image/")) {
                                setInstapayProof(null);
                                setFieldErrors((current) => ({
                                  ...current,
                                  instapayProof: t("validation.instapayProofImage"),
                                }));
                                return;
                              }

                              if (file.size > INSTAPAY_PROOF_MAX_BYTES) {
                                setInstapayProof(null);
                                setFieldErrors((current) => ({
                                  ...current,
                                  instapayProof: t("validation.instapayProofSize"),
                                }));
                                return;
                              }

                              try {
                                const dataUrl = await readFileAsDataUrl(file);
                                setInstapayProof({ file, dataUrl });
                              } catch {
                                setInstapayProof(null);
                                setFieldErrors((current) => ({
                                  ...current,
                                  instapayProof: t("validation.instapayProofRead"),
                                }));
                              }
                            }}
                          />
                          {instapayProof && (
                            <p className="mt-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                              {t("form.payment.instapay.proofReady", { file: instapayProof.file.name })}
                            </p>
                          )}
                          {renderFieldError("instapayProof")}
                        </div>
                      </div>
                    )}
                    {renderFieldError("paymentMethod")}
                  </div>
                  <div className="mt-4 rounded-xl bg-[#0F1A26]/5 px-4 py-3 text-xs font-semibold text-[#0F1A26]/65">
                    {t("hints.securePayment")}
                  </div>
                </div>

                <div className="order-4 flex items-start gap-3 rounded-2xl border border-green-700/15 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                  <p>{t("form.reassurance")}</p>
                </div>

                {showCheckoutActions && (
                  <div ref={bottomOrderCtaRef} className="order-5 rounded-[1.75rem] border border-[#0F1A26]/10 bg-white p-3 shadow-[0_18px_45px_rgba(15,26,38,0.10)]">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="group h-14 w-full rounded-[1.25rem] bg-[#E31820] text-base font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#E31820]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F1A26] disabled:translate-y-0 disabled:opacity-50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        {isSubmitting ? t("form.processing") : t("form.orderNow")}
                      </span>
                    </Button>
                    <p className="mt-2 text-center text-xs font-bold text-[#0F1A26]/55">
                      {!deliveryMethod
                          ? `${t("form.completeOrder", {
                            total: checkoutSubtotal.toString(),
                          })} (${t("form.delivery.title")})`
                          : deliveryMethod === "delivery" && !formData.city
                            ? `${t("form.completeOrder", {
                              total: displayedTotal.toString(),
                            })} (${t("form.selectCity")})`
                            : t("form.completeOrder", { total: displayedTotal.toString() })}
                    </p>
                  </div>
                )}

                {submitError ? (
                  <p className="text-sm text-red-600 mt-3">{submitError}</p>
                ) : null}
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96 order-first lg:order-last">
              <div id="checkout-review" className="scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/5 lg:sticky lg:top-28">
                <h2 className="text-lg font-semibold text-[#0F1A26] mb-2">{t('summary.title')}</h2>
                {buyNowItem ? (
                  <p className="text-xs text-[#EEBC3F] font-medium mb-4">{t('summary.buyNowMode') || '🛒 Buy Now - Quick Purchase'}</p>
                ) : (
                  <p className="text-xs text-[#0F1A26]/60 mb-4">{t('summary.cartMode') || '🛍️ From Cart'}</p>
                )}

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {!mounted ? (
                    <div className="flex gap-3">
                      <div className="w-24 h-24 rounded-lg bg-[#F8F6F3] flex-shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-[#F8F6F3] rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-[#F8F6F3] rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ) : checkoutItems.map((item, index) => (
                    <Link
                      key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}
                      href={`/product/${item.slug}`}
                      className="flex gap-3 group cursor-pointer"
                      prefetch={false}
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F8F6F3] flex-shrink-0 relative">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain"
                          loading="lazy"
                          quality={40}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#0F1A26] truncate group-hover:text-[#EEBC3F] transition-colors">{item.name}</h4>
                        {/* Show size for covers, color for passport wallets */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.size && (
                            <span className="text-[10px] bg-[#EEBC3F]/10 text-[#0F1A26]/70 px-1.5 py-0.5 rounded">
                              {t('summary.size') || 'Size'}: {item.size.toUpperCase()}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] bg-[#EEBC3F]/10 text-[#0F1A26]/70 px-1.5 py-0.5 rounded capitalize">
                              {t('summary.color') || 'Color'}: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#0F1A26]/50 mt-0.5">{t('summary.qty', { quantity: item.quantity })}</p>
                      </div>
                      <span className="text-sm font-medium text-[#0F1A26]">
                        EGP {item.price * item.quantity}
                      </span>
                    </Link>
                  ))}
                </div>

                {mounted && checkoutPackOnat && (
                  <div className="mb-5 overflow-hidden rounded-[24px] border border-[#EEBC3F]/45 bg-[#FFF4D6] shadow-[0_18px_45px_rgba(238,188,63,0.18)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[#EEBC3F]/25 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-[#0F1A26]">{t("upsell.title")}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#0F1A26]/65">
                          {t("upsell.subtitle")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#0F1A26] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#EEBC3F]">
                        PackOnat
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4">
                      <Link
                        href={`/product/${checkoutPackOnat.slug}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm"
                        prefetch={false}
                      >
                        <Image
                          src={checkoutPackOnatColor?.image || checkoutPackOnat.image}
                          alt={checkoutPackOnat.name}
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                          loading="lazy"
                          quality={60}
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${checkoutPackOnat.slug}`}
                          className="block truncate text-base font-black text-[#0F1A26] transition hover:text-[#B88900]"
                          prefetch={false}
                        >
                          {checkoutPackOnat.name}
                        </Link>
                        {checkoutPackOnatColor?.name && (
                          <p className="mt-1 truncate text-xs font-bold text-[#0F1A26]/55">
                            {checkoutPackOnatColor.name}
                          </p>
                        )}
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#0F1A26]">EGP {checkoutPackOnat.price}</span>
                          {checkoutPackOnat.originalPrice && checkoutPackOnat.originalPrice > checkoutPackOnat.price && (
                            <span className="text-xs font-bold text-[#0F1A26]/35 line-through">
                              EGP {checkoutPackOnat.originalPrice}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={addCheckoutPackOnat}
                          className="mt-3 h-10 w-full rounded-full bg-[#EEBC3F] px-4 text-xs font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white"
                        >
                          {t("upsell.addToCart")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">{t('summary.subtotal')}</span>
                    <span className="text-[#0F1A26] font-medium">
                      EGP {mounted ? (buyNowItem ? checkoutSubtotal : originalSubtotal) : "--"}
                    </span>
                  </div>
                  {mounted && displayedDiscountAmount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{displayedDiscountLabel}</span>
                        <span className="font-medium">-EGP {displayedDiscountAmount}</span>
                      </div>
                      {!hasAppliedDiscountCode && (
                        <div className="flex flex-col gap-0.5">
                        {appliedDiscounts.map((desc, i) => (
                          <span key={i} className="text-[10px] text-green-600/70 italic text-right block">
                            • {desc}
                          </span>
                        ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#0F1A26]">
                      <TicketPercent className="h-4 w-4 text-[#EEBC3F]" />
                      {t("discount.title")}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => {
                          setDiscountCodeInput(e.target.value.toUpperCase());
                          if (discountCodeStatus !== "idle") {
                            setDiscountCodeStatus("idle");
                            setDiscountCodeMessage("");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyDiscountCode();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-[#0F1A26]/10 bg-white px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] text-[#0F1A26] outline-none placeholder:normal-case placeholder:tracking-normal focus:border-[#EEBC3F]"
                        placeholder={t("discount.placeholder")}
                        disabled={discountCodeStatus === "loading"}
                      />
                      {appliedDiscountCode ? (
                        <button
                          type="button"
                          onClick={handleRemoveDiscountCode}
                          className="rounded-xl border border-[#0F1A26]/10 bg-white px-3 py-2 text-xs font-black text-[#0F1A26] transition hover:bg-[#0F1A26] hover:text-white"
                        >
                          {t("discount.remove")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyDiscountCode}
                          disabled={discountCodeStatus === "loading" || !discountCodeInput.trim()}
                          className="rounded-xl bg-[#0F1A26] px-4 py-2 text-xs font-black text-white transition hover:bg-[#EEBC3F] hover:text-[#0F1A26] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {discountCodeStatus === "loading" ? t("discount.checking") : t("discount.apply")}
                        </button>
                      )}
                    </div>
                    {discountCodeMessage ? (
                      <p
                        className={`mt-2 text-xs font-bold ${
                          discountCodeStatus === "success" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {discountCodeMessage}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-[#0F1A26]/45">
                        {t("discount.hint")}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">{t('summary.shipping')}</span>
                    <span className="text-[#0F1A26] font-medium">
                      {!deliveryMethod ? (
                        <span className="text-[#0F1A26]/50 font-medium text-xs">{t("form.delivery.title")}</span>
                      ) : deliveryMethod === "delivery" && formData.city ? (
                        shipping === 0
                          ? `${t('summary.free')} ${t('summary.freeShippingOver1000') || '(Order > 1000 EGP)'}`
                          : `EGP ${shipping}`
                      ) : deliveryMethod === "delivery" ? (
                        <span className="text-[#0F1A26]/50 font-medium text-xs">{t('summary.selectCityForShipping')}</span>
                      ) : (
                        t('summary.free')
                      )}
                    </span>
                  </div>
                  {!hasAppliedDiscountCode && paymentDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t("summary.paymentMethodDiscount")}</span>
                      <span className="font-medium">-EGP {paymentDiscount}</span>
                    </div>
                  )}
                  <div className="border-t border-[#0F1A26]/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[#0F1A26] font-semibold">{t('summary.total')}</span>
                      <span className="text-[#0F1A26] font-bold text-lg">
                        EGP {mounted
                          ? displayedTotal
                          : "--"
                        }
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {showCheckoutActions && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-3 ps-3 pe-[5.25rem] transition-all duration-300 sm:px-6 sm:pb-5 ${
            isBottomOrderCtaVisible ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
          }`}
          aria-hidden={isBottomOrderCtaVisible}
        >
          <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-[22px] border border-white/10 bg-[#0F1A26]/95 p-3 shadow-[0_18px_60px_rgba(15,26,38,0.34)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:p-3.5">
            <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 px-1 sm:flex sm:justify-start sm:px-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white/55">
                  {t("summary.itemCount", { count: checkoutItemCount })}
                  {" • "}
                  {!deliveryMethod
                    ? t("form.delivery.title")
                    : deliveryMethod === "delivery" && !formData.city
                      ? t("summary.selectCityForShipping")
                      : shipping === 0
                        ? t("summary.freeShipping")
                        : `${t("summary.shippingLabel")} EGP ${shipping}`}
                </p>
                {hasAppliedDiscountCode && displayedDiscountAmount > 0 ? (
                  <p className="mt-1 truncate text-[11px] font-bold text-emerald-400">
                    {displayedDiscountLabel}: -EGP {displayedDiscountAmount}
                  </p>
                ) : paymentDiscount > 0 ? (
                  <p className="mt-1 truncate text-[11px] font-bold text-emerald-400">
                    {t("summary.paymentDiscount", { amount: paymentDiscount })}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 border-s border-white/10 ps-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                  {t("summary.total")}
                </p>
                <p className="text-lg font-black leading-tight text-white">
                  EGP {displayedTotal}
                </p>
              </div>
            </div>

            <p className="hidden max-w-xs text-xs font-semibold leading-5 text-white/60 lg:block">
              {t("form.reassurance")}
            </p>

            <Button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting || !hasCheckoutItems}
              className="h-12 w-full shrink-0 rounded-2xl bg-[#E31820] px-5 text-sm font-black text-white shadow-lg shadow-black/20 hover:bg-[#C61219] disabled:opacity-50 sm:w-auto sm:min-w-56 sm:px-8"
            >
              {isSubmitting ? (
                t("form.processing")
              ) : (
                <>
                  <span>{t("form.orderNow")}</span>
                  <span className="ms-2 sm:hidden">
                    • EGP {displayedTotal}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      {isSubmitting && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0F1A26]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-white p-6 text-center shadow-[0_24px_80px_rgba(15,26,38,0.35)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#EEBC3F]/25 border-t-[#EEBC3F]" />
            <p className="text-lg font-black text-[#0F1A26]">
              {locale === "ar" ? "بنثبت طلبك دلوقتي" : "Securing your order"}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#0F1A26]/65">
              {locale === "ar"
                ? "استنى لحظات ومتضغطش تاني. لو الشحن بياخد وقت، الطلب لسه بيتسجل."
                : "Please wait and do not submit again. Shipping setup may take a few moments."}
            </p>
          </div>
        </div>
      )}
      {showPackonatUpsell && checkoutPopupProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F1A26]/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative grid w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl sm:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[240px] bg-[#0F1A26] p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(238,188,63,0.22),transparent_36%),radial-gradient(circle_at_72%_82%,rgba(227,24,32,0.24),transparent_34%)]" />
              <div className="relative mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-[#EEBC3F] ring-1 ring-white/15">
                <TicketPercent className="h-4 w-4" />
                {checkoutPopup.badge}
              </div>
              <div className="relative mx-auto aspect-square max-h-[300px] overflow-hidden rounded-3xl bg-white/10">
                <Image
                  src={checkoutPopupImage}
                  alt={checkoutPopupProduct.name || checkoutPopup.title}
                  fill
                  sizes="(min-width: 640px) 320px, 80vw"
                  className="object-contain p-7"
                />
              </div>
            </div>

            <div className="p-6 sm:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F1EBE3] px-3 py-1.5 text-xs font-black text-[#0F1A26]">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                {"\u0642\u0628\u0644 \u0635\u0641\u062d\u0629 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628"}
              </div>

              <h2 className="text-2xl font-black leading-tight text-[#0F1A26] sm:text-3xl">
                {checkoutPopup.title}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#0F1A26]/65">
                {checkoutPopup.description}
              </p>

              <div className="mt-5 rounded-3xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E31820]">
                      {"\u0633\u0639\u0631 \u0627\u0644\u0645\u0646\u062a\u062c"}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#0F1A26]">
                      {checkoutPopupProduct.name}
                    </h3>
                  </div>
                  <p className="shrink-0 text-2xl font-black text-[#E31820]">
                    EGP {Math.round(checkoutPopupPrice).toLocaleString("en-US")}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#0F1A26]/75">
                  {checkoutPopup.discountPercent > 0 && (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-100 text-base font-black text-green-700">
                      {checkoutPopup.discountPercent}%
                    </span>
                  )}
                  <span>
                    {checkoutPopup.hint}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={goToPackonatProduct}
                  className="h-12 rounded-2xl bg-[#E31820] text-sm font-black text-white shadow-lg shadow-[#E31820]/20 hover:bg-[#C61219]"
                >
                  {checkoutPopup.acceptLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={continueToSuccessPage}
                  className="h-12 rounded-2xl border-[#0F1A26]/20 bg-white text-sm font-black"
                >
                  {checkoutPopup.declineLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
