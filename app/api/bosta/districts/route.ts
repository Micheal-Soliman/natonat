import { NextResponse } from "next/server";
import { fetchBostaCities, fetchBostaDistricts } from "@/lib/bosta";

export async function GET() {
  try {
    const [districts, cities] = await Promise.all([
      fetchBostaDistricts().catch(() => []),
      fetchBostaCities().catch(() => []),
    ]);
    const governorates = Array.from(
      new Map(
        [
          ...districts.map((district) => ({
            value: district.cityName || district.city || district.cityOtherName || "",
            en: district.cityName || district.city || "",
            ar: district.cityOtherName || district.cityName || district.city || "",
            cityId: district.cityId || "",
          })),
          ...cities.map((city) => ({
            value: city.name || city.alias || city.nameAr || "",
            en: city.name || city.alias || "",
            ar: city.nameAr || city.name || city.alias || "",
            cityId: city._id || city.id || "",
          })),
        ]
          .filter((governorate) => governorate.value.trim())
          .map((governorate) => [governorate.value.toLowerCase(), governorate]),
      ).values(),
    ).sort((a, b) => a.en.localeCompare(b.en, "en"));

    return NextResponse.json({
      success: true,
      districts,
      cities,
      governorates,
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
