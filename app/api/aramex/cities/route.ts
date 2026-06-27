import { NextResponse } from "next/server";
import { fetchCities } from "@/lib/aramex";
import { EG_ARAMEX_CITIES } from "@/lib/aramex-cities-eg";

type CitiesResponse = {
  Cities?: string[];
};

function normalizeCities(cities: unknown[]) {
  return Array.from(
    new Map(
      cities
        .filter((city): city is string => typeof city === "string" && city.trim().length > 0)
        .map((city) => [city.trim().toLowerCase(), city.trim()])
    ).values()
  ).sort((a, b) => a.localeCompare(b));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") || "EG";
  const localCities = countryCode.toUpperCase() === "EG" ? [...EG_ARAMEX_CITIES] : [];

  try {
    const data = (await fetchCities(countryCode)) as CitiesResponse;
    return NextResponse.json(normalizeCities([...(data.Cities || []), ...localCities]));
  } catch (error) {
    console.error("[Aramex Cities API] Error:", error);
    if (localCities.length > 0) {
      return NextResponse.json(normalizeCities(localCities));
    }

    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
