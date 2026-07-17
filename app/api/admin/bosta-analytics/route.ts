import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { getBostaDeliveryAnalytics } from "@/lib/bosta";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getBostaDeliveryAnalytics();
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not fetch Bosta analytics", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
