import { NextResponse } from "next/server";
import { createBostaDelivery, getBostaConfigDiagnostics } from "@/lib/bosta";

function getAppOrigin(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function isInternalAuthorized(req: Request) {
  const expected = process.env.BOSTA_INTERNAL_API_SECRET;
  if (!expected) return true;
  return req.headers.get("x-internal-api-secret") === expected;
}

export async function POST(req: Request) {
  try {
    if (!isInternalAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized Bosta shipment request" }, { status: 401 });
    }

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

    const appOrigin = getAppOrigin(req);
    const orderRes = await fetch(`${appOrigin}/api/orders/log?order_ref=${encodeURIComponent(orderRef)}`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => null);
    const orderData = orderRes?.ok ? await orderRes.json().catch(() => null) : null;
    const existingOrder = getObject(orderData?.order);
    if (!existingOrder.order_ref) {
      return NextResponse.json(
        { error: "Order must be stored before creating Bosta shipment" },
        { status: 409 },
      );
    }

    const existingBosta = getObject(existingOrder.bosta || existingOrder.shipment || existingOrder.aramex);
    const existingTrackingNumber = getString(existingBosta.trackingNumber);
    if (existingTrackingNumber) {
      return NextResponse.json({
        success: true,
        provider: "bosta",
        trackingNumber: existingTrackingNumber,
        trackingLink:
          getString(existingBosta.trackingLink) ||
          `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(existingTrackingNumber)}`,
        labelUrl: getString(existingBosta.labelUrl),
        guid: getString(existingBosta.guid || existingBosta.deliveryId),
        existing: true,
      });
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
          ...(process.env.NODE_ENV !== "production" ? { diagnostics: getBostaConfigDiagnostics(), raw: result.raw } : {}),
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
        ...(process.env.NODE_ENV !== "production" ? { diagnostics: getBostaConfigDiagnostics() } : {}),
      },
      { status: 500 },
    );
  }
}
