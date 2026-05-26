import { NextResponse } from "next/server";
import { getAramexCredentials, calculateRate, getAramexEnv, getAramexHost } from "@/lib/aramex";

type AramexNotification = {
  Code?: string;
  Message?: string;
};

type AramexDiagnosticResponse = {
  Notifications?: AramexNotification[];
  HasErrors?: boolean;
  TotalAmount?: unknown;
};

type EndpointDiagnostic = {
  reachable: boolean;
  status?: number;
  hasAuthError?: boolean;
  notifications?: string[];
  error?: string;
  code?: unknown;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown) {
  if (error && typeof error === "object") {
    const err = error as { code?: unknown; cause?: { code?: unknown } };
    return err.cause?.code || err.code || null;
  }

  return null;
}

export async function GET() {
  const env = getAramexEnv();
  if (env === "prod") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const diagnostics: {
    config?: Record<string, unknown>;
    endpoints: Record<string, EndpointDiagnostic>;
    rateTest?: unknown;
  } = {
    endpoints: {},
  };

  const credentials = getAramexCredentials();
  diagnostics.config = {
    environment: env,
    host: getAramexHost(),
    entity: credentials.AccountEntity,
    countryCode: credentials.AccountCountryCode,
    source: credentials.Source,
  };

  // Test connectivity to both environments
  const testUrls = [
    { label: "dev_rate", url: "https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" },
    { label: "prod_rate", url: "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" },
  ];

  for (const { label, url } of testUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ClientInfo: credentials, Transaction: { Reference1: "", Reference2: "", Reference3: "", Reference4: "", Reference5: "" } }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      let parsed: AramexDiagnosticResponse | null = null;
      try { parsed = JSON.parse(text) as AramexDiagnosticResponse; } catch {}
      const notifications = parsed?.Notifications || [];
      const hasAuthError = notifications.some((n) => n.Code === "ERR75");
      diagnostics.endpoints[label] = {
        reachable: true,
        status: res.status,
        hasAuthError,
        notifications: notifications.map((n) => `${n.Code}: ${n.Message}`),
      };
    } catch (e: unknown) {
      diagnostics.endpoints[label] = {
        reachable: false,
        error: getErrorMessage(e),
        code: getErrorCode(e),
      };
    }
  }

  // Test actual rate calculation with configured environment
  let rateTest: unknown = null;
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
    }) as AramexDiagnosticResponse;
    rateTest = {
      success: !rateResult?.HasErrors,
      totalAmount: rateResult?.TotalAmount || null,
      notifications: rateResult?.Notifications?.map((n) => `${n.Code}: ${n.Message}`) || [],
    };
  } catch (e: unknown) {
    rateTest = { success: false, error: getErrorMessage(e) };
  }
  diagnostics.rateTest = rateTest;

  const currentEnvOk = diagnostics.endpoints.dev_rate?.reachable;

  return NextResponse.json({
    success: !!currentEnvOk,
    message: !currentEnvOk
      ? "Aramex dev environment not working. ws.dev.aramex.net unreachable - use VPN or switch to prod with ARAMEX_ENV=prod"
      : "Aramex integration working",
    diagnostics,
  }, { status: currentEnvOk ? 200 : 502 });
}
