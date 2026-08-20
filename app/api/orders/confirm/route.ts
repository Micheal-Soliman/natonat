import { NextResponse } from "next/server";
import { fetchOrderFromDatabase } from "@/lib/order-database";
import { verifyOrderConfirmationToken } from "@/lib/order-verification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderRef = String(url.searchParams.get("order_ref") || "").trim().toUpperCase();
  const token = String(url.searchParams.get("token") || "");
  if (!verifyOrderConfirmationToken(orderRef, token)) {
    return NextResponse.json({ error: "Invalid or expired confirmation link" }, { status: 403 });
  }

  const order = await fetchOrderFromDatabase(orderRef);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const status = String(order.status || "").toLowerCase();
  if (status === "cancelled" || status === "returned") {
    return NextResponse.json({ error: "This order can no longer be confirmed" }, { status: 409 });
  }

  if (status === "pending_verification") {
    const response = await fetch(`${url.origin}/api/orders/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        source: String(order.source || "checkout"),
        order_ref: orderRef,
        status: "confirmed",
        verified_at: new Date().toISOString(),
        verification_status: "confirmed",
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Could not confirm order" }, { status: 502 });
  }

  const locale = String(order.locale || "ar") === "en" ? "en" : "ar";
  return NextResponse.redirect(new URL(`/${locale}/order-confirmed?order_ref=${encodeURIComponent(orderRef)}&verified=true`, url.origin));
}

