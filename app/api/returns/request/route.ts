import { NextResponse } from "next/server";
import { fetchOrderFromDatabase, upsertOrderToDatabase } from "@/lib/order-database";
import { sendReturnRequestEmail } from "@/lib/email";

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderRef = String(body.orderRef || "").trim().toUpperCase();
    const phone = digits(body.phone);
    const customerName = String(body.customerName || "").trim();
    const email = String(body.email || "").trim();
    const reason = String(body.reason || "").trim();
    const requestType = body.requestType === "return" ? "return" : "exchange";

    if (!orderRef || phone.length < 10 || customerName.length < 2 || reason.length < 8) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const order = await fetchOrderFromDatabase(orderRef);
    if (!order) {
      return NextResponse.json({ error: "We could not find this order." }, { status: 404 });
    }

    const customer = order.customer && typeof order.customer === "object"
      ? order.customer as Record<string, unknown>
      : {};
    const storedPhone = digits(customer.phone || order.customer_phone);
    if (!storedPhone || storedPhone.slice(-10) !== phone.slice(-10)) {
      return NextResponse.json({ error: "The phone number does not match this order." }, { status: 403 });
    }

    const now = new Date().toISOString();
    const extras = order.extras && typeof order.extras === "object"
      ? order.extras as Record<string, unknown>
      : {};
    const returnRequest = { requestType, reason, customerName, phone, email, requestedAt: now, status: "requested" };

    await upsertOrderToDatabase({
      ...order,
      order_ref: orderRef,
      extras: { ...extras, return_request: returnRequest },
      updated_at: now,
    });
    await sendReturnRequestEmail({ orderRef, customerName, phone, email, requestType, reason });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Return request failed", error);
    return NextResponse.json({ error: "Could not submit the request. Please try again." }, { status: 500 });
  }
}

