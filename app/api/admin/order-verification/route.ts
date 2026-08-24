import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabase } from "@/lib/order-database";
import type { OrderVerificationAction } from "@/lib/order-verification";

type VerificationBody = {
  orderRef?: string;
  action?: OrderVerificationAction;
};

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as VerificationBody | null;
  const orderRef = String(body?.orderRef || "").trim().toUpperCase();
  const action = body?.action;
  if (!orderRef || (action !== "confirm" && action !== "cancel")) {
    return NextResponse.json({ error: "orderRef and a valid action are required" }, { status: 400 });
  }

  const order = await fetchOrderFromDatabase(orderRef);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const currentStatus = String(order.status || "").toLowerCase();
  const targetStatus = action === "confirm" ? "confirmed" : "cancelled";
  if (currentStatus === targetStatus || (action === "confirm" && currentStatus === "shipped")) {
    return NextResponse.json({ success: true, idempotent: true, order_ref: orderRef });
  }
  if (currentStatus !== "pending_verification") {
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
      status: targetStatus,
      verification_status: action === "confirm" ? "manually_confirmed" : "manually_cancelled",
      verified_at: action === "confirm" ? changedAt : "",
      verification_cancelled_at: action === "cancel" ? changedAt : "",
      verification_manual_required: false,
      verification_refund_required: refundRequired,
      updated_at: changedAt,
    }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not update order verification", details: result },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    action,
    order_ref: orderRef,
    message: action === "confirm"
      ? "Order confirmed. Bosta shipment creation is now allowed."
      : refundRequired
        ? "Order cancelled. No Bosta shipment was created; the paid amount needs refund review."
        : "Order cancelled. No Bosta shipment was created.",
  });
}
