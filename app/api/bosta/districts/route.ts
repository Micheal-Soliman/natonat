import { NextResponse } from "next/server";
import { fetchBostaCities, fetchBostaDistricts, getLocalBostaLocations } from "@/lib/bosta";

export async function GET(req: Request) {
  try {
    const lite = new URL(req.url).searchParams.get("lite") === "1";
    const localLocations = getLocalBostaLocations();
    const localDistricts = Array.isArray(localLocations.districts) ? localLocations.districts : [];

    if (localDistricts.length > 0) {
      const districts = localDistricts.map((district) => ({
        districtId: district.districtId,
        districtName: district.districtName,
        districtOtherName: district.districtOtherName,
        zoneId: district.zoneId,
        zoneName: district.zoneName,
        zoneOtherName: district.zoneOtherName,
        cityId: district.cityId,
        governorate: district.governorate,
        governorateAr: district.governorateAr,
        bostaCityName: district.bostaCityName,
        bostaCityOtherName: district.bostaCityOtherName,
        aliases: district.aliases,
      }));

      const payload = {
        success: true,
        source: "local_bosta_snapshot",
        ...(lite ? {} : { generatedAt: localLocations.generatedAt, countryId: localLocations.countryId }),
        districts,
        cities: [],
        governorates: localLocations.governorates || [],
        ...(lite
          ? {}
          : {
              names: Array.from(
                new Set(
                  districts
                    .flatMap((district) => [
                      district.districtOtherName,
                      district.districtName,
                      district.zoneOtherName,
                      district.zoneName,
                      district.governorateAr,
                      district.governorate,
                      district.bostaCityOtherName,
                      district.bostaCityName,
                      ...(Array.isArray(district.aliases) ? district.aliases : []),
                    ])
                    .filter((value): value is string => Boolean(value && value.trim())),
                ),
              ).sort((a, b) => a.localeCompare(b, "ar")),
            }),
      };

      return NextResponse.json(
        payload,
        {
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        },
      );
    }

    const [districts, cities] = await Promise.all([
      fetchBostaDistricts().catch(() => []),
      fetchBostaCities().catch(() => []),
    ]);
    const governorates = Array.from(
      new Map(
        [
          ...districts.map((district) => ({
            value: district.governorate || district.cityName || district.city || district.cityOtherName || "",
            en: district.governorate || district.cityName || district.city || "",
            ar: district.governorateAr || district.cityOtherName || district.cityName || district.city || "",
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

    const payload = {
      success: true,
      districts,
      cities,
      governorates,
      ...(lite
        ? {}
        : {
            names: Array.from(
              new Set(
                [
                  ...districts.flatMap((district) => [
                    district.districtOtherName,
                    district.districtName,
                    district.zoneOtherName,
                    district.zoneName,
                    district.governorateAr,
                    district.governorate,
                    district.cityName,
                    district.city,
                    district.bostaCityOtherName,
                    district.bostaCityName,
                  ]),
                  ...cities.flatMap((city) => [city.nameAr, city.name, city.alias]),
                ].filter((value): value is string => Boolean(value && value.trim())),
              ),
            ).sort((a, b) => a.localeCompare(b, "ar")),
          }),
    };

    return NextResponse.json(payload);
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
