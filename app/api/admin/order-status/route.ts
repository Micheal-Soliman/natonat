import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

type OrderStatusBody = {
  orderRef?: string;
  status?: string;
  paymentStatus?: string;
  note?: string;
};

function getAppOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as OrderStatusBody;
  const orderRef = String(body.orderRef || "").trim();
  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const res = await fetch(`${getAppOrigin(req)}/api/admin/order-edit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({
      orderRef,
      status: body.status,
      paymentStatus: body.paymentStatus,
      note: body.note || "Admin manually changed order status.",
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data || { error: "Could not update order status" }, { status: res.status });
}
