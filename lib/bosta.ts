type BostaOrderType = 10 | 15 | 25 | 30;
type BostaPickupPackageType = "Normal" | "Light Bulky" | "Heavy Bulky";
type BostaPickupRepeatedType = "One Time" | "Daily" | "Weekly";
const BOSTA_EGYPT_COUNTRY_ID = "60e4482c7cb7d4bc4849c4d5";

type BostaDistrict = {
  zoneId?: string;
  zoneName?: string;
  zoneOtherName?: string;
  districtId?: string;
  districtName?: string;
  districtOtherName?: string;
  cityId?: string;
  cityName?: string;
  city?: string;
  pickupAvailability?: boolean;
  dropOffAvailability?: boolean;
  coverage?: string;
};

let bostaDistrictsCache: Promise<BostaDistrict[]> | null = null;

export const BOSTA_STATE_LABELS: Record<number, string> = {
  10: "Pickup requested",
  11: "Waiting for route",
  20: "Route assigned",
  21: "Picked up from business",
  22: "Picking up from consignee",
  23: "Picked up from consignee",
  24: "Received at warehouse",
  25: "Fulfilled",
  30: "In transit between hubs",
  40: "Picking up",
  41: "Picked up",
  45: "Delivered",
  46: "Returned to business",
  47: "Exception",
  48: "Terminated",
  49: "Canceled",
  60: "Returned to stock",
  100: "Lost",
  101: "Damaged",
  102: "Investigation",
  103: "Awaiting your action",
  104: "Archived",
  105: "On hold",
};

export const BOSTA_EXCEPTION_LABELS: Record<number, string> = {
  1: "Retry delivery - customer is not at the address",
  2: "Retry delivery - customer changed the address",
  3: "Postponed - customer requested another day",
  4: "Cancellation - customer wants to open the shipment",
  5: "Waiting for data modification - address or phone is unclear/wrong",
  6: "Cancellation requested by sender",
  7: "Customer is not answering",
  8: "Cancellation - customer refuses to receive the shipment",
  12: "Cancellation - delivery address is outside Bosta coverage",
  13: "Waiting for data modification - address not clear",
  14: "Waiting for data modification - wrong phone number",
  20: "Retry return - business changed the address",
  21: "Postponed - business requested another day",
  22: "Waiting for return data modification - address or phone is unclear/wrong",
  23: "Business is not answering",
  24: "Business refused to receive the shipment",
  25: "Retry return - business is not at the address",
  26: "The order is damaged",
  27: "Empty order",
  28: "The order is incomplete",
  29: "The order does not belong to the business",
  30: "The order was opened while it should not",
  100: "Bad weather",
  101: "Suspicious consignee",
};

export function getBostaStateLabel(state: unknown) {
  const code = typeof state === "number" ? state : Number(state);
  if (!Number.isFinite(code)) return "";
  return BOSTA_STATE_LABELS[code] || `Bosta state ${code}`;
}

export function getBostaExceptionLabel(exceptionCode: unknown) {
  const code = typeof exceptionCode === "number" ? exceptionCode : Number(exceptionCode);
  if (!Number.isFinite(code)) return "";
  return BOSTA_EXCEPTION_LABELS[code] || `Bosta exception ${code}`;
}

export function getOrderStatusFromBostaState(state: unknown) {
  const code = typeof state === "number" ? state : Number(state);
  if (code === 45) return "delivered";
  if (code === 46 || code === 60) return "returned";
  if (code === 49) return "cancelled";
  if (code === 48 || code === 100 || code === 101) return "failed";
  if (code === 10 || code === 11) return "confirmed";
  if (Number.isFinite(code)) return "shipped";
  return "";
}

export type BostaCustomer = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  governorate?: string;
  districtId?: string;
  districtName?: string;
  cityId?: string;
  zoneId?: string;
  secondLine?: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
};

export type BostaShipmentItem = {
  name?: string;
  quantity?: number;
};

export type CreateBostaDeliveryInput = {
  orderRef: string;
  customer: BostaCustomer;
  items: BostaShipmentItem[];
  totalValue: number;
  cod?: boolean;
  codAmount?: number;
};

export type CreateBostaDeliveryResult = {
  success: boolean;
  provider: "bosta";
  trackingNumber?: string;
  trackingLink?: string;
  labelUrl?: string;
  guid?: string;
  raw?: unknown;
  error?: string;
};

export type CreateBostaPickupInput = {
  scheduledDate: string;
  businessLocationId?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
    secPhone?: string;
    email?: string;
  };
  notes?: string;
  numberOfParcels: number;
  packageType?: BostaPickupPackageType;
  repeatedData?: {
    repeatedType?: BostaPickupRepeatedType;
    days?: string[];
    startDate?: string;
    endDate?: string;
  };
};

export type CreateBostaPickupResult = {
  success: boolean;
  provider: "bosta";
  message?: string;
  raw?: unknown;
  error?: string;
};

export type CreateBostaAwbInput = {
  trackingNumbers?: string[];
  ids?: string[];
  requestedAwbType?: "A4" | "A6";
  lang?: "ar" | "en";
};

export type CreateBostaAwbResult = {
  success: boolean;
  provider: "bosta";
  pdfBase64?: string;
  message?: string;
  raw?: unknown;
  error?: string;
};

function getBostaBaseUrl() {
  return (process.env.BOSTA_BASE_URL || "https://app.bosta.co/api/v2").replace(/\/$/, "");
}

function getBostaApiKey() {
  const key = process.env.BOSTA_API_KEY;
  if (!key) {
    throw new Error("BOSTA_API_KEY is not configured");
  }
  return key;
}

function getBostaBusinessLocationId() {
  return process.env.BOSTA_PICKUP_LOCATION_ID || undefined;
}

function getBostaDeliveryLocationId() {
  return process.env.BOSTA_PICKUP_LOCATION_ID || process.env.BOSTA_DELIVERY_LOCATION_ID || undefined;
}

function shouldAllowOpenPackage() {
  return process.env.BOSTA_ALLOW_OPEN_PACKAGE === "true";
}

function getPackageType(itemCount: number) {
  if (itemCount <= 1) return "Small";
  if (itemCount <= 4) return "Medium";
  return "Large";
}

function normalizeAddressSearch(value?: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u0623\u0625\u0622]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("01")) return `+2${digits}`;
  return phone || "";
}

function getBostaPickupContact(input?: CreateBostaPickupInput["contactPerson"]) {
  const contact = {
    name: input?.name || process.env.BOSTA_PICKUP_CONTACT_NAME || "",
    phone: normalizePhone(input?.phone || process.env.BOSTA_PICKUP_CONTACT_PHONE || ""),
    secPhone: normalizePhone(input?.secPhone || process.env.BOSTA_PICKUP_CONTACT_SECOND_PHONE || ""),
    email: input?.email || process.env.BOSTA_PICKUP_CONTACT_EMAIL || "",
  };

  if (!contact.name || !contact.phone) {
    throw new Error("Bosta pickup needs contact name and phone. Add BOSTA_PICKUP_CONTACT_NAME and BOSTA_PICKUP_CONTACT_PHONE.");
  }

  return contact;
}

function getBostaTrackingNumber(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;

  return String(
    nestedData.trackingNumber ||
      nestedData.trackingCode ||
      nestedData.tracking_number ||
      nestedData._id ||
      nestedData.id ||
      "",
  );
}

function getBostaDeliveryId(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;

  return String(nestedData._id || nestedData.id || "");
}

async function fetchBostaDistricts() {
  if (bostaDistrictsCache) return bostaDistrictsCache;

  const normalizeDistrictsPayload = (data: unknown): BostaDistrict[] => {
    const records = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)
        ? (data as Record<string, unknown>).data as unknown[]
        : [];

    return records.flatMap((record): BostaDistrict[] => {
      if (!record || typeof record !== "object") return [];
      const city = record as BostaDistrict & { districts?: BostaDistrict[] };

      if (Array.isArray(city.districts)) {
        return city.districts.map((district) => ({
          ...district,
          cityId: district.cityId || city.cityId,
          cityName: district.cityName || city.cityName,
          city: district.city || city.cityName,
        }));
      }

      return [city as BostaDistrict];
    });
  };

  bostaDistrictsCache = fetch(`${getBostaBaseUrl()}/cities/getAllDistricts?countryId=${BOSTA_EGYPT_COUNTRY_ID}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "force-cache",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Bosta districts error: ${response.status} - ${text}`);
      }

      const data = text ? JSON.parse(text) as unknown : [];
      return normalizeDistrictsPayload(data);
    })
    .catch((error) => {
      bostaDistrictsCache = null;
      throw error;
    });

  return bostaDistrictsCache;
}

function scoreBostaDistrict(district: BostaDistrict, customer: BostaCustomer) {
  if (district.dropOffAvailability === false) return -1;

  const customerDistrict = normalizeAddressSearch(customer.districtName || customer.city);
  const customerGovernorate = normalizeAddressSearch(customer.governorate);
  const districtNames = [
    district.districtName,
    district.districtOtherName,
    district.zoneName,
    district.zoneOtherName,
  ].map(normalizeAddressSearch).filter(Boolean);
  const cityNames = [
    district.cityName,
    district.city,
  ].map(normalizeAddressSearch).filter(Boolean);

  let score = 0;
  if (customerDistrict && districtNames.some((name) => name === customerDistrict)) score += 100;
  if (customerDistrict && districtNames.some((name) => name.includes(customerDistrict) || customerDistrict.includes(name))) score += 60;
  if (customerGovernorate && cityNames.some((name) => name === customerGovernorate)) score += 25;
  if (district.coverage === "BOSTA") score += 5;

  return score;
}

async function resolveBostaDistrict(customer: BostaCustomer) {
  if (customer.districtId) {
    return {
      districtId: customer.districtId,
      districtName: customer.districtName || customer.city || "",
      cityId: customer.cityId || "",
      city: customer.governorate || customer.city || "",
      zoneId: customer.zoneId || "",
    };
  }

  const districts = await fetchBostaDistricts();
  const match = districts
    .map((district) => ({ district, score: scoreBostaDistrict(district, customer) }))
    .filter((entry) => entry.score > 0 && entry.district.districtId)
    .sort((a, b) => b.score - a.score)[0]?.district;

  if (match?.districtId) {
    return {
      districtId: match.districtId,
      districtName: match.districtName || customer.city || "",
      cityId: match.cityId || customer.cityId || "",
      city: match.cityName || match.city || customer.governorate || customer.city || "",
      zoneId: match.zoneId || customer.zoneId || "",
    };
  }

  const fallbackDistrictId = process.env.BOSTA_DEFAULT_DISTRICT_ID || "";
  const fallbackDistrictName = process.env.BOSTA_DEFAULT_DISTRICT_NAME || "";
  const fallbackCityId = process.env.BOSTA_DEFAULT_CITY_ID || "";

  if (fallbackDistrictId || (fallbackDistrictName && fallbackCityId)) {
    return {
      districtId: fallbackDistrictId,
      districtName: fallbackDistrictName || customer.city || "",
      cityId: fallbackCityId,
      city: customer.governorate || customer.city || "Cairo",
      zoneId: process.env.BOSTA_DEFAULT_ZONE_ID || "",
    };
  }

  throw new Error(
    `Could not match Bosta district for "${customer.city || "unknown city"}". Choose a supported Bosta district or configure BOSTA_DEFAULT_DISTRICT_ID.`,
  );
}

async function buildDropOffAddress(customer: BostaCustomer) {
  const resolvedDistrict = await resolveBostaDistrict(customer);
  const districtId = resolvedDistrict.districtId || "";
  const districtName = resolvedDistrict.districtName || customer.districtName || customer.city || "";
  const cityId = resolvedDistrict.cityId || customer.cityId || "";
  const firstLine = (customer.address || "").trim();

  if (!districtId && !(districtName && cityId)) {
    throw new Error(
      "Bosta address needs districtId, or districtName + cityId. Add BOSTA_DEFAULT_CITY_ID or pass Bosta district data from checkout.",
    );
  }

  if (firstLine.length < 6) {
    throw new Error("Bosta address firstLine is required and must be more than 5 characters.");
  }

  return {
    city: resolvedDistrict.city || customer.governorate || customer.city || "Cairo",
    ...(districtId ? { districtId } : { districtName, cityId }),
    ...(resolvedDistrict.zoneId
      ? { zoneId: resolvedDistrict.zoneId }
      : {}),
    firstLine,
    secondLine: customer.secondLine || "",
    buildingNumber: customer.buildingNumber || "",
    floor: customer.floor || "",
    apartment: customer.apartment || "",
    isWorkAddress: false,
  };
}

export async function createBostaDelivery(input: CreateBostaDeliveryInput): Promise<CreateBostaDeliveryResult> {
  const itemCount = input.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const description = input.items
    .map((item) => `${item.name || "Product"} x${Math.max(1, Number(item.quantity || 1))}`)
    .join(", ")
    .slice(0, 250);
  const orderType: BostaOrderType = 10;
  const payload = {
    type: orderType,
    businessReference: input.orderRef,
    ...(getBostaDeliveryLocationId() ? { businessLocationId: getBostaDeliveryLocationId() } : {}),
    ...(input.cod ? { cod: Math.round(Number(input.codAmount || input.totalValue || 0)) } : {}),
    receiver: {
      firstName: input.customer.first_name || "Customer",
      lastName: input.customer.last_name || "",
      phone: normalizePhone(input.customer.phone),
      email: input.customer.email || undefined,
    },
    allowToOpenPackage: shouldAllowOpenPackage(),
    dropOffAddress: await buildDropOffAddress(input.customer),
    specs: {
      packageDetails: {
        description,
        itemsCount: itemCount,
      },
      packageType: getPackageType(itemCount),
    },
    ...(process.env.BOSTA_WEBHOOK_URL
      ? {
          webhookUrl: process.env.BOSTA_WEBHOOK_URL,
          webhookCustomHeaders: process.env.BOSTA_WEBHOOK_SECRET
            ? { "x-bosta-webhook-secret": process.env.BOSTA_WEBHOOK_SECRET }
            : undefined,
        }
      : {}),
    notes: input.orderRef,
  };

  const response = await fetch(`${getBostaBaseUrl()}/deliveries?apiVersion=1`, {
    method: "POST",
    headers: {
      Authorization: getBostaApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  });

  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep text for diagnostics.
  }

  if (!response.ok) {
    return {
      success: false,
      provider: "bosta",
      raw: data,
      error: `Bosta delivery error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const trackingNumber = getBostaTrackingNumber(data);
  const deliveryId = getBostaDeliveryId(data);

  return {
    success: Boolean(trackingNumber || deliveryId),
    provider: "bosta",
    trackingNumber: trackingNumber || deliveryId,
    trackingLink: trackingNumber ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}` : undefined,
    guid: deliveryId || undefined,
    raw: data,
    error: trackingNumber || deliveryId ? undefined : "Bosta response did not include a delivery/tracking id",
  };
}

export async function createBostaPickup(input: CreateBostaPickupInput): Promise<CreateBostaPickupResult> {
  const businessLocationId = input.businessLocationId || getBostaBusinessLocationId();

  if (!businessLocationId) {
    throw new Error("BOSTA_PICKUP_LOCATION_ID is not configured. Bosta delivery can use the default location, but pickup requests need the real pickup location id.");
  }

  if (!input.scheduledDate) {
    throw new Error("Bosta pickup needs scheduledDate in YYYY-MM-DD format");
  }

  const numberOfParcels = Math.max(1, Math.round(Number(input.numberOfParcels || 1)));
  const repeatedType = input.repeatedData?.repeatedType || "One Time";
  const payload = {
    scheduledDate: input.scheduledDate,
    businessLocationId,
    contactPerson: getBostaPickupContact(input.contactPerson),
    notes: input.notes || "",
    numberOfParcels,
    packageType: input.packageType || "Normal",
    repeatedData: {
      repeatedType,
      days: input.repeatedData?.days || [],
      startDate: input.repeatedData?.startDate || input.scheduledDate,
      endDate: input.repeatedData?.endDate || input.scheduledDate,
    },
  };

  const response = await fetch(`${getBostaBaseUrl()}/pickups`, {
    method: "POST",
    headers: {
      Authorization: getBostaApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  });

  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep text for diagnostics.
  }

  if (!response.ok) {
    return {
      success: false,
      provider: "bosta",
      raw: data,
      error: `Bosta pickup error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : "Pickup request created",
    raw: data,
  };
}

function getBase64FromAwbResponse(data: unknown) {
  if (typeof data === "string") {
    const cleaned = data.replace(/^data:application\/pdf;base64,/, "").trim();
    return cleaned.length > 100 ? cleaned : "";
  }

  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;

  for (const key of ["pdf", "file", "awb", "base64", "pdfBase64", "airWaybill"]) {
    const value = nestedData[key];
    if (typeof value === "string" && value.trim().length > 100) {
      return value.replace(/^data:application\/pdf;base64,/, "").trim();
    }
  }

  return "";
}

export async function createBostaAwb(input: CreateBostaAwbInput): Promise<CreateBostaAwbResult> {
  const trackingNumbers = (input.trackingNumbers || []).map((value) => value.trim()).filter(Boolean);
  const ids = (input.ids || []).map((value) => value.trim()).filter(Boolean);

  if (!trackingNumbers.length && !ids.length) {
    throw new Error("Bosta AWB needs trackingNumbers or delivery ids");
  }

  const payload = {
    ...(trackingNumbers.length ? { trackingNumbers: trackingNumbers.join(",") } : { ids: ids.join(",") }),
    requestedAwbType: input.requestedAwbType || "A4",
    lang: input.lang || "ar",
  };

  const response = await fetch(`${getBostaBaseUrl()}/deliveries/mass-awb`, {
    method: "POST",
    headers: {
      Authorization: getBostaApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json, application/pdf",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  });

  const contentType = response.headers.get("content-type") || "";
  let data: unknown;

  if (contentType.includes("application/pdf")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    data = buffer.toString("base64");
  } else {
    const text = await response.text();
    data = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // Keep text for diagnostics or direct base64 responses.
    }
  }

  if (!response.ok) {
    return {
      success: false,
      provider: "bosta",
      raw: data,
      error: `Bosta AWB error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const pdfBase64 = getBase64FromAwbResponse(data);
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};

  return {
    success: Boolean(pdfBase64 || record.success),
    provider: "bosta",
    pdfBase64,
    message: typeof record.message === "string" ? record.message : undefined,
    raw: data,
    error: pdfBase64 || record.success ? undefined : "Bosta AWB response did not include a printable PDF",
  };
}
