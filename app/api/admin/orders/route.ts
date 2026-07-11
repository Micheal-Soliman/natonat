import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

type SheetsListResponse = {
  success?: boolean;
  orders?: unknown[];
  total?: number;
  returned?: number;
  error?: string;
  message?: string;
  details?: unknown;
};

type OrderRecord = Record<string, unknown>;

function getSafeDetails(value: unknown) {
  if (typeof value !== "string") return value;
  return value.length > 700 ? `${value.slice(0, 700)}...` : value;
}

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const next = Number(cleaned);
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

function getObject(value: unknown): OrderRecord {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return getObject(parsed);
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

function firstString(...values: unknown[]) {
  for (const value of values) {
    const next = getString(value).trim();
    if (next) return next;
  }
  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const next = getNumber(value);
    if (next > 0) return next;
  }
  return 0;
}

function normalizeOrder(input: unknown) {
  const order = getObject(input);
  const customerFromJson = getObject(order.customer || order["Customer (Full JSON)"]);
  const extras = getObject(order.extras || order["Extras (JSON)"] || order["Extras (Full JSON)"]);
  const aramexFromJson = getObject(order.aramex);
  const items = getArray(order.items || order["Items (Full JSON)"] || order["Items"]);

  const customer = {
    ...customerFromJson,
    first_name: firstString(customerFromJson.first_name, order["First Name"]),
    last_name: firstString(customerFromJson.last_name, order["Last Name"]),
    email: firstString(customerFromJson.email, order.Email),
    phone: firstString(customerFromJson.phone, order.Phone),
    address: firstString(customerFromJson.address, order.Address),
    city: firstString(customerFromJson.city, order.City),
    governorate: firstString(customerFromJson.governorate, order.Governorate),
  };

  const aramex = {
    ...aramexFromJson,
    trackingNumber: firstString(aramexFromJson.trackingNumber, order["Aramex Tracking Number"]),
    trackingLink: firstString(aramexFromJson.trackingLink, order["Aramex Tracking Link"]),
    guid: firstString(aramexFromJson.guid, order["Aramex GUID"]),
    status: firstString(aramexFromJson.status, order["Aramex Status"]),
    latestDescription: firstString(aramexFromJson.latestDescription, order["Aramex Latest Update"]),
    latestLocation: firstString(aramexFromJson.latestLocation, order["Aramex Latest Location"]),
    syncedAt: firstString(aramexFromJson.syncedAt, order["Aramex Synced At"]),
    error: firstString(aramexFromJson.error, order["Aramex Error"]),
  };

  return {
    ...order,
    order_ref: firstString(order.order_ref, order["Order Ref"]),
    source: firstString(order.source, order.Source),
    created_at: firstString(order.created_at, order["Created At"], order.Timestamp),
    updated_at: firstString(order.updated_at, order["Updated At"], order["Aramex Synced At"]),
    status: firstString(order.status, order.Status),
    payment_status: firstString(order.payment_status, order["Payment Status"]),
    payment_method: firstString(order.payment_method, order["Payment Method"]),
    delivery_method: firstString(order.delivery_method, order["Delivery Method"]),
    amount_egp: firstNumber(order.amount_egp, order["Total (EGP)"]),
    shipping_egp: firstNumber(order.shipping_egp, order["Shipping (EGP)"]),
    discount_egp: firstNumber(order.discount_egp, order["Discount (EGP)"]),
    payment_discount_egp: firstNumber(order.payment_discount_egp, order["Payment Discount (EGP)"]),
    amount_cents: firstNumber(order.amount_cents, order["Total Cents"]),
    locale: firstString(order.locale, order.Locale),
    email_sent_at: firstString(order.email_sent_at, order["Email Sent At"]),
    instapay_proof_email_sent_at: firstString(order.instapay_proof_email_sent_at, order["InstaPay Admin Email Sent At"]),
    instapay_pending_customer_email_sent_at: firstString(order.instapay_pending_customer_email_sent_at, order["InstaPay Customer Pending Email Sent At"]),
    customer,
    extras: {
      ...extras,
      subtotal_egp: firstNumber(extras.subtotal_egp, order["Subtotal (EGP)"]),
      city_key: firstString(extras.city_key, order["City Key"]),
    },
    items,
    aramex,
  };
}

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(webhookUrl);
  const requestUrl = new URL(req.url);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", requestUrl.searchParams.get("limit") || "500");

  let res: Response;

  try {
    res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not connect to Google Sheets webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const text = await res.text();
  let data: SheetsListResponse | null = null;

  try {
    data = JSON.parse(text) as SheetsListResponse;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.success || !Array.isArray(data.orders)) {
    return NextResponse.json(
      {
        error: data?.error || data?.message || "Could not fetch orders from Google Sheets",
        details: {
          status: res.status,
          statusText: res.statusText,
          response: data || getSafeDetails(text),
        },
      },
      { status: 502 },
    );
  }

  const orders = data.orders.map(normalizeOrder);

  return NextResponse.json({
    success: true,
    orders,
    total: data.total ?? orders.length,
    returned: data.returned ?? orders.length,
  });
}
