import { NextResponse } from "next/server";
import { sendOrderEmail, sendCustomerConfirmationEmail } from "@/lib/email";

type OrderLogBody = Record<string, unknown>;
type OrderHistoryEntry = {
  status: string;
  timestamp: string;
  source: unknown;
};

type StoredOrder = OrderLogBody & {
  status?: string;
  history?: OrderHistoryEntry[];
  aramex?: {
    trackingNumber?: string;
  };
};

// Simple in-memory store for orders (in production, use a database like Redis, Supabase, etc.)
const orderStore = new Map<string, OrderLogBody>();

// GET endpoint to retrieve order by reference
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const order_ref = searchParams.get("order_ref");

  if (!order_ref) {
    return NextResponse.json(
      { error: "Missing order_ref parameter" },
      { status: 400 }
    );
  }

  const order = orderStore.get(order_ref);
  
  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}

export async function POST(req: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not set" },
      { status: 500 }
    );
  }

  let body: OrderLogBody;
  try {
    body = (await req.json()) as OrderLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Store in memory for retrieval by webhook
  const orderRef = body.order_ref as string | undefined;
  if (orderRef) {
    const existing = orderStore.get(orderRef) as StoredOrder | undefined;
    
    // Build status history
    const newStatus = (body.status || existing?.status || "confirmed") as string;
    const historyEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      source: body.source || "manual"
    };

    const history = existing?.history ? [...existing.history, historyEntry] : [historyEntry];
    
    // Add Aramex tracking link if tracking number exists
    const bodyAramex = body.aramex as StoredOrder["aramex"] | undefined;
    const trackingNumber = bodyAramex?.trackingNumber || existing?.aramex?.trackingNumber;
    const trackingLink = trackingNumber 
      ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`
      : "";

    const updatedOrder = { 
      ...existing, 
      ...body, 
      history,
      tracking_link: trackingLink 
    };

    orderStore.set(orderRef, updatedOrder);
    
    // Send email notification for new orders from checkout
    if (body.source === "checkout") {
      // Don't await to avoid blocking the response
      sendOrderEmail(updatedOrder).catch(err => console.error("Failed to send order email:", err));
      sendCustomerConfirmationEmail(updatedOrder).catch(err => console.error("Failed to send customer confirmation email:", err));
    }

    // Forward the ENTIRE updated order to Google Sheets
    body = updatedOrder;

    // Clean up old orders after 48 hours (extended to cover weekend payments)
    setTimeout(() => {
      orderStore.delete(orderRef);
    }, 48 * 60 * 60 * 1000);
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to write to Google Sheets", status: res.status, data: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: text, order_ref: orderRef });
}
