import { NextResponse } from "next/server";
import { fetchBostaCityDistricts } from "@/lib/bosta";

type RouteContext = {
  params: Promise<{ cityId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { cityId } = await context.params;
    const districts = await fetchBostaCityDistricts(cityId);
    return NextResponse.json({
      success: true,
      districts,
      names: Array.from(
        new Set(
          districts
            .flatMap((district) => [
              district.districtOtherName,
              district.districtName,
              district.zoneOtherName,
              district.zoneName,
            ])
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load Bosta city districts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
