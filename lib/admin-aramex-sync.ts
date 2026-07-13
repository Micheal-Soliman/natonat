import { trackShipment } from "@/lib/aramex";
import {
  isOrderDatabaseConfigured,
  listOrdersFromDatabase,
  upsertOrderToDatabase,
} from "@/lib/order-database";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  aramex?: Record<string, unknown>;
};

type SheetsListResponse = {
  success?: boolean;
  orders?: AdminOrder[];
  error?: string;
};

export type AramexSyncOptions = {
  limit?: number;
  orderRefs?: string[];
};

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function getTrackingNumber(order: AdminOrder) {
  const aramex = order.aramex && typeof order.aramex === "object" ? order.aramex : {};
  return getString(aramex.trackingNumber || order["Aramex Tracking Number"]);
}

function getOrderRef(order: AdminOrder) {
  return getString(order.order_ref || order["Order Ref"]);
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function findFirstString(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const object = value as Record<string, unknown>;

  for (const key of keys) {
    const direct = getString(object[key]);
    if (direct) return direct;
  }

  return "";
}

function extractTracking(raw: unknown) {
  const payload = getObject(raw);
  const results = Array.isArray(payload.TrackingResults) ? payload.TrackingResults : [];
  const firstResult = getObject(results[0]);
  const nestedUpdates = Array.isArray(firstResult.TrackingUpdates)
    ? firstResult.TrackingUpdates
    : Array.isArray(firstResult.Value)
      ? firstResult.Value
      : [];
  const latestUpdate = getObject(nestedUpdates[nestedUpdates.length - 1]);
  const status =
    findFirstString(firstResult, ["TrackingStatus", "UpdateDescription", "Status"]) ||
    findFirstString(latestUpdate, ["UpdateDescription", "Status", "TrackingStatus", "UpdateCode"]) ||
    "Tracked";

  return {
    status,
    latestDescription: findFirstString(latestUpdate, ["UpdateDescription", "Comments", "Status"]),
    latestLocation: findFirstString(latestUpdate, ["UpdateLocation", "Location"]),
    latestDate: findFirstString(latestUpdate, ["UpdateDateTime", "UpdateDate", "Date"]),
    estimatedDelivery: getString(firstResult.EstimatedDeliveryTime),
    raw,
  };
}

async function fetchOrders(webhookUrl: string, limit: number) {
  const url = new URL(webhookUrl);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const text = await res.text();
  const data = JSON.parse(text) as SheetsListResponse;

  if (!res.ok || !data.success || !Array.isArray(data.orders)) {
    throw new Error(data.error || "Could not fetch orders");
  }

  return data.orders;
}

async function saveOrder(webhookUrl: string, order: AdminOrder) {
  let databaseError = "";
  let databaseStored = false;

  if (isOrderDatabaseConfigured()) {
    try {
      await upsertOrderToDatabase(order);
      databaseStored = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error);
    }
  }

  if (!webhookUrl) {
    if (databaseStored) return { supabase: "stored", google_sheets: "not_configured" };
    throw new Error(databaseError || "No order storage is configured");
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(order),
    cache: "no-store",
  });
  const text = await res.text();

  if (!res.ok && !databaseStored) {
    throw new Error(`Could not save order update: ${text || databaseError}`);
  }

  return text ? JSON.parse(text) : { supabase: databaseStored ? "stored" : "failed" };
}

export async function syncAramexOrders(options: AramexSyncOptions = {}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const databaseConfigured = isOrderDatabaseConfigured();
  if (!webhookUrl && !databaseConfigured) {
    throw new Error("No order storage is configured");
  }

  const limit = Math.max(1, Math.min(100, Number(options.limit || 50)));
  const requestedRefs = new Set((options.orderRefs || []).map((ref) => String(ref).trim()).filter(Boolean));
  const databaseOrders = databaseConfigured
    ? (await listOrdersFromDatabase(Math.max(limit, requestedRefs.size || limit))) as AdminOrder[]
    : [];
  const orders = databaseOrders.length
    ? databaseOrders
    : webhookUrl
      ? await fetchOrders(webhookUrl, Math.max(limit, requestedRefs.size || limit))
      : [];
  const targets = orders
    .filter((order) => requestedRefs.size === 0 || requestedRefs.has(getOrderRef(order)))
    .filter((order) => getTrackingNumber(order))
    .slice(0, limit);

  const results = [];

  for (const order of targets) {
    const orderRef = getOrderRef(order);
    const trackingNumber = getTrackingNumber(order);

    try {
      const raw = await trackShipment(trackingNumber);
      const tracking = extractTracking(raw);
      const existingAramex = getObject(order.aramex);
      const syncedOrder = {
        ...order,
        aramex: {
          ...existingAramex,
          trackingNumber,
          status: tracking.status,
          latestDescription: tracking.latestDescription,
          latestLocation: tracking.latestLocation,
          latestDate: tracking.latestDate,
          estimatedDelivery: tracking.estimatedDelivery,
          syncedAt: new Date().toISOString(),
          trackingRaw: tracking.raw,
          error: "",
        },
      };

      await saveOrder(webhookUrl || "", syncedOrder);
      results.push({ orderRef, trackingNumber, status: tracking.status, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ orderRef, trackingNumber, success: false, error: message });
    }
  }

  return {
    synced: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    checked: targets.length,
    results,
  };
}
