type OrderRecord = Record<string, unknown>;

type SupabaseOrderRow = {
  order_ref: string;
  source?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  delivery_method?: string | null;
  locale?: string | null;
  amount_egp?: number | null;
  amount_cents?: number | null;
  subtotal_egp?: number | null;
  shipping_egp?: number | null;
  discount_egp?: number | null;
  payment_discount_egp?: number | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_governorate?: string | null;
  city_key?: string | null;
  aramex_tracking_number?: string | null;
  aramex_tracking_link?: string | null;
  aramex_guid?: string | null;
  aramex_status?: string | null;
  aramex_latest_update?: string | null;
  aramex_latest_location?: string | null;
  aramex_synced_at?: string | null;
  aramex_error?: string | null;
  email_sent_at?: string | null;
  instapay_proof_email_sent_at?: string | null;
  instapay_pending_customer_email_sent_at?: string | null;
  customer?: OrderRecord | null;
  items?: unknown[] | null;
  items_flat?: string | null;
  aramex?: OrderRecord | null;
  extras?: OrderRecord | null;
  payment?: OrderRecord | null;
  referral?: OrderRecord | null;
  inventory?: OrderRecord | null;
  history?: unknown[] | null;
  raw_payload?: OrderRecord | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function getHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function getObject(value: unknown): OrderRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as OrderRecord)
    : {};
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
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

function parseDateValue(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 20_000 && value < 80_000) {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return Number.isFinite(date.getTime()) ? date.toISOString() : null;
    }

    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  const raw = getString(value);
  if (!raw) return null;

  const normalized = raw
    .replace(/\u200f|\u200e/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)$/, "$1T$2");

  const date = new Date(normalized);
  if (Number.isFinite(date.getTime())) return date.toISOString();

  const dayFirstMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (dayFirstMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0", meridiem] = dayFirstMatch;
    let fullYear = Number(year);
    if (fullYear < 100) fullYear += 2000;
    let hours = Number(hour);
    if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
    const parsed = new Date(fullYear, Number(month) - 1, Number(day), hours, Number(minute), Number(second));
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  }

  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const next = getString(value);
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

export function isOrderDatabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function normalizeOrderForDatabase(order: OrderRecord): SupabaseOrderRow | null {
  const orderRef = firstString(order.order_ref, order["Order Ref"]);
  if (!orderRef) return null;

  const customer = getObject(order.customer || order["Customer (Full JSON)"]);
  const extras = getObject(order.extras || order["Extras (JSON)"] || order["Extras (Full JSON)"]);
  const aramex = getObject(order.aramex);

  return {
    order_ref: orderRef,
    source: firstString(order.source, order.Source) || null,
    status: firstString(order.status, order.Status) || null,
    payment_status: firstString(order.payment_status, order["Payment Status"]) || null,
    payment_method: firstString(order.payment_method, order["Payment Method"]) || null,
    delivery_method: firstString(order.delivery_method, order["Delivery Method"]) || null,
    locale: firstString(order.locale, order.Locale) || null,
    amount_egp: firstNumber(order.amount_egp, order["Total (EGP)"]) || null,
    amount_cents: firstNumber(order.amount_cents, order["Total Cents"]) || null,
    subtotal_egp: firstNumber(extras.subtotal_egp, order["Subtotal (EGP)"]) || null,
    shipping_egp: firstNumber(order.shipping_egp, order["Shipping (EGP)"]) || null,
    discount_egp: firstNumber(order.discount_egp, order["Discount (EGP)"]) || null,
    payment_discount_egp: firstNumber(order.payment_discount_egp, order["Payment Discount (EGP)"]) || null,
    customer_first_name: firstString(customer.first_name, order["First Name"]) || null,
    customer_last_name: firstString(customer.last_name, order["Last Name"]) || null,
    customer_email: firstString(customer.email, order.Email) || null,
    customer_phone: firstString(customer.phone, order.Phone) || null,
    customer_address: firstString(customer.address, order.Address) || null,
    customer_city: firstString(customer.city, order.City) || null,
    customer_governorate: firstString(customer.governorate, order.Governorate) || null,
    city_key: firstString(extras.city_key, order["City Key"]) || null,
    aramex_tracking_number: firstString(aramex.trackingNumber, order["Aramex Tracking Number"]) || null,
    aramex_tracking_link: firstString(aramex.trackingLink, order["Aramex Tracking Link"], order.tracking_link) || null,
    aramex_guid: firstString(aramex.guid, order["Aramex GUID"]) || null,
    aramex_status: firstString(aramex.status, order["Aramex Status"]) || null,
    aramex_latest_update: firstString(aramex.latestDescription, order["Aramex Latest Update"]) || null,
    aramex_latest_location: firstString(aramex.latestLocation, order["Aramex Latest Location"]) || null,
    aramex_synced_at: parseDateValue(aramex.syncedAt || order["Aramex Synced At"]) || null,
    aramex_error: firstString(aramex.error, order["Aramex Error"]) || null,
    email_sent_at: parseDateValue(order.email_sent_at || order["Email Sent At"]) || null,
    instapay_proof_email_sent_at:
      parseDateValue(order.instapay_proof_email_sent_at || order["InstaPay Admin Email Sent At"]) || null,
    instapay_pending_customer_email_sent_at:
      parseDateValue(order.instapay_pending_customer_email_sent_at || order["InstaPay Customer Pending Email Sent At"]) || null,
    customer,
    items: getArray(order.items || order["Items (Full JSON)"] || order.Items),
    items_flat: firstString(order.items_flat, order["Items"]) || null,
    aramex,
    extras,
    payment: getObject(order.payment),
    referral: getObject(order.referral),
    inventory: getObject(order.inventory),
    history: getArray(order.history),
    raw_payload: order,
    created_at:
      parseDateValue(order.created_at || order["Created At"] || order.Timestamp) ||
      new Date().toISOString(),
    updated_at:
      parseDateValue(order.updated_at || order["Updated At"] || order["Aramex Synced At"]) ||
      new Date().toISOString(),
  };
}

export function databaseRowToOrder(row: SupabaseOrderRow): OrderRecord {
  const rawPayload = getObject(row.raw_payload);

  return {
    ...rawPayload,
    order_ref: row.order_ref || rawPayload.order_ref,
    source: row.source || rawPayload.source,
    status: row.status || rawPayload.status,
    payment_status: row.payment_status || rawPayload.payment_status,
    payment_method: row.payment_method || rawPayload.payment_method,
    delivery_method: row.delivery_method || rawPayload.delivery_method,
    locale: row.locale || rawPayload.locale,
    amount_egp: row.amount_egp ?? rawPayload.amount_egp,
    amount_cents: row.amount_cents ?? rawPayload.amount_cents,
    shipping_egp: row.shipping_egp ?? rawPayload.shipping_egp,
    discount_egp: row.discount_egp ?? rawPayload.discount_egp,
    payment_discount_egp: row.payment_discount_egp ?? rawPayload.payment_discount_egp,
    customer: row.customer || rawPayload.customer,
    items: row.items || rawPayload.items,
    items_flat: row.items_flat || rawPayload.items_flat,
    aramex: row.aramex || rawPayload.aramex,
    extras: row.extras || rawPayload.extras,
    payment: row.payment || rawPayload.payment,
    referral: row.referral || rawPayload.referral,
    inventory: row.inventory || rawPayload.inventory,
    history: row.history || rawPayload.history,
    email_sent_at: row.email_sent_at || rawPayload.email_sent_at,
    instapay_proof_email_sent_at: row.instapay_proof_email_sent_at || rawPayload.instapay_proof_email_sent_at,
    instapay_pending_customer_email_sent_at:
      row.instapay_pending_customer_email_sent_at || rawPayload.instapay_pending_customer_email_sent_at,
    created_at: row.created_at || rawPayload.created_at,
    updated_at: row.updated_at || rawPayload.updated_at,
    database_synced_at: row.updated_at,
  };
}

export async function upsertOrderToDatabase(order: OrderRecord) {
  const config = getSupabaseConfig();
  const row = normalizeOrderForDatabase(order);
  if (!config || !row) return { skipped: true };

  const res = await fetch(`${config.url}/rest/v1/orders?on_conflict=order_ref`, {
    method: "POST",
    headers: {
      ...getHeaders(config.serviceRoleKey),
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase order upsert failed (${res.status}): ${text}`);
  }

  return { skipped: false };
}

export async function fetchOrderFromDatabase(orderRef: string) {
  const config = getSupabaseConfig();
  if (!config || !orderRef) return null;

  const url = new URL(`${config.url}/rest/v1/orders`);
  url.searchParams.set("order_ref", `eq.${orderRef}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(config.serviceRoleKey),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as SupabaseOrderRow[];
  return rows[0] ? databaseRowToOrder(rows[0]) : null;
}

export async function listOrdersFromDatabase(limit = 500) {
  const config = getSupabaseConfig();
  if (!config) return [];

  const url = new URL(`${config.url}/rest/v1/orders`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 2000))));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(config.serviceRoleKey),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase order list failed (${res.status}): ${text}`);
  }

  const rows = (await res.json()) as SupabaseOrderRow[];
  return rows.map(databaseRowToOrder);
}
