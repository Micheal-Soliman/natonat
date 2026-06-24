"use client";

import { Suspense, useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Truck, Check, MapPin, Phone, Mail, Newspaper, Store, Package, Search, ChevronDown, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "@/app/lib/cart-context";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";
import { useCatalogProducts } from "@/app/lib/catalog-context";


function generateOrderRef() {
  return `NAT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

const ARAMEX_CITIES_CACHE_KEY = "natonat-aramex-cities-eg";
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

function normalizeCitySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
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
  const aliasTerms = Object.entries(citySearchAliases).flatMap(([key, aliases]) =>
    cityKey === normalizeCitySearch(key) || aliases.some((alias) => cityKey.includes(normalizeCitySearch(alias)))
      ? aliases
      : []
  );

  return [city, ...aliasTerms].map(normalizeCitySearch);
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
  const locale = useLocale();
  const router = useRouter();
  const { items, subtotal, discount, originalSubtotal, appliedDiscounts, clearCart, buyNowItem, setBuyNowItem } = useCart();
  const checkoutTracked = useRef(false);

  // Group duplicate items (same id + size + color) and sum quantities
  const checkoutItems = useMemo(() => {
    const rawCheckoutItems = buyNowItem ? [buyNowItem] : items;

    return rawCheckoutItems.reduce((acc: typeof rawCheckoutItems, item) => {
      const existing = acc.find(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
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

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postCode: "",
    phone: "",
    newsletter: false,
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
      ].slice(0, 60);
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
      })
      .slice(0, 60);
  }, [aramexCities, citySearch]);

  const selectCity = (city: string) => {
    setFormData((current) => ({ ...current, city }));
    setCitySearch(city);
    setFieldErrors((current) => ({ ...current, city: "" }));
    setCityListOpen(false);
  };

  const validateCitySearch = () => {
    if (deliveryMethod !== "delivery" || loadingCities) return;

    const normalizedValue = normalizeCitySearch(citySearch);
    const exactCity = aramexCities.find((city) =>
      getCitySearchTerms(city).some((term) => term === normalizedValue)
    );

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

  const [paymentMethod, setPaymentMethod] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess] = useState(false);
  const [orderId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [aramexStatus, setAramexStatus] = useState<"idle" | "pending" | "success" | "failed" | "skipped">("idle");
  const [aramexError, setAramexError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasCheckoutItems = checkoutItems.length > 0;

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

    if (!emailValue) nextErrors.email = requiredMessage;
    else if (!isValidEmail) nextErrors.email = invalidEmailMessage;

    if (!deliveryMethod) nextErrors.deliveryMethod = requiredMessage;

    if (deliveryMethod) {
      if (!formData.firstName.trim()) nextErrors.firstName = requiredMessage;
      if (!formData.lastName.trim()) nextErrors.lastName = requiredMessage;
      if (!formData.phone.trim()) nextErrors.phone = requiredMessage;
      else if (!isValidEgyptPhone) nextErrors.phone = invalidPhoneMessage;
    }

    if (deliveryMethod === "delivery") {
      if (!formData.address.trim()) nextErrors.address = requiredMessage;
      if (!formData.city || !aramexCities.includes(formData.city)) {
        nextErrors.city = invalidCityMessage;
      }
    }

    if (!paymentMethod) nextErrors.paymentMethod = requiredMessage;

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
          items: checkoutItems.map((item) => serializeOrderItem(item, products)),
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

    const orderRef = generateOrderRef();
    try {
      window.sessionStorage.setItem(
        `meta-purchase-payload-${orderRef}`,
        JSON.stringify({
          value: finalTotal,
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

        const paymentDiscount = Math.round((checkoutSubtotal + shipping) * 0.02);
        const amountCents = Math.round((checkoutSubtotal + shipping - paymentDiscount) * 100);
        const itemsSum = intentionItems.reduce((sum, it) => sum + it.amount, 0);
        const shouldSendPaymobItems = paymentDiscount <= 0;
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
              last_name: formData.lastName || "NA",
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
              total_egp: finalTotal,
              payment_discount: paymentDiscount > 0 ? paymentDiscount : null,
              payment_discount_percent: paymentDiscount > 0 ? 2 : null,
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
          city: formData.city,
        });

        const orderLogRes = await fetch("/api/orders/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "checkout",
            order_ref: orderRef,
            locale,
            payment_method: "paymob_card",
            status: "created",
            payment_status: "Pending",
            amount_egp: finalTotal,
            amount_cents: amountCents,
            shipping_egp: shipping,
            delivery_method: deliveryMethod,
            customer: {
              email: formData.email,
              phone: formData.phone,
              first_name: formData.firstName,
              last_name: formData.lastName,
              city: formData.city,
              address: formData.address,
              postCode: formData.postCode,
            },
            items: checkoutItems.map((item) => serializeOrderItem(item, products)),
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
            },
            created_at: new Date().toISOString(),
          }),
        });
        if (!orderLogRes.ok) {
          const logError = await orderLogRes.json().catch(() => null);
          throw new Error(logError?.error || "Could not save order before payment");
        }

        const checkoutUrl = `${paymobBaseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
        window.location.href = checkoutUrl;
        return;
      } catch (err) {
        setIsSubmitting(false);
        setSubmitError(err instanceof Error ? err.message : "Payment initialization failed");
        return;
      }
    }

    // --- Delivery Order Flow ---

    let aramexPayload: {
      trackingNumber: string;
      labelUrl?: string;
      guid?: string;
    } | null = null;

    // Step 1: Create Aramex shipment FIRST
    if (deliveryMethod === "delivery") {
      setAramexStatus("pending");

      try {
        const shipmentPayload = {
          orderRef,
          customer: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            postCode: formData.postCode,
          },
          items: checkoutItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })),
          totalValue: finalTotal,
          cod: paymentMethod === "cod",
          codAmount: paymentMethod === "cod" ? finalTotal : 0,
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
        }
      } catch (err) {
        setAramexStatus("failed");
        setAramexError(err instanceof Error ? err.message : "Network error");
      }
    } else {
      setAramexStatus("skipped");
    }

    // Step 2: Log order ONCE
    const shippingRuleCOD = getShippingRule({
      deliveryMethod,
      subtotal: checkoutSubtotal,
      city: formData.city,
    });

    try {
      const logRes = await fetch("/api/orders/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "checkout",
          order_ref: orderRef,
          locale,
          payment_method: paymentMethod,
          status: "confirmed",
          payment_status: paymentMethod === "cod" ? "Cash on Delivery" : "Confirmed",
          amount_egp: finalTotal,
          amount_cents: Math.round(finalTotal * 100),
          shipping_egp: shipping,
          delivery_method: deliveryMethod,

          aramex: aramexPayload,

          customer: {
            email: formData.email,
            phone: formData.phone,
            first_name: formData.firstName,
            last_name: formData.lastName,
            city: formData.city,
            address: formData.address,
            postCode: formData.postCode,
          },

          items: checkoutItems.map((item) => serializeOrderItem(item, products)),

          extras: {
            shipping_rule: shippingRuleCOD,
            city_key: formData.city,
            subtotal_egp: checkoutSubtotal,
            free_shipping_threshold: 1000,
            payment_discount: paymentDiscount > 0 ? paymentDiscount : null,
            payment_discount_percent: paymentDiscount > 0 ? 2 : null,
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
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Failed to log order");
      return;
    }


    // Step 3: Redirect to Order Confirmed page for tracking
    setIsSubmitting(false);
    clearCart();
    setBuyNowItem(null);

    router.push(
      `/order-confirmed?order_ref=${encodeURIComponent(orderRef)}&method=${encodeURIComponent(paymentMethod)}&success=true`
    );
  };

  // Shipping: 75 EGP for Cairo, Giza & Alexandria, 100 EGP for other cities, free for orders > 1000, pickup = 0
  const shipping = useMemo(() => {
    if (!deliveryMethod) return 0;
    if (deliveryMethod === "pickup") return 0;
    if (checkoutSubtotal > 1000) return 0;

    return isDiscountShippingCity(formData.city) ? 75 : 100;
  }, [
    deliveryMethod,
    checkoutSubtotal,
    formData.city
  ]);
  const total = useMemo(
    () => checkoutSubtotal + shipping,
    [checkoutSubtotal, shipping]
  );

  // 2% discount for non-COD payment methods
  const paymentDiscount = useMemo(
    () =>
      paymentMethod && paymentMethod !== "cod"
        ? Math.round((checkoutSubtotal + shipping) * 0.02)
        : 0,
    [paymentMethod, checkoutSubtotal, shipping]
  );

  const finalTotal = useMemo(
    () => total - paymentDiscount,
    [total, paymentDiscount]
  );

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

  const checkoutStepLabels = t.raw("steps") as string[];
  const contactStepDone = Boolean(formData.email.trim());
  const deliveryStepDone =
    Boolean(deliveryMethod) &&
    Boolean(formData.firstName.trim() && formData.lastName.trim() && formData.phone.trim()) &&
    (deliveryMethod === "pickup" || Boolean(formData.city && formData.address.trim()));
  const paymentStepDone = Boolean(paymentMethod);
  const reviewStepDone = contactStepDone && deliveryStepDone && paymentStepDone && hasCheckoutItems;
  const checkoutStepStatus = [
    contactStepDone,
    deliveryStepDone,
    paymentStepDone,
    reviewStepDone,
  ];
  const visibleCheckoutStepLabels = checkoutStepLabels;
  const checkoutStepAnchors = [
    "#checkout-details",
    "#checkout-shipping",
    "#checkout-payment",
    "#checkout-review",
  ];
  const firstIncompleteCheckoutStep = checkoutStepStatus.findIndex((isDone) => !isDone);
  const currentCheckoutStepIndex =
    firstIncompleteCheckoutStep === -1
      ? visibleCheckoutStepLabels.length - 1
      : firstIncompleteCheckoutStep;

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
      <main className="min-h-screen bg-[#F1EBE3] pb-28 lg:pb-0">
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

          <div className="mb-8 rounded-2xl border border-[#0F1A26]/5 bg-white p-4 shadow-sm shadow-[#0F1A26]/5 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#EEBC3F]">
                  {currentCheckoutStepIndex + 1}/{visibleCheckoutStepLabels.length}
                </p>
                <h2 className="mt-1 truncate text-lg font-black text-[#0F1A26] sm:text-xl">
                  {visibleCheckoutStepLabels[currentCheckoutStepIndex]}
                </h2>
              </div>
              <div className="hidden rounded-full bg-[#F1EBE3] px-4 py-2 text-xs font-bold text-[#0F1A26]/60 sm:block">
                {checkoutStepStatus.filter(Boolean).length}/{visibleCheckoutStepLabels.length}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visibleCheckoutStepLabels.map((label, index) => {
                const isDone = checkoutStepStatus[index];
                const isCurrent =
                  !isDone &&
                  checkoutStepStatus.slice(0, index).every(Boolean);
                const isActive = isDone || isCurrent || index === currentCheckoutStepIndex;

                return (
                  <a
                    key={label}
                    href={checkoutStepAnchors[index]}
                    aria-current={index === currentCheckoutStepIndex ? "step" : undefined}
                    className={`min-w-0 rounded-2xl border p-3 transition-all ${
                      isCurrent
                        ? "border-[#EEBC3F] bg-[#EEBC3F]/10 shadow-sm"
                        : isDone
                          ? "border-[#0F1A26]/10 bg-[#F8F6F3]"
                          : "border-[#0F1A26]/10 bg-white"
                    }`}
                  >
                    <div className="mb-2 h-1.5 rounded-full bg-[#0F1A26]/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isActive ? "w-full bg-[#EEBC3F]" : "w-0 bg-[#EEBC3F]"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isDone
                            ? "bg-[#0F1A26] text-white"
                            : isCurrent
                              ? "bg-[#EEBC3F] text-[#0F1A26]"
                              : "bg-[#0F1A26]/5 text-[#0F1A26]/35"
                        }`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span
                        className={`min-w-0 truncate text-xs font-bold sm:text-[13px] ${
                          isDone || isCurrent ? "text-[#0F1A26]" : "text-[#0F1A26]/35"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout Form */}
            <div className="flex-1">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Contact */}
                <div id="checkout-details" className="scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#EEBC3F]" />
                    {t("form.contact.title")}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                        {t("form.contact.email")}
                      </label>
                      <input
                        type="email"
                        required
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

                    {/* Newsletter Subscribe */}
                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#EEBC3F]/20 cursor-pointer transition-all hover:bg-[#EEBC3F]/5 hover:border-[#EEBC3F]/40">
                      <input
                        type="checkbox"
                        checked={formData.newsletter}
                        onChange={(e) =>
                          setFormData({ ...formData, newsletter: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#EEBC3F] rounded [color-scheme:light]"
                      />
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-[#EEBC3F]" />
                        <span className="text-sm font-medium text-[#0F1A26]">
                          {t("form.contact.newsletter")}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Delivery Method */}
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                                {t("form.shipping.firstName")}
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
                                placeholder={t("form.shipping.firstNamePlaceholder")}
                              />
                              {renderFieldError("firstName")}
                            </div>

                            <div>
                              <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                                {t("form.shipping.lastName")}
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => {
                                  setFormData({ ...formData, lastName: e.target.value });
                                  setFieldErrors((current) => ({ ...current, lastName: "" }));
                                }}
                                className={getInputClass("lastName", inputSmallClass)}
                                placeholder={t("form.shipping.lastNamePlaceholder")}
                              />
                              {renderFieldError("lastName")}
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
                  <div id="checkout-shipping" className="scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/5">
                    <h2 className="text-lg font-semibold text-[#0F1A26] mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#EEBC3F]" />
                      {t("form.shipping.title")}
                    </h2>

                    <p className="text-sm text-[#EEBC3F] mb-4 font-medium">
                      {t("form.shipping.egyptOnly")}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.firstName")}
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
                          placeholder={t("form.shipping.firstNamePlaceholder")}
                        />
                        {renderFieldError("firstName")}
                      </div>

                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.lastName")}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => {
                            setFormData({ ...formData, lastName: e.target.value });
                            setFieldErrors((current) => ({ ...current, lastName: "" }));
                          }}
                          className={getInputClass("lastName", inputClass)}
                          placeholder={t("form.shipping.lastNamePlaceholder")}
                        />
                        {renderFieldError("lastName")}
                      </div>

                      <div className="sm:col-span-2">
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

                      <div>
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
                              const normalizedValue = normalizeCitySearch(value);
                              const exactCity = aramexCities.find(
                                (city) => getCitySearchTerms(city).some((term) => term === normalizedValue)
                              );

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

                      <div>
                        <label className="text-sm text-[#0F1A26]/60 mb-1 block">
                          {t("form.shipping.postCode")}
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-[#0F1A26]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={formData.postCode}
                            onChange={(e) =>
                              setFormData({ ...formData, postCode: e.target.value })
                            }
                            className={inputIconClass}
                            placeholder={t("form.shipping.postCodePlaceholder")}
                          />
                        </div>
                      </div>

                      <div>
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
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div id="checkout-payment" className="scroll-mt-28 bg-white rounded-2xl p-6 border border-[#0F1A26]/10 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0F1A26] mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#EEBC3F]" />
                    {t("form.payment.title")}
                  </h2>


                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "card"
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
                            <p className="text-sm text-green-600 font-bold mt-1">2% OFF</p>
                          </div>

                          <CardPaymentLogoImages />

                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod"
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
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "instapay"
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
                            <p className="text-sm text-green-600 font-bold mt-1">2% OFF</p>
                          </div>

                          <InstaPayLogoImages />
                        </div>
                      </div>
                    </label>

                    {/* InstaPay Account Details Dropdown */}
                    {paymentMethod === "instapay" && (
                      <div className="mx-4 md:ml-7 p-3 md:p-4 bg-[#EEBC3F]/10 rounded-xl border border-[#EEBC3F]/30 animate-in slide-in-from-top-2 duration-200">
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
                      </div>
                    )}
                    {renderFieldError("paymentMethod")}
                  </div>
                  <div className="mt-4 rounded-xl bg-[#0F1A26]/5 px-4 py-3 text-xs font-semibold text-[#0F1A26]/65">
                    {t("hints.securePayment")}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !hasCheckoutItems}
                  className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting
                    ? t("form.processing")
                    : mounted
                      ? !deliveryMethod
                        ? `${t("form.completeOrder", {
                          total: checkoutSubtotal.toString(),
                        })} (${t("form.delivery.title")})`
                        : deliveryMethod === "delivery" && !formData.city
                        ? `${t("form.completeOrder", {
                          total: checkoutSubtotal.toString(),
                        })} (${t("form.selectCity")})`
                        : t("form.completeOrder", { total: finalTotal.toString() })
                      : t("form.completeOrder", { total: "--" })}
                </Button>

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

                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#0F1A26]/60">{t('summary.subtotal')}</span>
                    <span className="text-[#0F1A26] font-medium">EGP {mounted ? originalSubtotal : "--"}</span>
                  </div>
                  {mounted && discount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{t('summary.discount') || 'Discount'}</span>
                        <span className="font-medium">-EGP {discount}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {appliedDiscounts.map((desc, i) => (
                          <span key={i} className="text-[10px] text-green-600/70 italic text-right block">
                            • {desc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                  {paymentDiscount > 0 && (
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
                          ? (deliveryMethod === "delivery" && !formData.city ? subtotal : finalTotal)
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

      {checkoutItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#0F1A26]/10 bg-white/95 px-4 py-3 shadow-[0_-8px_28px_rgba(15,26,38,0.14)] backdrop-blur-xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0 text-xs font-semibold text-[#0F1A26]/60">
              <p className="truncate">
                {t("summary.itemCount", { count: checkoutItemCount })}
                {" · "}
                {!deliveryMethod
                  ? t("form.delivery.title")
                  : deliveryMethod === "delivery" && !formData.city
                  ? t("summary.selectCityForShipping")
                  : shipping === 0
                    ? t("summary.freeShipping")
                    : `${t("summary.shippingLabel")} EGP ${shipping}`}
              </p>
              {paymentDiscount > 0 && (
                <p className="mt-0.5 text-green-600">
                  {t("summary.paymentDiscount", { amount: paymentDiscount })}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/40">
                {t("summary.total")}
              </p>
              <p className="text-base font-black text-[#0F1A26]">
                EGP {deliveryMethod === "delivery" && !formData.city ? checkoutSubtotal : finalTotal}
              </p>
            </div>
          </div>
          <div className="hidden">
            <span>
              {!deliveryMethod
                ? t("form.delivery.title")
                : deliveryMethod === "delivery" && !formData.city
                ? t("summary.selectCityForShipping")
                : shipping === 0
                  ? t("summary.freeShipping")
                  : `${t("summary.shippingLabel")} EGP ${shipping}`}
            </span>
            <span className="text-base font-black text-[#0F1A26]">
              EGP {deliveryMethod === "delivery" && !formData.city ? checkoutSubtotal : finalTotal}
            </span>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || !hasCheckoutItems}
            className="h-12 w-full rounded-full bg-[#EEBC3F] text-sm font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white disabled:opacity-50"
          >
            {isSubmitting
              ? t("form.processing")
              : mounted
                ? !deliveryMethod
                  ? `${t("form.completeOrder", { total: checkoutSubtotal.toString() })} (${t("form.delivery.title")})`
                  : deliveryMethod === "delivery" && !formData.city
                    ? `${t("form.completeOrder", { total: checkoutSubtotal.toString() })} (${t("form.selectCity")})`
                    : t("form.completeOrder", { total: finalTotal.toString() })
                : t("form.completeOrder", { total: "--" })}
          </Button>
        </div>
      )}
      <Footer />
    </>
  );
}
