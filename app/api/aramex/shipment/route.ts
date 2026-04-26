import { NextResponse } from "next/server";
import { createShipment, buildShipmentFromOrder } from "@/lib/aramex";

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

    if (!orderRef || !customer || !items || !totalValue) {
      return NextResponse.json(
        { error: "Missing required fields: orderRef, customer, items, totalValue" },
        { status: 400 }
      );
    }

    // Build shipment data (with COD params)
    const shipmentData = buildShipmentFromOrder(orderRef, customer, items, totalValue, cod, codAmount);

    // Create shipment with Aramex
    const result = await createShipment(shipmentData);

    // Check for errors
    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Aramex shipment creation failed", 
          details: result.error || "Unknown error",
          raw: result.raw 
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
      guid: result.guid,
      raw: result.raw,
    });

  } catch (error) {
    console.error("[Aramex Shipment] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to create shipment", 
        details: message,
      },
      { status: 500 }
    );
  }
}
