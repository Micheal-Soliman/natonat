import { NextResponse } from "next/server";

import { reconcileBostaOrders } from "@/lib/bosta-reconciliation";
import {
  isDeletedOrderRecord,
  listOrdersFromDatabase,
  upsertOrderToDatabase,
} from "@/lib/order-database";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function isCronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const url = new URL(req.url);
  const token = bearer || req.headers.get("x-cron-secret") || url.searchParams.get("token") || "";

  return token === secret;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  const orders = (await listOrdersFromDatabase(1000))
    .filter((order) => !isDeletedOrderRecord(order));
  const reconciliation = await reconcileBostaOrders(orders);
  const errors = [...reconciliation.errors];
  const stateCounts = reconciliation.updates.reduce<Record<string, number>>((counts, update) => {
    const code = String(update.bosta.latestCode || "unknown");
    counts[code] = (counts[code] || 0) + 1;
    return counts;
  }, {});
  let synced = 0;

  for (const update of reconciliation.updates) {
    try {
      await upsertOrderToDatabase({
        ...update.order,
        source: update.order.source || "checkout",
        last_update_source: "bosta_status_sync",
        order_ref: update.orderRef,
        status: update.status,
        bosta: update.bosta,
        shipment: update.bosta,
        updated_at: new Date().toISOString(),
      });
      synced += 1;
    } catch (error) {
      errors.push({
        orderRef: update.orderRef,
        error: error instanceof Error ? error.message : "Could not persist Bosta status",
      });
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    source: "cron_bosta_reconciliation",
    syncedAt: new Date().toISOString(),
    checked: reconciliation.checked,
    synced,
    failed: errors.length,
    skipped: reconciliation.missing.length,
    stateCounts,
    errors: errors.slice(0, 50),
  });
}
