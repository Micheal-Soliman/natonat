import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { fetchOrderFromDatabase } from "@/lib/order-database";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  customer?: Record<string, unknown>;
  bosta?: Record<string, unknown>;
  shipment?: Record<string, unknown>;
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
        title: getString(row.title),
        slug: getString(row.slug),
        type: getString(row.type),
        size: getString(row.size || row.selectedSize || row.variantSize),
        color: getString(row.color || row.selectedColor || row.variant),
        variant: getString(row.variant),
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
      { error: "Bosta shipment can only be created for delivery orders" },
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
  const existingBosta = getObject(order.bosta || order.shipment || order.aramex);
  const previousTrackingNumber = getString(
    existingBosta.trackingNumber ||
      order["Bosta Tracking Number"] ||
      order["Aramex Tracking Number"],
  );
  const recreated = Boolean(previousTrackingNumber);

  if (recreated) {
    return NextResponse.json(
      {
        error: "Existing Bosta shipment already exists",
        details:
          "Terminate the old Bosta tracking from the dashboard before creating a replacement to avoid duplicate active shipments.",
        previousTrackingNumber,
      },
      { status: 409 },
    );
  }

  const shipmentRes = await fetch(`${appOrigin}/api/bosta/shipment`, {
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
        error: "Bosta shipment creation failed",
        details: shipmentData?.details || shipmentData?.error || "Unknown Bosta error",
      },
      { status: 502 },
    );
  }

  const timestamp = new Date().toISOString();
  const previousTrackingNumbers = [
    ...getArray(existingBosta.previousTrackingNumbers),
    ...(previousTrackingNumber ? [previousTrackingNumber] : []),
  ];
  const auditEntry = {
    action: recreated ? "admin_bosta_replaced" : "admin_bosta_created",
    timestamp,
    source: "admin_dashboard",
    note: recreated
      ? `Admin created a replacement Bosta shipment after old tracking handling: ${previousTrackingNumber}.`
      : "Admin created Bosta shipment from saved order data.",
  };

  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...order,
      source: recreated ? "admin_bosta_replaced" : "admin_bosta_created",
      order_ref: orderRef,
      status: "shipped",
      bosta: {
        ...existingBosta,
        previousTrackingNumbers,
        previousTrackingNumber: previousTrackingNumber || undefined,
        oldTrackingCancelRequired: recreated,
        oldTrackingCancelNote: recreated
          ? "Replacement shipment was created after old Bosta tracking handling. Refresh status to keep tracking data current."
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
      shipment: {
        provider: "bosta",
        trackingNumber: shipmentData.trackingNumber,
        trackingLink: shipmentData.trackingLink,
      },
      admin_audit: [...getArray(order.admin_audit), auditEntry],
      updated_at: timestamp,
    }),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Bosta shipment created, but failed to update order log", details: logData },
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
