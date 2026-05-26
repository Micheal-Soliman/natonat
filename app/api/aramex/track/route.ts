import { NextResponse } from "next/server";
import { trackShipment } from "@/lib/aramex";

type TrackResponse = {
  HasErrors?: boolean;
  Notifications?: Array<{ Message: string }>;
  TrackingResults?: Array<{
    TrackingStatus?: string;
    TrackingUpdates?: unknown[];
    EstimatedDeliveryTime?: string;
  }>;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get("trackingNumber");

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Missing trackingNumber parameter" },
        { status: 400 }
      );
    }

    const result = (await trackShipment(trackingNumber)) as TrackResponse;

    if (result.HasErrors) {
      const errorMessages = result.Notifications?.map((n: { Message: string }) => n.Message).join(", ") || "Unknown error";
      return NextResponse.json(
        { error: "Tracking failed", details: errorMessages, aramex: result },
        { status: 400 }
      );
    }

    // Extract tracking results
    const trackingResult = result.TrackingResults?.[0];
    
    return NextResponse.json({
      success: true,
      trackingNumber,
      status: trackingResult?.TrackingStatus,
      updates: trackingResult?.TrackingUpdates || [],
      estimatedDelivery: trackingResult?.EstimatedDeliveryTime,
      aramex: result,
    });

  } catch (error) {
    console.error("[Aramex Tracking] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to track shipment", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
