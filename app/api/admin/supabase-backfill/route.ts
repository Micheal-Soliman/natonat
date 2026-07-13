import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  isOrderDatabaseConfigured,
  normalizeOrderForDatabase,
  upsertOrderToDatabase,
} from "@/lib/order-database";

type SheetsListResponse = {
  success?: boolean;
  orders?: unknown[];
  total?: number;
  returned?: number;
  error?: string;
  message?: string;
  details?: unknown;
};

type BackfillBody = {
  commit?: boolean;
  limit?: number;
};

function getSafeDetails(value: unknown) {
  if (typeof value !== "string") return value;
  return value.length > 700 ? `${value.slice(0, 700)}...` : value;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function fetchSheetOrders(limit: number) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("GOOGLE_SHEETS_WEBHOOK_URL is not configured");
  }

  const url = new URL(webhookUrl);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();
  let data: SheetsListResponse | null = null;

  try {
    data = JSON.parse(text) as SheetsListResponse;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.success || !Array.isArray(data.orders)) {
    throw new Error(
      JSON.stringify({
        error: data?.error || data?.message || "Could not fetch orders from Google Sheets",
        details: {
          status: res.status,
          statusText: res.statusText,
          response: data || getSafeDetails(text),
        },
      }),
    );
  }

  return data.orders;
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOrderDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  let body: BackfillBody = {};
  try {
    body = (await req.json()) as BackfillBody;
  } catch {
    body = {};
  }

  const commit = body.commit === true;
  const limit = Math.max(1, Math.min(Number(body.limit) || 2000, 5000));

  let sheetOrders: unknown[] = [];

  try {
    sheetOrders = await fetchSheetOrders(limit);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load Google Sheets orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const candidates = sheetOrders
    .map((order) => ({
      original: getObject(order),
      normalized: normalizeOrderForDatabase(getObject(order)),
    }))
    .filter((entry) => entry.normalized?.order_ref);

  const uniqueByRef = new Map<string, Record<string, unknown>>();
  for (const entry of candidates) {
    const orderRef = entry.normalized?.order_ref;
    if (!orderRef) continue;
    uniqueByRef.set(orderRef, entry.original);
  }

  if (!commit) {
    return NextResponse.json({
      success: true,
      mode: "preview",
      note: "No Supabase rows were changed. Send { commit: true } to write.",
      sheet_rows: sheetOrders.length,
      valid_orders: candidates.length,
      unique_orders: uniqueByRef.size,
      skipped_rows: sheetOrders.length - candidates.length,
      sample_refs: [...uniqueByRef.keys()].slice(0, 10),
    });
  }

  const failures: Array<{ order_ref?: string; error: string }> = [];
  let insertedOrUpdated = 0;

  for (const [orderRef, order] of uniqueByRef) {
    try {
      await upsertOrderToDatabase(order);
      insertedOrUpdated += 1;
    } catch (error) {
      failures.push({
        order_ref: orderRef,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    mode: "commit",
    sheet_rows: sheetOrders.length,
    valid_orders: candidates.length,
    unique_orders: uniqueByRef.size,
    inserted_or_updated: insertedOrUpdated,
    failed: failures.length,
    failures: failures.slice(0, 25),
  });
}
