type BostaOrderType = 10 | 15 | 25 | 30;
type BostaPickupPackageType = "Normal" | "Light Bulky" | "Heavy Bulky";
type BostaPickupRepeatedType = "One Time" | "Daily" | "Weekly";

type BostaDistrict = {
  zoneId?: string;
  zoneName?: string;
  zoneOtherName?: string;
  districtId?: string;
  "districtI\""?: string;
  districtName?: string;
  districtOtherName?: string;
  cityId?: string;
  cityName?: string;
  cityOtherName?: string;
  cityCode?: string;
  city?: string;
  pickupAvailability?: boolean;
  dropOffAvailability?: boolean;
  coverage?: string;
};

export type BostaCity = {
  _id?: string;
  id?: string;
  name?: string;
  nameAr?: string;
  alias?: string;
  code?: string;
  sector?: number;
  pickupAvailability?: boolean;
  dropOffAvailability?: boolean;
  showAsDropOffCity?: boolean;
  showAsPickupCity?: boolean;
  hub?: {
    _id?: string;
    name?: string;
  };
};

export type BostaZone = {
  _id?: string;
  id?: string;
  name?: string;
  districts?: string[];
  showAsDropOffZone?: boolean;
  showAsPickupZone?: boolean;
  city?: {
    _id?: string;
    name?: string;
  };
};

let bostaDistrictsCache: Promise<BostaDistrict[]> | null = null;
let bostaCitiesCache: Promise<BostaCity[]> | null = null;
const bostaCityCache = new Map<string, Promise<BostaCity | null>>();
const bostaCityZonesCache = new Map<string, Promise<BostaZone[]>>();
const bostaCityDistrictsCache = new Map<string, Promise<BostaDistrict[]>>();

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
  secondPhone?: string;
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
  title?: string;
  slug?: string;
  type?: string;
  size?: string;
  selectedSize?: string;
  variantSize?: string;
  color?: string;
  selectedColor?: string;
  variant?: string;
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

function formatBostaShipmentItem(item: BostaShipmentItem) {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const name = String(item.name || item.title || item.slug || "Product").trim();
  const size = String(item.size || item.selectedSize || item.variantSize || "").trim();
  const color = String(item.color || item.selectedColor || item.variant || "").trim();
  const type = String(item.type || "").trim();
  const details = [
    name,
    size ? `Size ${size.toUpperCase()}` : "",
    color ? `Color ${color}` : "",
    type && !name.toLowerCase().includes(type.toLowerCase()) ? type : "",
    `Qty ${quantity}`,
  ].filter(Boolean);

  return details.join(" - ");
}

export type BostaPickupLocationContact = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isDefault?: boolean;
};

export type BostaPickupLocationAddress = {
  districtId?: string;
  firstLine?: string;
  secondLine?: string;
  floor?: string;
  apartment?: string;
  buildingNumber?: string;
};

export type BostaPickupLocation = Record<string, unknown> & {
  _id?: string;
  id?: string;
  locationName?: string;
  isDefault?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  contacts?: BostaPickupLocationContact[];
  address?: BostaPickupLocationAddress & Record<string, unknown>;
};

export type BostaPickupLocationInput = {
  locationName: string;
  contacts?: BostaPickupLocationContact[];
  address: BostaPickupLocationAddress;
};

export type BostaPickupLocationResult = {
  success: boolean;
  provider: "bosta";
  message?: string;
  location?: BostaPickupLocation | null;
  locations?: BostaPickupLocation[];
  raw?: unknown;
  error?: string;
};

export type CreateDefaultBostaPickupLocationInput = {
  businessId?: string;
  pickupAddress: Array<{
    locationName: string;
    districtId: string;
    firstLine: string;
    buildingNumber?: string;
    floor?: string;
    apartment?: string;
    secondLine?: string;
  }>;
};

export type SearchBostaDeliveriesInput = {
  type?: "SEND" | "CASH_COLLECTION" | "RETURN" | "RTO" | "EXCHANGE" | "CUSTOMER_RETURN_PICKUP";
  trackingNumbers?: string[];
  mobilePhones?: string;
  businessReference?: string;
  stateCodes?: string[];
};

export type BostaDeliverySearchRecord = Record<string, unknown> & {
  _id?: string;
  trackingNumber?: string;
  businessReference?: string;
  state?: {
    code?: number | string;
    value?: string;
  };
};

export type SearchBostaDeliveriesResult = {
  success: boolean;
  provider: "bosta";
  deliveries: BostaDeliverySearchRecord[];
  message?: string;
  raw?: unknown;
  error?: string;
};

export type TerminateBostaDeliveryResult = {
  success: boolean;
  provider: "bosta";
  message?: string;
  deliveryId?: string;
  raw?: unknown;
  error?: string;
};

export type UpdateBostaDeliveryInput = {
  trackingNumber: string;
  customer?: BostaCustomer;
  cod?: number;
  allowToOpenPackage?: boolean;
};

export type UpdateBostaDeliveryResult = {
  success: boolean;
  provider: "bosta";
  message?: string;
  deliveryId?: string;
  raw?: unknown;
  error?: string;
};

export type BostaDeliveryAnalyticsResult = {
  success: boolean;
  provider: "bosta";
  data?: Record<string, unknown>;
  message?: string;
  raw?: unknown;
  error?: string;
};

function getBostaBaseUrl() {
  return (process.env.BOSTA_BASE_URL || "https://app.bosta.co/api/v2").replace(/\/$/, "");
}

function getBostaApiKey() {
  const rawKey =
    process.env.BOSTA_API_KEY ||
    process.env.BOSTA_TOKEN ||
    process.env.BOSTA_ACCESS_TOKEN ||
    "";
  const key = rawKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^authorization:\s*/i, "")
    .replace(/^token:\s*/i, "")
    .trim();
  if (!key) {
    throw new Error("BOSTA_API_KEY is not configured");
  }
  return key;
}

function getBostaAuthorizationHeader() {
  const key = getBostaApiKey();
  const token = key.replace(/^bearer\s+/i, "").trim();
  return `Bearer ${token}`;
}

function getBostaAuthHeaderAttempts(): Array<{ label: string; headers: Record<string, string> }> {
  const key = getBostaApiKey();
  const token = key.replace(/^bearer\s+/i, "").trim();
  return [
    { label: "authorization_bearer", headers: { Authorization: `Bearer ${token}` } },
    { label: "authorization_raw", headers: { Authorization: token } },
    { label: "authorization_token", headers: { Authorization: `Token ${token}` } },
    { label: "x_api_key", headers: { "x-api-key": token } },
  ];
}

export function getBostaConfigDiagnostics() {
  const rawKey =
    process.env.BOSTA_API_KEY ||
    process.env.BOSTA_TOKEN ||
    process.env.BOSTA_ACCESS_TOKEN ||
    "";
  const cleanedKey = rawKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^authorization:\s*/i, "")
    .replace(/^token:\s*/i, "")
    .replace(/^bearer\s+/i, "")
    .trim();

  return {
    baseUrl: getBostaBaseUrl(),
    hasApiKey: cleanedKey.length > 0,
    apiKeyLength: cleanedKey.length,
    apiKeyPreview: cleanedKey ? `${cleanedKey.slice(0, 4)}...${cleanedKey.slice(-4)}` : "",
    hadWhitespaceOrWrapper: rawKey !== cleanedKey,
    hasPickupLocationId: Boolean(getBostaDeliveryLocationId()),
    hasDefaultDistrictId: Boolean(process.env.BOSTA_DEFAULT_DISTRICT_ID),
    hasDefaultCityId: Boolean(process.env.BOSTA_DEFAULT_CITY_ID),
  };
}

function getBostaBusinessLocationId() {
  return process.env.BOSTA_PICKUP_LOCATION_ID || undefined;
}

function getBostaBusinessId() {
  return process.env.BOSTA_BUSINESS_ID || process.env.BOSTA_BUSINESS_ID_RECEIVED_ON_LOGIN || undefined;
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

function normalizeLatinAddressSound(value: string) {
  return value
    .replace(/\b(el|al)\b/g, "")
    .replace(/q/g, "k")
    .replace(/[aeiou]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function getAddressSearchKeys(value?: string) {
  const normalized = normalizeAddressSearch(value);
  if (!normalized) return [];

  const keys = new Set([normalized]);
  const latinSound = normalizeLatinAddressSound(normalized);
  if (latinSound) keys.add(latinSound);

  return Array.from(keys);
}

function addressKeysMatch(
  customerKeys: string[],
  candidateKeys: string[],
  mode: "exact" | "contains",
) {
  return customerKeys.some((customerKey) =>
    candidateKeys.some((candidateKey) => {
      if (mode === "exact") return candidateKey === customerKey;
      return candidateKey.includes(customerKey) || customerKey.includes(candidateKey);
    }),
  );
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

export async function fetchBostaDistricts() {
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
          districtId: district.districtId || district["districtI\""],
          cityId: district.cityId || city.cityId,
          cityName: district.cityName || city.cityName,
          cityOtherName: district.cityOtherName || city.cityOtherName,
          cityCode: district.cityCode || city.cityCode,
          city: district.city || city.cityName,
        }));
      }

      return [{
        ...city,
        districtId: city.districtId || city["districtI\""],
      } as BostaDistrict];
    });
  };

  bostaDistrictsCache = fetch(`${getBostaBaseUrl()}/cities/getAllDistricts`, {
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

export async function fetchBostaCities() {
  if (bostaCitiesCache) return bostaCitiesCache;

  const normalizeCitiesPayload = (data: unknown): BostaCity[] => {
    const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const nestedData = record.data && typeof record.data === "object"
      ? record.data as Record<string, unknown>
      : record;
    const list = Array.isArray(nestedData.list)
      ? nestedData.list
      : Array.isArray(nestedData.cities)
        ? nestedData.cities
        : Array.isArray(data)
          ? data
          : [];

    return list
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
      .map((item) => ({
        _id: typeof item._id === "string" ? item._id : undefined,
        id: typeof item.id === "string" ? item.id : undefined,
        name: typeof item.name === "string" ? item.name : undefined,
        nameAr: typeof item.nameAr === "string" ? item.nameAr : undefined,
        alias: typeof item.alias === "string" ? item.alias : undefined,
        code: typeof item.code === "string" ? item.code : undefined,
        sector: typeof item.sector === "number" ? item.sector : undefined,
        pickupAvailability: typeof item.pickupAvailability === "boolean" ? item.pickupAvailability : undefined,
        dropOffAvailability: typeof item.dropOffAvailability === "boolean" ? item.dropOffAvailability : undefined,
        showAsDropOffCity: typeof item.showAsDropOffCity === "boolean" ? item.showAsDropOffCity : undefined,
        showAsPickupCity: typeof item.showAsPickupCity === "boolean" ? item.showAsPickupCity : undefined,
        hub: item.hub && typeof item.hub === "object" && !Array.isArray(item.hub)
          ? item.hub as BostaCity["hub"]
          : undefined,
      }))
      .filter((city) => city.name || city.nameAr || city._id);
  };

  bostaCitiesCache = fetch(`${getBostaBaseUrl()}/cities`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    cache: "force-cache",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Bosta cities error: ${response.status} - ${text}`);
      }

      const data = text ? JSON.parse(text) as unknown : [];
      return normalizeCitiesPayload(data);
    })
    .catch((error) => {
      bostaCitiesCache = null;
      throw error;
    });

  return bostaCitiesCache;
}

export async function fetchBostaCity(cityId: string) {
  const normalizedCityId = cityId.trim();
  if (!normalizedCityId) return null;
  const cached = bostaCityCache.get(normalizedCityId);
  if (cached) return cached;

  const request = fetch(`${getBostaBaseUrl()}/cities/${encodeURIComponent(normalizedCityId)}`, {
    method: "GET",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "force-cache",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Bosta city error: ${response.status} - ${text}`);
      }

      const payload = text ? JSON.parse(text) as unknown : {};
      const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
      return {
        _id: typeof data._id === "string" ? data._id : normalizedCityId,
        id: typeof data.id === "string" ? data.id : undefined,
        name: typeof data.name === "string" ? data.name : undefined,
        nameAr: typeof data.nameAr === "string" ? data.nameAr : undefined,
        alias: typeof data.alias === "string" ? data.alias : undefined,
        code: typeof data.code === "string" ? data.code : undefined,
        sector: typeof data.sector === "number" ? data.sector : undefined,
        showAsDropOffCity: typeof data.showAsDropOffCity === "boolean" ? data.showAsDropOffCity : undefined,
        showAsPickupCity: typeof data.showAsPickupCity === "boolean" ? data.showAsPickupCity : undefined,
      } satisfies BostaCity;
    })
    .catch((error) => {
      bostaCityCache.delete(normalizedCityId);
      throw error;
    });

  bostaCityCache.set(normalizedCityId, request);
  return request;
}

export async function fetchBostaCityZones(cityId: string) {
  const normalizedCityId = cityId.trim();
  if (!normalizedCityId) return [];
  const cached = bostaCityZonesCache.get(normalizedCityId);
  if (cached) return cached;

  const request = fetch(`${getBostaBaseUrl()}/cities/${encodeURIComponent(normalizedCityId)}/zones`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    cache: "force-cache",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Bosta city zones error: ${response.status} - ${text}`);
      }

      const payload = text ? JSON.parse(text) as unknown : [];
      const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const data = Array.isArray(record.data) ? record.data : Array.isArray(payload) ? payload : [];
      return data
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
        .map((item) => ({
          _id: typeof item._id === "string" ? item._id : undefined,
          id: typeof item.id === "string" ? item.id : undefined,
          name: typeof item.name === "string" ? item.name : undefined,
          districts: Array.isArray(item.districts) ? item.districts.filter((value): value is string => typeof value === "string") : [],
          showAsDropOffZone: typeof item.showAsDropOffZone === "boolean" ? item.showAsDropOffZone : undefined,
          showAsPickupZone: typeof item.showAsPickupZone === "boolean" ? item.showAsPickupZone : undefined,
          city: item.city && typeof item.city === "object" && !Array.isArray(item.city)
            ? item.city as BostaZone["city"]
            : undefined,
        }));
    })
    .catch((error) => {
      bostaCityZonesCache.delete(normalizedCityId);
      throw error;
    });

  bostaCityZonesCache.set(normalizedCityId, request);
  return request;
}

export async function fetchBostaCityDistricts(cityId: string) {
  const normalizedCityId = cityId.trim();
  if (!normalizedCityId) return [];
  const cached = bostaCityDistrictsCache.get(normalizedCityId);
  if (cached) return cached;

  const request = fetch(`${getBostaBaseUrl()}/cities/${encodeURIComponent(normalizedCityId)}/districts`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    cache: "force-cache",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Bosta city districts error: ${response.status} - ${text}`);
      }

      const payload = text ? JSON.parse(text) as unknown : [];
      const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const data = Array.isArray(record.data) ? record.data : Array.isArray(payload) ? payload : [];
      return data
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
        .map((district) => ({
          zoneId: typeof district.zoneId === "string" ? district.zoneId : undefined,
          zoneName: typeof district.zoneName === "string" ? district.zoneName : undefined,
          zoneOtherName: typeof district.zoneOtherName === "string" ? district.zoneOtherName : undefined,
          districtId: typeof district.districtId === "string"
            ? district.districtId
            : typeof district["districtI\""] === "string"
              ? district["districtI\""] as string
              : undefined,
          districtName: typeof district.districtName === "string" ? district.districtName : undefined,
          districtOtherName: typeof district.districtOtherName === "string" ? district.districtOtherName : undefined,
          cityId: normalizedCityId,
          pickupAvailability: typeof district.pickupAvailability === "boolean" ? district.pickupAvailability : undefined,
          dropOffAvailability: typeof district.dropOffAvailability === "boolean" ? district.dropOffAvailability : undefined,
        }));
    })
    .catch((error) => {
      bostaCityDistrictsCache.delete(normalizedCityId);
      throw error;
    });

  bostaCityDistrictsCache.set(normalizedCityId, request);
  return request;
}

function scoreBostaDistrict(district: BostaDistrict, customer: BostaCustomer) {
  if (district.dropOffAvailability === false) return -1;

  const customerDistrictKeys = getAddressSearchKeys(customer.districtName || customer.city);
  const customerCityKeys = getAddressSearchKeys(customer.city);
  const customerGovernorateKeys = getAddressSearchKeys(customer.governorate);
  const districtNameKeys = [
    district.districtName,
    district.districtOtherName,
    district.zoneName,
    district.zoneOtherName,
  ].flatMap(getAddressSearchKeys);
  const cityNameKeys = [
    district.cityName,
    district.cityOtherName,
    district.city,
  ].flatMap(getAddressSearchKeys);

  let score = 0;
  if (addressKeysMatch(customerDistrictKeys, districtNameKeys, "exact")) score += 120;
  if (addressKeysMatch(customerDistrictKeys, districtNameKeys, "contains")) score += 70;
  if (addressKeysMatch(customerCityKeys, districtNameKeys, "exact")) score += 40;
  if (addressKeysMatch(customerGovernorateKeys, cityNameKeys, "exact")) score += 35;
  if (addressKeysMatch(customerGovernorateKeys, cityNameKeys, "contains")) score += 15;
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

function getBostaAddressDiagnostics(address: Record<string, unknown>, customer: BostaCustomer) {
  return {
    city: String(address.city || ""),
    cityId: String(address.cityId || customer.cityId || ""),
    districtId: String(address.districtId || ""),
    districtName: String(address.districtName || customer.districtName || ""),
    zoneId: String(address.zoneId || customer.zoneId || ""),
    firstLineLength: String(address.firstLine || customer.address || "").length,
    customerCity: customer.city || "",
    customerGovernorate: customer.governorate || "",
  };
}

function formatBostaDiagnosticsParts(parts: Record<string, unknown>) {
  return Object.entries(parts)
    .map(([key, value]) => `${key}=${String(value || "") || "empty"}`)
    .join(", ");
}

export async function createBostaDelivery(input: CreateBostaDeliveryInput): Promise<CreateBostaDeliveryResult> {
  const itemCount = input.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const description = input.items
    .map(formatBostaShipmentItem)
    .join(", ")
    .slice(0, 250);

  try {
    const existingDelivery = await searchBostaDeliveries({ businessReference: input.orderRef });
    const isReusableDelivery = (delivery: BostaDeliverySearchRecord) => {
      const state = delivery.state && typeof delivery.state === "object" ? delivery.state.code : delivery.state;
      const code = typeof state === "number" ? state : Number(state);
      return ![48, 49, 100, 101].includes(code);
    };
    const existing = existingDelivery.deliveries.find(
      (delivery) => delivery.businessReference === input.orderRef && isReusableDelivery(delivery),
    ) || existingDelivery.deliveries.find(isReusableDelivery);
    if (existingDelivery.success && existing) {
      const trackingNumber = getBostaTrackingNumber(existing);
      const deliveryId = getBostaDeliveryId(existing);
      if (trackingNumber || deliveryId) {
        return {
          success: true,
          provider: "bosta",
          trackingNumber: trackingNumber || deliveryId,
          trackingLink: trackingNumber ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}` : undefined,
          guid: deliveryId || undefined,
          raw: existing,
        };
      }
    }
  } catch (error) {
    console.error("Bosta duplicate check failed before create", {
      order_ref: input.orderRef,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const orderType: BostaOrderType = 10;
  const dropOffAddress = await buildDropOffAddress(input.customer);
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
    dropOffAddress,
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
    notes: `${input.orderRef}${description ? ` | ${description}` : ""}`.slice(0, 250),
  };

  const authAttempts = getBostaAuthHeaderAttempts();
  let response: Response | null = null;
  let text = "";
  let data: unknown = {};
  const attemptedAuthLabels: string[] = [];

  for (const attempt of authAttempts) {
    attemptedAuthLabels.push(attempt.label);
    response = await fetch(`${getBostaBaseUrl()}/deliveries?apiVersion=1`, {
      method: "POST",
      headers: {
        ...attempt.headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    text = await response.text();
    data = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // Keep text for diagnostics.
    }

    if (response.ok || (response.status !== 401 && response.status !== 403)) break;
  }

  if (!response) {
    return {
      success: false,
      provider: "bosta",
      raw: null,
      error: "Bosta delivery error: request was not sent",
    };
  }

  if (!response.ok) {
    const diagnostics = getBostaConfigDiagnostics();
    const addressDiagnostics = getBostaAddressDiagnostics(dropOffAddress, input.customer);
    return {
      success: false,
      provider: "bosta",
      raw: data,
      error: [
        `Bosta delivery error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
        `Diagnostics: baseUrl=${diagnostics.baseUrl}`,
        `hasApiKey=${diagnostics.hasApiKey}`,
        `apiKeyLength=${diagnostics.apiKeyLength}`,
        `apiKeyPreview=${diagnostics.apiKeyPreview || "empty"}`,
        `hadWhitespaceOrWrapper=${diagnostics.hadWhitespaceOrWrapper}`,
        `authAttempts=${attemptedAuthLabels.join(">")}`,
        `address={${formatBostaDiagnosticsParts(addressDiagnostics)}}`,
      ].join(" | "),
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

function parseBostaJsonResponse(data: unknown) {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  return { record, nestedData };
}

function normalizePickupLocation(value: unknown): BostaPickupLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    ...record,
    _id: typeof record._id === "string" ? record._id : undefined,
    id: typeof record.id === "string" ? record.id : undefined,
    locationName: typeof record.locationName === "string" ? record.locationName : undefined,
    isDefault: typeof record.isDefault === "boolean" ? record.isDefault : undefined,
    canEdit: typeof record.canEdit === "boolean" ? record.canEdit : undefined,
    canDelete: typeof record.canDelete === "boolean" ? record.canDelete : undefined,
    contactPerson: record.contactPerson && typeof record.contactPerson === "object" && !Array.isArray(record.contactPerson)
      ? record.contactPerson as BostaPickupLocation["contactPerson"]
      : undefined,
    contacts: Array.isArray(record.contacts)
      ? record.contacts.filter((contact): contact is BostaPickupLocationContact => Boolean(contact && typeof contact === "object" && !Array.isArray(contact)))
      : [],
    address: record.address && typeof record.address === "object" && !Array.isArray(record.address)
      ? record.address as BostaPickupLocation["address"]
      : undefined,
  };
}

function normalizePickupLocationsPayload(data: unknown): BostaPickupLocation[] {
  const { record, nestedData } = parseBostaJsonResponse(data);
  const list = Array.isArray(nestedData.list)
    ? nestedData.list
    : Array.isArray(nestedData.locations)
      ? nestedData.locations
      : Array.isArray(record.list)
        ? record.list
        : Array.isArray(data)
          ? data
          : [];

  return list.map(normalizePickupLocation).filter((location): location is BostaPickupLocation => Boolean(location));
}

export async function listBostaPickupLocations(): Promise<BostaPickupLocationResult> {
  const response = await fetch(`${getBostaBaseUrl()}/pickup-locations`, {
    method: "GET",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
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
      error: `Bosta pickup locations error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const { record } = parseBostaJsonResponse(data);
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : undefined,
    locations: normalizePickupLocationsPayload(data),
    raw: data,
  };
}

async function getDefaultBostaPickupLocationId() {
  const configured = getBostaBusinessLocationId();
  if (configured) return configured;

  const result = await listBostaPickupLocations();
  if (!result.success) return "";

  const locations = result.locations || [];
  const defaultLocation = locations.find((location) => location.isDefault) || locations[0];
  return defaultLocation?._id || defaultLocation?.id || "";
}

export async function getBostaPickupLocation(id: string): Promise<BostaPickupLocationResult> {
  const locationId = id.trim();
  if (!locationId) {
    return { success: false, provider: "bosta", location: null, error: "Pickup location id is required" };
  }

  const response = await fetch(`${getBostaBaseUrl()}/pickup-locations/${encodeURIComponent(locationId)}`, {
    method: "GET",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
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
      error: `Bosta pickup location error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const { record, nestedData } = parseBostaJsonResponse(data);
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : undefined,
    location: normalizePickupLocation(nestedData),
    raw: data,
  };
}

export async function updateBostaPickupLocation(id: string, input: BostaPickupLocationInput): Promise<BostaPickupLocationResult> {
  const locationId = id.trim();
  if (!locationId) {
    return { success: false, provider: "bosta", error: "Pickup location id is required" };
  }

  const payload = {
    locationName: input.locationName,
    contacts: input.contacts?.length ? input.contacts : [],
    address: input.address,
  };

  const response = await fetch(`${getBostaBaseUrl()}/pickup-locations/${encodeURIComponent(locationId)}`, {
    method: "PUT",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
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
      error: `Bosta update pickup location error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const { record, nestedData } = parseBostaJsonResponse(data);
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : undefined,
    location: normalizePickupLocation(nestedData),
    raw: data,
  };
}

export async function deleteBostaPickupLocation(id: string): Promise<BostaPickupLocationResult> {
  const locationId = id.trim();
  if (!locationId) {
    return { success: false, provider: "bosta", error: "Pickup location id is required" };
  }

  const response = await fetch(`${getBostaBaseUrl()}/pickup-locations/${encodeURIComponent(locationId)}`, {
    method: "DELETE",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30000),
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
      error: `Bosta delete pickup location error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const { record } = parseBostaJsonResponse(data);
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : undefined,
    raw: data,
  };
}

export async function createDefaultBostaPickupLocation(input: CreateDefaultBostaPickupLocationInput): Promise<BostaPickupLocationResult> {
  const businessId = (input.businessId || getBostaBusinessId() || "").trim();
  if (!businessId) {
    return {
      success: false,
      provider: "bosta",
      error: "Bosta business id is required. Set BOSTA_BUSINESS_ID or pass businessId.",
    };
  }

  const response = await fetch(`${getBostaBaseUrl()}/businesses/${encodeURIComponent(businessId)}`, {
    method: "PUT",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ pickupAddress: input.pickupAddress }),
    signal: AbortSignal.timeout(30000),
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
      error: `Bosta create default pickup location error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const { record } = parseBostaJsonResponse(data);
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : undefined,
    raw: data,
  };
}

export async function createBostaPickup(input: CreateBostaPickupInput): Promise<CreateBostaPickupResult> {
  const businessLocationId = input.businessLocationId || await getDefaultBostaPickupLocationId();

  if (!businessLocationId) {
    throw new Error("No Bosta pickup location found. Set BOSTA_PICKUP_LOCATION_ID or create/default a pickup location in Bosta.");
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
      Authorization: getBostaAuthorizationHeader(),
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
      Authorization: getBostaAuthorizationHeader(),
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

function normalizeBostaSearchData(data: unknown): BostaDeliverySearchRecord[] {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const rawData = record.data;
  const candidates = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === "object" && Array.isArray((rawData as Record<string, unknown>).deliveries)
      ? (rawData as Record<string, unknown>).deliveries as unknown[]
      : rawData && typeof rawData === "object" && Array.isArray((rawData as Record<string, unknown>).list)
        ? (rawData as Record<string, unknown>).list as unknown[]
        : rawData && typeof rawData === "object"
          ? [rawData]
          : Array.isArray(data)
            ? data
            : [];

  return candidates.filter((item): item is BostaDeliverySearchRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
}

export async function searchBostaDeliveries(input: SearchBostaDeliveriesInput): Promise<SearchBostaDeliveriesResult> {
  const trackingNumbers = (input.trackingNumbers || []).map((value) => value.trim()).filter(Boolean);
  const payload = {
    type: input.type || "SEND",
    ...(trackingNumbers.length ? { trackingNumbers: trackingNumbers.join(", ") } : {}),
    ...(input.mobilePhones ? { mobilePhones: input.mobilePhones } : {}),
    ...(input.businessReference ? { businessReference: input.businessReference } : {}),
    ...(input.stateCodes?.length ? { stateCodes: input.stateCodes } : {}),
  };

  if (!trackingNumbers.length && !input.mobilePhones && !input.businessReference && !input.stateCodes?.length) {
    return {
      success: false,
      provider: "bosta",
      deliveries: [],
      error: "Bosta search needs trackingNumbers, mobilePhones, businessReference, or stateCodes",
    };
  }

  const response = await fetch(`${getBostaBaseUrl()}/deliveries/search`, {
    method: "POST",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
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
      deliveries: [],
      raw: data,
      error: `Bosta delivery search error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    success: record.success !== false,
    provider: "bosta",
    deliveries: normalizeBostaSearchData(data),
    message: typeof record.message === "string" ? record.message : undefined,
    raw: data,
  };
}

export async function terminateBostaDelivery(trackingNumber: string): Promise<TerminateBostaDeliveryResult> {
  const normalizedTrackingNumber = trackingNumber.trim();
  if (!normalizedTrackingNumber) {
    return {
      success: false,
      provider: "bosta",
      error: "Bosta terminate needs a tracking number",
    };
  }

  const response = await fetch(`${getBostaBaseUrl()}/deliveries/business/${encodeURIComponent(normalizedTrackingNumber)}/terminate`, {
    method: "DELETE",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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
      error: `Bosta terminate error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : {};
  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : "Delivery terminated successfully",
    deliveryId: typeof nestedData._id === "string" ? nestedData._id : undefined,
    raw: data,
  };
}

export async function updateBostaDelivery(input: UpdateBostaDeliveryInput): Promise<UpdateBostaDeliveryResult> {
  const trackingNumber = input.trackingNumber.trim();
  if (!trackingNumber) {
    return {
      success: false,
      provider: "bosta",
      error: "Bosta update needs a tracking number",
    };
  }

  const payload = {
    ...(input.allowToOpenPackage !== undefined ? { allowToOpenPackage: input.allowToOpenPackage } : {}),
    ...(typeof input.cod === "number" && Number.isFinite(input.cod) ? { cod: Math.round(input.cod) } : {}),
    ...(input.customer
      ? {
          receiver: {
            phone: normalizePhone(input.customer.phone),
            ...(input.customer.secondPhone ? { secondPhone: normalizePhone(input.customer.secondPhone) } : {}),
          },
          dropOffAddress: await buildDropOffAddress(input.customer),
        }
      : {}),
  };

  if (!Object.keys(payload).length) {
    return {
      success: false,
      provider: "bosta",
      error: "Bosta update needs customer, cod, or allowToOpenPackage changes",
    };
  }

  const response = await fetch(`${getBostaBaseUrl()}/deliveries/business/${encodeURIComponent(trackingNumber)}`, {
    method: "PUT",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
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
      error: `Bosta update error: ${response.status} - ${typeof data === "string" ? data : JSON.stringify(data)}`,
    };
  }

  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nestedData = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : {};

  return {
    success: record.success !== false,
    provider: "bosta",
    message: typeof record.message === "string" ? record.message : "Delivery updated successfully",
    deliveryId: typeof nestedData._id === "string" ? nestedData._id : undefined,
    raw: data,
  };
}

export async function getBostaDeliveryAnalytics(): Promise<BostaDeliveryAnalyticsResult> {
  const response = await fetch(`${getBostaBaseUrl()}/deliveries/analytics/total-deliveries`, {
    method: "GET",
    headers: {
      Authorization: getBostaAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });

  const text = await response.text();
  let raw: unknown = text;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    // Keep raw text for diagnostics.
  }

  if (!response.ok) {
    return {
      success: false,
      provider: "bosta",
      raw,
      error: `Bosta analytics error: ${response.status} - ${typeof raw === "string" ? raw : JSON.stringify(raw)}`,
    };
  }

  const record = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const data = record.data && typeof record.data === "object" && !Array.isArray(record.data)
    ? record.data as Record<string, unknown>
    : {};

  return {
    success: record.success !== false,
    provider: "bosta",
    data,
    message: typeof record.message === "string" ? record.message : undefined,
    raw,
  };
}
