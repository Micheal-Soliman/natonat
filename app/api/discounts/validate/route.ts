import { NextResponse } from "next/server";
import { sanityClient } from "@/sanity/lib/client";
import { discountCodeByCodeQuery } from "@/sanity/lib/queries";
import { validateConversionRescueCode } from "@/lib/conversion-rescue-code";
import { validateReferralDiscount } from "@/lib/referrals";

type DiscountType = "percentage" | "fixed" | "free_shipping";

type DiscountCodeDocument = {
  _id?: string;
  title?: string;
  code?: string;
  isActive?: boolean;
  discountType?: DiscountType;
  value?: number;
  maxDiscountEgp?: number;
  minimumSubtotalEgp?: number;
  startsAt?: string;
  endsAt?: string;
  allowedPaymentMethods?: string[];
  combineWithPaymentDiscount?: boolean;
  appliesTo?: "all" | "products" | "categories";
  productLegacyIds?: number[];
  productSlugs?: string[];
  categories?: string[];
  customerMessage?: string;
};

type DiscountValidationItem = {
  id?: number;
  slug?: string;
  category?: string | string[];
  quantity?: number;
  price?: number;
  price_egp?: number;
  unit_price_egp?: number;
  line_total_egp?: number;
};

type DiscountValidationBody = {
  code?: string;
  subtotal?: number;
  shipping?: number;
  paymentMethod?: string;
  items?: DiscountValidationItem[];
};

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function itemTotal(item: DiscountValidationItem) {
  const quantity = getNumber(item.quantity, 1);
  const lineTotal = getNumber(item.line_total_egp, NaN);

  if (Number.isFinite(lineTotal)) return Math.max(0, lineTotal);

  const unitPrice = getNumber(
    item.unit_price_egp ?? item.price_egp ?? item.price,
    0,
  );

  return Math.max(0, unitPrice * quantity);
}

function itemMatchesDiscount(item: DiscountValidationItem, discount: DiscountCodeDocument) {
  if (!discount.appliesTo || discount.appliesTo === "all") return true;

  if (discount.appliesTo === "products") {
    const legacyIds = new Set((discount.productLegacyIds || []).filter(Number.isFinite));
    const slugs = new Set((discount.productSlugs || []).filter(Boolean));

    return Boolean(
      (typeof item.id === "number" && legacyIds.has(item.id)) ||
        (item.slug && slugs.has(item.slug)),
    );
  }

  if (discount.appliesTo === "categories") {
    const allowedCategories = new Set((discount.categories || []).map((category) => category.toLowerCase()));
    const itemCategories = Array.isArray(item.category)
      ? item.category
      : item.category
        ? [item.category]
        : [];

    return itemCategories.some((category) => allowedCategories.has(category.toLowerCase()));
  }

  return false;
}

function calculateEligibleSubtotal(
  items: DiscountValidationItem[],
  discount: DiscountCodeDocument,
  fallbackSubtotal: number,
) {
  if (!Array.isArray(items) || items.length === 0 || !discount.appliesTo || discount.appliesTo === "all") {
    return fallbackSubtotal;
  }

  return items
    .filter((item) => itemMatchesDiscount(item, discount))
    .reduce((sum, item) => sum + itemTotal(item), 0);
}

function jsonInvalid(message: string, status = 200) {
  return NextResponse.json(
    {
      valid: false,
      message,
      discountAmount: 0,
    },
    { status },
  );
}

export async function POST(req: Request) {
  let body: DiscountValidationBody;

  try {
    body = (await req.json()) as DiscountValidationBody;
  } catch {
    return jsonInvalid("Invalid request", 400);
  }

  const code = normalizeCode(body.code || "");
  if (!code) return jsonInvalid("Enter a discount code");
  const subtotal = Math.max(0, getNumber(body.subtotal));
  const shipping = Math.max(0, getNumber(body.shipping));
  const rescueCode = validateConversionRescueCode(code);

  if (rescueCode) {
    if (!rescueCode.valid) {
      return jsonInvalid(
        rescueCode.reason === "expired" ? "Discount code has expired" : "Discount code is not valid",
      );
    }

    const discountAmount = Math.max(0, Math.round(subtotal * (rescueCode.percent / 100)));
    if (discountAmount <= 0) {
      return jsonInvalid("Discount code is valid, but there is nothing to discount");
    }

    return NextResponse.json({
      valid: true,
      code: rescueCode.code,
      discountId: "conversion-rescue",
      title: "Conversion rescue discount",
      discountType: "percentage",
      value: rescueCode.percent,
      discountAmount,
      eligibleSubtotal: subtotal,
      combineWithPaymentDiscount: false,
      message: `${rescueCode.percent}% discount applied`,
    });
  }

  let discounts: DiscountCodeDocument[] = [];

  try {
    discounts = await sanityClient.fetch<DiscountCodeDocument[]>(
      discountCodeByCodeQuery,
      {},
      { cache: "no-store" },
    );
  } catch (error) {
    console.error("Discount code validation failed", error);
    return NextResponse.json(
      { valid: false, message: "Discount service is unavailable", discountAmount: 0 },
      { status: 503 },
    );
  }

  const discount = discounts.find((item) => normalizeCode(item.code || "") === code) || null;

  if (!discount?.code) {
    const referralDiscount = await validateReferralDiscount({ code, subtotal });
    if (referralDiscount?.valid) {
      return NextResponse.json(referralDiscount);
    }

    if (referralDiscount && !referralDiscount.valid) {
      return jsonInvalid(referralDiscount.message || "Referral code is not valid");
    }

    return jsonInvalid("Discount code was not found");
  }
  if (discount.isActive === false) return jsonInvalid("Discount code is not active");

  const now = Date.now();
  if (discount.startsAt && Date.parse(discount.startsAt) > now) {
    return jsonInvalid("Discount code is not active yet");
  }
  if (discount.endsAt && Date.parse(discount.endsAt) < now) {
    return jsonInvalid("Discount code has expired");
  }

  const paymentMethod = body.paymentMethod || "";
  const allowedPaymentMethods = discount.allowedPaymentMethods || [];
  if (
    allowedPaymentMethods.length > 0 &&
    (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod))
  ) {
    return jsonInvalid("Discount code is not available for this payment method");
  }

  const minimumSubtotal = Math.max(0, getNumber(discount.minimumSubtotalEgp));

  if (minimumSubtotal > 0 && subtotal < minimumSubtotal) {
    return jsonInvalid(`Minimum order subtotal is EGP ${minimumSubtotal}`);
  }

  const eligibleSubtotal = calculateEligibleSubtotal(body.items || [], discount, subtotal);
  if (eligibleSubtotal <= 0 && discount.discountType !== "free_shipping") {
    return jsonInvalid("Discount code is not valid for these items");
  }

  let discountAmount = 0;
  const discountType = discount.discountType || "percentage";

  if (discountType === "percentage") {
    const percentage = Math.max(0, getNumber(discount.value));
    discountAmount = Math.round(eligibleSubtotal * (percentage / 100));
    const maxDiscount = Math.max(0, getNumber(discount.maxDiscountEgp));
    if (maxDiscount > 0) discountAmount = Math.min(discountAmount, maxDiscount);
  } else if (discountType === "fixed") {
    discountAmount = Math.min(Math.round(getNumber(discount.value)), eligibleSubtotal);
  } else if (discountType === "free_shipping") {
    discountAmount = shipping;
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal + shipping));

  if (discountAmount <= 0) {
    return jsonInvalid("Discount code is valid, but there is nothing to discount");
  }

  return NextResponse.json({
    valid: true,
    code: normalizeCode(discount.code),
    discountId: discount._id,
    title: discount.title,
    discountType,
    value: discount.value || null,
    discountAmount,
    eligibleSubtotal,
    combineWithPaymentDiscount: discount.combineWithPaymentDiscount === true,
    message: discount.customerMessage || "Discount code applied",
  });
}
