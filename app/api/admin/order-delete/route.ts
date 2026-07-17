import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { isOrderDatabaseConfigured, markOrderDeletedInDatabase } from "@/lib/order-database";

type DeleteBody = {
  orderRef?: string;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

async function deleteOrderFromSheets(orderRef: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return { skipped: true, reason: "not_configured" };

  const token = process.env.GOOGLE_SHEETS_ADMIN_TOKEN || process.env.ORDER_DELETE_TOKEN || "";
  if (!token) {
    return { skipped: true, reason: "missing_GOOGLE_SHEETS_ADMIN_TOKEN" };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "delete_order",
      order_ref: orderRef,
      delete_token: token,
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null) as Record<string, unknown> | null;
  if (!res.ok || data?.success === false) {
    throw new Error(getString(data?.error) || `Google Sheets delete failed (${res.status})`);
  }

  return {
    skipped: false,
    data,
  };
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as DeleteBody;
  const orderRef = getString(body.orderRef);

  if (!orderRef) {
    return NextResponse.json({ error: "Missing orderRef" }, { status: 400 });
  }

  let databaseDeleted = false;
  let databaseError = "";
  if (isOrderDatabaseConfigured()) {
    try {
      await markOrderDeletedInDatabase(orderRef);
      databaseDeleted = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error);
    }
  }

  let sheetsDeleted = false;
  let sheetsResult: unknown = null;
  let sheetsError = "";
  try {
    const result = await deleteOrderFromSheets(orderRef);
    sheetsResult = result;
    sheetsDeleted = !result.skipped;
  } catch (error) {
    sheetsError = error instanceof Error ? error.message : String(error);
  }

  if (!databaseDeleted && !sheetsDeleted) {
    return NextResponse.json(
      {
        error: "Order was not deleted from any storage",
        database: databaseError || (isOrderDatabaseConfigured() ? "failed" : "not_configured"),
        google_sheets: sheetsError || sheetsResult || "not_configured",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    order_ref: orderRef,
    storage: {
      supabase: databaseDeleted ? "deleted_marker_saved" : isOrderDatabaseConfigured() ? "failed" : "not_configured",
      google_sheets: sheetsDeleted ? "deleted" : sheetsError || "not_configured_or_missing_token",
    },
    details: {
      sheets: sheetsResult,
      database_error: databaseError || undefined,
      sheets_error: sheetsError || undefined,
    },
  });
}
