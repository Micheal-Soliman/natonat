import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  fetchOrderFromDatabase,
  listOrdersFromDatabase,
} from "@/lib/order-database";
import {
  parseOrderVerificationPayload,
  type OrderVerificationAction,
} from "@/lib/order-verification";

type JsonRecord = Record<string, unknown>;

function getRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  let phone = getString(value).replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = `20${phone.slice(1)}`;
  if (phone && !phone.startsWith("20")) phone = `20${phone}`;
  return phone;
}

function verifyMetaSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET || "";
  if (!appSecret || !signature?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = signature.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getWebhookMessages(payload: JsonRecord) {
  const messages: JsonRecord[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  entries.forEach((entryValue) => {
    const entry = getRecord(entryValue);
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    changes.forEach((changeValue) => {
      const value = getRecord(getRecord(changeValue).value);
      if (Array.isArray(value.messages)) {
        value.messages.forEach((message) => messages.push(getRecord(message)));
      }
    });
  });

  return messages;
}

function getWebhookStatuses(payload: JsonRecord) {
  const statuses: JsonRecord[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  entries.forEach((entryValue) => {
    const entry = getRecord(entryValue);
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    changes.forEach((changeValue) => {
      const value = getRecord(getRecord(changeValue).value);
      if (Array.isArray(value.statuses)) {
        value.statuses.forEach((status) => statuses.push(getRecord(status)));
      }
    });
  });

  return statuses;
}

function getButtonPayload(message: JsonRecord) {
  const interactive = getRecord(message.interactive);
  const buttonReply = getRecord(interactive.button_reply);
  const button = getRecord(message.button);
  return getString(buttonReply.id) || getString(button.payload);
}

function inferActionFromMessage(message: JsonRecord): OrderVerificationAction | null {
  const interactive = getRecord(message.interactive);
  const buttonReply = getRecord(interactive.button_reply);
  const button = getRecord(message.button);
  const text = `${getString(buttonReply.title)} ${getString(button.text)}`.toLowerCase();

  if (text.includes("confirm") || text.includes("تأكيد")) return "confirm";
  if (text.includes("cancel") || text.includes("إلغاء") || text.includes("الغاء")) return "cancel";
  return null;
}

async function findOrderByOutboundMessageId(messageId: string) {
  if (!messageId) return null;
  const orders = await listOrdersFromDatabase(2000);
  return orders.find((order) =>
    getString(order.verification_message_id) === messageId ||
    getString(order.verification_reminder_message_id) === messageId
  ) || null;
}

async function findOrderByMessageContext(message: JsonRecord) {
  return findOrderByOutboundMessageId(getString(getRecord(message.context).id));
}

async function findLatestPendingOrderByCustomerPhone(message: JsonRecord) {
  const senderPhone = normalizePhone(message.from);
  if (!senderPhone) return null;

  const orders = await listOrdersFromDatabase(2000);
  return orders
    .filter((order) => {
      const customer = getRecord(order.customer);
      return getString(order.status).toLowerCase() === "pending_verification" &&
        normalizePhone(customer.phone) === senderPhone;
    })
    .sort((left, right) => {
      const leftTime = Date.parse(getString(left.created_at) || getString(left.updated_at)) || 0;
      const rightTime = Date.parse(getString(right.created_at) || getString(right.updated_at)) || 0;
      return rightTime - leftTime;
    })[0] || null;
}

async function storeDeliveryStatus(origin: string, status: JsonRecord) {
  const messageId = getString(status.id);
  const order = await findOrderByOutboundMessageId(messageId);
  const orderRef = order ? getString(order.order_ref).toUpperCase() : "";
  if (!orderRef) return { success: false, skipped: true, error: "Message order not found" };

  const deliveryStatus = getString(status.status).toLowerCase();
  const failed = deliveryStatus === "failed";
  const errors = Array.isArray(status.errors) ? status.errors : [];
  const errorText = failed ? JSON.stringify(errors).slice(0, 1500) : "";
  const changedAt = new Date().toISOString();
  const response = await fetch(`${origin}/api/orders/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-order-verification-secret": process.env.ORDER_CONFIRMATION_SECRET || "",
    },
    body: JSON.stringify({
      source: "whatsapp_delivery_status",
      order_ref: orderRef,
      verification_whatsapp_status: deliveryStatus,
      verification_whatsapp_status_at: changedAt,
      verification_message_failed_at: failed ? changedAt : "",
      verification_message_error: failed ? errorText || "WhatsApp delivery failed" : "",
      verification_manual_required: failed,
      updated_at: changedAt,
    }),
    cache: "no-store",
  });

  return { success: response.ok, status: response.status, orderRef, deliveryStatus };
}

async function transitionOrder(
  origin: string,
  orderRef: string,
  action: OrderVerificationAction,
  message: JsonRecord,
) {
  const order = await fetchOrderFromDatabase(orderRef);
  if (!order) return { success: false, status: 404, error: "Order not found" };

  const currentStatus = getString(order.status).toLowerCase();
  const targetStatus = action === "confirm" ? "confirmed" : "cancelled";
  const alreadyAtTarget =
    currentStatus === targetStatus || (action === "confirm" && currentStatus === "shipped");
  if (!alreadyAtTarget && currentStatus !== "pending_verification") {
    return { success: false, status: 409, error: `Order is ${currentStatus || "not pending"}` };
  }

  const changedAt = new Date().toISOString();
  const paymentStatus = getString(order.payment_status).toLowerCase();
  const paymentMethod = getString(order.payment_method).toLowerCase();
  const refundRequired = action === "cancel" && paymentStatus === "paid" && paymentMethod !== "cod";
  const response = await fetch(`${origin}/api/orders/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-order-verification-secret": process.env.ORDER_CONFIRMATION_SECRET || "",
    },
    body: JSON.stringify({
      source: "whatsapp_order_verification",
      order_ref: orderRef,
      status: alreadyAtTarget ? currentStatus : targetStatus,
      verification_status: action === "confirm" ? "confirmed" : "cancelled_by_customer",
      verified_at: action === "confirm" ? changedAt : "",
      verification_cancelled_at: action === "cancel" ? changedAt : "",
      verification_response_message_id: getString(message.id),
      verification_manual_required: false,
      verification_refund_required: refundRequired,
      updated_at: changedAt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return { success: false, status: 502, error: error || "Could not update order" };
  }

  return { success: true, status: 200, reconciled: alreadyAtTarget };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    challenge &&
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid Meta signature" }, { status: 401 });
  }

  let payload: JsonRecord;
  try {
    payload = getRecord(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = getWebhookMessages(payload);
  const statuses = getWebhookStatuses(payload);
  const results = [];
  const origin = new URL(request.url).origin;

  console.info("[WhatsApp Webhook] Event received", {
    messages: messages.length,
    statuses: statuses.length,
    hasEntries: Array.isArray(payload.entry) && payload.entry.length > 0,
  });

  for (const status of statuses) {
    results.push(await storeDeliveryStatus(origin, status));
  }

  for (const message of messages) {
    const buttonPayload = getButtonPayload(message);
    const parsed = parseOrderVerificationPayload(buttonPayload);
    if (parsed) {
      results.push(await transitionOrder(origin, parsed.orderRef, parsed.action, message));
      continue;
    }

    const action = inferActionFromMessage(message);
    const contextualOrder = action
      ? await findOrderByMessageContext(message) || await findLatestPendingOrderByCustomerPhone(message)
      : null;
    const orderRef = contextualOrder ? getString(contextualOrder.order_ref).toUpperCase() : "";
    if (action && orderRef) {
      results.push(await transitionOrder(origin, orderRef, action, message));
      continue;
    }

    console.warn("[WhatsApp Webhook] Message was not actionable", {
      type: getString(message.type),
      hasButtonPayload: Boolean(buttonPayload),
      inferredAction: action || "",
      hasContext: Boolean(getString(getRecord(message.context).id)),
    });
  }

  const failed = results.find((result) => !result.success && Number(result.status || 0) >= 500);
  if (failed) return NextResponse.json(failed, { status: Number(failed.status || 500) });

  return NextResponse.json({ success: true, processed: results.length, results });
}
