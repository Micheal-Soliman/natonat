import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { syncAramexOrders } from "@/lib/admin-aramex-sync";

type TrackBody = {
  limit?: number;
  orderRefs?: string[];
};

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({} as TrackBody)) as TrackBody;
  const result = await syncAramexOrders(body);

  return NextResponse.json({
    success: true,
    ...result,
  });
}
