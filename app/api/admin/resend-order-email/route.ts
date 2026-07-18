import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { sendCustomerConfirmationEmail, sendOrderEmail } from "@/lib/email";
import {
  fetchOrderFromDatabaseIncludingDeleted,
  isDeletedOrderRecord,
} from "@/lib/order-database";

type OrderRecord = Record<string, unknown>;

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchOrder(orderRef: string) {
  const databaseOrder = await fetchOrderFromDatabaseIncludingDeleted(orderRef);
  if (isDeletedOrderRecord(databaseOrder)) return null;
  if (databaseOrder) return databaseOrder as OrderRecord;

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);
  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => null) as { success?: boolean; order?: unknown } | null;

  return res.ok && data?.success && data.order && typeof data.order === "object"
    ? data.order as OrderRecord
    : null;
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { orderRef?: string };
  const orderRef = getString(body.orderRef);
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const order = await fetchOrder(orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [adminResult, customerResult] = await Promise.allSettled([
    sendOrderEmail(order),
    sendCustomerConfirmationEmail(order),
  ]);
  const adminOk = adminResult.status === "fulfilled" && Boolean(adminResult.value.success);
  const customerOk = customerResult.status === "fulfilled" && Boolean(customerResult.value.success);
  const timestamp = new Date().toISOString();
  const appOrigin = getAppOrigin(req);

  await fetch(`${appOrigin}/api/orders/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: adminOk && customerOk ? "email_notification" : "email_notification_failed",
      order_ref: orderRef,
      email_sent_at: adminOk && customerOk ? timestamp : undefined,
      email_error: adminOk && customerOk
        ? ""
        : {
            admin: adminResult.status === "rejected" ? String(adminResult.reason) : adminResult.value.error || "",
            customer: customerResult.status === "rejected" ? String(customerResult.reason) : customerResult.value.error || "",
          },
      updated_at: timestamp,
    }),
    cache: "no-store",
  }).catch((error) => {
    console.error("Failed to store resend email result", { order_ref: orderRef, error });
  });

  return NextResponse.json({
    success: adminOk && customerOk,
    order_ref: orderRef,
    adminEmail: adminOk,
    customerEmail: customerOk,
  });
}
