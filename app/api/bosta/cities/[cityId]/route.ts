import { NextResponse } from "next/server";
import { fetchBostaCity } from "@/lib/bosta";

type RouteContext = {
  params: Promise<{ cityId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { cityId } = await context.params;
    const city = await fetchBostaCity(cityId);
    if (!city) {
      return NextResponse.json({ success: false, error: "Missing cityId" }, { status: 400 });
    }

    return NextResponse.json({ success: true, city });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load Bosta city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
