import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { sanityClient } from "@/sanity/lib/client";
import {
  referralProgramQuery,
  referralRecordByCodeQuery,
  referralRecordByCustomerQuery,
} from "@/sanity/lib/queries";

type ReferralProgram = {
  isEnabled?: boolean;
  friendDiscountPercent?: number;
  referrerRewardPercent?: number;
  minimumSubtotalEgp?: number;
  maxFriendDiscountEgp?: number;
  maxRewardDiscountEgp?: number;
  rewardExpiryDays?: number;
  combineFriendDiscountWithPaymentDiscount?: boolean;
  customerMessage?: string;
};

type ReferralRecord = {
  _id?: string;
  code?: string;
  isActive?: boolean;
  referrerName?: string;
  referrerPhone?: string;
  referrerEmail?: string;
  sourceOrderRef?: string;
  uses?: number;
};

type ReferralOrder = Record<string, unknown> & {
  order_ref?: string;
  amount_egp?: number;
  discount_egp?: number;
  discount?: {
    code?: string;
    referral_record_id?: string;
    is_referral?: boolean;
    amount_egp?: number;
  } | null;
  customer?: {
    first_name?: string;
    phone?: string;
    email?: string;
  };
};

const DEFAULT_PROGRAM: Required<ReferralProgram> = {
  isEnabled: false,
  friendDiscountPercent: 5,
  referrerRewardPercent: 5,
  minimumSubtotalEgp: 0,
  maxFriendDiscountEgp: 0,
  maxRewardDiscountEgp: 0,
  rewardExpiryDays: 30,
  combineFriendDiscountWithPaymentDiscount: false,
  customerMessage: "Referral discount applied.",
};

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  });
}

export function normalizeReferralCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getCustomerName(order: ReferralOrder) {
  return order.customer?.first_name?.trim() || "natOnat customer";
}

function getCustomerPhone(order: ReferralOrder) {
  return normalizePhone(order.customer?.phone || "");
}

function getCustomerEmail(order: ReferralOrder) {
  return normalizeEmail(order.customer?.email || "");
}

function buildReferralCode(order: ReferralOrder) {
  const namePart = getCustomerName(order)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
  const phonePart = getCustomerPhone(order).slice(-4);
  const fallbackPart = String(order.order_ref || Date.now()).slice(-4).replace(/[^A-Z0-9]/gi, "");

  return normalizeReferralCode(`NAT-${namePart || "VIP"}-${phonePart || fallbackPart || "0000"}`);
}

function buildReferralRecordId(order: ReferralOrder) {
  const identity = getCustomerPhone(order) || getCustomerEmail(order) || String(order.order_ref || Date.now());

  return `referralRecord.${identity.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

async function getReferralProgram() {
  const program = await sanityClient.fetch<ReferralProgram | null>(
    referralProgramQuery,
    {},
    { cache: "no-store" },
  );

  return {
    ...DEFAULT_PROGRAM,
    ...(program || {}),
  };
}

async function getReferralRecordByCode(code: string) {
  const records = await sanityClient.fetch<ReferralRecord[]>(
    referralRecordByCodeQuery,
    {},
    { cache: "no-store" },
  );

  return records.find((record) => normalizeReferralCode(record.code || "") === code) || null;
}

export async function validateReferralDiscount({
  code,
  subtotal,
}: {
  code: string;
  subtotal: number;
}) {
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) return null;

  const program = await getReferralProgram();
  if (!program.isEnabled) return null;

  const record = await getReferralRecordByCode(normalizedCode);
  if (!record?.code || record.isActive === false) return null;

  const minimumSubtotal = Math.max(0, getNumber(program.minimumSubtotalEgp));
  if (minimumSubtotal > 0 && subtotal < minimumSubtotal) {
    return {
      valid: false,
      message: `Minimum order subtotal is EGP ${minimumSubtotal}`,
      discountAmount: 0,
    };
  }

  const percent = Math.max(0, getNumber(program.friendDiscountPercent));
  let discountAmount = Math.round(Math.max(0, subtotal) * (percent / 100));
  const maxDiscount = Math.max(0, getNumber(program.maxFriendDiscountEgp));
  if (maxDiscount > 0) discountAmount = Math.min(discountAmount, maxDiscount);

  if (discountAmount <= 0) {
    return {
      valid: false,
      message: "Referral code is valid, but there is nothing to discount",
      discountAmount: 0,
    };
  }

  return {
    valid: true,
    code: normalizedCode,
    discountId: record._id,
    title: "Referral discount",
    discountType: "percentage" as const,
    value: percent,
    discountAmount,
    eligibleSubtotal: subtotal,
    combineWithPaymentDiscount: program.combineFriendDiscountWithPaymentDiscount === true,
    message: program.customerMessage || DEFAULT_PROGRAM.customerMessage,
    isReferral: true,
    referralRecordId: record._id,
    referrerName: record.referrerName,
  };
}

export async function ensureReferralRecordForOrder(order: ReferralOrder) {
  const program = await getReferralProgram();
  if (!program.isEnabled) return null;

  const client = getWriteClient();
  if (!client) {
    console.warn("[Referral] SANITY_API_WRITE_TOKEN is not set; referral record was not written");
    return null;
  }

  const phone = getCustomerPhone(order);
  const email = getCustomerEmail(order);
  if (!phone && !email) return null;

  const existing = await sanityClient.fetch<ReferralRecord | null>(
    referralRecordByCustomerQuery,
    { phone, email },
    { cache: "no-store" },
  );

  if (existing?._id) return existing;

  const now = new Date().toISOString();
  return client.createIfNotExists({
    _id: buildReferralRecordId(order),
    _type: "referralRecord",
    code: buildReferralCode(order),
    isActive: true,
    referrerName: getCustomerName(order),
    referrerPhone: phone || undefined,
    referrerEmail: email || undefined,
    sourceOrderRef: order.order_ref,
    uses: 0,
    conversions: [],
    rewardCodes: [],
    createdAt: now,
  });
}

export async function markReferralConversionForOrder(order: ReferralOrder) {
  const referralRecordId = order.discount?.referral_record_id;
  const referralCode = normalizeReferralCode(order.discount?.code || "");
  const orderRef = order.order_ref;
  if (!orderRef || (!referralRecordId && !referralCode)) return null;

  const program = await getReferralProgram();
  if (!program.isEnabled) return null;

  const client = getWriteClient();
  if (!client) {
    console.warn("[Referral] SANITY_API_WRITE_TOKEN is not set; referral conversion was not written");
    return null;
  }

  const record = referralRecordId
    ? ({ _id: referralRecordId, code: referralCode } as ReferralRecord)
    : await getReferralRecordByCode(referralCode);
  if (!record?._id) return null;

  const existingConversion = await sanityClient.fetch<{ conversions?: Array<{ orderRef?: string }> } | null>(
    `*[_type == "referralRecord" && _id == $id][0]{ conversions[]{ orderRef } }`,
    { id: record._id },
    { cache: "no-store" },
  );
  if (existingConversion?.conversions?.some((conversion) => conversion.orderRef === orderRef)) {
    return null;
  }

  const rewardPercent = Math.max(0, getNumber(program.referrerRewardPercent));
  const amount = Math.max(0, getNumber(order.amount_egp));
  let rewardValue = Math.round(amount * (rewardPercent / 100));
  const maxReward = Math.max(0, getNumber(program.maxRewardDiscountEgp));
  if (maxReward > 0) rewardValue = Math.min(rewardValue, maxReward);
  if (rewardValue <= 0) return null;

  const rewardCode = normalizeReferralCode(`THANKS-${record.code || "REF"}-${String(orderRef).slice(-4)}`);
  const now = new Date();
  const expiryDays = Math.max(1, getNumber(program.rewardExpiryDays, 30));
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();

  await client.createIfNotExists({
    _id: `discountCode.${rewardCode}`,
    _type: "discountCode",
    title: `Referral reward for ${record.code || "referrer"}`,
    code: rewardCode,
    isActive: true,
    discountType: "fixed",
    value: rewardValue,
    minimumSubtotalEgp: 0,
    startsAt: createdAt,
    endsAt: expiresAt,
    allowedPaymentMethods: [],
    combineWithPaymentDiscount: false,
    appliesTo: "all",
    customerMessage: "Referral reward applied.",
    showInAnnouncement: false,
  });

  await client
    .patch(record._id)
    .setIfMissing({ uses: 0, conversions: [], rewardCodes: [] })
    .inc({ uses: 1 })
    .append("conversions", [
      {
        _key: `conversion-${orderRef}`,
        orderRef,
        customerName: getCustomerName(order),
        customerPhone: getCustomerPhone(order),
        amountEgp: amount,
        discountEgp: getNumber(order.discount?.amount_egp ?? order.discount_egp),
        rewardCode,
        confirmedAt: createdAt,
      },
    ])
    .append("rewardCodes", [
      {
        _key: `reward-${orderRef}`,
        orderRef,
        code: rewardCode,
        value: rewardValue,
        createdAt,
      },
    ])
    .commit();

  return {
    referral_code: record.code,
    reward_code: rewardCode,
    reward_value_egp: rewardValue,
  };
}
