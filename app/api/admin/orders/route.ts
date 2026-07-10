import { NextResponse } from "next/server";

type SheetsListResponse = {
  success?: boolean;
  orders?: unknown[];
  total?: number;
  returned?: number;
  error?: string;
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function isAuthorized(req: Request) {
  const configuredToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!configuredToken) {
    return process.env.NODE_ENV !== "production";
  }

  const url = new URL(req.url);
  const providedToken =
    getBearerToken(req) ||
    req.headers.get("x-admin-token") ||
    url.searchParams.get("token") ||
    "";

  return providedToken === configuredToken;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(webhookUrl);
  const requestUrl = new URL(req.url);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", requestUrl.searchParams.get("limit") || "500");

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
    return NextResponse.json(
      {
        error: data?.error || "Could not fetch orders from Google Sheets",
        details: data || text,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    orders: data.orders,
    total: data.total ?? data.orders.length,
    returned: data.returned ?? data.orders.length,
  });
}
