import { NextResponse } from "next/server";
import { listOrdersFromDatabase, upsertOrderToDatabase } from "@/lib/order-database";
import { isOrderVerificationEnabled, sendOrderVerificationWhatsApp } from "@/lib/order-verification";

function authorized(request: Request) {
  const url = new URL(request.url);
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const token = bearer || request.headers.get("x-cron-secret") || url.searchParams.get("token") || "";
  return Boolean(process.env.CRON_SECRET && token === process.env.CRON_SECRET);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOrderVerificationEnabled()) return NextResponse.json({ success: true, skipped: "disabled" });

  const now = Date.now();
  const orders = await listOrdersFromDatabase(1000);
  let reminded = 0;
  let cancelled = 0;

  for (const order of orders) {
    if (String(order.status || "").toLowerCase() !== "pending_verification") continue;
    const createdAt = Date.parse(String(order.verification_requested_at || order.created_at || ""));
    if (!Number.isFinite(createdAt)) continue;
    const ageHours = (now - createdAt) / 3_600_000;

    if (ageHours >= 24) {
      await fetch(`${new URL(request.url).origin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          source: String(order.source || "checkout"),
          status: "cancelled",
          verification_status: "auto_cancelled",
          auto_cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      });
      cancelled += 1;
      continue;
    }

    if (ageHours >= 12 && !order.verification_reminder_sent_at) {
      const result = await sendOrderVerificationWhatsApp(order, { reminder: true });
      await upsertOrderToDatabase({
        ...order,
        verification_reminder_sent_at: result.success ? new Date().toISOString() : "",
        verification_reminder_error: result.success ? "" : result.error,
        updated_at: new Date().toISOString(),
      });
      if (result.success) reminded += 1;
    }
  }

  return NextResponse.json({ success: true, reminded, cancelled });
}

