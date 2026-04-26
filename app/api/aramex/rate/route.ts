import { NextResponse } from "next/server";
import { calculateRate } from "@/lib/aramex";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const {
      originCity,
      destinationCity,
      weight,
      numberOfPieces = 1,
      productGroup = "DOM",
    } = body;

    if (!originCity || !destinationCity || !weight) {
      return NextResponse.json(
        { error: "Missing required fields: originCity, destinationCity, weight" },
        { status: 400 }
      );
    }

    const rateData = {
      OriginAddress: {
        Line1: "",
        Line2: "",
        Line3: "",
        City: originCity,
        StateOrProvinceCode: originCity,
        PostCode: "00000",
        CountryCode: "EG",
        Longitude: 0,
        Latitude: 0,
        BuildingNumber: null,
        BuildingName: null,
        Floor: null,
        Apartment: null,
        POBox: null,
        Description: null,
      },
      DestinationAddress: {
        Line1: "",
        Line2: "",
        Line3: "",
        City: destinationCity,
        StateOrProvinceCode: destinationCity,
        PostCode: "00000",
        CountryCode: "EG",
        Longitude: 0,
        Latitude: 0,
        BuildingNumber: null,
        BuildingName: null,
        Floor: null,
        Apartment: null,
        POBox: null,
        Description: null,
      },
      ShipmentDetails: {
        ActualWeight: {
          Value: weight,
          Unit: "Kg",
        },
        Dimensions: {
          Length: 30,
          Width: 20,
          Height: 10,
          Unit: "cm",
        },
        NumberOfPieces: numberOfPieces,
        ProductGroup: productGroup, // DOM or EXP
        ProductType: productGroup === "DOM" ? "COM" : "PPX",
        PaymentType: "P",
      },
    };

    const result = await calculateRate(rateData);

    if (result.HasErrors) {
      const errorMessages = result.Notifications?.map((n: { Message: string }) => n.Message).join(", ") || "Unknown error";
      return NextResponse.json(
        { error: "Rate calculation failed", details: errorMessages, aramex: result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      rate: {
        totalAmount: result.TotalAmount?.Value,
        currency: result.TotalAmount?.CurrencyCode,
        baseAmount: result.BaseCharge?.Value,
        taxes: result.Taxes?.map((t: { Value: number; Type: string }) => ({ value: t.Value, type: t.Type })),
        details: result.RateDetails,
      },
      aramex: result,
    });

  } catch (error) {
    console.error("[Aramex Rate] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to calculate rate", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
