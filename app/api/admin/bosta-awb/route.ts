import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { createBostaAwb } from "@/lib/bosta";

type AwbRequest = {
  trackingNumbers?: string[] | string;
  ids?: string[] | string;
  requestedAwbType?: "A4" | "A6";
  lang?: "ar" | "en";
};

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({})) as AwbRequest;
    const result = await createBostaAwb({
      trackingNumbers: toStringArray(body.trackingNumbers),
      ids: toStringArray(body.ids),
      requestedAwbType: body.requestedAwbType === "A6" ? "A6" : "A4",
      lang: body.lang === "en" ? "en" : "ar",
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        provider: "bosta",
        error: error instanceof Error ? error.message : "Failed to print Bosta AWB",
      },
      { status: 500 },
    );
  }
}
