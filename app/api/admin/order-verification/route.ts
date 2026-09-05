import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromStorage } from "@/lib/order-storage";
import {
  sendOrderVerificationWhatsApp,
  type OrderVerificationAction,
} from "@/lib/order-verification";

type VerificationBody = {
  orderRef?: string;
  action?: OrderVerificationAction | "resend";
};

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as VerificationBody | null;
  const orderRef = String(body?.orderRef || "").trim().toUpperCase();
  const action = body?.action;
  if (!orderRef || (action !== "confirm" && action !== "cancel" && action !== "resend")) {
    return NextResponse.json({ error: "orderRef and a valid action are required" }, { status: 400 });
  }

  const order = await fetchOrderFromStorage(orderRef);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const currentStatus = String(order.status || "").toLowerCase();
  if (action === "resend") {
    if (currentStatus !== "pending_verification") {
      return NextResponse.json(
        { error: `Order is ${currentStatus || "not pending verification"}` },
        { status: 409 },
      );
    }

    const result = await sendOrderVerificationWhatsApp(order);
    const changedAt = new Date().toISOString();
    const origin = new URL(request.url).origin;
    const logResponse = await fetch(`${origin}/api/orders/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-order-verification-secret": process.env.ORDER_CONFIRMATION_SECRET || "",
      },
      body: JSON.stringify({
        source: "order_verification_whatsapp",
        order_ref: orderRef,
        verification_message_queued_at: "",
        verification_message_sent_at: result.success ? changedAt : "",
        verification_message_id: result.success ? result.messageId || "" : "",
        verification_message_error: result.success ? "" : result.error,
        verification_manual_required: !result.success,
        verification_resent_at: changedAt,
        updated_at: changedAt,
      }),
      cache: "no-store",
    });

    if (!logResponse.ok) {
      return NextResponse.json({ error: "Could not store WhatsApp resend result" }, { status: 502 });
    }

    return NextResponse.json(
      result.success
        ? { success: true, action, order_ref: orderRef, message: "WhatsApp confirmation resent." }
        : { success: false, action, order_ref: orderRef, error: result.error },
      { status: result.success ? 200 : 502 },
    );
  }

  const targetStatus = action === "confirm" ? "confirmed" : "cancelled";
  const alreadyAtTarget =
    currentStatus === targetStatus || (action === "confirm" && currentStatus === "shipped");
  if (!alreadyAtTarget && currentStatus !== "pending_verification") {
    return NextResponse.json(
      { error: `Order is ${currentStatus || "not pending verification"}` },
      { status: 409 },
    );
  }

  const changedAt = new Date().toISOString();
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const paymentMethod = String(order.payment_method || "").toLowerCase();
  const refundRequired = action === "cancel" && paymentStatus === "paid" && paymentMethod !== "cod";
  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}/api/orders/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-order-verification-secret": process.env.ORDER_CONFIRMATION_SECRET || "",
    },
    body: JSON.stringify({
      source: "admin_order_verification",
      order_ref: orderRef,
      status: alreadyAtTarget ? currentStatus : targetStatus,
      verification_status: action === "confirm" ? "manually_confirmed" : "manually_cancelled",
      verified_at: action === "confirm" ? changedAt : "",
      verification_cancelled_at: action === "cancel" ? changedAt : "",
      verification_manual_required: false,
      verification_refund_required: refundRequired,
      updated_at: changedAt,
    }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as {
    error?: string;
    shipment?: {
      success?: boolean;
      trackingNumber?: string;
      guid?: string;
      error?: string;
      status?: string;
    };
  };

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not update order verification", details: result },
      { status: 502 },
    );
  }

  const requiresShipment =
    action === "confirm" && String(order.delivery_method || "").toLowerCase() === "delivery";
  const trackingNumber = result.shipment?.trackingNumber || result.shipment?.guid || "";
  if (requiresShipment && !trackingNumber) {
    return NextResponse.json(
      {
        error: "Order confirmed, but Bosta shipment creation failed",
        details: result.shipment?.error || result.shipment?.status || "Bosta did not return a tracking number",
        order_ref: orderRef,
        confirmed: true,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    action,
    reconciled: alreadyAtTarget,
    order_ref: orderRef,
    message: action === "confirm"
      ? trackingNumber
        ? `Order confirmed and Bosta shipment created: ${trackingNumber}.`
        : "Order confirmed. No courier shipment is required."
      : refundRequired
        ? "Order cancelled. No Bosta shipment was created; the paid amount needs refund review."
        : "Order cancelled. No Bosta shipment was created.",
  });
}
