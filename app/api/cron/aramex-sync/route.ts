import { NextResponse } from "next/server";

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

  return NextResponse.json({
    success: true,
    source: "cron_bosta_sync_disabled",
    syncedAt: new Date().toISOString(),
    synced: 0,
    failed: 0,
    skipped: true,
    message: "Bosta tracking updates are handled by the Bosta webhook. Legacy courier cron sync is disabled.",
  });
}
