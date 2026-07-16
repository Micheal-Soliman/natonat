import { NextResponse } from "next/server";

import {
  fetchOrderFromDatabase,
  listOrdersFromDatabase,
  upsertOrderToDatabase,
} from "@/lib/order-database";
import { getBostaExceptionLabel, getBostaStateLabel, getOrderStatusFromBostaState } from "@/lib/bosta";

type OrderRecord = Record<string, unknown>;
type BostaWebhookPayload = {
  _id?: string;
  trackingNumber?: string | number;
  state?: string | number;
  type?: string;
  cod?: number;
  timeStamp?: number;
  isConfirmedDelivery?: boolean;
  deliveryPromiseDate?: string;
  exceptionReason?: string;
  exceptionCode?: string | number;
  businessReference?: string;
  numberOfAttempts?: number;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function getObject(value: unknown): OrderRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as OrderRecord
    : {};
}

function getTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
  }

  const raw = getString(value);
  if (raw) {
    const date = new Date(raw);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }

  return new Date().toISOString();
}

function getTrackingNumber(order: OrderRecord) {
  const aramex = getObject(order.aramex);
  return getString(aramex.trackingNumber || order["Aramex Tracking Number"]);
}

async function findOrder(payload: BostaWebhookPayload) {
  const orderRef = getString(payload.businessReference);
  if (orderRef) {
    const order = await fetchOrderFromDatabase(orderRef);
    if (order) return order;
  }

  const trackingNumber = getString(payload.trackingNumber);
  if (!trackingNumber) return null;

  const orders = await listOrdersFromDatabase(1500);
  return orders.find((order) => getTrackingNumber(order) === trackingNumber) || null;
}

function isAuthorized(req: Request) {
  const expected = process.env.BOSTA_WEBHOOK_SECRET;
  if (!expected) return true;

  const customSecret = req.headers.get("x-bosta-webhook-secret");
  const authorization = req.headers.get("authorization");

  return (
    customSecret === expected ||
    authorization === expected ||
    authorization === `Basic ${expected}` ||
    authorization === `Bearer ${expected}`
  );
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Invalid Bosta webhook secret" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null) as BostaWebhookPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ success: false, error: "Invalid Bosta webhook payload" }, { status: 400 });
  }

  const trackingNumber = getString(payload.trackingNumber);
  const stateLabel = getBostaStateLabel(payload.state);
  const exceptionLabel = payload.exceptionReason || getBostaExceptionLabel(payload.exceptionCode);
  const syncedAt = getTimestamp(payload.timeStamp);
  const order = await findOrder(payload);

  if (!order) {
    return NextResponse.json({
      success: false,
      error: "Order not found for Bosta webhook",
      businessReference: payload.businessReference,
      trackingNumber,
    }, { status: 404 });
  }

  const currentAramex = getObject(order.aramex);
  const history = Array.isArray(order.history) ? order.history : [];
  const status = getOrderStatusFromBostaState(payload.state) || getString(order.status) || "shipped";
  const latestDescription = exceptionLabel
    ? `${stateLabel}: ${exceptionLabel}`
    : stateLabel;

  const updatedOrder: OrderRecord = {
    ...order,
    status,
    source: "bosta_webhook",
    updated_at: syncedAt,
    aramex: {
      ...currentAramex,
      provider: "bosta",
      guid: getString(payload._id) || getString(currentAramex.guid),
      trackingNumber: trackingNumber || getString(currentAramex.trackingNumber),
      trackingLink: trackingNumber
        ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}`
        : getString(currentAramex.trackingLink),
      status: stateLabel,
      latestCode: getString(payload.state),
      latestDescription,
      latestDate: syncedAt,
      latestComments: exceptionLabel,
      latestProblemCode: getString(payload.exceptionCode),
      latestAttempts: payload.numberOfAttempts ?? "",
      deliveryPromiseDate: payload.deliveryPromiseDate || "",
      confirmedDelivery: Boolean(payload.isConfirmedDelivery),
      collectedCod: payload.cod ?? "",
      syncedAt,
      latestUpdateRaw: payload,
      trackingRaw: payload,
      error: "",
    },
    history: [
      ...history,
      {
        status,
        timestamp: new Date().toISOString(),
        source: "bosta_webhook",
        event_key: `bosta_webhook:${trackingNumber || payload.businessReference || payload._id}:${payload.state}:${syncedAt}`,
      },
    ],
  };

  await upsertOrderToDatabase(updatedOrder);

  return NextResponse.json({
    success: true,
    order_ref: getString(updatedOrder.order_ref),
    trackingNumber,
    state: payload.state,
    stateLabel,
    status,
  });
}
