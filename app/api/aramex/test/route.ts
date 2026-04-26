import { NextResponse } from "next/server";
import { getAramexCredentials, calculateRate } from "@/lib/aramex";

export async function GET() {
  const diagnostics: Record<string, any> = {};

  const credentials = getAramexCredentials();
  const env = process.env.ARAMEX_ENV || "dev";
  diagnostics.config = {
    environment: env,
    host: env === "prod" ? "ws.aramex.net" : "ws.dev.aramex.net",
    username: credentials.UserName,
    account: credentials.AccountNumber,
    entity: credentials.AccountEntity,
    countryCode: credentials.AccountCountryCode,
    source: credentials.Source,
  };

  // Test connectivity to both environments
  const testUrls = [
    { label: "dev_rate", url: "https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" },
    { label: "prod_rate", url: "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" },
  ];

  diagnostics.endpoints = {};
  for (const { label, url } of testUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ClientInfo: credentials, Transaction: { Reference1: "", Reference2: "", Reference3: "", Reference4: "", Reference5: "" } }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      const notifications = parsed?.Notifications || [];
      const hasAuthError = notifications.some((n: any) => n.Code === "ERR75");
      diagnostics.endpoints[label] = {
        reachable: true,
        status: res.status,
        hasAuthError,
        notifications: notifications.map((n: any) => `${n.Code}: ${n.Message}`),
      };
    } catch (e: any) {
      diagnostics.endpoints[label] = {
        reachable: false,
        error: e.message,
        code: e.cause?.code || e.code || null,
      };
    }
  }

  // Test actual rate calculation with configured environment
  let rateTest: any = null;
  try {
    const originCity = "Cairo";
    const destinationCity = "Alexandria";
    const rateResult = await calculateRate({
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
        ActualWeight: { Value: 1, Unit: "Kg" },
        Dimensions: { Length: 30, Width: 20, Height: 10, Unit: "cm" },
        ProductGroup: "DOM",
        ProductType: "COM",
        PaymentType: "P",
        NumberOfPieces: 1,
      },
    });
    rateTest = {
      success: !rateResult?.HasErrors,
      totalAmount: rateResult?.TotalAmount || null,
      notifications: rateResult?.Notifications?.map((n: any) => `${n.Code}: ${n.Message}`) || [],
    };
  } catch (e: any) {
    rateTest = { success: false, error: e.message };
  }
  diagnostics.rateTest = rateTest;

  const currentEnvOk = env === "prod"
    ? diagnostics.endpoints.prod_rate?.reachable && !diagnostics.endpoints.prod_rate?.hasAuthError
    : diagnostics.endpoints.dev_rate?.reachable;

  return NextResponse.json({
    success: !!currentEnvOk,
    message: !currentEnvOk
      ? `Aramex ${env} environment not working. ${env === "dev" ? "ws.dev.aramex.net unreachable - use VPN or switch to prod with ARAMEX_ENV=prod" : "Credentials rejected (ERR75) - need valid prod credentials"}`
      : "Aramex integration working",
    diagnostics,
  }, { status: currentEnvOk ? 200 : 502 });
}
