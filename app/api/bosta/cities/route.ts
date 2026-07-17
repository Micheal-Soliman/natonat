import { NextResponse } from "next/server";
import { fetchBostaCities } from "@/lib/bosta";

export async function GET() {
  try {
    const cities = await fetchBostaCities();
    const names = Array.from(
      new Set(
        cities
          .flatMap((city) => [city.nameAr, city.name, city.alias])
          .filter((value): value is string => Boolean(value && value.trim())),
      ),
    ).sort((a, b) => a.localeCompare(b, "ar"));

    return NextResponse.json({
      success: true,
      cities,
      names,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load Bosta cities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
