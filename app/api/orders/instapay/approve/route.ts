import { NextResponse } from "next/server";
import { fetchOrderFromDatabaseIncludingDeleted, isDeletedOrderRecord } from "@/lib/order-database";

type LoggedOrder = {
  order_ref?: string;
  status?: string;
  payment_status?: string;
  delivery_method?: string;
  customer?: unknown;
  items?: Array<{
    name?: string;
    title?: string;
    slug?: string;
    type?: string;
    size?: string;
    selectedSize?: string;
    variantSize?: string;
    color?: string;
    selectedColor?: string;
    variant?: string;
    quantity?: number;
  }>;
  amount_egp?: number;
  amount_cents?: number;
  bosta?: {
    provider?: string;
    trackingNumber?: string;
    trackingLink?: string;
    labelUrl?: string;
    guid?: string;
  };
  shipment?: {
    provider?: string;
    trackingNumber?: string;
    trackingLink?: string;
    labelUrl?: string;
    guid?: string;
  };
  aramex?: LoggedOrder["bosta"];
};

async function fetchOrder(orderRef: string) {
  const databaseOrder = await fetchOrderFromDatabaseIncludingDeleted(orderRef);
  if (isDeletedOrderRecord(databaseOrder)) return null;
  if (databaseOrder) return databaseOrder as LoggedOrder;

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    success?: boolean;
    order?: LoggedOrder;
  };

  return data.success && data.order ? data.order : null;
}

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
  const token = process.env.INSTAPAY_APPROVAL_TOKEN;
  const { searchParams } = new URL(req.url);
  const orderRef = searchParams.get("order_ref") || "";
  const requestToken = searchParams.get("token") || "";

  if (!token) {
    return NextResponse.json(
      { error: "INSTAPAY_APPROVAL_TOKEN is not configured" },
      { status: 503 }
    );
  }

  if (!orderRef || requestToken !== token) {
    return NextResponse.json({ error: "Unauthorized approval request" }, { status: 401 });
  }

  const order = await fetchOrder(orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const appOrigin = getAppOrigin(req);
  let bostaPayload: LoggedOrder["bosta"] | null = order.bosta || order.shipment || order.aramex || null;
  let nextStatus = order.delivery_method === "delivery" ? "confirmed" : "confirmed";

  if (order.delivery_method === "delivery" && order.customer && !bostaPayload?.trackingNumber) {
    const shipmentRes = await fetch(`${appOrigin}/api/bosta/shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-secret": process.env.BOSTA_INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({
        orderRef,
        customer: order.customer,
        items: (order.items || []).map((item) => ({
          name: item.name || "Order item",
          title: item.title,
          slug: item.slug,
          type: item.type,
          size: item.size,
          selectedSize: item.selectedSize,
          variantSize: item.variantSize,
          color: item.color,
          selectedColor: item.selectedColor,
          variant: item.variant,
          quantity: item.quantity || 1,
        })),
        totalValue: order.amount_egp || Math.round((order.amount_cents || 0) / 100),
        cod: false,
        codAmount: 0,
      }),
      cache: "no-store",
    });

    const shipmentData = await shipmentRes.json();
    if (!shipmentRes.ok || !shipmentData.success) {
      await fetch(`${appOrigin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "instapay_admin_approved",
          order_ref: orderRef,
          status: "confirmed",
          payment_status: "Paid",
          bosta: {
            error: shipmentData?.details || shipmentData?.error || "Bosta shipment failed",
          },
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      });

      return NextResponse.json(
        {
          error: "InstaPay approved, but Bosta shipment failed",
          details: shipmentData?.details || shipmentData?.error || "Bosta shipment failed",
        },
        { status: 502 }
      );
    }

    bostaPayload = {
      provider: shipmentData.provider,
      trackingNumber: shipmentData.trackingNumber,
      trackingLink: shipmentData.trackingLink,
    };
    nextStatus = "shipped";
  }

  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "instapay_admin_approved",
      order_ref: orderRef,
      status: nextStatus,
      payment_status: "Paid",
      bosta: bostaPayload,
      shipment: bostaPayload ? { provider: "bosta", trackingNumber: bostaPayload.trackingNumber, trackingLink: bostaPayload.trackingLink } : null,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Approved but failed to update order log", data: logData },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    status: nextStatus,
    bosta: bostaPayload,
  });
}
