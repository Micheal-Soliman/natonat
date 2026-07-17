import { NextResponse } from "next/server";
import { fetchBostaCityZones } from "@/lib/bosta";

type RouteContext = {
  params: Promise<{ cityId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { cityId } = await context.params;
    const zones = await fetchBostaCityZones(cityId);
    return NextResponse.json({ success: true, zones });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load Bosta city zones",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
