import { NextResponse } from "next/server";
import { trackShipment } from "@/lib/aramex";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  aramex?: Record<string, unknown>;
};

type SheetsListResponse = {
  success?: boolean;
  orders?: AdminOrder[];
  error?: string;
};

type TrackBody = {
  limit?: number;
  orderRefs?: string[];
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function isAuthorized(req: Request) {
  const configuredToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!configuredToken) {
    return process.env.NODE_ENV !== "production";
  }

  const url = new URL(req.url);
  const providedToken =
    getBearerToken(req) ||
    req.headers.get("x-admin-token") ||
    url.searchParams.get("token") ||
    "";

  return providedToken === configuredToken;
}

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
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(order),
    cache: "no-store",
  });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Could not save order update: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({} as TrackBody)) as TrackBody;
  const limit = Math.max(1, Math.min(100, Number(body.limit || 50)));
  const requestedRefs = new Set((body.orderRefs || []).map((ref) => String(ref).trim()).filter(Boolean));
  const orders = await fetchOrders(webhookUrl, Math.max(limit, requestedRefs.size || limit));
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

      await saveOrder(webhookUrl, syncedOrder);
      results.push({ orderRef, trackingNumber, status: tracking.status, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ orderRef, trackingNumber, success: false, error: message });
    }
  }

  return NextResponse.json({
    success: true,
    synced: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    checked: targets.length,
    results,
  });
}
