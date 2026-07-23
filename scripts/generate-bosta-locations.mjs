import fs from "node:fs/promises";
import path from "node:path";

const COUNTRY_ID = "60e4482c7cb7d4bc4849c4d5";
const SOURCE_URL = `https://app.bosta.co/api/v2/cities/getAllDistricts?countryId=${COUNTRY_ID}`;
const OUTPUT_PATH = path.join(process.cwd(), "data", "bosta-locations.json");

const GOVERNORATE_CORRECTIONS = [
  {
    governorate: "Giza",
    governorateAr: "الجيزة",
    cityNames: ["cairo"],
    zoneNames: ["agouza"],
  },
];

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value) {
  return getText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(value, candidates) {
  const normalized = normalize(value);
  return candidates.some((candidate) => normalized === normalize(candidate));
}

function getDisplayGovernorate(city, district) {
  const correction = GOVERNORATE_CORRECTIONS.find((rule) => {
    const cityMatches = !rule.cityNames?.length || matchesAny(city.cityName, rule.cityNames);
    const zoneMatches = !rule.zoneNames?.length || matchesAny(district.zoneName, rule.zoneNames);
    const districtMatches = !rule.districtNames?.length || matchesAny(district.districtName, rule.districtNames);
    return cityMatches && zoneMatches && districtMatches;
  });

  return {
    governorate: correction?.governorate || getText(city.cityName) || getText(city.cityOtherName),
    governorateAr: correction?.governorateAr || getText(city.cityOtherName) || getText(city.cityName),
  };
}

function uniqueBy(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return [...map.values()];
}

const response = await fetch(SOURCE_URL, {
  headers: { Accept: "application/json" },
});

if (!response.ok) {
  throw new Error(`Bosta locations fetch failed: ${response.status} ${await response.text()}`);
}

const payload = await response.json();
const cities = Array.isArray(payload.data) ? payload.data : [];
const districts = cities.flatMap((city) => {
  const cityDistricts = Array.isArray(city.districts) ? city.districts : [];

  return cityDistricts
    .map((district) => {
      const display = getDisplayGovernorate(city, district);
      const districtId = getText(district.districtId || district["districtI\""]);
      const districtName = getText(district.districtName);
      const districtOtherName = getText(district.districtOtherName);
      const zoneName = getText(district.zoneName);
      const zoneOtherName = getText(district.zoneOtherName);
      const name = districtOtherName || districtName || zoneOtherName || zoneName;

      return {
        name,
        governorate: display.governorate,
        governorateAr: display.governorateAr,
        districtId,
        districtName: districtName || name,
        districtOtherName,
        cityId: getText(city.cityId),
        bostaCityName: getText(city.cityName),
        bostaCityOtherName: getText(city.cityOtherName),
        bostaCityCode: getText(city.cityCode),
        zoneId: getText(district.zoneId),
        zoneName,
        zoneOtherName,
        pickupAvailability: district.pickupAvailability === true,
        dropOffAvailability: district.dropOffAvailability === true,
        aliases: uniqueBy(
          [
            districtName,
            districtOtherName,
            zoneName,
            zoneOtherName,
            display.governorate,
            display.governorateAr,
            getText(city.cityName),
            getText(city.cityOtherName),
          ].filter(Boolean),
          normalize,
        ),
      };
    })
    .filter((district) => district.name && district.districtId && district.dropOffAvailability);
});

const governorates = uniqueBy(
  districts.map((district) => ({
    value: district.governorate,
    en: district.governorate,
    ar: district.governorateAr || district.governorate,
    cityId: district.cityId,
  })),
  (governorate) => normalize(governorate.value),
).sort((a, b) => a.en.localeCompare(b.en, "en"));

const output = {
  generatedAt: new Date().toISOString(),
  source: SOURCE_URL,
  countryId: COUNTRY_ID,
  governorates,
  districts: districts.sort((a, b) =>
    `${a.governorate} ${a.name}`.localeCompare(`${b.governorate} ${b.name}`, "ar"),
  ),
};

await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Wrote ${output.districts.length} districts and ${output.governorates.length} governorates to ${OUTPUT_PATH}`);
