import { NextResponse } from "next/server";
import { createBostaDelivery, getBostaConfigDiagnostics } from "@/lib/bosta";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderRef,
      customer,
      items,
      totalValue,
      cod = false,
      codAmount = 0,
    } = body;

    const numericTotalValue = Number(totalValue);
    const numericCodAmount = Number(codAmount);

    if (!orderRef || !customer || !Array.isArray(items) || !Number.isFinite(numericTotalValue)) {
      return NextResponse.json(
        { error: "Missing required fields: orderRef, customer, items, totalValue" },
        { status: 400 },
      );
    }

    const result = await createBostaDelivery({
      orderRef,
      customer,
      items,
      totalValue: numericTotalValue,
      cod,
      codAmount: Number.isFinite(numericCodAmount) ? numericCodAmount : 0,
    });

    if (!result.success) {
      console.error("[Bosta Shipment] Error:", result.error);
      return NextResponse.json(
        {
          error: "Bosta shipment creation failed",
          details: result.error || "Unknown Bosta error",
          diagnostics: getBostaConfigDiagnostics(),
          raw: result.raw,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      provider: "bosta",
      trackingNumber: result.trackingNumber,
      trackingLink: result.trackingLink,
      labelUrl: result.labelUrl,
      guid: result.guid,
      raw: result.raw,
    });
  } catch (error) {
    console.error("[Bosta Shipment] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create Bosta shipment",
        details: error instanceof Error ? error.message : "Unknown error",
        diagnostics: getBostaConfigDiagnostics(),
      },
      { status: 500 },
    );
  }
}
