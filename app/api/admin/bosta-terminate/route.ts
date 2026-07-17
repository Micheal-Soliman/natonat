import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabaseIncludingDeleted, isDeletedOrderRecord } from "@/lib/order-database";
import { terminateBostaDelivery } from "@/lib/bosta";

type OrderRecord = Record<string, unknown>;

type TerminateBody = {
  orderRef?: string;
  trackingNumber?: string;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
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

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchOrder(orderRef: string) {
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
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as TerminateBody;
  const orderRef = getString(body.orderRef);
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const order = await fetchOrder(orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const currentBosta = getObject(order.bosta || order.shipment || order.aramex);
  const trackingNumber = getString(
    body.trackingNumber ||
      currentBosta.trackingNumber ||
      order["Bosta Tracking Number"] ||
      order["Aramex Tracking Number"],
  );

  if (!trackingNumber) {
    return NextResponse.json({ error: "Missing Bosta tracking number" }, { status: 400 });
  }

  const result = await terminateBostaDelivery(trackingNumber);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not terminate Bosta delivery", details: result.raw },
      { status: 502 },
    );
  }

  const timestamp = new Date().toISOString();
  const previousTrackingNumbers = Array.from(new Set([
    ...getArray(currentBosta.previousTrackingNumbers).map((value) => getString(value)).filter(Boolean),
    trackingNumber,
  ]));
  const nextBosta = {
    ...currentBosta,
    provider: "bosta",
    trackingNumber: "",
    trackingLink: "",
    previousTrackingNumber: trackingNumber,
    previousTrackingNumbers,
    oldTrackingCancelRequired: false,
    oldTrackingTerminatedAt: timestamp,
    oldTrackingTerminateMessage: result.message || "",
    needsReplacement: false,
    replacementRequired: false,
    replacementResolvedAt: timestamp,
    replacementReason: "",
    replacementRequiredFields: [],
    status: "Terminated",
    latestCode: "48",
    latestDescription: result.message || "Delivery terminated successfully",
    syncedAt: timestamp,
    error: "",
  };

  const appOrigin = getAppOrigin(req);
  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...order,
      source: "admin_bosta_terminated",
      order_ref: orderRef,
      status: "confirmed",
      bosta: nextBosta,
      shipment: {
        provider: "bosta",
        trackingNumber: "",
        trackingLink: "",
        status: "Terminated",
        syncedAt: timestamp,
      },
      admin_audit: [
        ...getArray(order.admin_audit),
        {
          action: "admin_bosta_terminated",
          timestamp,
          source: "admin_dashboard",
          note: `Admin terminated Bosta tracking ${trackingNumber}.`,
        },
      ],
      updated_at: timestamp,
    }),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Bosta delivery terminated, but failed to update order log", details: logData },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    trackingNumber,
    message: result.message || "Delivery terminated successfully",
  });
}
