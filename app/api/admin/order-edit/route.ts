import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabase, isOrderDatabaseConfigured, upsertOrderToDatabase } from "@/lib/order-database";

type OrderRecord = Record<string, unknown>;

type EditableItem = {
  id?: number | string;
  slug?: string;
  name?: string;
  title?: string;
  size?: string;
  color?: string;
  variant?: string;
  quantity?: number;
  qty?: number;
  unit_price_egp?: number;
  line_total_egp?: number;
  price?: number;
  type?: string;
};

type OrderEditBody = {
  orderRef?: string;
  note?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  amountEgp?: number;
  subtotalEgp?: number;
  shippingEgp?: number;
  discountEgp?: number;
  paymentDiscountEgp?: number;
  customer?: OrderRecord;
  aramex?: OrderRecord;
  items?: EditableItem[];
};

const ALLOWED_ORDER_STATUSES = new Set([
  "created",
  "confirmed",
  "pending",
  "pending_instapay_approval",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "returned",
  "failed",
]);

const ALLOWED_PAYMENT_STATUSES = new Set([
  "paid",
  "pending",
  "cash on delivery",
  "pending instapay approval",
  "refunded",
  "failed",
]);

const ALLOWED_PAYMENT_METHODS = new Set([
  "cod",
  "cash_on_delivery",
  "cash on delivery",
  "paymob_card",
  "card",
  "instapay",
  "wallet",
  "bank_transfer",
  "custom_bulk",
]);

const ALLOWED_DELIVERY_METHODS = new Set(["delivery", "pickup", "custom"]);

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

function getObject(value: unknown): OrderRecord {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      return getObject(JSON.parse(value) as unknown);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as OrderRecord)
    : {};
}

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeEnum(value: unknown) {
  return getString(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeStatusValue(value: unknown) {
  return normalizeEnum(value).replaceAll(" ", "_");
}

function normalizePaymentStatusValue(value: unknown) {
  const normalized = normalizeEnum(value);
  if (normalized === "cash_on_delivery") return "cash on delivery";
  return normalized.replaceAll("_", " ");
}

function sanitizeCustomer(input: unknown) {
  const customer = getObject(input);
  const allowedKeys = ["first_name", "last_name", "name", "email", "phone", "address", "city", "governorate"];
  return Object.fromEntries(
    allowedKeys
      .map((key) => [key, getString(customer[key])])
      .filter(([, value]) => Boolean(value)),
  );
}

function sanitizeAramex(input: unknown) {
  const aramex = getObject(input);
  const allowedKeys = [
    "trackingNumber",
    "trackingLink",
    "guid",
    "status",
    "latestCode",
    "latestDescription",
    "latestLocation",
    "latestDate",
    "latestComments",
    "latestProblemCode",
    "syncedAt",
    "error",
    "manualTrackingUpdatedAt",
  ];

  return Object.fromEntries(
    allowedKeys
      .map((key) => [key, getString(aramex[key])])
      .filter(([, value]) => Boolean(value)),
  );
}

function sanitizeItems(items: unknown) {
  return getArray(items)
    .map((item) => getObject(item))
    .map((item) => {
      const quantity = Math.max(1, Math.round(getNumber(item.quantity ?? item.qty) || 1));
      const unitPrice = getNumber(item.unit_price_egp ?? item.price_egp ?? item.unit_price ?? item.unitPrice ?? item.price);
      const lineTotal = getNumber(item.line_total_egp ?? item.line_total ?? item.lineTotal ?? item.total) || unitPrice * quantity;

      return {
        ...item,
        id: item.id,
        slug: getString(item.slug),
        name: getString(item.name || item.title || item.slug || "Order item"),
        size: getString(item.size || item.selectedSize || item.variantSize),
        color: getString(item.color || item.selectedColor || item.variantColor),
        variant: getString(item.variant || item.option),
        quantity,
        unit_price_egp: unitPrice,
        line_total_egp: lineTotal,
        price: unitPrice || getNumber(item.price),
      };
    })
    .filter((item) => item.name || item.slug);
}

function getOrderRef(order: OrderRecord) {
  return getString(order.order_ref || order["Order Ref"]);
}

function getCustomer(order: OrderRecord) {
  return getObject(order.customer || order["Customer (Full JSON)"]);
}

function getItems(order: OrderRecord) {
  return getArray(order.items || order["Items (Full JSON)"] || order["Items"]);
}

function getExtras(order: OrderRecord) {
  return getObject(order.extras || order["Extras (Full JSON)"] || order["Extras (JSON)"]);
}

function getAramex(order: OrderRecord) {
  return getObject(order.aramex);
}

async function fetchOrderFromSheets(orderRef: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as { success?: boolean; order?: OrderRecord } | null;
  return data?.success && data.order ? data.order : null;
}

async function fetchExistingOrder(orderRef: string) {
  return ((await fetchOrderFromDatabase(orderRef)) as OrderRecord | null) || fetchOrderFromSheets(orderRef);
}

async function mirrorOrderToSheets(order: OrderRecord) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return { skipped: true };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let data: unknown = text;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    // Keep raw text for diagnostics.
  }

  if (!res.ok || (data && typeof data === "object" && (data as { success?: boolean }).success === false)) {
    return { skipped: false, error: { status: res.status, data } };
  }

  return { skipped: false, data };
}

function changedFieldNames(before: OrderRecord, after: OrderRecord) {
  const keys = [
    "status",
    "payment_status",
    "payment_method",
    "delivery_method",
    "amount_egp",
    "subtotal_egp",
    "shipping_egp",
    "discount_egp",
    "payment_discount_egp",
    "customer",
    "aramex",
    "items",
  ];

  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function applyManualEdit(existing: OrderRecord, body: OrderEditBody) {
  const timestamp = new Date().toISOString();
  const currentExtras = getExtras(existing);
  const currentCustomer = getCustomer(existing);
  const currentItems = getItems(existing);
  const currentAramex = getAramex(existing);
  const updated: OrderRecord = {
    ...existing,
    order_ref: getOrderRef(existing),
    source: "admin_manual_order_edit",
    customer: currentCustomer,
    items: currentItems,
    extras: currentExtras,
    aramex: currentAramex,
    updated_at: timestamp,
  };

  if (body.status !== undefined) {
    const status = normalizeStatusValue(body.status);
    if (!ALLOWED_ORDER_STATUSES.has(status)) {
      throw new Error(`Invalid order status: ${body.status}`);
    }
    updated.status = status;
  }

  if (body.paymentStatus !== undefined) {
    const paymentStatus = normalizePaymentStatusValue(body.paymentStatus);
    if (!ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
      throw new Error(`Invalid payment status: ${body.paymentStatus}`);
    }
    updated.payment_status = paymentStatus;
  }

  if (body.paymentMethod !== undefined) {
    const paymentMethod = normalizeStatusValue(body.paymentMethod);
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      throw new Error(`Invalid payment method: ${body.paymentMethod}`);
    }
    updated.payment_method = paymentMethod;
  }

  if (body.deliveryMethod !== undefined) {
    const deliveryMethod = normalizeStatusValue(body.deliveryMethod);
    if (!ALLOWED_DELIVERY_METHODS.has(deliveryMethod)) {
      throw new Error(`Invalid delivery method: ${body.deliveryMethod}`);
    }
    updated.delivery_method = deliveryMethod;
  }

  const subtotal = getNumber(body.subtotalEgp);
  const shipping = getNumber(body.shippingEgp);
  const discount = getNumber(body.discountEgp);
  const paymentDiscount = getNumber(body.paymentDiscountEgp);
  const total = getNumber(body.amountEgp);

  if (body.subtotalEgp !== undefined) updated.extras = { ...getExtras(updated), subtotal_egp: subtotal };
  if (body.shippingEgp !== undefined) updated.shipping_egp = shipping;
  if (body.discountEgp !== undefined) updated.discount_egp = discount;
  if (body.paymentDiscountEgp !== undefined) updated.payment_discount_egp = paymentDiscount;
  if (body.amountEgp !== undefined) {
    updated.amount_egp = total;
    updated.amount_cents = Math.round(total * 100);
  }

  if (body.customer !== undefined) {
    updated.customer = {
      ...currentCustomer,
      ...sanitizeCustomer(body.customer),
    };
  }

  if (body.aramex !== undefined) {
    const sanitizedAramex = sanitizeAramex(body.aramex);
    updated.aramex = {
      ...currentAramex,
      ...sanitizedAramex,
      manuallyEditedAt: timestamp,
    };
  }

  if (body.items !== undefined) {
    updated.items = sanitizeItems(body.items);
    updated.items_flat = (updated.items as OrderRecord[])
      .map((item) => {
        const qty = getNumber(item.quantity) || 1;
        const size = getString(item.size);
        return `${qty}x ${getString(item.name)}${size ? ` (${size})` : ""}`;
      })
      .join(" | ");
  }

  const changedFields = changedFieldNames(existing, updated);
  const auditEntry = {
    action: "admin_manual_order_edit",
    timestamp,
    source: "admin_dashboard",
    note: getString(body.note) || "Admin manually edited order fields.",
    changed_fields: changedFields,
    finance_affects_dashboard: changedFields.some((field) =>
      ["status", "payment_status", "amount_egp", "subtotal_egp", "shipping_egp", "discount_egp", "payment_discount_egp", "items"].includes(field),
    ),
    aramex_note: changedFields.includes("aramex")
      ? "Admin manually edited the stored tracking fields. This records tracking data in the dashboard but does not call Aramex."
      : getString(currentAramex.trackingNumber)
        ? "This manual edit updates database/dashboard only. Existing Aramex shipment details are not edited automatically."
        : "No Aramex tracking exists. Creating a shipment later will use the saved order data.",
  };

  updated.admin_audit = [...getArray(existing.admin_audit), auditEntry];
  updated.history = [...getArray(existing.history), auditEntry];

  return { updated, changedFields };
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as OrderEditBody;
  const orderRef = getString(body.orderRef);
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const existing = await fetchExistingOrder(orderRef);
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let updated: OrderRecord;
  let changedFields: string[];
  try {
    const result = applyManualEdit(existing, body);
    updated = result.updated;
    changedFields = result.changedFields;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid manual edit" },
      { status: 400 },
    );
  }

  if (!changedFields.length) {
    return NextResponse.json({ success: true, order_ref: orderRef, order: updated, changedFields });
  }

  let databaseStored = false;
  let databaseError = "";
  if (isOrderDatabaseConfigured()) {
    try {
      await upsertOrderToDatabase(updated);
      databaseStored = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error);
    }
  }

  const sheetsResult = await mirrorOrderToSheets(updated);
  const sheetsStored = !sheetsResult.skipped && !("error" in sheetsResult);

  if (!databaseStored && !sheetsStored) {
    return NextResponse.json(
      {
        error: "Manual edit was not saved",
        database: databaseError || (isOrderDatabaseConfigured() ? "Unknown Supabase error" : "not_configured"),
        sheets: "error" in sheetsResult ? sheetsResult.error : "not_configured",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    order: updated,
    changedFields,
    storage: {
      supabase: databaseStored ? "stored" : isOrderDatabaseConfigured() ? "failed" : "not_configured",
      google_sheets: sheetsStored ? "stored" : sheetsResult.skipped ? "not_configured" : "failed",
    },
  });
}
