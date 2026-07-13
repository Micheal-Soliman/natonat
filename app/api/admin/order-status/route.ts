import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Dashboard-only order status updates are disabled",
      details:
        "Order status must come from the real purchase flow, InstaPay approval, Aramex shipment creation, or Aramex tracking refresh. This prevents the dashboard from showing a status that did not happen in Aramex.",
    },
    { status: 410 },
  );
}
