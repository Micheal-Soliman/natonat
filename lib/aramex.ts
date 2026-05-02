// Aramex API Integration
// API Documentation: https://www.aramex.com/developers

type AramexEnv = "prod" | "dev";

export function getAramexEnv(): AramexEnv {
  const raw = (process.env.ARAMEX_ENV || "dev").toLowerCase();
  if (raw === "prod" || raw === "production") return "prod";
  return "dev";
}

export function getAramexHost(): string {
  return getAramexEnv() === "prod" ? "ws.aramex.net" : "ws.dev.aramex.net";
}

const ARAMEX_ENV = getAramexEnv();
const ARAMEX_HOST = getAramexHost();

const ARAMEX_LOCATION_JSON_BASE = `https://${ARAMEX_HOST}/ShippingAPI.V2/Location/Service_1_0.svc/json`;
const ARAMEX_RATE_JSON_BASE = `https://${ARAMEX_HOST}/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json`;
const ARAMEX_SHIPPING_JSON_BASE = `https://${ARAMEX_HOST}/ShippingAPI.V2/Shipping/Service_1_0.svc/json`;
const ARAMEX_TRACKING_JSON_BASE = `https://${ARAMEX_HOST}/ShippingAPI.V2/Tracking/Service_1_0.svc/json`;

export interface AramexCredentials {
  UserName: string;
  Password: string;
  Version: string;
  AccountNumber: string;
  AccountPin: string;
  AccountEntity: string;
  AccountCountryCode: string;
  Source: number;
}

export interface AramexAddress {
  Line1: string;
  Line2: string;
  Line3: string;
  City: string;
  StateOrProvinceCode: string;
  PostCode: string;
  CountryCode: string;
  Longitude: number;
  Latitude: number;
  BuildingNumber: string | null;
  BuildingName: string | null;
  Floor: string | null;
  Apartment: string | null;
  POBox: string | null;
  Description: string | null;
}

export interface AramexContact {
  Department: string;
  PersonName: string;
  Title: string;
  CompanyName: string;
  PhoneNumber1: string;
  PhoneNumber1Ext: string;
  PhoneNumber2: string;
  PhoneNumber2Ext: string;
  FaxNumber: string;
  CellPhone: string;
  EmailAddress: string;
  Type: string;
}

export interface AramexParty {
  Reference1?: string;
  Reference2?: string;
  AccountNumber?: string;
  PartyAddress: AramexAddress;
  Contact: AramexContact;
}

export interface AramexShipmentDetails {
  Dimensions: {
    Length: number;
    Width: number;
    Height: number;
    Unit: string;
  };
  ActualWeight: {
    Value: number;
    Unit: string;
  };
  ChargeableWeight?: {
    Value: number;
    Unit: string;
  };
  DescriptionOfGoods?: string;
  GoodsOriginCountry: string;
  NumberOfPieces: number;
  ProductGroup: string; // DOM or EXP
  ProductType: string; // COM, DOX, etc.
  PaymentType: string; // P, C, 3
  PaymentOptions?: string;
  Services?: string;
  CustomsValueAmount?: {
    CurrencyCode: string;
    Value: number;
  };
  CashOnDeliveryAmount?: {
    Value: number;
    CurrencyCode: string;
  };
  Insurance?: {
    InsuredValue: number;
    CurrencyCode: string;
  };
}

// Single shipment request for SOAP API (simplified structure)
export interface AramexShipmentRequest {
  ClientInfo: AramexCredentials;
  // Shipment level properties
  Reference1?: string;
  Reference2?: string;
  Reference3?: string;
  Shipper: AramexParty;
  Consignee: AramexParty;
  ThirdParty?: AramexParty;
  ShippingDateTime: string;
  DueDate?: string;
  Comments?: string;
  PickupLocation?: string;
  PickupGUID?: string;
  OperationsInstructions?: string;
  AccountingInstrcutions?: string;
  ForeignHAWB?: string;
  Details: AramexShipmentDetails;
  // Legacy array structure (kept for compatibility)
  Shipments?: Array<any>;
  Transaction?: {
    Reference1?: string;
    Reference2?: string;
    Reference3?: string;
    Reference4?: string;
    Reference5?: string;
  };
  LabelInfo?: {
    ReportID: number;
    ReportType: string;
  };
}

export interface AramexShipmentResponse {
  Transaction?: {
    Reference1?: string;
    Reference2?: string;
    Reference3?: string;
    Reference4?: string;
    Reference5?: string;
  };
  Notifications?: Array<{
    Code: string;
    Message: string;
  }>;
  HasErrors: boolean;
  Shipments?: Array<{
    Reference1?: string;
    Reference2?: string;
    Reference3?: string;
    ForeignHAWB?: string;
    HasErrors: boolean;
    Notifications?: Array<{
      Code: string;
      Message: string;
    }>;
    ShipmentLabel?: {
      LabelURL?: string;
      TrackingNumber?: string;
    };
    GUID?: string;
  }>;
}

// Get credentials from environment
export function getAramexCredentials(): AramexCredentials {
  const env = getAramexEnv();
  const hasAllRequired =
    !!process.env.ARAMEX_USERNAME &&
    !!process.env.ARAMEX_PASSWORD &&
    !!process.env.ARAMEX_ACCOUNT_NUMBER &&
    !!process.env.ARAMEX_ACCOUNT_PIN &&
    !!process.env.ARAMEX_ACCOUNT_ENTITY &&
    !!process.env.ARAMEX_ACCOUNT_COUNTRY_CODE;

  if (env === "prod" && !hasAllRequired) {
    throw new Error(
      "Aramex credentials are not configured for production. Set ARAMEX_USERNAME, ARAMEX_PASSWORD, ARAMEX_ACCOUNT_NUMBER, ARAMEX_ACCOUNT_PIN, ARAMEX_ACCOUNT_ENTITY, ARAMEX_ACCOUNT_COUNTRY_CODE (and optionally ARAMEX_VERSION, ARAMEX_SOURCE)."
    );
  }

  return {
    UserName: process.env.ARAMEX_USERNAME || "testingapi@aramex.com",
    Password: process.env.ARAMEX_PASSWORD || "R123456789$r",
    Version: process.env.ARAMEX_VERSION || "v1",
    AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "987654",
    AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "226321",
    AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "CAI",
    AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "EG",
    Source: Number(process.env.ARAMEX_SOURCE || 24),
  };
}

// Create shipment response
export interface CreateShipmentResult {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  guid?: string;
  raw?: string;
  error?: string;
}

// Create shipment
export async function createShipment(
  shipmentData: Omit<AramexShipmentRequest, "ClientInfo">
): Promise<CreateShipmentResult> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    Transaction: {
      Reference1: shipmentData.Reference1 || "",
      Reference2: "natOnat",
      Reference3: "",
      Reference4: "",
      Reference5: "",
    },
    LabelInfo: {
      ReportID: 9201,
      ReportType: "URL",
    },
    Shipments: [
      {
        Reference1: shipmentData.Reference1 || "",
        Reference2: shipmentData.Reference2 || "",
        Reference3: shipmentData.Reference3 || "",
        Shipper: {
          ...shipmentData.Shipper,
          AccountNumber: credentials.AccountNumber,
        },
        Consignee: {
          Reference1: shipmentData.Consignee.Reference1,
          PartyAddress: shipmentData.Consignee.PartyAddress,
          Contact: shipmentData.Consignee.Contact,
          AccountNumber: credentials.AccountNumber,
        },
        ThirdParty: {
          Reference1: "",
          Reference2: "",
          PartyAddress: { Line1: "", Line2: "", Line3: "", City: "", StateOrProvinceCode: "", PostCode: "", CountryCode: "", Longitude: 0, Latitude: 0, BuildingNumber: null, BuildingName: null, Floor: null, Apartment: null, POBox: null, Description: null },
          Contact: { Department: "", PersonName: "", Title: "", CompanyName: "", PhoneNumber1: "", PhoneNumber1Ext: "", PhoneNumber2: "", PhoneNumber2Ext: "", FaxNumber: "", CellPhone: "", EmailAddress: "", Type: "" },
          AccountNumber: credentials.AccountNumber,
        },
        ShippingDateTime: shipmentData.ShippingDateTime,
        DueDate: shipmentData.DueDate || shipmentData.ShippingDateTime,
        Comments: shipmentData.Comments,
        PickupLocation: shipmentData.PickupLocation,
        OperationsInstructions: shipmentData.OperationsInstructions,
        AccountingInstrcutions: shipmentData.AccountingInstrcutions,
        Details: {
          ...shipmentData.Details,
          ChargeableWeight: shipmentData.Details.ChargeableWeight || {
            Value: shipmentData.Details.ActualWeight.Value,
            Unit: shipmentData.Details.ActualWeight.Unit,
          },
          PaymentOptions: shipmentData.Details.PaymentOptions || "",
          CashOnDeliveryAmount: shipmentData.Details.CashOnDeliveryAmount || null,
          CustomsValueAmount: shipmentData.Details.CustomsValueAmount || null,
        },
        Attachments: [],
        ForeignHAWB: shipmentData.ForeignHAWB || "",
        TransportType: 0,
        PickupGUID: shipmentData.PickupGUID || "",
        Number: null,
        ScheduledDelivery: null,
      },
    ],
  };

  const response = await fetch(`${ARAMEX_SHIPPING_JSON_BASE}/CreateShipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`Aramex CreateShipments error: ${response.status} (${ARAMEX_SHIPPING_JSON_BASE}/CreateShipments) - ${rawText}`);
  }

  const json = rawText ? (JSON.parse(rawText) as AramexShipmentResponse) : ({} as AramexShipmentResponse);
  const hasErrors = !!json?.HasErrors;
  const shipment = json?.Shipments?.[0];

  return {
    success: !hasErrors && !shipment?.HasErrors,
    trackingNumber: shipment?.ShipmentLabel?.TrackingNumber,
    labelUrl: shipment?.ShipmentLabel?.LabelURL,
    guid: shipment?.GUID,
    raw: rawText,
    error:
      hasErrors
        ? json?.Notifications?.map((n) => n.Message).join(", ") || "Unknown error"
        : shipment?.HasErrors
          ? shipment?.Notifications?.map((n) => n.Message).join(", ") || "Unknown error"
          : undefined,
  };
}

// Track shipment
export async function trackShipment(trackingNumber: string): Promise<any> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    GetLastTrackingUpdateOnly: false,
    Shipments: [trackingNumber],
    Transaction: {
      Reference1: "",
      Reference2: "",
      Reference3: "",
      Reference4: "",
      Reference5: "",
    },
  };

  const response = await fetch(`${ARAMEX_TRACKING_JSON_BASE}/TrackShipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Aramex Tracking API error: ${response.status} (${ARAMEX_TRACKING_JSON_BASE}/TrackShipments) - ${rawText}`
    );
  }

  return rawText ? JSON.parse(rawText) : {};
}

// Get rate
export interface AramexRateRequest {
  OriginAddress: AramexAddress;
  DestinationAddress: AramexAddress;
  ShipmentDetails: Pick<
    AramexShipmentDetails,
    "ActualWeight" | "Dimensions" | "ProductGroup" | "ProductType" | "PaymentType"
  > & {
    NumberOfPieces: number;
  };
}

export async function calculateRate(rateData: AramexRateRequest): Promise<any> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    OriginAddress: rateData.OriginAddress,
    DestinationAddress: rateData.DestinationAddress,
    PreferredCurrencyCode: "EGP",
    ShipmentDetails: {
      Dimensions: rateData.ShipmentDetails.Dimensions,
      ActualWeight: {
        Unit: rateData.ShipmentDetails.ActualWeight.Unit,
        Value: rateData.ShipmentDetails.ActualWeight.Value,
      },
      ChargeableWeight: null,
      DescriptionOfGoods: null,
      GoodsOriginCountry: null,
      NumberOfPieces: rateData.ShipmentDetails.NumberOfPieces,
      ProductGroup: rateData.ShipmentDetails.ProductGroup,
      ProductType: rateData.ShipmentDetails.ProductType,
      PaymentType: rateData.ShipmentDetails.PaymentType,
      PaymentOptions: "",
      CustomsValueAmount: null,
      CashOnDeliveryAmount: null,
      InsuranceAmount: null,
      CashAdditionalAmount: null,
      CashAdditionalAmountDescription: null,
      CollectAmount: null,
      Services: "",
      Items: null,
      DeliveryInstructions: null,
    },
    Transaction: {
      Reference1: "",
      Reference2: "",
      Reference3: "",
      Reference4: "",
      Reference5: "",
    },
  };

  const response = await fetch(`${ARAMEX_RATE_JSON_BASE}/CalculateRate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Aramex Rate API error: ${response.status} (${ARAMEX_RATE_JSON_BASE}/CalculateRate) - ${rawText}`);
  }

  return rawText ? JSON.parse(rawText) : {};
}

// Validate address
export async function validateAddress(address: AramexAddress): Promise<any> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    Address: address,
  };

  const response = await fetch(`${ARAMEX_LOCATION_JSON_BASE}/ValidateAddress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aramex Address Validation error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Fetch all countries
export async function fetchCountries(): Promise<any> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    Transaction: {
      Reference1: "",
      Reference2: "",
      Reference3: "",
      Reference4: "",
      Reference5: "",
    },
  };

  const response = await fetch(`${ARAMEX_LOCATION_JSON_BASE}/FetchCountries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aramex Fetch Countries error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Fetch cities by country
export async function fetchCities(countryCode: string, nameStartsWith?: string): Promise<any> {
  const credentials = getAramexCredentials();

  const payload = {
    ClientInfo: credentials,
    Transaction: {
      Reference1: "",
      Reference2: "",
      Reference3: "",
      Reference4: "",
      Reference5: "",
    },
    CountryCode: countryCode,
    NameStartsWith: nameStartsWith,
    State: "",
  };

  const response = await fetch(`${ARAMEX_LOCATION_JSON_BASE}/FetchCities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aramex Fetch Cities error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Map lowercase city keys to Aramex-expected city names
const CITY_NAME_MAP: Record<string, string> = {
  cairo: "CAIRO",
  giza: "GIZA",
  alexandria: "ALEXANDRIA",
  dakahlia: "DAKAHLIA",
  red_sea: "RED SEA",
  beheira: "BEHEIRA",
  fayoum: "FAYOUM",
  gharbia: "GHARBIA",
  ismailia: "ISMAILIA",
  monufia: "MONUFIA",
  minya: "MINYA",
  qalyubia: "QALYUBIA",
  wadi_el_gadid: "WADI EL JADID",
  sharqia: "SHARQIA",
  suez: "SUEZ",
  aswan: "ASWAN",
  asyut: "ASYUT",
  beni_suef: "BENI SUEF",
  portsaid: "PORT SAID",
  damietta: "DAMIETTA",
  south_sinai: "SOUTH SINAI",
  kafr_el_sheikh: "KAFR EL SHEIKH",
  matrouh: "MATROUH",
  luxor: "LUXOR",
  qena: "QENA",
  sohag: "SOHAG",
  north_sinai: "NORTH SINAI",
};

// Helper to get Aramex State Codes for Egypt
const CITY_STATE_MAP: Record<string, string> = {
  cairo: "CAI",
  giza: "GIZ",
  alexandria: "ALX",
};

export function mapCityName(cityKey: string): string {
  return CITY_NAME_MAP[cityKey.toLowerCase()] || cityKey;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getShipperConfig() {
  const env = getAramexEnv();
  const requiredInProd = env === "prod";

  const getValue = (key: string, fallback: string) => {
    if (requiredInProd) return getRequiredEnv(key);
    return process.env[key] || fallback;
  };

  return {
    addressLine1: getValue("ARAMEX_SHIPPER_ADDRESS_LINE1", "123 natOnat Warehouse"),
    addressLine2: getValue("ARAMEX_SHIPPER_ADDRESS_LINE2", "Industrial Area"),
    addressLine3: process.env.ARAMEX_SHIPPER_ADDRESS_LINE3 || "",
    city: getValue("ARAMEX_SHIPPER_CITY", "Cairo"),
    state: getValue("ARAMEX_SHIPPER_STATE", "Cairo"),
    postCode: getValue("ARAMEX_SHIPPER_POSTCODE", "11728"),
    countryCode: getValue("ARAMEX_SHIPPER_COUNTRY_CODE", "EG"),
    companyName: getValue("ARAMEX_SHIPPER_COMPANY", "natOnat"),
    personName: getValue("ARAMEX_SHIPPER_PERSON", "natOnat Shipping"),
    phone: getValue("ARAMEX_SHIPPER_PHONE", "+201070004227"),
    email: getValue("ARAMEX_SHIPPER_EMAIL", "shipping@natonat.com"),
  };
}

// Build shipment from order data
export function buildShipmentFromOrder(
  orderRef: string,
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
  },
  items: Array<{
    name: string;
    quantity: number;
  }>,
  totalValue: number,
  cod: boolean = false,
  codAmount: number = 0
): Omit<AramexShipmentRequest, "ClientInfo"> {
  const shipperConfig = getShipperConfig();
  const shipper: AramexParty = {
    Reference1: orderRef,
    PartyAddress: {
      Line1: shipperConfig.addressLine1,
      Line2: shipperConfig.addressLine2,
      Line3: shipperConfig.addressLine3,
      City: mapCityName(shipperConfig.city),
      StateOrProvinceCode: CITY_STATE_MAP[shipperConfig.city.toLowerCase()] || "",
      PostCode: shipperConfig.postCode,
      CountryCode: shipperConfig.countryCode,
      Longitude: 0,
      Latitude: 0,
      BuildingNumber: null,
      BuildingName: null,
      Floor: null,
      Apartment: null,
      POBox: null,
      Description: null,
    },
    Contact: {
      Department: "",
      PersonName: shipperConfig.personName,
      Title: "",
      CompanyName: shipperConfig.companyName,
      PhoneNumber1: shipperConfig.phone,
      PhoneNumber1Ext: "",
      PhoneNumber2: "",
      PhoneNumber2Ext: "",
      FaxNumber: "",
      CellPhone: shipperConfig.phone,
      EmailAddress: shipperConfig.email,
      Type: "",
    },
  };

  const consignee: AramexParty = {
    Reference1: orderRef,
    PartyAddress: {
      Line1: customer.address,
      Line2: "",
      Line3: "",
      City: mapCityName(customer.city),
      StateOrProvinceCode: CITY_STATE_MAP[customer.city.toLowerCase()] || "",
      PostCode: "11511",
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
    Contact: {
      Department: "",
      PersonName: `${customer.first_name} ${customer.last_name}`,
      Title: "",
      CompanyName: "",
      PhoneNumber1: customer.phone,
      PhoneNumber1Ext: "",
      PhoneNumber2: "",
      PhoneNumber2Ext: "",
      FaxNumber: "",
      CellPhone: customer.phone,
      EmailAddress: customer.email,
      Type: "",
    },
    AccountNumber: "",
  };

  const itemsDescription = items.map((i) => `${i.name} x${i.quantity}`).join(", ");
  const numberOfPieces = items.length > 0 ? items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 1;
  const actualWeight = Math.max(0.5, 0.5 * numberOfPieces);

  return {
    Reference1: orderRef,
    Reference2: `NAT-${Date.now()}`,
    Shipper: shipper,
    Consignee: consignee,
    ShippingDateTime: `/Date(${Date.now()})/`,
    Comments: `Order: ${orderRef}`,
    Details: {
      Dimensions: {
        Length: 30,
        Width: 20,
        Height: 10,
        Unit: "cm",
      },
      ActualWeight: {
        Value: actualWeight,
        Unit: "Kg",
      },
      DescriptionOfGoods: itemsDescription,
      GoodsOriginCountry: "EG",
      NumberOfPieces: numberOfPieces,
      ProductGroup: "DOM", // Domestic
      ProductType: "COM", // Commercial
      PaymentType: cod ? "C" : "P", // C = COD, P = Prepaid
      CustomsValueAmount: {
        CurrencyCode: "EGP",
        Value: totalValue,
      },
      ...(cod && {
        CashOnDeliveryAmount: {
          Value: codAmount,
          CurrencyCode: "EGP",
        },
      }),
    },
  };
}
