import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabase, listOrdersFromDatabase } from "@/lib/order-database";
import {
  getBostaExceptionLabel,
  getBostaStateLabel,
  getOrderStatusFromBostaState,
  searchBostaDeliveries,
} from "@/lib/bosta";

type OrderRecord = Record<string, unknown>;

type SyncBody = {
  orderRefs?: string[];
  limit?: number;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
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
    ? value as OrderRecord
    : {};
}

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function getOrderRef(order: OrderRecord) {
  return getString(order.order_ref || order["Order Ref"]);
}

function getBosta(order: OrderRecord) {
  return getObject(order.bosta || order.shipment || order.aramex);
}

function getTrackingNumber(order: OrderRecord) {
  const bosta = getBosta(order);
  return getString(bosta.trackingNumber || order["Bosta Tracking Number"] || order["Aramex Tracking Number"]);
}

async function fetchSheetOrders(limit: number) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return [];

  const url = new URL(webhookUrl);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => null) as { success?: boolean; orders?: unknown[] } | null;

  if (!res.ok || !data?.success || !Array.isArray(data.orders)) return [];
  return data.orders.filter((order): order is OrderRecord => Boolean(order && typeof order === "object" && !Array.isArray(order)));
}

async function fetchOrdersForSync(orderRefs: string[], limit: number) {
  if (orderRefs.length) {
    const orders = await Promise.all(
      orderRefs.map(async (orderRef) => {
        const databaseOrder = await fetchOrderFromDatabase(orderRef);
        if (databaseOrder) return databaseOrder as OrderRecord;

        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
        if (!webhookUrl) return null;

        const url = new URL(webhookUrl);
        url.searchParams.set("order_ref", orderRef);
        const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
        const data = await res.json().catch(() => null) as { success?: boolean; order?: unknown } | null;
        return res.ok && data?.success && data.order && typeof data.order === "object"
          ? data.order as OrderRecord
          : null;
      }),
    );

    return orders.filter((order): order is OrderRecord => Boolean(order));
  }

  const databaseOrders = await listOrdersFromDatabase(limit).catch(() => []);
  const sheetOrders = await fetchSheetOrders(limit);
  const byRef = new Map<string, OrderRecord>();

  for (const order of [...sheetOrders, ...databaseOrders]) {
    const orderRef = getOrderRef(order);
    if (orderRef) byRef.set(orderRef, order);
  }

  return [...byRef.values()].slice(0, limit);
}

function getStateCode(delivery: OrderRecord) {
  const state = getObject(delivery.state);
  return getString(state.code || delivery.stateCode || delivery.state);
}

function getStateValue(delivery: OrderRecord) {
  const state = getObject(delivery.state);
  return getString(state.value || delivery.stateValue || delivery.status);
}

function buildBostaUpdate(order: OrderRecord, delivery: OrderRecord) {
  const currentBosta = getBosta(order);
  const stateCode = getStateCode(delivery);
  const stateValue = getStateValue(delivery) || getBostaStateLabel(stateCode);
  const exceptionCode = getString(delivery.exceptionCode || delivery.exceptionReasonCode);
  const exceptionLabel = getString(delivery.exceptionReason) || getBostaExceptionLabel(exceptionCode);
  const trackingNumber = getString(delivery.trackingNumber) || getTrackingNumber(order);
  const deliveryId = getString(delivery._id || delivery.id) || getString(currentBosta.deliveryId || currentBosta.guid);
  const latestDescription = [stateValue, exceptionLabel].filter(Boolean).join(" · ");
  const syncedAt = new Date().toISOString();

  return {
    ...currentBosta,
    provider: "bosta",
    guid: deliveryId,
    deliveryId,
    trackingNumber,
    trackingLink: trackingNumber
      ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}`
      : getString(currentBosta.trackingLink),
    status: stateValue || getString(currentBosta.status),
    latestCode: stateCode,
    latestDescription: latestDescription || getString(currentBosta.latestDescription),
    latestDate: getString(delivery.updatedAt || delivery.updated_at || delivery.lastUpdatedAt || delivery.createdAt) || syncedAt,
    latestComments: getString(delivery.notes || delivery.message),
    latestProblemCode: exceptionCode,
    syncedAt,
    trackingRaw: delivery,
    error: "",
  };
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as SyncBody;
  const orderRefs = (body.orderRefs || []).map((value) => String(value || "").trim()).filter(Boolean);
  const limit = Math.max(1, Math.min(200, Math.round(Number(body.limit || 50))));
  const orders = await fetchOrdersForSync(orderRefs, limit);
  const appOrigin = getAppOrigin(req);

  let checked = 0;
  let synced = 0;
  let failed = 0;
  const errors: Array<{ orderRef: string; error: string }> = [];

  for (const order of orders) {
    const orderRef = getOrderRef(order);
    const trackingNumber = getTrackingNumber(order);
    if (!orderRef || !trackingNumber) continue;

    checked += 1;

    const searchResult = await searchBostaDeliveries({ trackingNumbers: [trackingNumber] });
    if (!searchResult.success || !searchResult.deliveries.length) {
      failed += 1;
      errors.push({ orderRef, error: searchResult.error || "No Bosta delivery found for tracking number" });
      continue;
    }

    const delivery = searchResult.deliveries.find((item) => getString(item.trackingNumber) === trackingNumber) || searchResult.deliveries[0];
    const bosta = buildBostaUpdate(order, delivery);
    const status = getOrderStatusFromBostaState(bosta.latestCode) || getString(order.status) || "shipped";

    const logRes = await fetch(`${appOrigin}/api/orders/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        source: "admin_bosta_sync",
        order_ref: orderRef,
        status,
        bosta,
        shipment: {
          provider: "bosta",
          trackingNumber: bosta.trackingNumber,
          trackingLink: bosta.trackingLink,
          status: bosta.status,
          syncedAt: bosta.syncedAt,
        },
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    if (!logRes.ok) {
      failed += 1;
      const data = await logRes.json().catch(() => null) as { error?: string } | null;
      errors.push({ orderRef, error: data?.error || "Could not update order log after Bosta sync" });
      continue;
    }

    synced += 1;
  }

  return NextResponse.json({
    success: true,
    checked,
    synced,
    failed,
    errors,
    message: `Bosta sync checked ${checked} orders, updated ${synced}, failed ${failed}.`,
  });
}
