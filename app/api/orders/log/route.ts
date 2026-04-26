import { NextResponse } from "next/server";

type OrderLogBody = Record<string, unknown>;

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
    // Merge with existing order data if present
    const existing = orderStore.get(orderRef);
    if (existing) {
      orderStore.set(orderRef, { ...existing, ...body });
    } else {
      orderStore.set(orderRef, body);
    }
    
    // Clean up old orders after 24 hours
    setTimeout(() => {
      orderStore.delete(orderRef);
    }, 24 * 60 * 60 * 1000);
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
