import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  status?: string;
  payment_status?: string;
  aramex?: Record<string, unknown>;
  admin_audit?: unknown[];
};

type StatusBody = {
  orderRef?: string;
  status?: string;
  paymentStatus?: string;
  action?: string;
  note?: string;
  aramexStatus?: string;
  aramexError?: string;
};

function getArray(value: unknown) {
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
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as StatusBody;
  const orderRef = String(body.orderRef || "").trim();
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const existing = await fetchOrder(orderRef);
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const timestamp = new Date().toISOString();
  const auditEntry = {
    action: body.action || "status_update",
    status: body.status || existing.status || "",
    payment_status: body.paymentStatus || existing.payment_status || "",
    note: body.note || "",
    timestamp,
    source: "admin_dashboard",
  };

  const existingAramex =
    existing.aramex && typeof existing.aramex === "object" && !Array.isArray(existing.aramex)
      ? existing.aramex
      : {};

  const aramexPatch =
    body.aramexStatus || body.aramexError
      ? {
          aramex: {
            ...existingAramex,
            ...(body.aramexStatus ? { status: body.aramexStatus, latestDescription: body.note || body.aramexStatus } : {}),
            ...(body.aramexError !== undefined ? { error: body.aramexError } : {}),
            adminUpdatedAt: timestamp,
          },
        }
      : {};

  const appOrigin = getAppOrigin(req);
  const logRes = await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...existing,
      ...aramexPatch,
      source: "admin_status_update",
      order_ref: orderRef,
      status: body.status || existing.status || "confirmed",
      payment_status: body.paymentStatus || existing.payment_status || "",
      admin_audit: [...getArray(existing.admin_audit), auditEntry],
      updated_at: timestamp,
    }),
    cache: "no-store",
  });

  const logData = await logRes.json().catch(() => null);
  if (!logRes.ok) {
    return NextResponse.json(
      { error: "Failed to update order status", data: logData },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    audit: auditEntry,
  });
}
