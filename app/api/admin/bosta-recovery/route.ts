import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { createBostaDelivery } from "@/lib/bosta";
import {
  isDeletedOrderRecord,
  normalizeOrderForDatabase,
  upsertOrderToDatabase,
} from "@/lib/order-database";

type OrderRecord = Record<string, unknown>;
type RecoveryBody = {
  commit?: boolean;
  limit?: number;
  orderRefs?: string[];
};

function getObject(value: unknown): OrderRecord {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      return getObject(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as OrderRecord
    : {};
}

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function getNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^\d.-]/g, ""))
        : 0;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function getOrderRef(order: OrderRecord) {
  return getString(order.order_ref, order["Order Ref"]);
}

function getShipment(order: OrderRecord) {
  return getObject(order.bosta || order.shipment || order.aramex);
}

function getTrackingNumber(order: OrderRecord) {
  const shipment = getShipment(order);
  return getString(
    shipment.trackingNumber,
    order["Bosta Tracking Number"],
    order["Aramex Tracking Number"],
  );
}

function getCustomer(order: OrderRecord) {
  return getObject(order.customer || order["Customer (Full JSON)"]);
}

function getItems(order: OrderRecord) {
  return getArray(order.items || order["Items (Full JSON)"] || order.Items)
    .map((value) => {
      const item = getObject(value);
      return {
        name: getString(item.name, item.productName, item.title, item.slug, "Order item"),
        title: getString(item.title),
        slug: getString(item.slug),
        type: getString(item.type),
        size: getString(item.size, item.selectedSize, item.variantSize),
        color: getString(item.color, item.selectedColor, item.variant),
        quantity: getNumber(item.quantity, item.qty) || 1,
        bundleSelections: getArray(item.bundleSelections || item.bundle_selections)
          .map((selection) => {
            const row = getObject(selection);
            return {
              name: getString(row.productName, row.name, row.title, row.slug, "Bundle item"),
              title: getString(row.title),
              slug: getString(row.productSlug, row.slug),
              type: getString(row.productType, row.type),
              size: getString(row.size),
              color: getString(row.color),
              quantity: getNumber(row.quantity, row.qty) || 1,
            };
          }),
      };
    })
    .filter((item) => item.name);
}

function getTotal(order: OrderRecord) {
  const extras = getObject(order.extras || order["Extras (Full JSON)"]);
  return getNumber(
    order.amount_egp,
    order["Total (EGP)"],
    getNumber(order.amount_cents, order["Total Cents"]) / 100,
    extras.subtotal_egp,
    order["Subtotal (EGP)"],
  );
}

function evaluateOrder(order: OrderRecord) {
  const orderRef = getOrderRef(order);
  const extras = getObject(order.extras || order["Extras (Full JSON)"]);
  const status = getString(order.status, order.Status).toLowerCase();
  const paymentStatus = getString(order.payment_status, order["Payment Status"]).toLowerCase();
  const paymentMethod = getString(order.payment_method, order["Payment Method"]).toLowerCase();
  const deliveryMethod = getString(
    order.delivery_method,
    order["Delivery Method"],
    extras.delivery_method,
  ).toLowerCase();
  const customer = getCustomer(order);
  const items = getItems(order);
  const total = getTotal(order);

  let reason = "eligible";
  if (!orderRef || !orderRef.startsWith("NAT-")) reason = "not_storefront_order";
  else if (isDeletedOrderRecord(order)) reason = "deleted";
  else if (getTrackingNumber(order)) reason = "already_has_tracking";
  else if (deliveryMethod !== "delivery") reason = "not_delivery";
  else if (["delivered", "cancelled", "canceled", "returned", "deleted"].includes(status)) reason = "terminal_status";
  else if (["created", "pending", "pending_verification", "pending_instapay_approval"].includes(status)) reason = "not_confirmed";
  else if (paymentStatus.includes("pending") || paymentStatus.includes("failed")) reason = "payment_not_confirmed";
  else if (paymentMethod.includes("paymob") && paymentStatus !== "paid") reason = "card_not_paid";
  else if (paymentMethod.includes("instapay") && paymentStatus !== "paid") reason = "instapay_not_approved";
  else if (!customer.phone || !customer.address || !customer.city) reason = "missing_customer_delivery_data";
  else if (!items.length) reason = "missing_items";
  else if (!total) reason = "missing_total";

  return { orderRef, reason, customer, items, total, paymentMethod };
}

async function fetchSheetOrders(limit: number) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("GOOGLE_SHEETS_WEBHOOK_URL is not configured");
  const url = new URL(webhookUrl);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => null) as { success?: boolean; orders?: unknown[]; error?: string } | null;
  if (!response.ok || !data?.success || !Array.isArray(data.orders)) {
    throw new Error(data?.error || `Google Sheets list failed (${response.status})`);
  }
  return data.orders.map(getObject);
}

async function mirrorToSheets(order: OrderRecord) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null) as { success?: boolean; skipped?: boolean; error?: string } | null;
  if (!response.ok || data?.success === false || data?.skipped === true) {
    throw new Error(data?.error || `Google Sheets update failed (${response.status})`);
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as RecoveryBody;
  const commit = body.commit === true;
  const limit = Math.max(1, Math.min(Number(body.limit) || 3000, 5000));
  const requestedRefs = new Set((body.orderRefs || []).map(String).filter(Boolean));

  let sheetOrders: OrderRecord[];
  try {
    sheetOrders = await fetchSheetOrders(limit);
  } catch (error) {
    return NextResponse.json({
      error: "Could not load recovery source",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }

  const uniqueOrders = new Map<string, OrderRecord>();
  for (const order of sheetOrders) {
    const orderRef = getOrderRef(order);
    if (orderRef) uniqueOrders.set(orderRef, order);
  }

  const selectedOrders = [...uniqueOrders.values()]
    .filter((order) => !requestedRefs.size || requestedRefs.has(getOrderRef(order)));
  const evaluations = selectedOrders.map((order) => ({ order, ...evaluateOrder(order) }));
  const eligible = evaluations.filter((entry) => entry.reason === "eligible");
  const reasonCounts = evaluations.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.reason] = (counts[entry.reason] || 0) + 1;
    return counts;
  }, {});

  if (!commit) {
    return NextResponse.json({
      success: true,
      mode: "preview",
      note: "No database rows or Bosta shipments were changed.",
      sheet_rows: sheetOrders.length,
      unique_orders: uniqueOrders.size,
      selected_orders: selectedOrders.length,
      eligible_shipments: eligible.length,
      reason_counts: reasonCounts,
      eligible_refs: eligible.map((entry) => entry.orderRef),
    });
  }

  if (!requestedRefs.size) {
    return NextResponse.json({
      error: "Recovery commit requires explicit orderRefs",
      details: "Run preview first, then commit only the reviewed missing orders.",
    }, { status: 400 });
  }

  const results: Array<{ order_ref: string; status: string; tracking_number?: string; error?: string }> = [];
  let databaseBackfilled = 0;
  for (const order of selectedOrders) {
    try {
      if (normalizeOrderForDatabase(order)) {
        await upsertOrderToDatabase(order);
        databaseBackfilled += 1;
      }
    } catch (error) {
      results.push({
        order_ref: getOrderRef(order),
        status: "database_backfill_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const entry of eligible) {
    try {
      const isCod = entry.paymentMethod.includes("cod") || entry.paymentMethod.includes("cash");
      const shipment = await createBostaDelivery({
        orderRef: entry.orderRef,
        customer: entry.customer,
        items: entry.items,
        totalValue: entry.total,
        cod: isCod,
        codAmount: isCod ? entry.total : 0,
      });
      if (!shipment.success || !shipment.trackingNumber) {
        results.push({
          order_ref: entry.orderRef,
          status: "bosta_failed",
          error: shipment.error || "Bosta did not return a tracking number",
        });
        continue;
      }

      const timestamp = new Date().toISOString();
      const previousShipment = getShipment(entry.order);
      const recoveredOrder: OrderRecord = {
        ...entry.order,
        source: getString(entry.order.source, entry.order.original_source, "checkout"),
        original_source: getString(entry.order.original_source, entry.order.source, "checkout"),
        last_update_source: "admin_bosta_recovery",
        status: "shipped",
        bosta: {
          ...previousShipment,
          provider: "bosta",
          trackingNumber: shipment.trackingNumber,
          trackingLink: shipment.trackingLink,
          labelUrl: shipment.labelUrl,
          guid: shipment.guid,
          status: "Record created",
          error: "",
          recoveredAt: timestamp,
        },
        shipment: {
          ...previousShipment,
          provider: "bosta",
          trackingNumber: shipment.trackingNumber,
          trackingLink: shipment.trackingLink,
          labelUrl: shipment.labelUrl,
          guid: shipment.guid,
          status: "Record created",
          error: "",
          recoveredAt: timestamp,
        },
        history: [
          ...getArray(entry.order.history),
          {
            status: "shipped",
            timestamp,
            source: "admin_bosta_recovery",
            event_key: `admin_bosta_recovery:${shipment.trackingNumber}`,
          },
        ],
        updated_at: timestamp,
      };

      await upsertOrderToDatabase(recoveredOrder);
      await mirrorToSheets(recoveredOrder);
      results.push({
        order_ref: entry.orderRef,
        status: "recovered",
        tracking_number: shipment.trackingNumber,
      });
    } catch (error) {
      results.push({
        order_ref: entry.orderRef,
        status: "recovery_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const recovered = results.filter((result) => result.status === "recovered").length;
  const failed = results.filter((result) => result.status.endsWith("failed")).length;
  return NextResponse.json({
    success: failed === 0,
    mode: "commit",
    database_backfilled: databaseBackfilled,
    eligible_shipments: eligible.length,
    recovered_shipments: recovered,
    failed,
    reason_counts: reasonCounts,
    results,
  }, { status: failed ? 207 : 200 });
}
