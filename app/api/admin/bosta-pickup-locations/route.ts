import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { createDefaultBostaPickupLocation, listBostaPickupLocations } from "@/lib/bosta";

type CreateDefaultPickupLocationBody = {
  businessId?: string;
  pickupAddress?: Array<{
    locationName?: string;
    districtId?: string;
    firstLine?: string;
    buildingNumber?: string;
    floor?: string;
    apartment?: string;
    secondLine?: string;
  }>;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listBostaPickupLocations();
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not load Bosta pickup locations", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as CreateDefaultPickupLocationBody;
  const pickupAddress = (body.pickupAddress || []).map((address) => ({
    locationName: getString(address.locationName),
    districtId: getString(address.districtId),
    firstLine: getString(address.firstLine),
    buildingNumber: getString(address.buildingNumber),
    floor: getString(address.floor),
    apartment: getString(address.apartment),
    secondLine: getString(address.secondLine),
  })).filter((address) => address.locationName && address.districtId && address.firstLine.length >= 5);

  if (!pickupAddress.length) {
    return NextResponse.json(
      { error: "pickupAddress needs locationName, districtId, and firstLine with at least 5 characters" },
      { status: 400 },
    );
  }

  const result = await createDefaultBostaPickupLocation({
    businessId: getString(body.businessId) || undefined,
    pickupAddress,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not create Bosta pickup location", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
