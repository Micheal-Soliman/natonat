import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/sanity-site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getSiteSettings("fresh");
  return NextResponse.json(settings);
}
