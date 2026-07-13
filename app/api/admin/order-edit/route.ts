import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Dashboard-only order edits are disabled",
      details:
        "Editing customer data, totals, items, or payment data after shipment creation cannot be guaranteed to update Aramex. Use Aramex portal cancellation/recreation for shipment changes, then refresh/create the shipment from the dashboard only when there is no active tracking number.",
    },
    { status: 410 },
  );
}
