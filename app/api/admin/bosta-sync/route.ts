import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { reconcileBostaOrders } from "@/lib/bosta-reconciliation";
import {
  fetchOrderFromDatabaseIncludingDeleted,
  isDeletedOrderRecord,
  listOrdersFromDatabase,
} from "@/lib/order-database";

type OrderRecord = Record<string, unknown>;

type SyncBody = {
  orderRefs?: string[];
  limit?: number;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
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
        const databaseOrder = await fetchOrderFromDatabaseIncludingDeleted(orderRef);
        if (isDeletedOrderRecord(databaseOrder)) return null;
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
  const deletedOrderRefs = new Set(
    databaseOrders
      .filter((order) => isDeletedOrderRecord(order))
      .map(getOrderRef)
      .filter(Boolean),
  );
  const byRef = new Map<string, OrderRecord>();

  for (const order of [...sheetOrders, ...databaseOrders.filter((order) => !isDeletedOrderRecord(order))]) {
    const orderRef = getOrderRef(order);
    if (orderRef && !deletedOrderRefs.has(orderRef)) byRef.set(orderRef, order);
  }

  return [...byRef.values()].slice(0, limit);
}

async function persistReconciliationUpdate(
  appOrigin: string,
  update: Awaited<ReturnType<typeof reconcileBostaOrders>>["updates"][number],
) {
  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...update.order,
      source: "admin_bosta_sync",
      order_ref: update.orderRef,
      status: update.status,
      bosta: update.bosta,
      shipment: {
        provider: "bosta",
        trackingNumber: update.bosta.trackingNumber,
        trackingLink: update.bosta.trackingLink,
        status: update.bosta.status,
        syncedAt: update.bosta.syncedAt,
      },
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (logRes.ok) return "";
  const data = await logRes.json().catch(() => null) as { error?: string } | null;
  return data?.error || "Could not update order log after Bosta sync";
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as SyncBody;
  const orderRefs = (body.orderRefs || []).map((value) => String(value || "").trim()).filter(Boolean);
  const limit = Math.max(1, Math.min(1000, Math.round(Number(body.limit || 500))));
  const orders = await fetchOrdersForSync(orderRefs, limit);
  const reconciliation = await reconcileBostaOrders(orders);
  const appOrigin = getAppOrigin(req);
  const errors = [
    ...reconciliation.errors,
    ...reconciliation.missing.map((entry) => ({
      orderRef: entry.orderRef,
      error: "No Bosta delivery found for tracking number",
    })),
  ];
  let synced = 0;

  for (const update of reconciliation.updates) {
    const error = await persistReconciliationUpdate(appOrigin, update);
    if (error) {
      errors.push({ orderRef: update.orderRef, error });
    } else {
      synced += 1;
    }
  }

  return NextResponse.json({
    success: true,
    checked: reconciliation.checked,
    synced,
    failed: errors.length,
    skipped: reconciliation.missing.length,
    errors,
    message: `Bosta sync checked ${reconciliation.checked} orders, updated ${synced}, failed ${errors.length}.`,
  });
}
