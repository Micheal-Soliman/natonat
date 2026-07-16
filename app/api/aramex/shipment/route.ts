import { NextResponse } from "next/server";
import { createShipment, buildShipmentFromOrder } from "@/lib/aramex";
import { createBostaDelivery } from "@/lib/bosta";

function getShippingProvider() {
  return (process.env.SHIPPING_PROVIDER || "aramex").toLowerCase();
}

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
        { status: 400 }
      );
    }

    if (getShippingProvider() === "bosta") {
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
            raw: result.raw,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        provider: result.provider,
        trackingNumber: result.trackingNumber,
        trackingLink: result.trackingLink,
        labelUrl: result.labelUrl,
        guid: result.guid,
        raw: result.raw,
      });
    }

    // Build shipment data (with COD params)
    const shipmentData = buildShipmentFromOrder(
      orderRef,
      customer,
      items,
      numericTotalValue,
      cod,
      Number.isFinite(numericCodAmount) ? numericCodAmount : 0
    );

    // Create shipment with Aramex
    const result = await createShipment(shipmentData);
    if (process.env.NODE_ENV !== "production") {
      console.log("[Aramex API Response]:", JSON.stringify(result, null, 2));
    }

    // Check for errors
    if (!result.success) {
      console.error("[Aramex Shipment] Error:", result.error);
      return NextResponse.json(
        { 
          error: "Aramex shipment creation failed", 
          details: result.error || "Unknown Aramex error",
          raw: result.raw 
        },
        { status: 400 }
      );
    }

    // Success
    if (process.env.NODE_ENV !== "production") {
      console.log("[Aramex Shipment] Success:", result);
    }
    return NextResponse.json({
      success: true,
      provider: "aramex",
      trackingNumber: result.trackingNumber,
      trackingLink: result.trackingNumber
        ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${result.trackingNumber}`
        : undefined,
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
