import { NextResponse } from "next/server";
import { fetchCities } from "@/lib/aramex";

type CitiesResponse = {
  Cities?: string[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") || "EG";

  try {
    const data = (await fetchCities(countryCode)) as CitiesResponse;
    return NextResponse.json(data.Cities || []);
  } catch (error) {
    console.error("[Aramex Cities API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
