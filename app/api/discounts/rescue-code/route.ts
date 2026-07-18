import { NextResponse } from "next/server";

import { generateConversionRescueCode } from "@/lib/conversion-rescue-code";
import { getSiteSettings } from "@/lib/sanity-site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const RESCUE_CODE_COOKIE = "natonat_rescue_code";

export async function POST() {
  const settings = await getSiteSettings();
  const rescue = settings.conversionRescue;

  if (!rescue.enabled || rescue.discountPercent <= 0) {
    return NextResponse.json(
      { error: "Conversion rescue discount is not enabled" },
      { status: 404 },
    );
  }

  const generated = generateConversionRescueCode({
    percent: rescue.discountPercent,
    prefix: rescue.codePrefix,
    validityHours: rescue.codeValidityHours,
  });

  if (!generated) {
    return NextResponse.json(
      { error: "RESCUE_DISCOUNT_SECRET is required" },
      { status: 503 },
    );
  }

  const response = NextResponse.json({
    success: true,
    code: generated.code,
    percent: generated.percent,
    expiresAt: generated.expiresAt,
    label: rescue.discountLabel || `${generated.percent}% OFF`,
  });

  response.cookies.set(RESCUE_CODE_COOKIE, generated.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor((generated.expiresAt - Date.now()) / 1000)),
  });

  return response;
}
