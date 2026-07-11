import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

type SheetsListResponse = {
  success?: boolean;
  orders?: unknown[];
  total?: number;
  returned?: number;
  error?: string;
  message?: string;
  details?: unknown;
};

function getSafeDetails(value: unknown) {
  if (typeof value !== "string") return value;
  return value.length > 700 ? `${value.slice(0, 700)}...` : value;
}

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
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

  let res: Response;

  try {
    res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not connect to Google Sheets webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

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
        error: data?.error || data?.message || "Could not fetch orders from Google Sheets",
        details: {
          status: res.status,
          statusText: res.statusText,
          response: data || getSafeDetails(text),
        },
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
