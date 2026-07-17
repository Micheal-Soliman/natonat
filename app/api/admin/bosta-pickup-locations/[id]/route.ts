import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  deleteBostaPickupLocation,
  getBostaPickupLocation,
  updateBostaPickupLocation,
} from "@/lib/bosta";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdatePickupLocationBody = {
  locationName?: string;
  contacts?: Array<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    isDefault?: boolean;
  }>;
  address?: {
    districtId?: string;
    firstLine?: string;
    secondLine?: string;
    floor?: string;
    apartment?: string;
    buildingNumber?: string;
  };
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export async function GET(req: Request, context: RouteContext) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getBostaPickupLocation(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not load Bosta pickup location", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request, context: RouteContext) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({})) as UpdatePickupLocationBody;
  const locationName = getString(body.locationName);
  const address = body.address || {};
  const districtId = getString(address.districtId);
  const firstLine = getString(address.firstLine);

  if (!locationName || !districtId || firstLine.length < 5) {
    return NextResponse.json(
      { error: "locationName, address.districtId, and address.firstLine are required" },
      { status: 400 },
    );
  }

  const result = await updateBostaPickupLocation(id, {
    locationName,
    contacts: (body.contacts || []).map((contact) => ({
      firstName: getString(contact.firstName),
      lastName: getString(contact.lastName),
      phone: getString(contact.phone),
      isDefault: Boolean(contact.isDefault),
    })).filter((contact) => contact.firstName && contact.phone),
    address: {
      districtId,
      firstLine,
      secondLine: getString(address.secondLine),
      floor: getString(address.floor),
      apartment: getString(address.apartment),
      buildingNumber: getString(address.buildingNumber),
    },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not update Bosta pickup location", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}

export async function DELETE(req: Request, context: RouteContext) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteBostaPickupLocation(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Could not delete Bosta pickup location", details: result.raw },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
