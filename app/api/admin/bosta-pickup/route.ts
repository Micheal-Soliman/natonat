import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { createBostaPickup } from "@/lib/bosta";

type PickupRequest = {
  scheduledDate?: string;
  businessLocationId?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
    secPhone?: string;
    email?: string;
  };
  notes?: string;
  numberOfParcels?: number;
  packageType?: "Normal" | "Light Bulky" | "Heavy Bulky";
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getPackageType(value: unknown): "Normal" | "Light Bulky" | "Heavy Bulky" {
  if (value === "Light Bulky" || value === "Heavy Bulky") return value;
  return "Normal";
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({})) as PickupRequest;
    const scheduledDate = String(body.scheduledDate || "").trim();

    if (!scheduledDate || !isValidDate(scheduledDate)) {
      return NextResponse.json(
        { success: false, error: "scheduledDate is required in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    const numberOfParcels = Math.max(1, Math.round(Number(body.numberOfParcels || 1)));
    const result = await createBostaPickup({
      scheduledDate,
      businessLocationId: body.businessLocationId,
      contactPerson: body.contactPerson,
      notes: body.notes,
      numberOfParcels,
      packageType: getPackageType(body.packageType),
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        provider: "bosta",
        error: error instanceof Error ? error.message : "Failed to create Bosta pickup",
      },
      { status: 500 },
    );
  }
}
