import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabase } from "@/lib/order-database";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  customer?: Record<string, unknown>;
  aramex?: Record<string, unknown>;
  extras?: Record<string, unknown>;
  items?: unknown[];
  admin_audit?: unknown[];
};

type CreateBody = {
  orderRef?: string;
};

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

function getObject(value: unknown): Record<string, unknown> {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return getObject(parsed);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
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

async function fetchOrder(orderRef: string) {
  const databaseOrder = await fetchOrderFromDatabase(orderRef);
  if (databaseOrder) return databaseOrder as AdminOrder;

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as { success?: boolean; order?: AdminOrder };
  return data.success && data.order ? data.order : null;
}

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function getDeliveryMethod(order: AdminOrder) {
  const extras = getObject(order.extras || order["Extras (Full JSON)"]);
  return getString(order.delivery_method || order["Delivery Method"] || extras.delivery_method).toLowerCase();
}

function getPaymentMethod(order: AdminOrder) {
  return getString(order.payment_method || order["Payment Method"]).toLowerCase();
}

function getTotalValue(order: AdminOrder) {
  const extras = getObject(order.extras || order["Extras (Full JSON)"]);
  return (
    getNumber(order.amount_egp || order["Total (EGP)"]) ||
    getNumber(order.amount_cents || order["Total Cents"]) / 100 ||
    getNumber(extras.subtotal_egp) ||
    getNumber(order["Subtotal (EGP)"])
  );
}

function getOrderItems(order: AdminOrder) {
  return getArray(order.items || order["Items (Full JSON)"] || order["Items"])
    .map((item) => {
      const row = getObject(item);
      return {
        name: getString(row.name || row.title || row.slug || "Order item"),
        quantity: getNumber(row.quantity || row.qty) || 1,
      };
    })
    .filter((item) => item.name.trim().length > 0);
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const orderRef = String(body.orderRef || "").trim();
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const order = await fetchOrder(orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!getDeliveryMethod(order).includes("delivery")) {
    return NextResponse.json(
      { error: "Aramex shipment can only be created for delivery orders" },
      { status: 400 },
    );
  }

  const customer = getObject(order.customer || order["Customer (Full JSON)"]);
  const items = getOrderItems(order);
  const totalValue = getTotalValue(order);
  const paymentMethod = getPaymentMethod(order);
  const isCod = paymentMethod.includes("cod") || paymentMethod.includes("cash");

  if (!customer.phone || !customer.address || !customer.city || !totalValue || !items.length) {
    return NextResponse.json(
      { error: "Missing customer address, city, phone, order total, or product lines" },
      { status: 400 },
    );
  }

  const appOrigin = getAppOrigin(req);
  const existingAramex = getObject(order.aramex);
  const previousTrackingNumber = getString(existingAramex.trackingNumber || order["Aramex Tracking Number"]);
  const recreated = Boolean(previousTrackingNumber);

  if (recreated) {
    return NextResponse.json(
      {
        error: "Existing Aramex shipment must be cancelled before creating a replacement",
        details:
          "This integration does not have a confirmed Aramex cancel-shipment API. Cancel/check the old tracking in Aramex portal first to avoid duplicate active shipments.",
        previousTrackingNumber,
      },
      { status: 409 },
    );
  }

  const shipmentRes = await fetch(`${appOrigin}/api/aramex/shipment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderRef,
      customer,
      items,
      totalValue,
      cod: isCod,
      codAmount: isCod ? totalValue : 0,
    }),
    cache: "no-store",
  });

  const shipmentData = await shipmentRes.json().catch(() => null);
  if (!shipmentRes.ok || !shipmentData?.success) {
    return NextResponse.json(
      {
        error: "Aramex shipment creation failed",
        details: shipmentData?.details || shipmentData?.error || "Unknown Aramex error",
      },
      { status: 502 },
    );
  }

  const timestamp = new Date().toISOString();
  const previousTrackingNumbers = [
    ...getArray(existingAramex.previousTrackingNumbers),
    ...(previousTrackingNumber ? [previousTrackingNumber] : []),
  ];
  const auditEntry = {
    action: recreated ? "admin_aramex_replaced" : "admin_aramex_created",
    timestamp,
    source: "admin_dashboard",
    note: recreated
      ? `Admin created a replacement Aramex shipment. Previous tracking needs portal cancel/check: ${previousTrackingNumber}.`
      : "Admin created Aramex shipment from saved order data.",
  };

  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...order,
      source: recreated ? "admin_aramex_replaced" : "admin_aramex_created",
      order_ref: orderRef,
      status: "shipped",
      aramex: {
        ...existingAramex,
        previousTrackingNumbers,
        previousTrackingNumber: previousTrackingNumber || undefined,
        oldTrackingCancelRequired: recreated,
        oldTrackingCancelNote: recreated
          ? "Replacement shipment was created. Confirm/cancel the previous tracking in Aramex portal because this integration cannot verify shipment cancellation."
          : "",
        trackingNumber: shipmentData.trackingNumber,
        trackingLink: shipmentData.trackingLink,
        provider: shipmentData.provider,
        labelUrl: shipmentData.labelUrl,
        guid: shipmentData.guid,
        error: "",
        status: "Record created",
        adminCreatedAt: timestamp,
        recreated,
        needsReplacement: false,
        replacementRequired: false,
        replacementResolvedAt: timestamp,
        replacementReason: "",
        replacementRequiredFields: [],
      },
      admin_audit: [...getArray(order.admin_audit), auditEntry],
      updated_at: timestamp,
    }),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Aramex created, but failed to update order log", details: logData },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    recreated,
    order_ref: orderRef,
    trackingNumber: shipmentData.trackingNumber,
    previousTrackingNumber,
    labelUrl: shipmentData.labelUrl,
    guid: shipmentData.guid,
  });
}
