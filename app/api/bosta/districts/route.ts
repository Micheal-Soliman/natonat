import { NextResponse } from "next/server";
import { fetchBostaCities, fetchBostaDistricts } from "@/lib/bosta";

export async function GET() {
  try {
    const [districts, cities] = await Promise.all([
      fetchBostaDistricts().catch(() => []),
      fetchBostaCities().catch(() => []),
    ]);
    return NextResponse.json({
      success: true,
      districts,
      cities,
      names: Array.from(
        new Set(
          [
            ...districts.flatMap((district) => [
              district.districtOtherName,
              district.districtName,
              district.zoneOtherName,
              district.zoneName,
              district.cityName,
              district.city,
            ]),
            ...cities.flatMap((city) => [city.nameAr, city.name, city.alias]),
          ]
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load Bosta districts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
