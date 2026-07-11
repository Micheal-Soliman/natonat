import { NextResponse } from "next/server";

import { syncAramexOrders } from "@/lib/admin-aramex-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 75);
    const result = await syncAramexOrders({ limit });

    return NextResponse.json({
      success: true,
      source: "cron_aramex_sync",
      syncedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Cron Aramex Sync] Failed", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
