import { NextResponse } from "next/server";
import { createShipment, buildShipmentFromOrder, validateAddress } from "@/lib/aramex";

type AramexAddressCandidate = {
  City?: string;
  StateOrProvinceCode?: string;
  PostCode?: string;
};

type AramexValidationResult = {
  Address?: AramexAddressCandidate;
  ValidatedAddress?: AramexAddressCandidate;
  SuggestedAddress?: AramexAddressCandidate;
  SuggestedAddresses?: AramexAddressCandidate[];
  Addresses?: AramexAddressCandidate[];
};

function tryExtractNormalizedAddress(validateResult: AramexValidationResult) {
  // Aramex responses may vary by account/version; keep this defensive.
  const candidates = [
    validateResult?.Address,
    validateResult?.ValidatedAddress,
    validateResult?.SuggestedAddress,
    validateResult?.SuggestedAddresses?.[0],
    validateResult?.Addresses?.[0],
  ].filter(Boolean);

  for (const c of candidates) {
    if (c?.City || c?.StateOrProvinceCode || c?.PostCode) return c;
  }
  return null;
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

    if (!orderRef || !customer || !items || !totalValue) {
      return NextResponse.json(
        { error: "Missing required fields: orderRef, customer, items, totalValue" },
        { status: 400 }
      );
    }

    // Build shipment data (with COD params)
    const shipmentData = buildShipmentFromOrder(orderRef, customer, items, totalValue, cod, codAmount);

    // Best-effort: validate & normalize addresses via Aramex Location API
    try {
      const shipperValidation = await validateAddress(shipmentData.Shipper.PartyAddress);
      const consigneeValidation = await validateAddress(shipmentData.Consignee.PartyAddress);

      const normalizedShipper = tryExtractNormalizedAddress(shipperValidation as AramexValidationResult);
      const normalizedConsignee = tryExtractNormalizedAddress(consigneeValidation as AramexValidationResult);

      if (normalizedShipper) {
        shipmentData.Shipper.PartyAddress = {
          ...shipmentData.Shipper.PartyAddress,
          ...normalizedShipper,
        };
      }

      if (normalizedConsignee) {
        shipmentData.Consignee.PartyAddress = {
          ...shipmentData.Consignee.PartyAddress,
          ...normalizedConsignee,
        };
      }
    } catch {
      // Ignore validation failures and continue with original payload
    }

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
