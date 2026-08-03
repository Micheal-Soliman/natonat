"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Banknote,
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  Eye,
  PackageCheck,
  PackageX,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Search,
  Truck,
  Undo2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

type AdminOrder = Record<string, unknown> & {
  order_ref?: string;
  source?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  delivery_method?: string;
  amount_egp?: number;
  shipping_egp?: number;
  discount_egp?: number;
  payment_discount_egp?: number;
  created_at?: string;
  updated_at?: string;
  customer?: Record<string, unknown>;
  bosta?: Record<string, unknown>;
  shipment?: Record<string, unknown>;
  aramex?: Record<string, unknown>;
  extras?: Record<string, unknown>;
};

type OrdersResponse = {
  success?: boolean;
  orders?: AdminOrder[];
  total?: number;
  returned?: number;
  skipped_empty_rows?: number;
  error?: string;
  details?: unknown;
};

function formatApiError(error: string | undefined, details: unknown, fallback: string) {
  const base = error || fallback;
  if (!details) return base;

  if (typeof details === "string") return `${base}: ${details}`;

  if (typeof details === "object" && details) {
    const record = details as Record<string, unknown>;
    const status = [record.status, record.statusText].filter(Boolean).join(" ");
    const response = record.response;

    if (response && typeof response === "object") {
      const responseRecord = response as Record<string, unknown>;
      const nestedError = responseRecord.error || responseRecord.message;
      if (nestedError) return [base, status, String(nestedError)].filter(Boolean).join(" - ");
    }

    if (typeof response === "string") return [base, status, response].filter(Boolean).join(" - ");
    if (status) return `${base} - ${status}`;
  }

  return base;
}

type AdminInventoryItem = {
  id: number;
  slug: string;
  name: string;
  type?: string;
  category?: string | string[];
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  stockQuantity?: number | null;
  price?: number | null;
  originalPrice?: number | null;
  costPrice?: number | null;
  packagingCost?: number | null;
  sizeStock?: Partial<
    Record<
      "s" | "m" | "l" | "xl",
      {
        status?: "in_stock" | "low_stock" | "out_of_stock";
        quantity?: number;
      }
    >
  >;
  sizePrices?: Record<string, unknown> | null;
  image?: string;
};

type InventoryResponse = {
  success?: boolean;
  inventory?: AdminInventoryItem[];
  source?: string;
  fetchedAt?: string;
  error?: string;
};

type AdminExpense = {
  _id: string;
  title?: string;
  amountEgp?: number;
  category?: string;
  expenseDate?: string;
  paymentMethod?: string;
  vendor?: string;
  relatedOrderRef?: string;
  notes?: string;
  _updatedAt?: string;
};

type ExpensesResponse = {
  success?: boolean;
  expenses?: AdminExpense[];
  total?: number;
  source?: string;
  fetchedAt?: string;
  error?: string;
};

type BostaSyncResponse = {
  success?: boolean;
  synced?: number;
  failed?: number;
  checked?: number;
  error?: string;
};

type AdminActionResponse = {
  success?: boolean;
  order_ref?: string;
  order?: AdminOrder;
  trackingNumber?: string;
  previousTrackingNumber?: string;
  error?: string;
  details?: unknown;
};

type AdminManualOrderDraft = {
  orderKind: "catalog" | "special";
  productSlug: string;
  productSize: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  governorate: string;
  address: string;
  notes: string;
  specialProductBrief: string;
  title: string;
  quantity: string;
  unitPrice: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryMethod: string;
  createBostaShipment: boolean;
};

type AdminManualOrderItemDraft = {
  orderKind: "catalog" | "special";
  productSlug: string;
  productSize: string;
  title: string;
  quantity: string;
  unitPrice: string;
  total: string;
  specialProductBrief: string;
};

type BostaPickupDraft = {
  scheduledDate: string;
  numberOfParcels: string;
  packageType: "Normal" | "Light Bulky" | "Heavy Bulky";
  notes: string;
};

type AdminOrderEditItem = {
  productSlug: string;
  name: string;
  size: string;
  color: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

type AdminOrderEditDraft = {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  amountEgp: string;
  subtotalEgp: string;
  shippingEgp: string;
  discountEgp: string;
  paymentDiscountEgp: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  customerGovernorate: string;
  customerAddress: string;
  BostaTrackingNumber: string;
  BostaTrackingLink: string;
  BostaStatus: string;
  BostaLatestCode: string;
  BostaLatestUpdate: string;
  BostaLatestLocation: string;
  BostaLatestDate: string;
  BostaError: string;
  note: string;
  items: AdminOrderEditItem[];
};

type AdminTab = "finance" | "orders" | "customers" | "stock" | "expenses";
type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

function getTomorrowInputDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const ADMIN_ORDER_STATUSES = [
  { value: "created", label: "Created" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
  { value: "pending_instapay_approval", label: "Pending InstaPay Approval" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const ADMIN_PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "cash on delivery", label: "Cash on Delivery" },
  { value: "pending", label: "Pending" },
  { value: "pending instapay approval", label: "Pending InstaPay Approval" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const ADMIN_PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "paymob_card", label: "Card / Paymob" },
  { value: "instapay", label: "InstaPay / Wallets" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "custom_bulk", label: "Custom / offline bulk" },
];

const ADMIN_DELIVERY_METHODS = [
  { value: "delivery", label: "Delivery / courier eligible" },
  { value: "pickup", label: "Pickup" },
  { value: "custom", label: "Custom / no shipment" },
];

const MANUAL_ORDER_PAYMENT_METHODS = [
  { value: "custom_bulk", label: "Custom bulk / finance-only" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "paymob_card", label: "Card / Paymob" },
  { value: "instapay", label: "InstaPay / Wallets" },
  { value: "bank_transfer", label: "Bank transfer" },
] as const;

const MANUAL_ORDER_PAYMENT_STATUSES = [
  { value: "Paid", label: "Paid" },
  { value: "Cash on Delivery", label: "Cash on Delivery" },
  { value: "Pending", label: "Pending" },
  { value: "Pending InstaPay Approval", label: "Pending InstaPay Approval" },
  { value: "Refunded", label: "Refunded" },
] as const;

const MANUAL_ORDER_DELIVERY_METHODS = [
  { value: "custom", label: "Custom / finance only" },
  { value: "delivery", label: "Delivery / courier" },
  { value: "pickup", label: "Pickup" },
] as const;

const BOSTA_TRACKING_STAGES = [
  { key: "shipment_created", label: "Shipment Created" },
  { key: "shipment_picked_up", label: "Shipment Picked Up" },
  { key: "departed_origin", label: "Departed Origin" },
  { key: "in_transit", label: "In Transit" },
  { key: "arrived_destination", label: "Arrived Destination" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const OPERATIONAL_TRACKING_STAGES = [
  { key: "pending_instapay_approval", label: "Pending InstaPay approval" },
  { key: "needs_bosta_replacement", label: "Needs shipment replacement" },
  { key: "bosta_connection_issue", label: "Bosta connection issue" },
  { key: "bosta_exception", label: "Bosta exception" },
  { key: "bosta_failed", label: "Shipment failed" },
  { key: "missing_tracking", label: "Missing tracking" },
  { key: "returned_cancelled", label: "Returned / Cancelled" },
  { key: "pickup_order", label: "Pickup order" },
  { key: "custom_finance_order", label: "Custom / finance only" },
  { key: "needs_review", label: "Needs review" },
] as const;

const SHIPMENT_STATUS_STAGES = [...BOSTA_TRACKING_STAGES, ...OPERATIONAL_TRACKING_STAGES] as const;

const money = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const cairoDateTime = new Intl.DateTimeFormat("en-EG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Cairo",
});

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const next = Number(cleaned);
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

function parseDateValue(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    // Google Sheets serial date: days since 1899-12-30.
    if (value > 20_000 && value < 80_000) {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return Number.isFinite(date.getTime()) ? date : null;
    }

    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const raw = getString(value).trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/\u200f|\u200e/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)$/, "$1T$2");

  const direct = new Date(normalized);
  if (Number.isFinite(direct.getTime())) return direct;

  const dayFirstMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (dayFirstMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0", meridiem] = dayFirstMatch;
    let fullYear = Number(year);
    if (fullYear < 100) fullYear += 2000;
    let hours = Number(hour);
    if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
    const date = new Date(fullYear, Number(month) - 1, Number(day), hours, Number(minute), Number(second));
    return Number.isFinite(date.getTime()) ? date : null;
  }

  return null;
}

function getObject(value: unknown): Record<string, unknown> {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return getObject(parsed);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const UPDATE_ONLY_SOURCES = new Set([
  "admin_manual_order_edit",
  "admin_status_update",
  "admin_bosta_created",
  "admin_bosta_replaced",
  "admin_bosta_sync",
  "admin_bosta_terminated",
  "email_notification",
  "email_notification_failed",
  "email_notification_queued",
  "customer_email_notification",
  "meta_capi",
  "paymob_webhook_aramex",
  "paymob_webhook_bosta",
  "bosta_sync",
  "bosta_status_sync",
  "bosta_manual_tracking_update",
]);

function isUpdateOnlySource(value: unknown) {
  const source = getString(value).trim().toLowerCase();
  return UPDATE_ONLY_SOURCES.has(source) || source.endsWith("_bosta_failed") || source.endsWith("_bosta_created");
}

function getOrderSource(order: AdminOrder) {
  const currentSource = getString(order.source || order["Source"]);
  if (currentSource && !isUpdateOnlySource(currentSource)) return currentSource;

  const rawPayload = getObject(order["Raw Payload"]);
  const rawSource = getString(rawPayload.original_source || rawPayload.initial_source || rawPayload.source);
  if (rawSource && !isUpdateOnlySource(rawSource)) return rawSource;

  const history = getArray(order.history || order["History (JSON)"] || rawPayload.history);
  for (const entry of history) {
    const source = getString(getObject(entry).source);
    if (source && !isUpdateOnlySource(source)) return source;
  }

  const orderRef = getOrderRef(order);
  if (orderRef.startsWith("NAT-")) return "checkout";
  if (orderRef.startsWith("CUSTOM-")) return "admin_special_order";
  return currentSource;
}

function getOrderLastUpdateSource(order: AdminOrder) {
  const lastUpdateSource = getString(order.last_update_source || order["Last Update Source"]);
  if (lastUpdateSource) return lastUpdateSource;

  const currentSource = getString(order.source || order["Source"]);
  return isUpdateOnlySource(currentSource) ? currentSource : "";
}

function getOrderRef(order: AdminOrder) {
  return getString(order.order_ref || order["Order Ref"]);
}

function getCustomer(order: AdminOrder) {
  return getObject(order.customer || order["Customer (Full JSON)"]);
}

function getBosta(order: AdminOrder) {
  return getObject(order.bosta || order.shipment || order.aramex);
}

function getAmount(order: AdminOrder) {
  return getNumber(order.amount_egp || order["Total (EGP)"]);
}

function getShipping(order: AdminOrder) {
  return getNumber(order.shipping_egp || order["Shipping (EGP)"]);
}

function getExtras(order: AdminOrder) {
  return getObject(order.extras || order["Extras (Full JSON)"]);
}

function getItems(order: AdminOrder) {
  const items = order.items || order["Items (Full JSON)"] || order["Items"];
  if (typeof items === "string" && items.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(items) as unknown;
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

function getCreatedAt(order: AdminOrder) {
  return getString(order.created_at || order["Created At"] || order["Timestamp"]);
}

function getUpdatedAt(order: AdminOrder) {
  return getString(order.updated_at || order["Updated At"]);
}

function getOrderDate(order: AdminOrder) {
  return parseDateValue(order.created_at || order["Created At"] || order["Timestamp"] || order.updated_at || order["Updated At"]);
}

function getExpenseDate(expense: AdminExpense) {
  return parseDateValue(expense.expenseDate || expense._updatedAt);
}

function getExpenseAmount(expense: AdminExpense) {
  return getNumber(expense.amountEgp);
}

function getSubtotal(order: AdminOrder) {
  const extras = getExtras(order);
  const total = getAmount(order);
  const shipping = getShipping(order);
  const discounts = getDiscount(order);

  return (
    getNumber(extras.subtotal_egp) ||
    getNumber(order["Subtotal (EGP)"]) ||
    (total > 0 ? Math.max(0, total - shipping + discounts) : 0) ||
    0
  );
}

function formatAdminDateTime(value: unknown) {
  const date = parseDateValue(value);
  return date ? cairoDateTime.format(date) : "";
}

function formatAdminValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const formattedDate = formatAdminDateTime(value);
    if (formattedDate) return formattedDate;
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object" && value) return "Recorded details";
  return getString(value);
}

function formatAdminLabel(label: string) {
  return label
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function isEmptyAdminValue(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(getObject(value)).length === 0;
  return false;
}

function getDiscount(order: AdminOrder) {
  return getOrderDiscount(order) + getPaymentDiscount(order);
}

function getOrderDiscount(order: AdminOrder) {
  const extras = getExtras(order);
  return (
    getNumber(order.discount_egp || order["Discount (EGP)"]) ||
    getNumber(extras.discount_egp) ||
    getNumber(extras.quantity_discount) ||
    0
  );
}

function getPaymentDiscount(order: AdminOrder) {
  const extras = getExtras(order);
  return (
    getNumber(order.payment_discount_egp || order["Payment Discount (EGP)"]) ||
    getNumber(extras.payment_discount) ||
    getNumber(extras.payment_discount_egp) ||
    0
  );
}

function getItemRecordedQuantity(item: Record<string, unknown>) {
  const quantity = getNumber(item.quantity ?? item.qty);
  return quantity > 0 ? quantity : 0;
}

function isBundleParentItem(item: Record<string, unknown>) {
  return Boolean(item.isBundle || getArray(item.bundleSelections).length > 0);
}

function isCustomOrder(order: AdminOrder) {
  const source = getOrderSource(order).toLowerCase();
  const extras = getExtras(order);
  const paymentMethod = getPaymentMethod(order);
  return (
    source.includes("admin_special_order") ||
    source.includes("admin_catalog_order") ||
    paymentMethod.includes("custom") ||
    Boolean(
      extras.is_custom_order ||
        extras.exclude_from_catalog_product_sales ||
        extras.created_from_admin_manual_order ||
        order.is_custom_order,
    )
  );
}

function isCustomOrderItem(item: Record<string, unknown>) {
  return Boolean(item.isCustomOrder || item.is_custom_order || item.custom_order);
}

function getOrderRecordedPieces(order: AdminOrder) {
  if (isCustomOrder(order)) return 0;

  const sheetQuantity = getNumber(order["Total Items Quantity"]);
  if (sheetQuantity > 0) return sheetQuantity;

  return getItems(order).reduce((sum, item) => {
    if (isBundleParentItem(item) || isCustomOrderItem(item)) return sum;
    return sum + getItemRecordedQuantity(item);
  }, 0);
}

function getOrderCustomPieces(order: AdminOrder) {
  if (!isCustomOrder(order)) return 0;

  const extras = getExtras(order);
  const customQuantity = getNumber(extras.custom_order_quantity);
  if (customQuantity > 0) return customQuantity;

  const sheetQuantity = getNumber(order["Total Items Quantity"]);
  if (sheetQuantity > 0) return sheetQuantity;

  return getItems(order).reduce((sum, item) => {
    if (isBundleParentItem(item)) return sum;
    return sum + getItemRecordedQuantity(item);
  }, 0);
}

function getItemUnitPrice(item: Record<string, unknown>) {
  return getNumber(
    item.unit_price_egp ??
      item.price_egp ??
      item.unit_price ??
      item.unitPrice ??
      item.price,
  );
}

function getItemLineTotal(item: Record<string, unknown>) {
  const recordedLineTotal = getNumber(item.line_total_egp ?? item.line_total ?? item.lineTotal ?? item.total);
  if (recordedLineTotal > 0) return recordedLineTotal;

  const quantity = getItemRecordedQuantity(item);
  const unitPrice = getItemUnitPrice(item);
  return quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0;
}

function getPaymentMethod(order: AdminOrder) {
  return getString(order.payment_method || order["Payment Method"]).toLowerCase();
}

function getDeliveryMethod(order: AdminOrder) {
  const extras = getExtras(order);
  return getString(order.delivery_method || order["Delivery Method"] || extras.delivery_method).toLowerCase();
}

function getDeliveryBucket(order: AdminOrder) {
  const method = getDeliveryMethod(order);
  if (method.includes("pickup") || method.includes("pick up")) return "pickup";
  if (method.includes("delivery") || method.includes("ship")) return "delivery";
  return method || "unknown";
}

function getStatus(order: AdminOrder) {
  return getString(order.status || order["Status"]).toLowerCase();
}

function getPaymentStatus(order: AdminOrder) {
  return getString(order.payment_status || order["Payment Status"]).toLowerCase();
}

function getTrackingNumber(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.trackingNumber || order["Bosta Tracking Number"] || order["Aramex Tracking Number"]);
}

function getShipmentProvider(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.provider || order["Shipment Provider"]).toLowerCase();
}

function getPreviousTrackingNumbers(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getArray(Bosta.previousTrackingNumbers)
    .map(getString)
    .filter(Boolean);
}

function needsOldTrackingCancellation(order: AdminOrder) {
  const Bosta = getBosta(order);
  return Boolean(Bosta.oldTrackingCancelRequired || getPreviousTrackingNumbers(order).length > 0);
}

function getBostaError(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.error || order["Bosta Error"] || order["Aramex Error"]);
}

function hasBostaConnectionIssue(order: AdminOrder) {
  const Bosta = getBosta(order);
  const error = getBostaError(order).toLowerCase();
  return Boolean(
    Bosta.connectionIssue ||
      error.includes("invalid authorization token") ||
      error.includes("errorcode\":1028") ||
      error.includes("bosta update error: 401") ||
      error.includes("api key"),
  );
}

function getBostaStatus(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.status || order["Bosta Status"] || order["Aramex Status"]);
}

function getBostaLatestUpdate(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.latestDescription || Bosta.latestDate || order["Bosta Latest Update"] || order["Aramex Latest Update"]);
}

function getBostaLatestLocation(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.latestLocation || order["Bosta Latest Location"] || order["Aramex Latest Location"]);
}

function getBostaLatestCode(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.latestCode || Bosta.updateCode || order["Bosta Update Code"] || order["Aramex Update Code"]);
}

function getBostaLatestCodeNumber(order: AdminOrder) {
  const rawCode = getBostaLatestCode(order);
  const code = Number(rawCode);
  return Number.isFinite(code) ? code : null;
}

function getBostaSyncedAt(order: AdminOrder) {
  const Bosta = getBosta(order);
  return getString(Bosta.syncedAt || order["Bosta Synced At"] || order["Aramex Synced At"]);
}

function getStageLabel(stageKey: string) {
  return SHIPMENT_STATUS_STAGES.find((stage) => stage.key === stageKey)?.label || stageKey;
}

function getTrackingRawText(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getBostaTrackingText(order: AdminOrder) {
  const Bosta = getBosta(order);
  return [
    getBostaStatus(order),
    getBostaLatestCode(order),
    getBostaLatestUpdate(order),
    getBostaLatestLocation(order),
    getString(Bosta.latestDate),
    getTrackingRawText(Bosta.trackingRaw),
  ]
    .join(" ")
    .toLowerCase();
}

function hasReturnedSignal(order: AdminOrder) {
  const text = `${getStatus(order)} ${getPaymentStatus(order)} ${getBostaTrackingText(order)}`.toLowerCase();
  return (
    text.includes("return") ||
    text.includes("returned") ||
    text.includes("rto") ||
    text.includes("cancel") ||
    text.includes("مرتجع") ||
    text.includes("إلغاء") ||
    text.includes("ملغي")
  );
}

function getBostaTimelineStageKey(order: AdminOrder) {
  const code = getBostaLatestCodeNumber(order);
  if (code !== null) {
    if (code === 45) return "delivered";
    if (code === 46 || code === 49 || code === 60) return "returned_cancelled";
    if (code === 48 || code === 100 || code === 101) return "bosta_failed";
    if (code === 47 || code === 102 || code === 103 || code === 105) return "bosta_exception";
    if (code === 30) return "in_transit";
    if ([21, 22, 23, 24, 40, 41].includes(code)) return "shipment_picked_up";
    if ([10, 11, 20].includes(code)) return "shipment_created";
  }

  const text = getBostaTrackingText(order);

  if (!text.trim()) return "";

  if (
    text.includes("delivered") ||
    text.includes("تم التوصيل") ||
    text.includes("signed") ||
    text.includes("pod")
  ) {
    return "delivered";
  }

  if (
    text.includes("out for delivery") ||
    text.includes("with courier") ||
    text.includes("الخروج للتوصيل") ||
    text.includes("مندوب")
  ) {
    return "out_for_delivery";
  }

  if (
    text.includes("arrived at destination") ||
    text.includes("arrived destination") ||
    text.includes("destination facility") ||
    text.includes("الوصول إلى الوجهة") ||
    text.includes("وصلت للوجهة")
  ) {
    return "arrived_destination";
  }

  if (
    text.includes("departed origin") ||
    text.includes("origin facility") ||
    text.includes("مغادرة المنشأ")
  ) {
    return "departed_origin";
  }

  if (
    text.includes("in transit") ||
    text.includes("forwarded") ||
    text.includes("departed") ||
    text.includes("arrived") ||
    text.includes("في الطريق")
  ) {
    return "in_transit";
  }

  if (
    text.includes("picked up") ||
    text.includes("collected") ||
    text.includes("استلام الشحنة")
  ) {
    return "shipment_picked_up";
  }

  if (
    text.includes("record created") ||
    text.includes("shipment created") ||
    text.includes("created") ||
    text.includes("إنشاء الشحنة") ||
    text.includes("تم إنشاء شحنة")
  ) {
    return "shipment_created";
  }

  return "";
}

function getOrderShipmentStatusKey(order: AdminOrder) {
  if (isPendingInstaPay(order)) return "pending_instapay_approval";
  if (hasBostaConnectionIssue(order)) return "bosta_connection_issue";
  if (needsBostaReplacement(order)) return "needs_bosta_replacement";
  if (getBostaError(order)) return "bosta_failed";
  if (hasReturnedSignal(order)) return "returned_cancelled";
  if (needsBosta(order)) return "missing_tracking";

  const timelineStage = getBostaTimelineStageKey(order);
  if (timelineStage) return timelineStage;

  if (getTrackingNumber(order)) return "shipment_created";
  if (getDeliveryBucket(order) === "pickup") return "pickup_order";
  if (isCustomOrder(order) || getDeliveryBucket(order) === "custom") return "custom_finance_order";

  return "needs_review";
}

function getOrderShipmentStatusLabel(order: AdminOrder) {
  return getStageLabel(getOrderShipmentStatusKey(order));
}

function getCustomerEmailSentAt(order: AdminOrder) {
  return getString(order.email_sent_at || order["Email Sent At"]);
}

function getInstaPayPendingCustomerEmailSentAt(order: AdminOrder) {
  return getString(order.instapay_pending_customer_email_sent_at || order["InstaPay Pending Customer Email Sent At"]);
}

function getInstaPayApprovalEmailSentAt(order: AdminOrder) {
  return getString(order.instapay_proof_email_sent_at || order["InstaPay Approval Email Sent At"]);
}

function isReturned(order: AdminOrder) {
  return getOrderShipmentStatusKey(order) === "returned_cancelled";
}

function isDelivered(order: AdminOrder) {
  return getOrderShipmentStatusKey(order) === "delivered";
}

function isInTransit(order: AdminOrder) {
  return [
    "shipment_picked_up",
    "departed_origin",
    "in_transit",
    "arrived_destination",
    "out_for_delivery",
  ].includes(getOrderShipmentStatusKey(order));
}

function isPaid(order: AdminOrder) {
  const paymentStatus = getPaymentStatus(order);
  return paymentStatus === "paid" || paymentStatus.includes("cash on delivery");
}

function isConfirmed(order: AdminOrder) {
  const status = getStatus(order);
  return ["confirmed", "shipped", "completed", "delivered"].includes(status) || isPaid(order);
}

function isPendingInstaPay(order: AdminOrder) {
  return getPaymentMethod(order) === "instapay" && getStatus(order) === "pending_instapay_approval";
}

function needsBosta(order: AdminOrder) {
  return (
    getDeliveryBucket(order) === "delivery" &&
    isConfirmed(order) &&
    !isPendingInstaPay(order) &&
    !getTrackingNumber(order)
  );
}

function needsBostaReplacement(order: AdminOrder) {
  const Bosta = getBosta(order);
  return Boolean(
    getTrackingNumber(order) &&
      (Bosta.needsReplacement || Bosta.replacementRequired) &&
      !hasBostaConnectionIssue(order),
  );
}

function hasBostaTracking(order: AdminOrder) {
  return Boolean(getTrackingNumber(order));
}

function getPaymentBucket(order: AdminOrder) {
  if (isCustomOrder(order)) return "custom_bulk";

  const method = getPaymentMethod(order);
  const source = getOrderSource(order).toLowerCase();
  const extras = getExtras(order);

  if (
    method.includes("custom") ||
    source.includes("admin_catalog_order") ||
    source.includes("admin_special_order") ||
    extras.created_from_admin_manual_order
  ) {
    return "custom_bulk";
  }

  if (method.includes("card") || method.includes("paymob")) return "card";
  if (method.includes("instapay") || method.includes("wallet")) return "instapay";
  if (method.includes("cod") || method.includes("cash")) return "cod";
  return method || "unknown";
}

function normalizeInventoryKey(value: unknown) {
  return getString(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCustomerPhone(value: unknown) {
  return getString(value).replace(/[^\d+]/g, "");
}

function getCustomerDisplayName(customer: Record<string, unknown>) {
  return [
    getString(customer.first_name || customer.name),
    getString(customer.last_name),
  ].filter(Boolean).join(" ").trim();
}

function getCustomerKey(order: AdminOrder) {
  const customer = getCustomer(order);
  const phone = normalizeCustomerPhone(customer.phone || order["Phone"]);
  const email = getString(customer.email || order["Email"]).toLowerCase();
  const name = getCustomerDisplayName(customer).toLowerCase();
  return phone || email || name || `unknown:${getOrderRef(order)}`;
}

function getInventoryProductKeys(item: AdminInventoryItem) {
  return [item.slug, item.name, item.id].map(normalizeInventoryKey).filter(Boolean);
}

function getOrderItemProductKeys(item: Record<string, unknown>) {
  return [item.slug, item.name, item.title, item.id, item.product_id].map(normalizeInventoryKey).filter(Boolean);
}

function getOrderItemSearchText(item: Record<string, unknown>) {
  return [
    item.name,
    item.title,
    item.slug,
    item.type,
    item.category,
    item.productType,
    item.product_type,
    item.line_id,
    item.product_id,
  ].map(getString).join(" ").toLowerCase();
}

function isLuggageCoverItem(item: Record<string, unknown>) {
  const text = getOrderItemSearchText(item);
  return (
    text.includes("luggage cover") ||
    text.includes("luggage-cover") ||
    text.includes("luggage-covers") ||
    text.includes("cover")
  ) && !isPackOnatItem(item) && !isPassportWalletItem(item);
}

function isPackOnatItem(item: Record<string, unknown>) {
  const text = getOrderItemSearchText(item);
  return (
    text.includes("packonat") ||
    text.includes("pack onat") ||
    text.includes("packing folder") ||
    text.includes("garment folder")
  );
}

function isPassportWalletItem(item: Record<string, unknown>) {
  const text = getOrderItemSearchText(item);
  return (
    text.includes("passport wallet") ||
    text.includes("passport-wallet") ||
    (text.includes("passport") && text.includes("wallet"))
  );
}

function createDailyCategoryUnits() {
  return {
    luggageCovers: 0,
    packOnat: 0,
    passportWallet: 0,
    customBulk: 0,
    other: 0,
    total: 0,
  };
}

function addQuantityToDailyCategoryUnits(
  units: ReturnType<typeof createDailyCategoryUnits>,
  category: keyof Omit<ReturnType<typeof createDailyCategoryUnits>, "total">,
  quantity: number,
) {
  if (quantity <= 0) return;
  units[category] += quantity;
  units.total += quantity;
}

function addOrderToDailyCategoryUnits(units: ReturnType<typeof createDailyCategoryUnits>, order: AdminOrder) {
  if (!isConfirmed(order) || isReturned(order)) return;

  const items = getItems(order);
  let countedFromItems = false;

  items.forEach((item) => {
    if (isBundleParentItem(item)) return;

    const quantity = getItemRecordedQuantity(item);
    if (quantity <= 0) return;

    countedFromItems = true;

    if (isCustomOrderItem(item)) {
      addQuantityToDailyCategoryUnits(units, "customBulk", quantity);
    } else if (isPackOnatItem(item)) {
      addQuantityToDailyCategoryUnits(units, "packOnat", quantity);
    } else if (isPassportWalletItem(item)) {
      addQuantityToDailyCategoryUnits(units, "passportWallet", quantity);
    } else if (isLuggageCoverItem(item)) {
      addQuantityToDailyCategoryUnits(units, "luggageCovers", quantity);
    } else {
      addQuantityToDailyCategoryUnits(units, "other", quantity);
    }
  });

  if (!countedFromItems && isCustomOrder(order)) {
    addQuantityToDailyCategoryUnits(units, "customBulk", getOrderCustomPieces(order));
  }
}

function formatDailyCategoryUnits(units: ReturnType<typeof createDailyCategoryUnits>) {
  const parts = [
    units.luggageCovers ? `Covers ${units.luggageCovers}` : "",
    units.packOnat ? `PackOnat ${units.packOnat}` : "",
    units.passportWallet ? `Wallets ${units.passportWallet}` : "",
    units.customBulk ? `Custom ${units.customBulk}` : "",
    units.other ? `Other ${units.other}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "-";
}

function getOrderItemSizeKey(item: Record<string, unknown>) {
  const size = normalizeInventoryKey(item.size || item.selectedSize || item.variantSize);
  return size || "product";
}

function getSizeRows(item: AdminInventoryItem) {
  const sizeKeys = ["s", "m", "l", "xl"] as const;
  const hasSizePrices = item.sizePrices && Object.keys(item.sizePrices).length > 0;
  const hasSizeStock = item.sizeStock && Object.keys(item.sizeStock).length > 0;

  if (!hasSizePrices && !hasSizeStock) {
    return [
      {
        size: "product",
        status: item.stockStatus || "in_stock",
        quantity: item.stockQuantity,
      },
    ];
  }

  return sizeKeys
    .filter((size) => hasSizePrices ? Boolean(item.sizePrices?.[size]) : Boolean(item.sizeStock?.[size]))
    .map((size) => ({
      size: size.toUpperCase(),
      status: item.sizeStock?.[size]?.status || item.stockStatus || "in_stock",
      quantity: item.sizeStock?.[size]?.quantity ?? item.stockQuantity ?? null,
    }));
}

function getSizePrice(product: AdminInventoryItem | undefined, size: string) {
  if (!product) return 0;
  const sizeKey = size.toLowerCase();
  const priceRow = product.sizePrices?.[sizeKey];
  if (priceRow && typeof priceRow === "object" && !Array.isArray(priceRow)) {
    const price = getNumber((priceRow as Record<string, unknown>).price);
    if (price > 0) return price;
  }

  return getNumber(product.price);
}

function getDefaultProductSize(product: AdminInventoryItem | undefined) {
  if (!product) return "";
  const rows = getSizeRows(product);
  if (rows.length === 1 && rows[0].size === "product") return "";
  return rows.find((row) => row.status !== "out_of_stock" && row.quantity !== 0)?.size || rows[0]?.size || "";
}

function toEditMoneyValue(value: number) {
  return value > 0 ? String(Math.round(value * 100) / 100) : "";
}

function getEditablePaymentMethod(order: AdminOrder) {
  const method = getPaymentMethod(order);
  if (method.includes("cash") || method.includes("cod")) return "cod";
  if (method.includes("paymob") || method.includes("card")) return "paymob_card";
  if (method.includes("instapay") || method.includes("wallet")) return "instapay";
  if (method.includes("bank")) return "bank_transfer";
  if (method.includes("custom")) return "custom_bulk";
  return "cod";
}

function getEditableDeliveryMethod(order: AdminOrder) {
  const method = getDeliveryMethod(order);
  if (method.includes("pickup")) return "pickup";
  if (method.includes("custom")) return "custom";
  return "delivery";
}

function buildOrderEditDraft(order: AdminOrder): AdminOrderEditDraft {
  const customer = getCustomer(order);
  const items = getItems(order);
  const Bosta = getBosta(order);

  return {
    status: getStatus(order) || "confirmed",
    paymentStatus: getPaymentStatus(order) || "paid",
    paymentMethod: getEditablePaymentMethod(order),
    deliveryMethod: getEditableDeliveryMethod(order),
    amountEgp: toEditMoneyValue(getAmount(order)),
    subtotalEgp: toEditMoneyValue(getSubtotal(order)),
    shippingEgp: toEditMoneyValue(getShipping(order)),
    discountEgp: toEditMoneyValue(getOrderDiscount(order)),
    paymentDiscountEgp: toEditMoneyValue(getPaymentDiscount(order)),
    customerFirstName: getString(customer.first_name || customer.name),
    customerLastName: getString(customer.last_name),
    customerEmail: getString(customer.email),
    customerPhone: getString(customer.phone),
    customerCity: getString(customer.city),
    customerGovernorate: getString(customer.governorate),
    customerAddress: getString(customer.address),
    BostaTrackingNumber: getTrackingNumber(order),
    BostaTrackingLink: getString(Bosta.trackingLink || order["Bosta Tracking Link"]),
    BostaStatus: getBostaStatus(order),
    BostaLatestCode: getBostaLatestCode(order),
    BostaLatestUpdate: getBostaLatestUpdate(order),
    BostaLatestLocation: getBostaLatestLocation(order),
    BostaLatestDate: getString(Bosta.latestDate || order["Bosta Latest Date"]),
    BostaError: getBostaError(order),
    note: "",
    items: items.length
      ? items.map((item) => ({
          productSlug: getString(item.slug),
          name: getString(item.name || item.title || item.slug || "Order item"),
          size: getString(item.size || item.selectedSize || item.variantSize),
          color: getString(item.color || item.selectedColor || item.variantColor),
          quantity: String(getItemRecordedQuantity(item) || 1),
          unitPrice: toEditMoneyValue(getItemUnitPrice(item)),
          lineTotal: toEditMoneyValue(getItemLineTotal(item)),
        }))
      : [
          {
            productSlug: "",
            name: "",
            size: "",
            color: "",
            quantity: "1",
            unitPrice: "",
            lineTotal: "",
          },
        ],
  };
}

function isInventoryLow(item: AdminInventoryItem) {
  if (item.stockStatus === "out_of_stock") return true;
  if (item.stockStatus === "low_stock") return true;
  if (typeof item.stockQuantity === "number" && item.stockQuantity <= 3) return true;

  return getSizeRows(item).some((row) => {
    if (row.status === "out_of_stock" || row.status === "low_stock") return true;
    return typeof row.quantity === "number" && row.quantity <= 3;
  });
}

function isInventoryOut(item: AdminInventoryItem) {
  if (item.stockStatus === "out_of_stock") return true;
  if (item.stockQuantity === 0) return true;
  const rows = getSizeRows(item);
  return rows.length > 0 && rows.every((row) => row.status === "out_of_stock" || row.quantity === 0);
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "dark",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Banknote;
  tone?: "dark" | "gold" | "green" | "red";
}) {
  const toneClass = {
    dark: "bg-[#0F1A26] text-white",
    gold: "bg-[#EEBC3F] text-[#0F1A26]",
    green: "bg-emerald-600 text-white",
    red: "bg-rose-600 text-white",
  }[tone];

  return (
    <div className="rounded-3xl border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">{title}</p>
          <p className="mt-3 text-2xl font-black text-[#0F1A26]">{value}</p>
          {subtitle && <p className="mt-1 text-sm font-semibold text-[#0F1A26]/50">{subtitle}</p>}
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black text-[#0F1A26] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#0F1A26]/55">{description}</p>
      </div>
    </div>
  );
}

function DataPill({ label, value, dark = false }: { label: string; value: ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${dark ? "border border-white/10 bg-white/10" : "bg-[#F8F6F3]"}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${dark ? "text-white/45" : "text-[#0F1A26]/40"}`}>{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${dark ? "text-white" : "text-[#0F1A26]"}`}>{value || "-"}</p>
    </div>
  );
}

function NestedValuePanel({
  label,
  value,
  dark = false,
  depth = 0,
}: {
  label: string;
  value: unknown;
  dark?: boolean;
  depth?: number;
}) {
  if (isEmptyAdminValue(value)) return null;

  if (Array.isArray(value)) {
    return (
      <div className={`rounded-2xl p-3 ${dark ? "border border-white/10 bg-white/10" : "bg-[#F8F6F3]"}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${dark ? "text-white/45" : "text-[#0F1A26]/40"}`}>
          {formatAdminLabel(label)}
        </p>
        <div className="mt-3 space-y-2">
          {value.map((item, index) => (
            typeof item === "object" && item
              ? (
                <div key={`${label}-${index}`} className={`rounded-xl p-3 ${dark ? "bg-[#0F1A26]/70" : "bg-white"}`}>
                  <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.12em] ${dark ? "text-white/35" : "text-[#0F1A26]/35"}`}>
                    Item {index + 1}
                  </p>
                  <KeyValueGrid data={getObject(item)} dark={dark} depth={depth + 1} />
                </div>
              )
              : <DataPill key={`${label}-${index}`} label={`Item ${index + 1}`} value={formatAdminValue(item)} dark={dark} />
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === "object" && value) {
    return (
      <div className={`rounded-2xl p-3 ${dark ? "border border-white/10 bg-white/10" : "bg-[#F8F6F3]"}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${dark ? "text-white/45" : "text-[#0F1A26]/40"}`}>
          {formatAdminLabel(label)}
        </p>
        <div className={`mt-3 rounded-xl p-3 ${dark ? "bg-[#0F1A26]/70" : "bg-white"}`}>
          <KeyValueGrid data={getObject(value)} dark={dark} depth={depth + 1} />
        </div>
      </div>
    );
  }

  return <DataPill label={formatAdminLabel(label)} value={formatAdminValue(value)} dark={dark} />;
}

function KeyValueGrid({ data, dark = false, depth = 0 }: { data: Record<string, unknown>; dark?: boolean; depth?: number }) {
  const rows = Object.entries(data).filter(([, value]) => !isEmptyAdminValue(value));

  if (!rows.length) {
    return (
      <p className={`rounded-2xl p-4 text-sm font-bold ${dark ? "bg-white/10 text-white/45" : "bg-[#F8F6F3] text-[#0F1A26]/45"}`}>
        No data recorded.
      </p>
    );
  }

  return (
    <div className={`grid gap-3 ${depth > 0 ? "" : "sm:grid-cols-2"}`}>
      {rows.map(([key, value]) => (
        <NestedValuePanel key={key} label={key} value={value} dark={dark} depth={depth} />
      ))}
    </div>
  );
}

function OrderDetailsPanel({
  order,
  inventory,
  onClose,
  onApproveInstaPay,
  onCreateBosta,
  onPrintBostaAwb,
  onSaveManualEdit,
  onDeleteOrder,
  actionLoadingRef,
}: {
  order: AdminOrder;
  inventory: AdminInventoryItem[];
  onClose: () => void;
  onApproveInstaPay: (order: AdminOrder) => void;
  onCreateBosta: (order: AdminOrder) => void;
  onPrintBostaAwb: (order: AdminOrder) => void;
  onSaveManualEdit: (order: AdminOrder, draft: AdminOrderEditDraft) => void;
  onDeleteOrder: (order: AdminOrder) => void;
  actionLoadingRef: string;
}) {
  const customer = getCustomer(order);
  const Bosta = getBosta(order);
  const extras = getExtras(order);
  const items = getItems(order);
  const orderRef = getOrderRef(order);
  const auditRows = [...getArray(order.admin_audit), ...getArray(order.history)]
    .map((entry) => getObject(entry))
    .filter((entry) => Object.keys(entry).length > 0)
    .slice()
    .reverse()
    .slice(0, 12);
  const trackingNumber = getTrackingNumber(order);
  const isBostaShipment = getShipmentProvider(order) === "bosta";
  const canCreateBosta = getDeliveryBucket(order) === "delivery" && !isPendingInstaPay(order) && !trackingNumber;
  const previousTrackingNumbers = getPreviousTrackingNumbers(order);
  const oldTrackingCancelRequired = needsOldTrackingCancellation(order);
  const bostaDisplay = hasBostaConnectionIssue(order)
    ? {
        ...Bosta,
        needsReplacement: false,
        replacementRequired: false,
        replacementReason: "",
        needsReplacementNote: "No replacement is required. The courier API connection failed while refreshing or updating Bosta.",
      }
    : Bosta;
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<AdminOrderEditDraft>(() => buildOrderEditDraft(order));

  const updateEditDraft = (key: keyof AdminOrderEditDraft, value: string) => {
    setEditDraft((current) => ({ ...current, [key]: value }));
  };

  const updateEditItem = (index: number, key: keyof AdminOrderEditItem, value: string) => {
    setEditDraft((current) => {
      const items = [...current.items];
      const nextItem = { ...items[index], [key]: value };

      if (key === "productSlug") {
        const product = inventory.find((item) => item.slug === value);
        if (product) {
          const size = getDefaultProductSize(product);
          const price = getSizePrice(product, size);
          const quantity = getNumber(nextItem.quantity) || 1;
          nextItem.name = product.name;
          nextItem.size = size;
          nextItem.unitPrice = price > 0 ? String(price) : nextItem.unitPrice;
          nextItem.lineTotal = price > 0 ? String(price * quantity) : nextItem.lineTotal;
        }
      }

      if (key === "size") {
        const product = inventory.find((item) => item.slug === nextItem.productSlug);
        const price = getSizePrice(product, value);
        const quantity = getNumber(nextItem.quantity) || 1;
        if (price > 0) {
          nextItem.unitPrice = String(price);
          nextItem.lineTotal = String(price * quantity);
        }
      }

      if (key === "quantity" || key === "unitPrice") {
        const quantity = getNumber(key === "quantity" ? value : nextItem.quantity);
        const unitPrice = getNumber(key === "unitPrice" ? value : nextItem.unitPrice);
        nextItem.lineTotal = quantity > 0 && unitPrice > 0 ? String(quantity * unitPrice) : nextItem.lineTotal;
      }

      items[index] = nextItem;
      return { ...current, items };
    });
  };

  const addEditItem = () => {
    setEditDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        { productSlug: "", name: "", size: "", color: "", quantity: "1", unitPrice: "", lineTotal: "" },
      ],
    }));
  };

  const removeEditItem = (index: number) => {
    setEditDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1A26]/50 p-3 backdrop-blur-sm sm:p-6">
      <div className="ms-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#0F1A26]/10 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Order full details</p>
            <h3 className="mt-2 text-2xl font-black">{getOrderRef(order) || "No order ref"}</h3>
            <p className="mt-1 text-sm font-semibold text-[#0F1A26]/50">
              {formatAdminDateTime(getCreatedAt(order)) || "No creation date"}
              {getUpdatedAt(order) ? ` - updated ${formatAdminDateTime(getUpdatedAt(order)) || getUpdatedAt(order)}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4EFE8] text-[#0F1A26] transition hover:bg-[#0F1A26] hover:text-white"
            aria-label="Close order details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {isPendingInstaPay(order) && (
            <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700/70">Waiting payment approval</p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    Approving this order marks payment as paid and creates a courier shipment if delivery is required.
                  </p>
                </div>
                <button
                  onClick={() => onApproveInstaPay(order)}
                  disabled={actionLoadingRef === `instapay:${getOrderRef(order)}`}
                  className="h-11 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {actionLoadingRef === `instapay:${getOrderRef(order)}` ? "Approving..." : "Approve InstaPay"}
                </button>
              </div>
            </div>
          )}

          <section className="mb-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-lg font-black">Admin actions</h4>
                <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
                  Every action writes an audit entry and updates finance/status reading.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => onCreateBosta(order)}
                  disabled={!canCreateBosta || actionLoadingRef === `Bosta-create:${orderRef}`}
                  className="h-10 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoadingRef === `Bosta-create:${orderRef}`
                    ? "Creating..."
                    : trackingNumber
                      ? "Shipment already exists"
                      : "Create shipment"}
                </button>
                {isBostaShipment && trackingNumber && (
                  <button
                    onClick={() => onPrintBostaAwb(order)}
                    disabled={actionLoadingRef === `bosta-awb:${orderRef}`}
                    className="h-10 rounded-2xl bg-[#0F1A26] px-3 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoadingRef === `bosta-awb:${orderRef}` ? "Printing..." : "Print Bosta AWB"}
                  </button>
                )}
                <button
                  onClick={() => onDeleteOrder(order)}
                  disabled={actionLoadingRef === `order-delete:${orderRef}`}
                  className="h-10 rounded-2xl bg-rose-600 px-3 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoadingRef === `order-delete:${orderRef}` ? "Deleting..." : "Delete order"}
                </button>
              </div>
            </div>
          </section>

          <section className="mb-5 rounded-[1.5rem] border border-[#0F1A26]/10 bg-[#F8F6F3] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-black">Manual order edit</h4>
                <p className="mt-1 text-xs font-bold leading-5 text-[#0F1A26]/50">
                  Saves to database and updates dashboard finance. If Bosta accepts the change, shipment details update too; otherwise the order is marked for replacement.
                </p>
              </div>
              <button
                onClick={() => setEditOpen((open) => !open)}
                className="h-10 rounded-2xl bg-[#0F1A26] px-5 text-xs font-black text-white transition hover:-translate-y-0.5"
              >
                {editOpen ? "Close edit" : "Edit order"}
              </button>
            </div>

            {editOpen && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
                  Use this when a customer changes product, size, price, or when an order is cancelled/returned. Finance cards read these saved values.
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    Order status
                    <select
                      value={editDraft.status}
                      onChange={(event) => updateEditDraft("status", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                    >
                      {ADMIN_ORDER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    Payment status
                    <select
                      value={editDraft.paymentStatus}
                      onChange={(event) => updateEditDraft("paymentStatus", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                    >
                      {ADMIN_PAYMENT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    Payment method
                    <select
                      value={editDraft.paymentMethod}
                      onChange={(event) => updateEditDraft("paymentMethod", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                    >
                      {ADMIN_PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    Delivery
                    <select
                      value={editDraft.deliveryMethod}
                      onChange={(event) => updateEditDraft("deliveryMethod", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                    >
                      {ADMIN_DELIVERY_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["subtotalEgp", "Subtotal"],
                    ["discountEgp", "Order discount"],
                    ["paymentDiscountEgp", "Payment discount"],
                    ["shippingEgp", "Shipping"],
                    ["amountEgp", "Final total"],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                      {label}
                      <input
                        type="number"
                        min="0"
                        value={editDraft[key as keyof AdminOrderEditDraft] as string}
                        onChange={(event) => updateEditDraft(key as keyof AdminOrderEditDraft, event.target.value)}
                        className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["customerFirstName", "First name"],
                    ["customerLastName", "Last name"],
                    ["customerPhone", "Phone"],
                    ["customerEmail", "Email"],
                    ["customerCity", "City"],
                    ["customerGovernorate", "Governorate"],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                      {label}
                      <input
                        value={editDraft[key as keyof AdminOrderEditDraft] as string}
                        onChange={(event) => updateEditDraft(key as keyof AdminOrderEditDraft, event.target.value)}
                        className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                      />
                    </label>
                  ))}
                  <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2">
                    Address
                    <textarea
                      value={editDraft.customerAddress}
                      onChange={(event) => updateEditDraft("customerAddress", event.target.value)}
                      className="min-h-20 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                    />
                  </label>
                </div>

                <div className="rounded-3xl bg-white p-3">
                  <div>
                    <h5 className="text-sm font-black">Tracking / courier record</h5>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#0F1A26]/45">
                      Use this to record a manual tracking number or correct dashboard tracking fields. It does not call the courier by itself.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[
                      ["BostaTrackingNumber", "Tracking number"],
                      ["BostaTrackingLink", "Tracking link"],
                      ["BostaStatus", "Courier status"],
                      ["BostaLatestCode", "Latest code"],
                      ["BostaLatestLocation", "Latest location"],
                      ["BostaLatestDate", "Latest date"],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                        {label}
                        <input
                          value={editDraft[key as keyof AdminOrderEditDraft] as string}
                          onChange={(event) => updateEditDraft(key as keyof AdminOrderEditDraft, event.target.value)}
                          className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                        />
                      </label>
                    ))}
                    <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2">
                      Latest update
                      <textarea
                        value={editDraft.BostaLatestUpdate}
                        onChange={(event) => updateEditDraft("BostaLatestUpdate", event.target.value)}
                        className="min-h-16 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2">
                      Courier error / note
                      <textarea
                        value={editDraft.BostaError}
                        onChange={(event) => updateEditDraft("BostaError", event.target.value)}
                        className="min-h-16 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-black">Product lines</h5>
                    <button
                      type="button"
                      onClick={addEditItem}
                      className="h-9 rounded-2xl border border-[#0F1A26]/10 px-4 text-xs font-black transition hover:bg-[#F8F6F3]"
                    >
                      Add line
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {editDraft.items.map((item, index) => {
                      const product = inventory.find((entry) => entry.slug === item.productSlug);
                      const matchedProduct = product || inventory.find((entry) => entry.name === item.name);
                      const sizeRows = matchedProduct ? getSizeRows(matchedProduct) : [];

                      return (
                        <div key={`${index}-${item.productSlug}-${item.name}`} className="rounded-2xl border border-[#0F1A26]/10 p-3">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 xl:col-span-2">
                              Catalog product
                              <select
                                value={item.productSlug}
                                onChange={(event) => updateEditItem(index, "productSlug", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              >
                                <option value="">Manual product</option>
                                {inventory.map((productItem) => (
                                  <option key={productItem.slug} value={productItem.slug}>
                                    {productItem.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 xl:col-span-2">
                              Product name
                              <input
                                value={item.name}
                                onChange={(event) => updateEditItem(index, "name", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              />
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                              Size
                              {sizeRows.length > 1 ? (
                                <select
                                  value={item.size}
                                  onChange={(event) => updateEditItem(index, "size", event.target.value)}
                                  className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                                >
                                  <option value="">No size</option>
                                  {sizeRows.map((row) => (
                                    <option key={row.size} value={row.size}>{row.size}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={item.size}
                                  onChange={(event) => updateEditItem(index, "size", event.target.value)}
                                  className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                                />
                              )}
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                              Color
                              <input
                                value={item.color}
                                onChange={(event) => updateEditItem(index, "color", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              />
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                              Qty
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(event) => updateEditItem(index, "quantity", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              />
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                              Unit
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(event) => updateEditItem(index, "unitPrice", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              />
                            </label>
                            <label className="space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                              Line total
                              <input
                                type="number"
                                min="0"
                                value={item.lineTotal}
                                onChange={(event) => updateEditItem(index, "lineTotal", event.target.value)}
                                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                              />
                            </label>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeEditItem(index)}
                                disabled={editDraft.items.length <= 1}
                                className="h-11 w-full rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <label className="block space-y-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  Admin note
                  <textarea
                    value={editDraft.note}
                    onChange={(event) => updateEditDraft("note", event.target.value)}
                    placeholder="Example: Customer changed M to L / order returned / manual total correction"
                    className="min-h-20 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0F1A26]"
                  />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditDraft(buildOrderEditDraft(order))}
                    className="h-11 rounded-2xl border border-[#0F1A26]/10 px-5 text-sm font-black transition hover:bg-white"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveManualEdit(order, editDraft)}
                    disabled={actionLoadingRef === `order-edit:${orderRef}`}
                    className="h-11 rounded-2xl bg-[#EEBC3F] px-6 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {actionLoadingRef === `order-edit:${orderRef}` ? "Saving..." : "Save manual edit"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="mb-5 rounded-[1.5rem] border border-[#0F1A26]/10 bg-[#F8F6F3] p-4">
            <h4 className="text-lg font-black">Courier order cycle</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">1. Edit</p>
                <p className="mt-1 text-sm font-bold text-[#0F1A26]/65">Save customer, address, phone, items and totals on the order.</p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">2. Create / replace</p>
                <p className="mt-1 text-sm font-bold text-[#0F1A26]/65">This is the step that sends the latest saved data to the active courier and returns a tracking number.</p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">3. Refresh status</p>
                <p className="mt-1 text-sm font-bold text-[#0F1A26]/65">Reads shipment movement from the courier. It does not edit the shipment.</p>
              </div>
            </div>
            {oldTrackingCancelRequired && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
                This order has an old replaced tracking number{previousTrackingNumbers.length ? `: ${previousTrackingNumbers.join(", ")}` : ""}. Use the Bosta terminate action for any active old tracking, then refresh status to keep the dashboard clean.
              </div>
            )}
            {needsBostaReplacement(order) && (
              <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm font-bold leading-6 text-orange-900">
                This order changed after tracking was created. Terminate the old Bosta shipment first, then create a new shipment from the latest saved order data.
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataPill label="total" value={money.format(getAmount(order))} />
            <DataPill label="subtotal" value={money.format(getSubtotal(order))} />
            <DataPill label="discounts" value={money.format(getDiscount(order))} />
            <DataPill label="shipping" value={money.format(getShipping(order))} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
              <h4 className="mb-3 text-lg font-black">Customer</h4>
              <KeyValueGrid data={customer} />
            </section>

            <section className="rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
              <h4 className="mb-3 text-lg font-black">Payment & order status</h4>
              <KeyValueGrid
                data={{
                  payment_method: getPaymentMethod(order),
                  payment_status: getPaymentStatus(order),
                  order_status: getStatus(order),
                  delivery_method: getString(order.delivery_method || order["Delivery Method"]),
                  created_from: getOrderSource(order),
                  last_update_source: getOrderLastUpdateSource(order),
                }}
              />
            </section>
          </div>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Products</h4>
            {items.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    <tr>
                      <th className="py-2 pe-3">Product</th>
                      <th className="py-2 pe-3">Variant</th>
                      <th className="py-2 pe-3">Qty</th>
                      <th className="py-2 pe-3">Unit</th>
                      <th className="py-2 pe-3">Line</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F1A26]/8">
                    {items.map((item, index) => (
                      <tr key={`${getString(item.id || item.slug || item.name)}-${index}`}>
                        <td className="py-3 pe-3 font-black">{getString(item.name || item.title || item.slug)}</td>
                        <td className="py-3 pe-3 text-[#0F1A26]/60">
                          {[item.size, item.color, item.variant, item.option].map(getString).filter(Boolean).join(" / ") || "-"}
                        </td>
                        <td className="py-3 pe-3 font-bold">{getString(item.quantity || item.qty || 1)}</td>
                        <td className="py-3 pe-3">{money.format(getItemUnitPrice(item))}</td>
                        <td className="py-3 pe-3 font-black">{money.format(getItemLineTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F8F6F3] p-4 text-sm font-bold text-[#0F1A26]/45">No product lines recorded.</p>
            )}
          </section>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Courier tracking</h4>
            <KeyValueGrid
              data={{
                tracking_number: getTrackingNumber(order),
                dashboard_stage: getOrderShipmentStatusLabel(order),
                Bosta_status: getBostaStatus(order),
                update_code: getBostaLatestCode(order),
                update_description: getBostaLatestUpdate(order),
                update_location: getBostaLatestLocation(order),
                update_datetime: getString(Bosta.latestDate || order["Bosta Latest Date"]),
                comments: getString(Bosta.latestComments),
                problem_code: getString(Bosta.latestProblemCode),
                estimated_delivery: getString(Bosta.estimatedDelivery),
                synced_at: formatAdminDateTime(getBostaSyncedAt(order)) || getBostaSyncedAt(order),
                error: getBostaError(order),
                ...bostaDisplay,
              }}
            />
            {!isEmptyAdminValue(Bosta.trackingRaw) && (
              <details className="mt-4 rounded-2xl bg-[#0F1A26] p-4 text-white">
                <summary className="cursor-pointer text-sm font-black">Full courier tracking response</summary>
                <div className="mt-3 max-h-[360px] overflow-auto">
                  {typeof Bosta.trackingRaw === "string" ? (
                    <DataPill label="tracking response" value={Bosta.trackingRaw} dark />
                  ) : (
                    <KeyValueGrid data={getObject(Bosta.trackingRaw)} dark />
                  )}
                </div>
              </details>
            )}
          </section>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Customer notifications</h4>
            <KeyValueGrid
              data={{
                customer_confirmation_email: formatAdminDateTime(getCustomerEmailSentAt(order)) || getCustomerEmailSentAt(order) || "Not recorded",
                instapay_pending_customer_email: formatAdminDateTime(getInstaPayPendingCustomerEmailSentAt(order)) || getInstaPayPendingCustomerEmailSentAt(order) || "Not recorded",
                admin_instapay_approval_email: formatAdminDateTime(getInstaPayApprovalEmailSentAt(order)) || getInstaPayApprovalEmailSentAt(order) || "Not recorded",
                confirmation_email_tracking_number: getTrackingNumber(order) || "Tracking not available yet",
              }}
            />
          </section>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Audit timeline</h4>
            {auditRows.length ? (
              <div className="space-y-3">
                {auditRows.map((entry, index) => (
                  <div key={`${getString(entry.timestamp)}-${index}`} className="rounded-2xl bg-[#F8F6F3] p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-black">
                        {getString(entry.action || entry.status || entry.source || "event")}
                      </p>
                      <p className="text-xs font-bold text-[#0F1A26]/40">{getString(entry.timestamp)}</p>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#0F1A26]/55">
                      {getString(entry.note || entry.source || entry.event_key)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F8F6F3] p-4 text-sm font-bold text-[#0F1A26]/45">
                No audit events recorded yet.
              </p>
            )}
          </section>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Finance extras / complete order record</h4>
            <div className="grid gap-5 lg:grid-cols-2">
              <KeyValueGrid data={extras} />
              <div className="max-h-[420px] overflow-auto rounded-2xl bg-[#0F1A26] p-4">
                <KeyValueGrid data={order} dark />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [skippedEmptyOrderRows, setSkippedEmptyOrderRows] = useState(0);
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [BostaCities, setBostaCities] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [inventoryFetchedAt, setInventoryFetchedAt] = useState("");
  const [expensesFetchedAt, setExpensesFetchedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [BostaSyncing, setBostaSyncing] = useState(false);
  const [BostaSyncMessage, setBostaSyncMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expenseQuery, setExpenseQuery] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expensePaymentFilter, setExpensePaymentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("finance");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [customDateDraftFrom, setCustomDateDraftFrom] = useState("");
  const [customDateDraftTo, setCustomDateDraftTo] = useState("");
  const [actionLoadingRef, setActionLoadingRef] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(25);
  const [stockCoverageDays, setStockCoverageDays] = useState(14);
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [manualOrderDraft, setManualOrderDraft] = useState<AdminManualOrderDraft>({
    orderKind: "special",
    productSlug: "",
    productSize: "",
    customerName: "",
    phone: "",
    email: "",
    city: "",
    governorate: "",
    address: "",
    notes: "",
    specialProductBrief: "",
    title: "",
    quantity: "1",
    unitPrice: "",
    total: "",
    paymentMethod: "custom_bulk",
    paymentStatus: "Paid",
    deliveryMethod: "custom",
    createBostaShipment: false,
  });
  const [manualOrderItems, setManualOrderItems] = useState<AdminManualOrderItemDraft[]>([
    {
      orderKind: "special",
      productSlug: "",
      productSize: "",
      title: "",
      quantity: "1",
      unitPrice: "",
      total: "",
      specialProductBrief: "",
    },
  ]);
  const [bostaPickupDraft, setBostaPickupDraft] = useState<BostaPickupDraft>({
    scheduledDate: getTomorrowInputDate(),
    numberOfParcels: "1",
    packageType: "Normal",
    notes: "",
  });

  useEffect(() => {
    window.localStorage.removeItem("natonat-admin-token");
    const stored = window.localStorage.getItem("natonat-admin-session") || "";
    setSavedToken(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/bosta/districts", { cache: "force-cache" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const names = Array.isArray(data)
          ? data
          : Array.isArray(data?.names)
            ? data.names
            : Array.isArray(data?.districts)
              ? data.districts.map((district: unknown) => getString(getObject(district).name || getObject(district).districtName))
              : [];
        if (!cancelled) {
          setBostaCities(names.filter((city: unknown): city is string => typeof city === "string" && city.trim().length > 0));
        }
      })
      .catch(() => {
        if (!cancelled) setBostaCities([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadOrders = async (activeToken = savedToken) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders?limit=750", {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        cache: "no-store",
      });
      const data = (await res.json()) as OrdersResponse;

      if (!res.ok || !data.success || !Array.isArray(data.orders)) {
        throw new Error(formatApiError(data.error, data.details, "Could not load orders"));
      }

      setOrders(data.orders);
      setSkippedEmptyOrderRows(data.skipped_empty_rows || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (activeToken = savedToken) => {
    setInventoryLoading(true);

    try {
      const res = await fetch("/api/admin/inventory", {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        cache: "no-store",
      });
      const data = (await res.json()) as InventoryResponse;

      if (!res.ok || !data.success || !Array.isArray(data.inventory)) {
        throw new Error(data.error || "Could not load inventory");
      }

      setInventory(data.inventory);
      setInventoryFetchedAt(data.fetchedAt || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inventory");
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadExpenses = async (activeToken = savedToken) => {
    setExpensesLoading(true);

    try {
      const res = await fetch("/api/admin/expenses", {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        cache: "no-store",
      });
      const data = (await res.json()) as ExpensesResponse;

      if (!res.ok || !data.success || !Array.isArray(data.expenses)) {
        throw new Error(data.error || "Could not load expenses");
      }

      setExpenses(data.expenses);
      setExpensesFetchedAt(data.fetchedAt || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load expenses");
    } finally {
      setExpensesLoading(false);
    }
  };

  const refreshAll = (activeToken = savedToken) => {
    void loadOrders(activeToken);
    void loadInventory(activeToken);
    void loadExpenses(activeToken);
  };

  const changeDatePreset = (nextPreset: DatePreset) => {
    setDatePreset(nextPreset);
    if (nextPreset !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    } else {
      setCustomDateDraftFrom(customDateFrom);
      setCustomDateDraftTo(customDateTo);
    }
  };

  const applyCustomDateRange = () => {
    setDatePreset("custom");
    setCustomDateFrom(customDateDraftFrom);
    setCustomDateTo(customDateDraftTo);
    setOrdersPage(1);
  };

  const clearCustomDateRange = () => {
    setDatePreset("all");
    setCustomDateDraftFrom("");
    setCustomDateDraftTo("");
    setCustomDateFrom("");
    setCustomDateTo("");
    setOrdersPage(1);
  };

  const loginAndLoad = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { success?: boolean; sessionToken?: string; error?: string };

      if (!res.ok || !data.success || !data.sessionToken) {
        throw new Error(data.error || "Could not login");
      }

      window.localStorage.setItem("natonat-admin-session", data.sessionToken);
      setSavedToken(data.sessionToken);
      setPassword("");
      refreshAll(data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not login");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("natonat-admin-session");
    setSavedToken("");
    setOrders([]);
    setSkippedEmptyOrderRows(0);
    setInventory([]);
    setSelectedOrder(null);
  };

  const syncBosta = async () => {
    setBostaSyncing(true);
    setBostaSyncMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = (await res.json()) as BostaSyncResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not sync Bosta");
      }

      setBostaSyncMessage(`Tracking status refreshed: ${data.synced || 0} updated, ${data.failed || 0} failed.`);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync Bosta");
    } finally {
      setBostaSyncing(false);
    }
  };

  const syncOneBosta = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`Bosta:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRefs: [orderRef], limit: 1 }),
      });
      const data = (await res.json()) as BostaSyncResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not sync this Bosta order");
      }

      setBostaSyncMessage(`Tracking status refreshed for ${orderRef}: ${data.synced || 0} updated, ${data.failed || 0} failed.`);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync this Bosta order");
    } finally {
      setActionLoadingRef("");
    }
  };

  const approveInstaPayOrder = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`instapay:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/instapay-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRef }),
      });
      const data = (await res.json()) as AdminActionResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not approve InstaPay order");
      }

      setBostaSyncMessage(`InstaPay approved for ${orderRef}.`);
      setSelectedOrder(null);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve InstaPay order");
    } finally {
      setActionLoadingRef("");
    }
  };

  const createBostaPickupRequest = async () => {
    setActionLoadingRef("bosta-pickup");
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          scheduledDate: bostaPickupDraft.scheduledDate,
          numberOfParcels: getNumber(bostaPickupDraft.numberOfParcels) || 1,
          packageType: bostaPickupDraft.packageType,
          notes: bostaPickupDraft.notes,
        }),
      });
      const data = (await res.json()) as AdminActionResponse & { message?: string };

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not create Bosta pickup"));
      }

      setBostaSyncMessage(data.message || "Bosta pickup request created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create Bosta pickup");
    } finally {
      setActionLoadingRef("");
    }
  };

  const printBostaAwb = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    const trackingNumber = getTrackingNumber(order);
    if (!trackingNumber) return;

    setActionLoadingRef(`bosta-awb:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-awb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          trackingNumbers: [trackingNumber],
          requestedAwbType: "A4",
          lang: "ar",
        }),
      });
      const data = (await res.json()) as AdminActionResponse & {
        pdfBase64?: string;
        message?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not print Bosta AWB"));
      }

      if (data.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0));
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setBostaSyncMessage(`Bosta AWB opened for ${trackingNumber}.`);
      } else {
        setBostaSyncMessage(data.message || `Bosta AWB requested for ${trackingNumber}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not print Bosta AWB");
    } finally {
      setActionLoadingRef("");
    }
  };

  const updateManualOrderDraft = (key: keyof AdminManualOrderDraft, value: string | boolean) => {
    setManualOrderDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "createBostaShipment" && value === true) {
        if (next.paymentMethod === "custom_bulk" || next.orderKind === "special") {
          next.createBostaShipment = false;
          next.deliveryMethod = "custom";
          return next;
        }
        next.deliveryMethod = "delivery";
      }
      if (key === "createBostaShipment" && value === false) {
        next.deliveryMethod = "custom";
        if (next.paymentMethod === "cod") {
          next.paymentMethod = "custom_bulk";
          next.paymentStatus = "Paid";
        }
      }
      if (key === "deliveryMethod") {
        next.createBostaShipment =
          value === "delivery" &&
          next.paymentMethod !== "custom_bulk" &&
          next.orderKind !== "special";
      }
      if (key === "orderKind") {
        if (value === "special") {
          next.productSlug = "";
          next.productSize = "";
          next.createBostaShipment = false;
          next.deliveryMethod = "custom";
          if (!next.paymentMethod || next.paymentMethod === "cod") {
            next.paymentMethod = "custom_bulk";
            next.paymentStatus = "Paid";
          }
        }
      }
      if (key === "paymentMethod") {
        if (value === "cod") next.paymentStatus = "Cash on Delivery";
        if (value === "paymob_card" || value === "instapay" || value === "bank_transfer") next.paymentStatus = "Paid";
        if (value === "custom_bulk") {
          next.paymentStatus = "Paid";
          next.createBostaShipment = false;
          next.deliveryMethod = "custom";
        }
      }
      if (key === "productSlug") {
        const product = inventory.find((item) => item.slug === String(value));
        if (product) {
          const size = getDefaultProductSize(product);
          const price = getSizePrice(product, size);
          const quantity = getNumber(next.quantity) || 1;
          next.productSize = size;
          next.title = product.name;
          next.unitPrice = price > 0 ? String(price) : "";
          next.total = price > 0 ? String(price * quantity) : next.total;
        } else {
          next.productSize = "";
        }
      }
      if (key === "productSize") {
        const product = inventory.find((item) => item.slug === next.productSlug);
        const price = getSizePrice(product, String(value));
        const quantity = getNumber(next.quantity) || 1;
        if (price > 0) {
          next.unitPrice = String(price);
          next.total = String(price * quantity);
        }
      }
      if (key === "quantity" || key === "unitPrice") {
        const quantity = getNumber(key === "quantity" ? value : next.quantity);
        const unitPrice = getNumber(key === "unitPrice" ? value : next.unitPrice);
        if (quantity > 0 && unitPrice > 0) {
          next.total = String(quantity * unitPrice);
        }
      }
      return next;
    });
  };

  const updateManualOrderItem = (index: number, key: keyof AdminManualOrderItemDraft, value: string) => {
    setManualOrderItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, [key]: value };

      if (key === "orderKind" && value === "special") {
        next.productSlug = "";
        next.productSize = "";
      }

      if (key === "productSlug") {
        const product = inventory.find((entry) => entry.slug === value);
        if (product) {
          const size = getDefaultProductSize(product);
          const price = getSizePrice(product, size);
          const quantity = getNumber(next.quantity) || 1;
          next.orderKind = "catalog";
          next.productSize = size;
          next.title = product.name;
          next.unitPrice = price > 0 ? String(price) : next.unitPrice;
          next.total = price > 0 ? String(price * quantity) : next.total;
        } else {
          next.productSize = "";
        }
      }

      if (key === "productSize") {
        const product = inventory.find((entry) => entry.slug === next.productSlug);
        const price = getSizePrice(product, value);
        const quantity = getNumber(next.quantity) || 1;
        if (price > 0) {
          next.unitPrice = String(price);
          next.total = String(price * quantity);
        }
      }

      if (key === "quantity" || key === "unitPrice") {
        const quantity = getNumber(key === "quantity" ? value : next.quantity);
        const unitPrice = getNumber(key === "unitPrice" ? value : next.unitPrice);
        next.total = quantity > 0 && unitPrice > 0 ? String(quantity * unitPrice) : next.total;
      }

      return next;
    }));
  };

  const addManualOrderItem = () => {
    setManualOrderItems((current) => [
      ...current,
      { orderKind: "special", productSlug: "", productSize: "", title: "", quantity: "1", unitPrice: "", total: "", specialProductBrief: "" },
    ]);
  };

  const removeManualOrderItem = (index: number) => {
    setManualOrderItems((current) => current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const createManualCustomOrder = async () => {
    setActionLoadingRef("manual-order");
    setError("");

    try {
      const manualItemsPayload = manualOrderItems.map((item) => ({
        orderKind: item.orderKind,
        productSlug: item.orderKind === "catalog" ? item.productSlug : "",
        productSize: item.orderKind === "catalog" ? item.productSize : "",
        title: item.title,
        quantity: getNumber(item.quantity),
        unitPrice: getNumber(item.unitPrice),
        total: getNumber(item.total),
        specialProductBrief: item.specialProductBrief,
      }));
      const manualItemsTotal = manualItemsPayload.reduce((sum, item) => sum + item.total, 0);
      const res = await fetch("/api/admin/manual-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          ...manualOrderDraft,
          productSlug: manualOrderDraft.orderKind === "catalog" ? manualOrderDraft.productSlug : "",
          productSize: manualOrderDraft.orderKind === "catalog" ? manualOrderDraft.productSize : "",
          quantity: getNumber(manualOrderDraft.quantity),
          unitPrice: getNumber(manualOrderDraft.unitPrice),
          total: manualItemsTotal || getNumber(manualOrderDraft.total),
          items: manualItemsPayload,
          createBostaShipment: manualOrderIsDashboardOnly ? false : manualOrderDraft.createBostaShipment,
        }),
      });
      const data = (await res.json()) as AdminActionResponse;

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not create custom order"));
      }

      setBostaSyncMessage(
        data.trackingNumber
          ? `Manual order + Bosta shipment created: ${data.order_ref || ""}. Tracking: ${data.trackingNumber}.`
          : `Manual order saved without shipment: ${data.order_ref || ""}. Turn on "Create real courier shipment" when delivery tracking is needed.`,
      );
      setManualOrderOpen(false);
      setManualOrderDraft({
        orderKind: "special",
        productSlug: "",
        productSize: "",
        customerName: "",
        phone: "",
        email: "",
        city: "",
        governorate: "",
        address: "",
        notes: "",
        specialProductBrief: "",
        title: "",
        quantity: "1",
        unitPrice: "",
        total: "",
        paymentMethod: "custom_bulk",
        paymentStatus: "Paid",
        deliveryMethod: "custom",
        createBostaShipment: false,
      });
      setManualOrderItems([
        { orderKind: "special", productSlug: "", productSize: "", title: "", quantity: "1", unitPrice: "", total: "", specialProductBrief: "" },
      ]);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create custom order");
    } finally {
      setActionLoadingRef("");
    }
  };

  const saveManualOrderEdit = async (order: AdminOrder, draft: AdminOrderEditDraft) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`order-edit:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/order-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          orderRef,
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          paymentMethod: draft.paymentMethod,
          deliveryMethod: draft.deliveryMethod,
          amountEgp: getNumber(draft.amountEgp),
          subtotalEgp: getNumber(draft.subtotalEgp),
          shippingEgp: getNumber(draft.shippingEgp),
          discountEgp: getNumber(draft.discountEgp),
          paymentDiscountEgp: getNumber(draft.paymentDiscountEgp),
          customer: {
            first_name: draft.customerFirstName,
            last_name: draft.customerLastName,
            email: draft.customerEmail,
            phone: draft.customerPhone,
            city: draft.customerCity,
            governorate: draft.customerGovernorate,
            address: draft.customerAddress,
          },
          bosta: {
            trackingNumber: draft.BostaTrackingNumber,
            trackingLink: draft.BostaTrackingLink,
            status: draft.BostaStatus,
            latestCode: draft.BostaLatestCode,
            latestDescription: draft.BostaLatestUpdate,
            latestLocation: draft.BostaLatestLocation,
            latestDate: draft.BostaLatestDate,
            error: draft.BostaError,
            manualTrackingUpdatedAt: new Date().toISOString(),
          },
          items: draft.items.map((item) => ({
            slug: item.productSlug,
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: getNumber(item.quantity) || 1,
            unit_price_egp: getNumber(item.unitPrice),
            line_total_egp: getNumber(item.lineTotal),
            price: getNumber(item.unitPrice),
          })),
          note: draft.note,
        }),
      });
      const data = (await res.json()) as AdminActionResponse & {
        changedFields?: string[];
        storage?: Record<string, string>;
        bostaUpdate?: { attempted?: boolean; success?: boolean; message?: string; error?: string };
      };

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not save manual order edit"));
      }

      const bostaNote = data.bostaUpdate?.attempted
        ? data.bostaUpdate.success
          ? ` Bosta updated: ${data.bostaUpdate.message || "done"}.`
          : ` Bosta update failed; replacement is required: ${data.bostaUpdate.error || "check order"}.`
        : "";
      setBostaSyncMessage(
        `Order ${orderRef} updated manually. Changed: ${data.changedFields?.length ? data.changedFields.join(", ") : "no fields"}.${bostaNote}`,
      );
      setSelectedOrder(null);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save manual order edit");
    } finally {
      setActionLoadingRef("");
    }
  };

  const createBostaShipmentFromOrder = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`Bosta-create:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRef }),
      });
      const data = (await res.json()) as AdminActionResponse;

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not create Bosta shipment"));
      }

      setBostaSyncMessage(
        data.previousTrackingNumber
          ? `Replacement shipment created for ${orderRef}. New tracking: ${data.trackingNumber}. Old tracking needs portal cancel/check: ${data.previousTrackingNumber}.`
          : `Bosta shipment created for ${orderRef}. Tracking: ${data.trackingNumber}.`,
      );
      setSelectedOrder(null);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create Bosta shipment");
    } finally {
      setActionLoadingRef("");
    }
  };

  const terminateBostaShipmentForReplacement = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    const trackingNumber = getTrackingNumber(order);
    if (!orderRef || !trackingNumber) return;

    const confirmed = window.confirm(
      `Terminate Bosta tracking ${trackingNumber}? After this, create a new shipment for the corrected order.`,
    );
    if (!confirmed) return;

    setActionLoadingRef(`bosta-terminate:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/bosta-terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRef, trackingNumber }),
      });
      const data = (await res.json()) as AdminActionResponse & { message?: string };

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not terminate Bosta shipment"));
      }

      setBostaSyncMessage(
        `${data.message || "Bosta shipment terminated."} You can now create a new shipment for ${orderRef}.`,
      );
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not terminate Bosta shipment");
    } finally {
      setActionLoadingRef("");
    }
  };

  const deleteOrderEverywhere = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    const confirmed = window.confirm(
      `Delete order ${orderRef} permanently from dashboard, database, and Google Sheets?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    setActionLoadingRef(`order-delete:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/order-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRef }),
      });
      const data = (await res.json()) as AdminActionResponse & { storage?: Record<string, string> };

      if (!res.ok || !data.success) {
        throw new Error(formatApiError(data.error, data.details, "Could not delete order"));
      }

      setOrders((current) => current.filter((candidate) => getOrderRef(candidate) !== orderRef));
      setSelectedOrder(null);
      setBostaSyncMessage(
        `Order ${orderRef} deleted. Supabase: ${data.storage?.supabase || "-"} - Google Sheets: ${data.storage?.google_sheets || "-"}.`,
      );
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete order");
    } finally {
      setActionLoadingRef("");
    }
  };

  const exportOrdersCsv = () => {
    const headers = [
      "order_ref",
      "source",
      "created_at",
      "updated_at",
      "order_status",
      "payment_status",
      "payment_method",
      "delivery_method",
      "courier_label",
      "customer_first_name",
      "customer_last_name",
      "customer_name",
      "email",
      "phone",
      "city",
      "governorate",
      "address",
      "city_key",
      "items_flat",
      "items_json",
      "total_items_quantity",
      "retail_pieces",
      "bulk_pieces",
      "subtotal_egp",
      "order_discount_egp",
      "payment_discount_egp",
      "discount_egp",
      "shipping_egp",
      "total_egp",
      "amount_cents",
      "is_confirmed",
      "is_returned_or_cancelled",
      "is_delivered",
      "is_custom_bulk",
      "bosta_tracking_number",
      "bosta_tracking_link",
      "bosta_delivery_id",
      "bosta_status",
      "bosta_latest_code",
      "bosta_latest_update",
      "bosta_latest_location",
      "bosta_latest_date",
      "bosta_synced_at",
      "bosta_error",
      "customer_email_sent_at",
      "instapay_approval_email_sent_at",
      "instapay_pending_customer_email_sent_at",
      "admin_audit_json",
      "extras_json",
      "raw_order_json",
    ];
    const rows = filteredOrders.map((order) => {
      const customer = getCustomer(order);
      const bosta = getBosta(order);
      const extras = getExtras(order);
      const items = getItems(order);
      const firstName = getString(customer.first_name || customer.name);
      const lastName = getString(customer.last_name);
      return [
        getOrderRef(order),
        getOrderSource(order),
        getCreatedAt(order),
        getUpdatedAt(order),
        getStatus(order),
        getPaymentStatus(order),
        getPaymentMethod(order),
        getDeliveryMethod(order),
        getOrderShipmentStatusLabel(order),
        firstName,
        lastName,
        [firstName, lastName].filter(Boolean).join(" "),
        getString(customer.email || order["Email"]),
        getString(customer.phone || order["Phone"]),
        getString(customer.city || order["City"]),
        getString(customer.governorate || order["Governorate"]),
        getString(customer.address || order["Address"]),
        getString(extras.city_key || order["City Key"]),
        getString(order.items_flat || order["Items"]),
        JSON.stringify(items),
        String(getNumber(order["Total Items Quantity"]) || items.reduce((sum, item) => sum + getItemRecordedQuantity(item), 0)),
        String(getOrderRecordedPieces(order)),
        String(getOrderCustomPieces(order)),
        String(getSubtotal(order)),
        String(getOrderDiscount(order)),
        String(getPaymentDiscount(order)),
        String(getDiscount(order)),
        String(getShipping(order)),
        String(getAmount(order)),
        String(getNumber(order.amount_cents || order["Total Cents"])),
        isConfirmed(order) ? "yes" : "no",
        isReturned(order) ? "yes" : "no",
        isDelivered(order) ? "yes" : "no",
        isCustomOrder(order) ? "yes" : "no",
        getTrackingNumber(order),
        getString(bosta.trackingLink || order["Bosta Tracking Link"]),
        getString(bosta.deliveryId || bosta.guid || order["Bosta Delivery ID"]),
        getBostaStatus(order),
        getBostaLatestCode(order),
        getBostaLatestUpdate(order),
        getBostaLatestLocation(order),
        getString(bosta.latestDate || order["Bosta Latest Date"]),
        getBostaSyncedAt(order),
        getBostaError(order),
        getCustomerEmailSentAt(order),
        getInstaPayApprovalEmailSentAt(order),
        getInstaPayPendingCustomerEmailSentAt(order),
        JSON.stringify(getArray(order.admin_audit)),
        JSON.stringify(extras),
        JSON.stringify(order),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `natonat-orders-${dateRange.label.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExpensesCsv = () => {
    const headers = [
      "date",
      "title",
      "category",
      "amount_egp",
      "payment_method",
      "vendor",
      "related_order_ref",
      "notes",
    ];
    const rows = filteredExpenses.map((expense) => [
      expense.expenseDate || "",
      expense.title || "",
      expense.category || "",
      String(getExpenseAmount(expense)),
      expense.paymentMethod || "",
      expense.vendor || "",
      expense.relatedOrderRef || "",
      expense.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `natonat-expenses-${dateRange.label.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFinanceReportCsv = () => {
    const rows: string[][] = [
      ["natOnat finance report"],
      ["period", dateRange.label],
      [],
      ["summary"],
      ["all_orders_subtotal_shipping_excluded", String(stats.allOrdersSubtotal)],
      ["all_orders_shipping", String(stats.allOrdersShipping)],
      ["all_orders_total_shipping_included", String(stats.allOrdersValue)],
      ["all_orders_discounts", String(stats.allOrdersDiscounts)],
      ["confirmed_gross_shipping_excluded", String(stats.grossSales)],
      ["confirmed_total_shipping_included", String(stats.confirmedTotalValue)],
      ["net_revenue_before_expenses", String(stats.netRevenue)],
      ["expenses", String(expenseStats.total)],
      ["net_after_expenses", String(expenseStats.netAfterExpenses)],
      ["orders_count", String(stats.totalOrders)],
      ["pickup_orders", String(stats.pickupOrders)],
      ["delivery_orders", String(stats.deliveryOrders)],
      ["total_sold_pieces_before_returns", String(stats.soldPieces)],
      ["returned_cancelled_pieces", String(stats.returnedPieces)],
      ["delivered_sold_pieces", String(stats.deliveredPieces)],
      ["retail_pieces_after_returns_excluding_special_bulk", String(stats.totalPieces)],
      ["special_bulk_pieces_after_returns", String(stats.customPieces)],
      ["all_pieces_after_returns", String(stats.allPieces)],
      ["returned_cancelled_orders", String(stats.returnedOrders)],
      ["returned_cancelled_value", String(stats.returnedValue)],
      ["shipped_not_delivered_orders", String(stats.shippedNotDeliveredOrders)],
      ["shipped_not_delivered_value", String(stats.shippedNotDeliveredValue)],
      ["discounts", String(stats.discounts)],
      ["shipping_collected", String(stats.shippingCollected)],
      ["cod_expected_to_collect", String(stats.codToCollectValue)],
      ["paid_online_collected", String(stats.paidOnlineValue)],
      [],
      ["daily_close"],
      [
        "date",
        "orders",
        "confirmed",
        "total_units",
        "luggage_covers_units",
        "packonat_units",
        "passport_wallet_units",
        "custom_bulk_units",
        "other_units",
        "units_by_category",
        "gross",
        "discounts",
        "shipping",
        "returns",
        "expenses",
        "net",
        "net_after_expenses",
        "Bosta_issues",
      ],
      ...dailyClose.map((day) => [
        day.date,
        String(day.orders),
        String(day.confirmed),
        String(day.unitsByCategory.total),
        String(day.unitsByCategory.luggageCovers),
        String(day.unitsByCategory.packOnat),
        String(day.unitsByCategory.passportWallet),
        String(day.unitsByCategory.customBulk),
        String(day.unitsByCategory.other),
        formatDailyCategoryUnits(day.unitsByCategory),
        String(day.gross),
        String(day.discounts),
        String(day.shipping),
        String(day.returned),
        String(day.expenses),
        String(day.net),
        String(day.netAfterExpenses),
        String(day.BostaIssues),
      ]),
      [],
      ["payment_breakdown"],
      ["method", "orders", "gross", "discounts", "shipping", "returns", "net"],
      ...stats.paymentBreakdown.map((row) => [
        row.bucket,
        String(row.orders),
        String(row.gross),
        String(row.discounts),
        String(row.shipping),
        String(row.returns),
        String(row.net),
      ]),
      [],
      ["expense_breakdown"],
      ["category", "entries", "total"],
      ...expenseStats.categories.map((row) => [row.category, String(row.count), String(row.total)]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `natonat-finance-report-${dateRange.label.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!savedToken) return;
    refreshAll(savedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  useEffect(() => {
    setOrdersPage(1);
  }, [cityFilter, customDateFrom, customDateTo, datePreset, deliveryFilter, paymentFilter, query, statusFilter]);

  useEffect(() => {
    if (!savedToken) return;

    const timer = window.setInterval(() => {
      refreshAll(savedToken);
    }, 60_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    if (datePreset === "today") {
      return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
    }

    if (datePreset === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday), label: "Yesterday" };
    }

    if (datePreset === "7d" || datePreset === "30d") {
      const days = datePreset === "7d" ? 7 : 30;
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - (days - 1));
      return { from, to: endOfDay(now), label: `Last ${days} days` };
    }

    if (datePreset === "custom" && (customDateFrom || customDateTo)) {
      const from = customDateFrom ? startOfDay(new Date(customDateFrom)) : null;
      const to = customDateTo ? endOfDay(new Date(customDateTo)) : null;
      return {
        from: from && Number.isFinite(from.getTime()) ? from : null,
        to: to && Number.isFinite(to.getTime()) ? to : null,
        label: "Custom range",
      };
    }

    return { from: null, to: null, label: "All time" };
  }, [customDateFrom, customDateTo, datePreset]);

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!dateRange.from && !dateRange.to) return true;
      const date = getOrderDate(order);
      if (!date) return false;
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      return true;
    });
  }, [dateRange.from, dateRange.to, orders]);

  const visibleExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!dateRange.from && !dateRange.to) return true;
      const date = getExpenseDate(expense);
      if (!date) return false;
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      return true;
    });
  }, [dateRange.from, dateRange.to, expenses]);

  const orderFilterOptions = useMemo(() => {
    const paymentBuckets = new Map<string, number>();
    const deliveryBuckets = new Map<string, number>();
    const cityBuckets = new Map<string, { label: string; count: number }>();
    const statusBuckets = new Map<string, { label: string; count: number }>();

    SHIPMENT_STATUS_STAGES.forEach((stage) => {
      statusBuckets.set(stage.key, { label: stage.label, count: 0 });
    });

    visibleOrders.forEach((order) => {
      const payment = getPaymentBucket(order);
      paymentBuckets.set(payment, (paymentBuckets.get(payment) || 0) + 1);

      const delivery = getDeliveryBucket(order);
      deliveryBuckets.set(delivery, (deliveryBuckets.get(delivery) || 0) + 1);

      const customer = getCustomer(order);
      const city = getString(customer.city || order["City"]) || "Unknown";
      const cityKey = city.toLowerCase();
      const cityRow = cityBuckets.get(cityKey) || { label: city, count: 0 };
      cityRow.count += 1;
      cityBuckets.set(cityKey, cityRow);

      const statusLabel = getOrderShipmentStatusLabel(order);
      const statusKey = getOrderShipmentStatusKey(order);
      const statusRow = statusBuckets.get(statusKey) || { label: statusLabel, count: 0 };
      statusRow.count += 1;
      statusBuckets.set(statusKey, statusRow);
    });

    return {
      payments: Array.from(paymentBuckets.entries()).sort((a, b) => b[1] - a[1]),
      deliveries: Array.from(deliveryBuckets.entries()).sort((a, b) => b[1] - a[1]),
      cities: Array.from(cityBuckets.entries()).sort((a, b) => b[1].count - a[1].count),
      statuses: Array.from(statusBuckets.entries()).sort((a, b) => b[1].count - a[1].count),
    };
  }, [visibleOrders]);

  const filteredMetricOrders = useMemo(() => {
    return visibleOrders.filter((order) => {
      if (paymentFilter !== "all" && getPaymentBucket(order) !== paymentFilter) return false;
      if (deliveryFilter !== "all" && getDeliveryBucket(order) !== deliveryFilter) return false;

      if (cityFilter !== "all") {
        const customer = getCustomer(order);
        const city = (getString(customer.city || order["City"]) || "Unknown").toLowerCase();
        if (city !== cityFilter) return false;
      }

      if (statusFilter !== "all" && getOrderShipmentStatusKey(order) !== statusFilter) return false;

      return true;
    });
  }, [cityFilter, deliveryFilter, paymentFilter, statusFilter, visibleOrders]);

  const shipmentStatusBreakdown = useMemo(() => {
    const rows = new Map<string, { label: string; count: number; value: number }>();

    SHIPMENT_STATUS_STAGES.forEach((stage) => {
      rows.set(stage.key, { label: stage.label, count: 0, value: 0 });
    });

    filteredMetricOrders.forEach((order) => {
      const key = getOrderShipmentStatusKey(order);
      const row = rows.get(key) || {
        label: getOrderShipmentStatusLabel(order),
        count: 0,
        value: 0,
      };
      row.count += 1;
      row.value += getAmount(order);
      rows.set(key, row);
    });

    return Array.from(rows.entries())
      .map(([key, row]) => ({ key, ...row }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return SHIPMENT_STATUS_STAGES.findIndex((stage) => stage.key === a.key) -
          SHIPMENT_STATUS_STAGES.findIndex((stage) => stage.key === b.key);
      });
  }, [filteredMetricOrders]);

  const shipmentStatusTotal = shipmentStatusBreakdown.reduce((sum, row) => sum + row.count, 0);
  const shipmentStatusDifference = filteredMetricOrders.length - shipmentStatusTotal;

  const expenseFilterOptions = useMemo(() => {
    const categories = new Map<string, number>();
    const paymentMethods = new Map<string, number>();

    visibleExpenses.forEach((expense) => {
      const category = expense.category || "other";
      categories.set(category, (categories.get(category) || 0) + 1);

      const paymentMethod = expense.paymentMethod || "unknown";
      paymentMethods.set(paymentMethod, (paymentMethods.get(paymentMethod) || 0) + 1);
    });

    return {
      categories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]),
      paymentMethods: Array.from(paymentMethods.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [visibleExpenses]);

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = expenseQuery.trim().toLowerCase();

    return visibleExpenses.filter((expense) => {
      if (expenseCategoryFilter !== "all" && expense.category !== expenseCategoryFilter) return false;
      if (expensePaymentFilter !== "all" && expense.paymentMethod !== expensePaymentFilter) return false;

      if (normalizedQuery) {
        const searchable = [
          expense.title,
          expense.vendor,
          expense.relatedOrderRef,
          expense.notes,
          expense.category,
          expense.paymentMethod,
        ].join(" ").toLowerCase();
        if (!searchable.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [expenseCategoryFilter, expensePaymentFilter, expenseQuery, visibleExpenses]);

  const stats = useMemo(() => {
    const confirmedOrders = filteredMetricOrders.filter(isConfirmed);
    const revenueOrders = confirmedOrders.filter((order) => !isReturned(order));
    const customOrders = confirmedOrders.filter((order) => !isReturned(order) && isCustomOrder(order));
    const returnedOrders = confirmedOrders.filter(isReturned);
    const unconfirmedOrders = filteredMetricOrders.filter((order) => !isConfirmed(order) && !isReturned(order));
    const allOrdersSubtotal = filteredMetricOrders.reduce((sum, order) => sum + getSubtotal(order), 0);
    const allOrdersShipping = filteredMetricOrders.reduce((sum, order) => sum + getShipping(order), 0);
    const allOrdersDiscounts = filteredMetricOrders.reduce((sum, order) => sum + getDiscount(order), 0);
    const grossSales = confirmedOrders.reduce((sum, order) => sum + getSubtotal(order), 0);
    const confirmedTotalValue = confirmedOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const collectedRevenue = revenueOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const returnedValue = returnedOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const discounts = confirmedOrders.reduce((sum, order) => sum + getDiscount(order), 0);
    const orderDiscounts = confirmedOrders.reduce((sum, order) => sum + getOrderDiscount(order), 0);
    const paymentDiscounts = confirmedOrders.reduce((sum, order) => sum + getPaymentDiscount(order), 0);
    const shippingCollected = confirmedOrders.reduce((sum, order) => sum + getShipping(order), 0);
    const allOrdersValue = filteredMetricOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const unconfirmedValue = unconfirmedOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const missingTotalOrders = filteredMetricOrders.filter((order) => getAmount(order) <= 0);
    const missingDateOrders = filteredMetricOrders.filter((order) => !getOrderDate(order));
    const missingCustomerOrders = filteredMetricOrders.filter((order) => !getString(getCustomer(order).phone) && !getString(getCustomer(order).first_name));
    const missingItemsOrders = filteredMetricOrders.filter((order) => getItems(order).length === 0);
    const missingProductRevenueLines = revenueOrders.reduce((sum, order) => {
      return sum + getItems(order).filter((item) => getItemRecordedQuantity(item) > 0 && getItemLineTotal(item) <= 0).length;
    }, 0);
    const cardOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "card");
    const codOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "cod");
    const instapayOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "instapay");
    const BostaFailed = filteredMetricOrders.filter((order) => getBostaError(order));
    const BostaMissing = filteredMetricOrders.filter(needsBosta);
    const BostaReplacement = filteredMetricOrders.filter(needsBostaReplacement);
    const BostaWithTracking = filteredMetricOrders.filter(hasBostaTracking);
    const BostaSynced = filteredMetricOrders.filter((order) => getBostaStatus(order));
    const pendingInstaPay = filteredMetricOrders.filter(isPendingInstaPay);
    const deliveredOrders = filteredMetricOrders.filter(isDelivered);
    const pickupOrders = filteredMetricOrders.filter((order) => getDeliveryBucket(order) === "pickup");
    const deliveryOrders = filteredMetricOrders.filter((order) => getDeliveryBucket(order) === "delivery");
    const shippedNotDeliveredOrders = filteredMetricOrders.filter((order) => isInTransit(order) && !isDelivered(order) && !isReturned(order));
    const totalPieces = revenueOrders.reduce((sum, order) => sum + getOrderRecordedPieces(order), 0);
    const customPieces = customOrders.reduce((sum, order) => sum + getOrderCustomPieces(order), 0);
    const getTotalOrderPieces = (order: AdminOrder) => getOrderRecordedPieces(order) + getOrderCustomPieces(order);
    const soldPieces = confirmedOrders.reduce((sum, order) => sum + getTotalOrderPieces(order), 0);
    const returnedPieces = returnedOrders.reduce((sum, order) => sum + getTotalOrderPieces(order), 0);
    const deliveredPieces = confirmedOrders
      .filter((order) => isDelivered(order) && !isReturned(order))
      .reduce((sum, order) => sum + getTotalOrderPieces(order), 0);
    const awaitingPaymentOrders = filteredMetricOrders.filter((order) => !isConfirmed(order) && !isReturned(order));
    const paidOnlineOrders = revenueOrders.filter((order) => ["card", "instapay"].includes(getPaymentBucket(order)));
    const codRevenueOrders = revenueOrders.filter((order) => getPaymentBucket(order) === "cod");
    const paidOnlineValue = paidOnlineOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const codToCollectValue = codRevenueOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const BostaBlockedValue = filteredMetricOrders
      .filter((order) => getBostaError(order) || needsBosta(order) || needsBostaReplacement(order))
      .reduce((sum, order) => sum + getAmount(order), 0);
    const paymentBreakdown = ["cod", "card", "instapay", "unknown"].map((bucket) => {
      const bucketOrders = confirmedOrders.filter((order) => getPaymentBucket(order) === bucket);
      return {
        bucket,
        orders: bucketOrders.length,
        gross: bucketOrders.reduce((sum, order) => sum + getSubtotal(order), 0),
        discounts: bucketOrders.reduce((sum, order) => sum + getDiscount(order), 0),
        shipping: bucketOrders.reduce((sum, order) => sum + getShipping(order), 0),
        net: bucketOrders.filter((order) => !isReturned(order)).reduce((sum, order) => sum + getAmount(order), 0),
        returns: bucketOrders.filter(isReturned).reduce((sum, order) => sum + getAmount(order), 0),
      };
    }).filter((row) => row.orders > 0);

    return {
      grossSales,
      allOrdersSubtotal,
      allOrdersShipping,
      allOrdersDiscounts,
      confirmedTotalValue,
      netRevenue: collectedRevenue,
      returnedValue,
      discounts,
      orderDiscounts,
      paymentDiscounts,
      shippingCollected,
      allOrdersValue,
      unconfirmedValue,
      totalOrders: filteredMetricOrders.length,
      confirmedOrders: confirmedOrders.length,
      unconfirmedOrders: unconfirmedOrders.length,
      returnedOrders: returnedOrders.length,
      deliveredOrders: deliveredOrders.length,
      pickupOrders: pickupOrders.length,
      deliveryOrders: deliveryOrders.length,
      shippedNotDeliveredOrders: shippedNotDeliveredOrders.length,
      shippedNotDeliveredValue: shippedNotDeliveredOrders.reduce((sum, order) => sum + getAmount(order), 0),
      totalPieces,
      customPieces,
      allPieces: totalPieces + customPieces,
      soldPieces,
      returnedPieces,
      deliveredPieces,
      awaitingPaymentOrders: awaitingPaymentOrders.length,
      averageOrderValue: revenueOrders.length ? collectedRevenue / revenueOrders.length : 0,
      paidOnlineOrders: paidOnlineOrders.length,
      paidOnlineValue,
      codToCollectOrders: codRevenueOrders.length,
      codToCollectValue,
      BostaBlockedValue,
      customOrders: customOrders.length,
      customOrdersValue: customOrders.reduce((sum, order) => sum + getAmount(order), 0),
      missingTotalOrders: missingTotalOrders.length,
      missingDateOrders: missingDateOrders.length,
      missingCustomerOrders: missingCustomerOrders.length,
      missingItemsOrders: missingItemsOrders.length,
      missingProductRevenueLines,
      cardOrders: cardOrders.length,
      codOrders: codOrders.length,
      instapayOrders: instapayOrders.length,
      BostaFailed: BostaFailed.length,
      BostaMissing: BostaMissing.length,
      BostaReplacement: BostaReplacement.length,
      BostaWithTracking: BostaWithTracking.length,
      BostaSynced: BostaSynced.length,
      pendingInstaPay: pendingInstaPay.length,
      paymentBreakdown,
    };
  }, [filteredMetricOrders]);

  const expenseStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0);
    const categoryMap = new Map<string, { category: string; count: number; total: number }>();
    const paymentMap = new Map<string, { paymentMethod: string; count: number; total: number }>();

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "other";
      const categoryRow = categoryMap.get(category) || { category, count: 0, total: 0 };
      categoryRow.count += 1;
      categoryRow.total += getExpenseAmount(expense);
      categoryMap.set(category, categoryRow);

      const paymentMethod = expense.paymentMethod || "unknown";
      const paymentRow = paymentMap.get(paymentMethod) || { paymentMethod, count: 0, total: 0 };
      paymentRow.count += 1;
      paymentRow.total += getExpenseAmount(expense);
      paymentMap.set(paymentMethod, paymentRow);
    });

    const recent = [...filteredExpenses]
      .sort((a, b) => (getExpenseDate(b)?.getTime() || 0) - (getExpenseDate(a)?.getTime() || 0))
      .slice(0, 20);

    return {
      total,
      count: filteredExpenses.length,
      netAfterExpenses: stats.netRevenue - total,
      categories: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
      paymentMethods: Array.from(paymentMap.values()).sort((a, b) => b.total - a.total),
      recent,
    };
  }, [filteredExpenses, stats.netRevenue]);

  const inventoryStats = useMemo(() => {
    const lowItems = inventory.filter((item) => isInventoryLow(item) && !isInventoryOut(item));
    const outItems = inventory.filter(isInventoryOut);

    const totalKnownUnits = inventory.reduce((sum, item) => {
      const rows = getSizeRows(item);
      const rowQuantity = rows.reduce(
        (rowSum, row) => rowSum + (typeof row.quantity === "number" && item.sizeStock?.[row.size.toLowerCase() as "s" | "m" | "l" | "xl"] ? row.quantity : 0),
        0,
      );
      const knownQuantity = rowQuantity || (typeof item.stockQuantity === "number" ? item.stockQuantity : 0);
      return sum + knownQuantity;
    }, 0);
    const trackedVariants = inventory.reduce((sum, item) => sum + getSizeRows(item).length, 0);

    return {
      products: inventory.length,
      trackedVariants,
      totalKnownUnits,
      lowItems,
      outItems,
    };
  }, [inventory]);

  const stockConsumption = useMemo(() => {
    const revenueOrders = filteredMetricOrders.filter((order) => isConfirmed(order) && !isReturned(order) && !isCustomOrder(order));
    const orderDates = revenueOrders
      .map(getOrderDate)
      .filter((date): date is Date => Boolean(date));
    const minDate = dateRange.from || (orderDates.length ? new Date(Math.min(...orderDates.map((date) => date.getTime()))) : null);
    const maxDate = dateRange.to || (orderDates.length ? new Date(Math.max(...orderDates.map((date) => date.getTime()))) : null);
    const periodDays =
      minDate && maxDate
        ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86_400_000) + 1)
        : 30;

    const salesByProduct = new Map<string, number>();
    const salesByVariant = new Map<string, number>();

    revenueOrders.forEach((order) => {
      getItems(order).forEach((item) => {
        if (isBundleParentItem(item)) return;

        const qty = getItemRecordedQuantity(item);
        if (qty <= 0) return;

        const productKeys = getOrderItemProductKeys(item);
        const sizeKey = getOrderItemSizeKey(item);
        productKeys.forEach((productKey) => {
          salesByProduct.set(productKey, (salesByProduct.get(productKey) || 0) + qty);
          salesByVariant.set(`${productKey}::${sizeKey}`, (salesByVariant.get(`${productKey}::${sizeKey}`) || 0) + qty);
        });
      });
    });

    const rows = inventory.flatMap((item) => {
      const productKeys = getInventoryProductKeys(item);
      const productSold = Math.max(...productKeys.map((key) => salesByProduct.get(key) || 0), 0);

      return getSizeRows(item).map((row) => {
        const sizeKey = normalizeInventoryKey(row.size) || "product";
        const variantSold = Math.max(
          ...productKeys.map((key) => salesByVariant.get(`${key}::${sizeKey}`) || 0),
          0,
        );
        const sold = variantSold || (row.size === "product" ? productSold : 0);
        const dailyConsumption = sold / periodDays;
        const currentStock = typeof row.quantity === "number" ? row.quantity : null;
        const neededForTarget = Math.ceil(dailyConsumption * stockCoverageDays);
        const restockNeeded = currentStock === null ? 0 : Math.max(0, neededForTarget - currentStock);
        const coverageDays =
          currentStock !== null && dailyConsumption > 0
            ? Math.floor(currentStock / dailyConsumption)
            : null;
        const status =
          currentStock === null
            ? "untracked"
            : dailyConsumption <= 0
              ? "no_recent_sales"
              : restockNeeded > 0
                ? "restock_needed"
                : coverageDays !== null && coverageDays <= stockCoverageDays
                  ? "watch"
                  : "healthy";

        return {
          product: item.name,
          slug: item.slug,
          size: row.size,
          currentStock,
          sold,
          dailyConsumption,
          neededForTarget,
          restockNeeded,
          coverageDays,
          status,
          stockStatus: row.status,
        };
      });
    });

    const activeRows = rows
      .filter((row) => row.sold > 0 || row.restockNeeded > 0 || row.status === "untracked")
      .sort((a, b) => {
        if (b.restockNeeded !== a.restockNeeded) return b.restockNeeded - a.restockNeeded;
        if (b.sold !== a.sold) return b.sold - a.sold;
        return a.product.localeCompare(b.product);
      });

    return {
      periodDays,
      rows: activeRows,
      totalSold: rows.reduce((sum, row) => sum + row.sold, 0),
      totalRestockNeeded: rows.reduce((sum, row) => sum + row.restockNeeded, 0),
      restockRows: rows.filter((row) => row.restockNeeded > 0),
      untrackedRows: rows.filter((row) => row.currentStock === null && row.sold > 0),
    };
  }, [dateRange.from, dateRange.to, filteredMetricOrders, inventory, stockCoverageDays]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedPhoneQuery = normalizeCustomerPhone(query);

    return filteredMetricOrders.filter((order) => {
      const customer = getCustomer(order);
      const Bosta = getBosta(order);
      const extras = getExtras(order);
      const itemsText = getItems(order)
        .map((item) => [
          item.name,
          item.title,
          item.slug,
          item.size,
          item.color,
          item.variant,
        ].map(getString).filter(Boolean).join(" "))
        .join(" ");
      const searchable = [
        getOrderRef(order),
        getCustomerDisplayName(customer),
        normalizeCustomerPhone(customer.phone || order["Phone"]),
        getString(customer.email),
        getString(customer.city),
        getString(customer.governorate),
        getString(customer.address),
        getString(order["Address"]),
        getString(order["City"]),
        getString(order["Governorate"]),
        getTrackingNumber(order),
        getString(Bosta.trackingLink),
        getString(Bosta.status),
        getString(Bosta.latestDescription),
        getString(Bosta.latestLocation),
        getOrderSource(order),
        getOrderLastUpdateSource(order),
        getPaymentMethod(order),
        getPaymentStatus(order),
        getStatus(order),
        getDeliveryMethod(order),
        getString(extras.city_key),
        itemsText,
      ].join(" ").toLowerCase();

      const phoneMatch =
        normalizedPhoneQuery &&
        normalizeCustomerPhone(customer.phone || order["Phone"]).includes(normalizedPhoneQuery);

      if (normalizedQuery && !phoneMatch && !searchable.includes(normalizedQuery)) return false;

      return true;
    });
  }, [filteredMetricOrders, query]);

  const operations = useMemo(() => {
    const confirmedOrders = filteredMetricOrders.filter(isConfirmed);
    const revenueOrders = confirmedOrders.filter((order) => !isReturned(order) && !isCustomOrder(order));
    const productMap = new Map<
      string,
      {
        name: string;
        qty: number;
        orders: Set<string>;
        directRevenue: number;
      }
    >();
    const cityMap = new Map<string, { city: string; orders: number; revenue: number }>();
    const productFamilyPieces = {
      luggageCovers: { retail: 0, custom: 0 },
      packOnat: { retail: 0, custom: 0 },
      passportWallet: { retail: 0, custom: 0 },
    };
    const customRevenueOrders = confirmedOrders.filter((order) => !isReturned(order) && isCustomOrder(order));

    revenueOrders.forEach((order, orderIndex) => {
      const customer = getCustomer(order);
      const orderRef = getOrderRef(order) || `order-${orderIndex}`;
      const city = getString(customer.city || order["City"]) || "Unknown";
      const cityRow = cityMap.get(city) || { city, orders: 0, revenue: 0 };
      cityRow.orders += 1;
      cityRow.revenue += getAmount(order);
      cityMap.set(city, cityRow);

      const orderItems = getItems(order);

      orderItems.forEach((item) => {
        if (isBundleParentItem(item) || isCustomOrderItem(item)) return;

        const qty = getItemRecordedQuantity(item);
        if (isPackOnatItem(item)) {
          productFamilyPieces.packOnat.retail += qty;
        } else if (isPassportWalletItem(item)) {
          productFamilyPieces.passportWallet.retail += qty;
        } else if (isLuggageCoverItem(item)) {
          productFamilyPieces.luggageCovers.retail += qty;
        }

        const name = getString(item.name || item.title || item.slug || item.id) || "Unknown product";
        const line = getItemLineTotal(item);
        const row = productMap.get(name) || {
          name,
          qty: 0,
          orders: new Set<string>(),
          directRevenue: 0,
        };
        row.qty += qty;
        row.orders.add(orderRef);
        row.directRevenue += line;
        productMap.set(name, row);
      });
    });

    customRevenueOrders.forEach((order) => {
      const orderItems = getItems(order);
      orderItems.forEach((item) => {
        if (isBundleParentItem(item)) return;

        const qty = getItemRecordedQuantity(item) || getOrderCustomPieces(order);
        if (qty <= 0) return;

        if (isPackOnatItem(item)) {
          productFamilyPieces.packOnat.custom += qty;
        } else if (isPassportWalletItem(item)) {
          productFamilyPieces.passportWallet.custom += qty;
        } else if (isLuggageCoverItem(item)) {
          productFamilyPieces.luggageCovers.custom += qty;
        }
      });
    });

    const BostaAttention = filteredMetricOrders
      .filter((order) => getBostaError(order) || needsBosta(order) || needsBostaReplacement(order))
      .slice(0, 12);
    const instapayAttention = filteredMetricOrders.filter(isPendingInstaPay).slice(0, 12);
    const returnsAttention = filteredMetricOrders.filter(isReturned).slice(0, 12);
    const codOrders = revenueOrders.filter((order) => getPaymentBucket(order) === "cod");
    const codDelivered = codOrders.filter(isDelivered);
    const codInTransit = codOrders.filter((order) => !isDelivered(order) && !isReturned(order));
    const fulfillmentRows = [
      { label: "Delivered", orders: filteredMetricOrders.filter(isDelivered).length, value: filteredMetricOrders.filter(isDelivered).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-emerald-50 text-emerald-700" },
      { label: "In transit", orders: filteredMetricOrders.filter(isInTransit).length, value: filteredMetricOrders.filter(isInTransit).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-sky-50 text-sky-700" },
      { label: "Returned / cancelled", orders: filteredMetricOrders.filter(isReturned).length, value: filteredMetricOrders.filter(isReturned).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-rose-50 text-rose-700" },
      { label: "Missing tracking in orders", orders: filteredMetricOrders.filter(needsBosta).length, value: filteredMetricOrders.filter(needsBosta).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-amber-50 text-amber-800" },
      { label: "Bosta failed", orders: filteredMetricOrders.filter((order) => Boolean(getBostaError(order))).length, value: filteredMetricOrders.filter((order) => Boolean(getBostaError(order))).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-orange-50 text-orange-800" },
    ];
    const notificationRows = [
      {
        label: "Customer confirmation sent",
        orders: filteredMetricOrders.filter((order) => Boolean(getCustomerEmailSentAt(order))).length,
      },
      {
        label: "InstaPay pending email sent",
        orders: filteredMetricOrders.filter((order) => Boolean(getInstaPayPendingCustomerEmailSentAt(order))).length,
      },
      {
        label: "Admin approval email sent",
        orders: filteredMetricOrders.filter((order) => Boolean(getInstaPayApprovalEmailSentAt(order))).length,
      },
      {
        label: "Confirmed with customer email missing",
        orders: filteredMetricOrders.filter((order) => isConfirmed(order) && !getCustomerEmailSentAt(order)).length,
      },
    ];

    return {
      topProducts: Array.from(productMap.values())
        .map((product) => ({
          ...product,
          ordersCount: product.orders.size,
          revenue: product.directRevenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      topCities: Array.from(cityMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      productFamilyPieces,
      BostaAttention,
      instapayAttention,
      returnsAttention,
      fulfillmentRows,
      notificationRows,
      codDeliveredOrders: codDelivered.length,
      codDeliveredValue: codDelivered.reduce((sum, order) => sum + getAmount(order), 0),
      codPendingCollectionOrders: codInTransit.length,
      codPendingCollectionValue: codInTransit.reduce((sum, order) => sum + getAmount(order), 0),
      attentionCount: BostaAttention.length + instapayAttention.length + returnsAttention.length,
    };
  }, [filteredMetricOrders]);

  const customers = useMemo(() => {
    const rows = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        email: string;
        city: string;
        governorate: string;
        address: string;
        orders: number;
        confirmedOrders: number;
        returnedOrders: number;
        totalValue: number;
        netValue: number;
        discounts: number;
        shipping: number;
        pieces: number;
        firstOrderAt: Date | null;
        lastOrderAt: Date | null;
        paymentMethods: Set<string>;
        statuses: Set<string>;
        products: Map<string, number>;
        orderRefs: string[];
        trackingNumbers: string[];
      }
    >();

    filteredMetricOrders.forEach((order) => {
      const customer = getCustomer(order);
      const key = getCustomerKey(order);
      const orderDate = getOrderDate(order);
      const orderRef = getOrderRef(order);
      const row = rows.get(key) || {
        key,
        name: getCustomerDisplayName(customer) || "Unknown customer",
        phone: normalizeCustomerPhone(customer.phone || order["Phone"]),
        email: getString(customer.email || order["Email"]),
        city: getString(customer.city || order["City"]),
        governorate: getString(customer.governorate || order["Governorate"]),
        address: getString(customer.address || order["Address"]),
        orders: 0,
        confirmedOrders: 0,
        returnedOrders: 0,
        totalValue: 0,
        netValue: 0,
        discounts: 0,
        shipping: 0,
        pieces: 0,
        firstOrderAt: null,
        lastOrderAt: null,
        paymentMethods: new Set<string>(),
        statuses: new Set<string>(),
        products: new Map<string, number>(),
        orderRefs: [],
        trackingNumbers: [],
      };

      row.name = row.name === "Unknown customer" ? getCustomerDisplayName(customer) || row.name : row.name;
      row.phone ||= normalizeCustomerPhone(customer.phone || order["Phone"]);
      row.email ||= getString(customer.email || order["Email"]);
      row.city ||= getString(customer.city || order["City"]);
      row.governorate ||= getString(customer.governorate || order["Governorate"]);
      row.address ||= getString(customer.address || order["Address"]);
      row.orders += 1;
      if (isConfirmed(order)) row.confirmedOrders += 1;
      if (isReturned(order)) row.returnedOrders += 1;
      row.totalValue += getAmount(order);
      if (isConfirmed(order) && !isReturned(order)) row.netValue += getAmount(order);
      row.discounts += getDiscount(order);
      row.shipping += getShipping(order);
      row.pieces += getOrderRecordedPieces(order);
      if (orderDate && (!row.firstOrderAt || orderDate < row.firstOrderAt)) row.firstOrderAt = orderDate;
      if (orderDate && (!row.lastOrderAt || orderDate > row.lastOrderAt)) row.lastOrderAt = orderDate;
      row.paymentMethods.add(getPaymentBucket(order));
      row.statuses.add(getOrderShipmentStatusLabel(order));
      if (orderRef) row.orderRefs.push(orderRef);
      const tracking = getTrackingNumber(order);
      if (tracking) row.trackingNumbers.push(tracking);

      getItems(order).forEach((item) => {
        if (isBundleParentItem(item)) return;
        const name = getString(item.name || item.title || item.slug || item.id);
        if (!name) return;
        row.products.set(name, (row.products.get(name) || 0) + (getItemRecordedQuantity(item) || 1));
      });

      rows.set(key, row);
    });

    return Array.from(rows.values()).sort((a, b) => {
      if (b.netValue !== a.netValue) return b.netValue - a.netValue;
      return b.orders - a.orders;
    });
  }, [filteredMetricOrders]);

  const customerStats = useMemo(() => {
    const totalNet = customers.reduce((sum, customer) => sum + customer.netValue, 0);

    return {
      total: customers.length,
      repeat: customers.filter((customer) => customer.orders > 1).length,
      missingPhone: customers.filter((customer) => !customer.phone).length,
      missingEmail: customers.filter((customer) => !customer.email).length,
      averageCustomerValue: customers.length ? totalNet / customers.length : 0,
      top: customers[0],
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = customerQuery.trim().toLowerCase();
    const normalizedPhoneQuery = normalizeCustomerPhone(customerQuery);
    if (!normalizedQuery && !normalizedPhoneQuery) return customers;

    return customers.filter((customer) => {
      const text = [
        customer.name,
        customer.phone,
        customer.email,
        customer.city,
        customer.governorate,
        customer.address,
        customer.orderRefs.join(" "),
        customer.trackingNumbers.join(" "),
        Array.from(customer.products.keys()).join(" "),
      ].join(" ").toLowerCase();

      const phoneMatch = normalizedPhoneQuery && customer.phone.includes(normalizedPhoneQuery);
      return Boolean(phoneMatch || text.includes(normalizedQuery));
    });
  }, [customerQuery, customers]);

  const financeLedger = useMemo(() => {
    return filteredMetricOrders
      .map((order) => {
        const amount = getAmount(order);
        const bucket = getPaymentBucket(order);
        const returned = isReturned(order);
        const confirmed = isConfirmed(order);
        const BostaIssue = Boolean(getBostaError(order) || needsBosta(order));

        let movement = "Not counted yet";
        let explanation = "Order is not confirmed or paid yet.";
        let tone = "bg-[#F8F6F3] text-[#0F1A26]";

        if (returned) {
          movement = "Deducted";
          explanation = "Returned/cancelled order. Its value is removed from net revenue.";
          tone = "bg-rose-100 text-rose-700";
        } else if (confirmed && bucket === "cod") {
          movement = "COD to collect";
          explanation = "Confirmed COD order. It is expected revenue until delivery/collection is confirmed.";
          tone = "bg-amber-100 text-amber-800";
        } else if (confirmed && ["card", "instapay"].includes(bucket)) {
          movement = "Paid online";
          explanation = "Confirmed online-paid order. It counts in net revenue unless returned/cancelled.";
          tone = "bg-emerald-100 text-emerald-700";
        } else if (isPendingInstaPay(order)) {
          movement = "Waiting approval";
          explanation = "InstaPay proof is waiting admin approval before shipment/revenue confidence.";
          tone = "bg-yellow-100 text-yellow-800";
        }

        if (BostaIssue && !returned) {
          explanation += " Bosta needs attention before fulfillment is clean.";
        }

        return {
          order,
          orderRef: getOrderRef(order),
          amount,
          bucket,
          movement,
          explanation,
          tone,
          date: getOrderDate(order)?.getTime() || 0,
          BostaIssue,
        };
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 20);
  }, [filteredMetricOrders]);

  const dailyClose = useMemo(() => {
    const dayMap = new Map<
      string,
      {
        date: string;
        orders: number;
        confirmed: number;
        returned: number;
        gross: number;
        discounts: number;
        shipping: number;
        expenses: number;
        net: number;
        netAfterExpenses: number;
        BostaIssues: number;
        unitsByCategory: ReturnType<typeof createDailyCategoryUnits>;
      }
    >();

    filteredMetricOrders.forEach((order) => {
      const date = getOrderDate(order);
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      const row =
        dayMap.get(key) ||
        {
          date: key,
          orders: 0,
          confirmed: 0,
          returned: 0,
          gross: 0,
          discounts: 0,
          shipping: 0,
          expenses: 0,
          net: 0,
          netAfterExpenses: 0,
          BostaIssues: 0,
          unitsByCategory: createDailyCategoryUnits(),
        };

      row.orders += 1;
      if (isConfirmed(order)) row.confirmed += 1;
      if (isReturned(order)) row.returned += 1;
      if (isConfirmed(order)) {
        row.gross += getSubtotal(order);
        row.discounts += getDiscount(order);
        row.shipping += getShipping(order);
      }
      if (isConfirmed(order) && !isReturned(order)) row.net += getAmount(order);
      addOrderToDailyCategoryUnits(row.unitsByCategory, order);
      if (getBostaError(order) || needsBosta(order)) row.BostaIssues += 1;
      dayMap.set(key, row);
    });

    filteredExpenses.forEach((expense) => {
      const date = getExpenseDate(expense);
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      const row =
        dayMap.get(key) ||
        {
          date: key,
          orders: 0,
          confirmed: 0,
          returned: 0,
          gross: 0,
          discounts: 0,
          shipping: 0,
          expenses: 0,
          net: 0,
          netAfterExpenses: 0,
          BostaIssues: 0,
          unitsByCategory: createDailyCategoryUnits(),
        };

      row.expenses += getExpenseAmount(expense);
      dayMap.set(key, row);
    });

    return Array.from(dayMap.values())
      .map((row) => ({
        ...row,
        netAfterExpenses: row.net - row.expenses,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
  }, [filteredExpenses, filteredMetricOrders]);

  const financeAlerts = useMemo(() => {
    return [
      {
        label: "Bosta attention",
        value: stats.BostaFailed + stats.BostaMissing,
        detail: "Orders with failed or missing shipment tracking need admin review.",
        tone: stats.BostaFailed + stats.BostaMissing ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Pending approvals",
        value: stats.pendingInstaPay,
        detail: "InstaPay orders waiting approval are not confirmed yet.",
        tone: stats.pendingInstaPay ? "bg-yellow-50 text-yellow-800" : "bg-emerald-50 text-emerald-700",
      },
    ];
  }, [stats.BostaFailed, stats.BostaMissing, stats.pendingInstaPay]);

  const ordersPageCount = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const safeOrdersPage = Math.min(ordersPage, ordersPageCount);
  const paginatedOrders = filteredOrders.slice(
    (safeOrdersPage - 1) * ordersPageSize,
    safeOrdersPage * ordersPageSize,
  );
  const manualOrderIsDashboardOnly =
    manualOrderDraft.paymentMethod === "custom_bulk" ||
    manualOrderDraft.orderKind === "special" ||
    manualOrderItems.some((item) => item.orderKind === "special");

  return (
    <main className="min-h-screen bg-[#F4EFE8] px-4 py-6 text-[#0F1A26] sm:px-6 lg:px-8" dir="ltr">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-[#0F1A26] p-6 text-white shadow-2xl shadow-[#0F1A26]/15 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">natOnat Admin</p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">Orders & Money Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/60">
                Track sales, payment methods, InstaPay approvals, Bosta shipment gaps, returns, and net revenue from one admin-only view.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              {savedToken ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Admin access</p>
                    <p className="mt-1 text-sm font-bold text-white/80">Signed in</p>
                  </div>
                  <button
                    onClick={logout}
                    className="h-11 rounded-xl border border-white/15 px-5 text-sm font-black text-white transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Admin login</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      type="text"
                      placeholder="Username"
                      autoComplete="username"
                      className="h-11 min-w-[180px] rounded-xl border border-white/10 bg-white px-3 text-sm font-bold text-[#0F1A26] outline-none"
                    />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void loginAndLoad();
                      }}
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      className="h-11 min-w-[180px] rounded-xl border border-white/10 bg-white px-3 text-sm font-bold text-[#0F1A26] outline-none"
                    />
                    <button
                      onClick={loginAndLoad}
                      disabled={loading}
                      className="h-11 rounded-xl bg-[#EEBC3F] px-5 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {BostaSyncMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {BostaSyncMessage}
          </div>
        )}

        {!savedToken ? (
          <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#EEBC3F]">Login required</p>
            <h2 className="mt-3 text-2xl font-black">Enter the admin username and password to load the dashboard.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-[#0F1A26]/55">
              Orders, finance, Bosta sync, and inventory data are hidden until you sign in.
            </p>
          </section>
        ) : (
          <>
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {([
              { id: "finance", label: "Finance", sub: "Revenue, discounts, returns", icon: BarChart3 },
              { id: "orders", label: "Orders", sub: "Full order lifecycle", icon: ClipboardList },
              { id: "customers", label: "Customers", sub: "Profiles from orders", icon: UserRound },
              { id: "stock", label: "Stock", sub: "Sanity inventory by size", icon: Boxes },
              { id: "expenses", label: "Expenses", sub: "Costs and net after spend", icon: ReceiptText },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-3xl p-4 text-left transition ${
                    isActive ? "bg-[#0F1A26] text-white shadow-lg shadow-[#0F1A26]/15" : "bg-[#F8F6F3] text-[#0F1A26] hover:bg-[#F4EFE8]"
                  }`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isActive ? "bg-[#EEBC3F] text-[#0F1A26]" : "bg-white"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-base font-black">{tab.label}</span>
                    <span className={`mt-0.5 block text-xs font-bold ${isActive ? "text-white/60" : "text-[#0F1A26]/45"}`}>{tab.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-4 shadow-sm">
          <div className="grid gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">Dashboard period</p>
              <p className="mt-1 text-lg font-black">{dateRange.label} - {visibleOrders.length} orders in view</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[minmax(150px,0.8fr)_minmax(260px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)_auto_auto]">
              <select
                value={datePreset}
                onChange={(event) => changeDatePreset(event.target.value as DatePreset)}
                className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
              {datePreset === "custom" && (
                <div className="grid gap-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto_auto] 2xl:col-span-1 2xl:grid-cols-2">
                  <input
                    type="date"
                    value={customDateDraftFrom}
                    onChange={(event) => setCustomDateDraftFrom(event.target.value)}
                    className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
                  />
                  <input
                    type="date"
                    value={customDateDraftTo}
                    onChange={(event) => setCustomDateDraftTo(event.target.value)}
                    className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyCustomDateRange}
                    className="h-11 rounded-2xl bg-[#0F1A26] px-4 text-sm font-black text-white transition hover:-translate-y-0.5"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={clearCustomDateRange}
                    className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-white px-4 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5"
                  >
                    Clear
                  </button>
                </div>
              )}
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All payments ({visibleOrders.length})</option>
                {orderFilterOptions.payments.map(([bucket, count]) => (
                  <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
                ))}
              </select>
              <select
                value={deliveryFilter}
                onChange={(event) => setDeliveryFilter(event.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All delivery ({visibleOrders.length})</option>
                {orderFilterOptions.deliveries.map(([bucket, count]) => (
                  <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
                ))}
              </select>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All cities ({visibleOrders.length})</option>
                {orderFilterOptions.cities.map(([key, row]) => (
                  <option key={key} value={key}>{row.label} ({row.count})</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full min-w-0 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All statuses ({visibleOrders.length})</option>
                {orderFilterOptions.statuses.map(([statusKey, row]) => (
                  <option key={statusKey} value={statusKey}>{row.label} ({row.count})</option>
                ))}
              </select>
              {(paymentFilter !== "all" || deliveryFilter !== "all" || cityFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setPaymentFilter("all");
                    setDeliveryFilter("all");
                    setCityFilter("all");
                    setStatusFilter("all");
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#0F1A26]/10 px-4 text-sm font-black text-[#0F1A26]/65 transition hover:bg-[#F8F6F3]"
                >
                  Reset filters
                </button>
              )}
              <button
                onClick={exportOrdersCsv}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-[#0F1A26]/45">
            Showing {filteredMetricOrders.length} of {visibleOrders.length} valid orders after filters.
            {skippedEmptyOrderRows > 0 ? ` ${skippedEmptyOrderRows} empty sheet rows were ignored.` : ""}
            {" "}All finance and operations cards follow these filters.
          </p>
        </section>

        <section className="mt-4 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Manual admin orders</p>
              <h2 className="mt-1 text-lg font-black">Add special product or catalog order</h2>
              <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
                Use Special for made-to-order products, or Catalog when the product exists on the website and should follow stock/product reporting.
              </p>
            </div>
            <button
              onClick={() => setManualOrderOpen((current) => !current)}
              className="h-11 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              {manualOrderOpen ? "Close manual order" : "Add manual order"}
            </button>
          </div>

          {manualOrderOpen && (
            <div className="mt-4 rounded-[1.5rem] bg-[#F8F6F3] p-4">
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {[
                  {
                    value: "special",
                    title: "Custom / bulk order",
                    body: "Special made-to-order work outside the website catalog. Finance only, no stock deduction, no Bosta shipment.",
                  },
                  {
                    value: "catalog",
                    title: "Manual catalog order",
                    body: "A normal website product entered by admin for the customer. Uses catalog products, can deduct stock, and can create Bosta shipment.",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateManualOrderDraft("orderKind", option.value)}
                    className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      manualOrderDraft.orderKind === option.value
                        ? "border-[#EEBC3F] bg-white shadow-sm"
                        : "border-[#0F1A26]/10 bg-white/60"
                    }`}
                  >
                    <span className="text-sm font-black text-[#0F1A26]">{option.title}</span>
                    <span className="mt-2 block text-xs font-bold leading-5 text-[#0F1A26]/50">{option.body}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-[#0F1A26]/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#0F1A26]">Order items</h3>
                    <p className="text-xs font-bold text-[#0F1A26]/45">Add one or more products in the same manual order.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addManualOrderItem}
                    className="h-9 rounded-2xl bg-[#EEBC3F] px-4 text-xs font-black text-[#0F1A26]"
                  >
                    Add item
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {manualOrderItems.map((item, index) => {
                    const product = inventory.find((entry) => entry.slug === item.productSlug);
                    return (
                      <div key={index} className="grid gap-3 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] p-3 md:grid-cols-2 xl:grid-cols-6">
                        <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                          Type
                          <select
                            value={item.orderKind}
                            onChange={(event) => updateManualOrderItem(index, "orderKind", event.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-white px-3 text-xs font-bold normal-case tracking-normal outline-none"
                          >
                            <option value="special">Custom / bulk - finance only</option>
                            <option value="catalog">Catalog product - stock/courier</option>
                          </select>
                        </label>
                        {item.orderKind === "catalog" ? (
                          <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 xl:col-span-2">
                            Product
                            <select
                              value={item.productSlug}
                              onChange={(event) => updateManualOrderItem(index, "productSlug", event.target.value)}
                              className="mt-1 h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-white px-3 text-xs font-bold normal-case tracking-normal outline-none"
                            >
                              <option value="">Select website product</option>
                              {inventory.map((entry) => (
                                <option key={entry.slug} value={entry.slug} disabled={isInventoryOut(entry)}>
                                  {entry.name} {entry.stockStatus === "out_of_stock" ? "(out of stock)" : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 xl:col-span-2">
                            Product name
                            <input
                              value={item.title}
                              onChange={(event) => updateManualOrderItem(index, "title", event.target.value)}
                              className="mt-1 h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-white px-3 text-xs font-bold normal-case tracking-normal outline-none"
                            />
                          </label>
                        )}
                        <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                          Size
                          <select
                            value={item.productSize}
                            onChange={(event) => updateManualOrderItem(index, "productSize", event.target.value)}
                            disabled={item.orderKind !== "catalog" || !item.productSlug}
                            className="mt-1 h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-white px-3 text-xs font-bold normal-case tracking-normal outline-none disabled:bg-white/50"
                          >
                            <option value="">No size</option>
                            {(product ? getSizeRows(product) : []).map((row) => (
                              <option key={row.size} value={row.size === "product" ? "" : row.size} disabled={row.status === "out_of_stock" || row.quantity === 0}>
                                {row.size === "product" ? "No size" : row.size}
                                {typeof row.quantity === "number" ? ` - ${row.quantity} left` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        {(["quantity", "unitPrice", "total"] as const).map((field) => (
                          <label key={field} className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                            {field === "unitPrice" ? "Unit price" : field === "total" ? "Line total" : "Qty"}
                            <input
                              value={item[field]}
                              onChange={(event) => updateManualOrderItem(index, field, event.target.value)}
                              className="mt-1 h-10 w-full rounded-xl border border-[#0F1A26]/10 bg-white px-3 text-xs font-bold normal-case tracking-normal outline-none"
                            />
                          </label>
                        ))}
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeManualOrderItem(index)}
                            disabled={manualOrderItems.length <= 1}
                            className="h-10 rounded-xl border border-rose-200 bg-white px-3 text-xs font-black text-rose-700 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {false && manualOrderDraft.orderKind === "catalog" && (
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2">
                  Product
                  <select
                    value={manualOrderDraft.productSlug}
                    onChange={(event) => updateManualOrderDraft("productSlug", event.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  >
                    <option value="">Select website product</option>
                    {inventory.map((item) => (
                      <option key={item.slug} value={item.slug} disabled={isInventoryOut(item)}>
                        {item.name} {item.stockStatus === "out_of_stock" ? "(out of stock)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                )}
                {false && manualOrderDraft.orderKind === "catalog" && (
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  Product size
                  <select
                    value={manualOrderDraft.productSize}
                    onChange={(event) => updateManualOrderDraft("productSize", event.target.value)}
                    disabled={!manualOrderDraft.productSlug}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none disabled:bg-[#F8F6F3] disabled:text-[#0F1A26]/35"
                  >
                    <option value="">No size / custom</option>
                    {(inventory.find((item) => item.slug === manualOrderDraft.productSlug)
                      ? getSizeRows(inventory.find((item) => item.slug === manualOrderDraft.productSlug) as AdminInventoryItem)
                      : []
                    ).map((row) => (
                      <option key={row.size} value={row.size === "product" ? "" : row.size} disabled={row.status === "out_of_stock" || row.quantity === 0}>
                        {row.size === "product" ? "No size" : row.size}
                        {typeof row.quantity === "number" ? ` - ${row.quantity} left` : ""}
                        {row.status === "out_of_stock" ? " (out of stock)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                )}
                {[
                  ["customerName", "Customer / company"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["governorate", "Governorate"],
                  ["address", "Address"],
                ].map(([key, label]) => (
                  <label key={key} className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    {label}
                    <input
                      value={String(manualOrderDraft[key as keyof AdminManualOrderDraft])}
                      onChange={(event) => updateManualOrderDraft(key as keyof AdminManualOrderDraft, event.target.value)}
                      className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                    />
                  </label>
                ))}
                {false && manualOrderDraft.orderKind === "special" && (
                  <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2 xl:col-span-4">
                    Special product brief
                    <textarea
                      value={manualOrderDraft.specialProductBrief}
                      onChange={(event) => updateManualOrderDraft("specialProductBrief", event.target.value)}
                      placeholder="Example: 100 custom luggage covers for ABC company, navy color, company logo, special packaging."
                      className="mt-1 min-h-24 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal outline-none"
                    />
                  </label>
                )}
                <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  City
                  <select
                    value={manualOrderDraft.city}
                    onChange={(event) => updateManualOrderDraft("city", event.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  >
                    <option value="">Select Bosta city</option>
                    {BostaCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  Payment method
                  <select
                    value={manualOrderDraft.paymentMethod}
                    onChange={(event) => updateManualOrderDraft("paymentMethod", event.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  >
                    {MANUAL_ORDER_PAYMENT_METHODS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  Payment status
                  <select
                    value={manualOrderDraft.paymentStatus}
                    onChange={(event) => updateManualOrderDraft("paymentStatus", event.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  >
                    {MANUAL_ORDER_PAYMENT_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  Delivery method
                  <select
                    value={manualOrderDraft.deliveryMethod}
                    onChange={(event) => updateManualOrderDraft("deliveryMethod", event.target.value)}
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  >
                    {MANUAL_ORDER_DELIVERY_METHODS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[#0F1A26]/10 bg-white p-3 text-sm font-black text-[#0F1A26] md:col-span-2 xl:col-span-4">
                  <input
                    type="checkbox"
                    checked={manualOrderDraft.createBostaShipment && !manualOrderIsDashboardOnly}
                    onChange={(event) => updateManualOrderDraft("createBostaShipment", event.target.checked)}
                    disabled={manualOrderIsDashboardOnly}
                    className="h-5 w-5 accent-[#EEBC3F]"
                  />
                  {manualOrderIsDashboardOnly
                    ? "Dashboard-only custom/bulk order. No Bosta shipment will be created."
                    : "Create Bosta shipment now and return tracking number"}
                </label>
                <label className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45 md:col-span-2 xl:col-span-4">
                  Internal note
                  <input
                    value={manualOrderDraft.notes}
                    onChange={(event) => updateManualOrderDraft("notes", event.target.value)}
                    placeholder="Example: 60 custom covers for company event, special design/pricing."
                    className="mt-1 h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-3 text-sm font-bold normal-case tracking-normal outline-none"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {manualOrderIsDashboardOnly
                    ? "This custom/bulk order is saved for dashboard, finance, Supabase, and Google Sheets only. It will not be sent to Bosta."
                    : manualOrderDraft.createBostaShipment
                    ? "This will create the dashboard order plus a real Bosta shipment. The success message must include a tracking number."
                    : "This saves the order only. No shipment/tracking will be created unless you choose Delivery or tick Create Bosta shipment."}
                </span>
                <button
                  onClick={() => void createManualCustomOrder()}
                  disabled={actionLoadingRef === "manual-order"}
                  className="h-10 shrink-0 rounded-2xl bg-[#EEBC3F] px-5 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {actionLoadingRef === "manual-order"
                    ? "Saving..."
                    : manualOrderDraft.createBostaShipment && !manualOrderIsDashboardOnly
                      ? "Create order + shipment"
                      : "Save manual order"}
                </button>
              </div>
            </div>
          )}
        </section>

        {activeTab === "finance" && (
          <>
        {stats.totalOrders > 0 && (stats.missingDateOrders === stats.totalOrders || stats.missingTotalOrders === stats.totalOrders) && (
          <section className="mt-6 rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em]">Data source issue</p>
            <h2 className="mt-2 text-xl font-black">Orders loaded, but key fields are missing or unreadable.</h2>
            <p className="mt-2 text-sm font-bold leading-6">
              The dashboard is protecting the finance numbers. It will not pretend this data is valid until the order source includes readable date and total fields.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DataPill label="orders loaded" value={String(stats.totalOrders)} />
              <DataPill label="missing date" value={String(stats.missingDateOrders)} />
              <DataPill label="missing total" value={String(stats.missingTotalOrders)} />
            </div>
          </section>
        )}
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              eyebrow="Finance Control"
              title="Money view with real order-source numbers"
              description="All-orders totals reconcile with the sheet. Confirmed gross/net only count confirmed or paid orders, so pending/unpaid rows do not inflate the trusted sales view."
            />
            <button
              onClick={exportFinanceReportCsv}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#EEBC3F] px-5 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Export finance report
            </button>
          </div>
          <div className="mt-4 grid gap-3 rounded-3xl bg-[#F8F6F3] p-4 sm:grid-cols-3">
            <DataPill label="data source" value="Supabase orders database + Google Sheets backup log" />
            <DataPill label="auto refresh" value="Every 60 seconds while the admin page is open" />
            <DataPill label="tracking refresh" value="Refresh Tracking Status reads latest movement from the courier for stored tracking numbers" />
          </div>
          <div className="mt-4 rounded-3xl border border-[#0F1A26]/10 bg-[#0F1A26] p-4 text-white">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Pieces summary</p>
                <h3 className="text-xl font-black">What actually sold after returns</h3>
              </div>
              <p className="text-xs font-bold text-white/55">Confirmed non-returned orders only. This is the source of truth for pieces.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#EEBC3F] p-4 text-[#0F1A26]">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F1A26]/55">Total sold pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.soldPieces}</p>
                <p className="mt-1 text-xs font-bold text-[#0F1A26]/55">All confirmed pieces before return deduction.</p>
              </div>
              <div className="rounded-2xl bg-rose-500 p-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">Returned pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.returnedPieces}</p>
                <p className="mt-1 text-xs font-bold text-white/65">Pieces inside returned or cancelled confirmed orders.</p>
              </div>
              <div className="rounded-2xl bg-emerald-500 p-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">Delivered pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.deliveredPieces}</p>
                <p className="mt-1 text-xs font-bold text-white/65">Confirmed, non-returned pieces marked delivered by courier/status.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Retail/catalog pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.totalPieces}</p>
                <p className="mt-1 text-xs font-bold text-white/45">Website + catalog orders only. Bulk/custom excluded.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Bulk/custom pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.customPieces}</p>
                <p className="mt-1 text-xs font-bold text-white/45">{stats.customOrders} manual/bulk orders. Separate from retail.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">All pieces</p>
                <p className="mt-2 text-3xl font-black">{stats.allPieces}</p>
                <p className="mt-1 text-xs font-bold text-white/45">Retail + bulk/custom after returns.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-bold leading-5 text-white/60">
              <p className="font-black text-white">Detected retail product families only:</p>
              <p className="mt-1">
                Luggage covers {operations.productFamilyPieces.luggageCovers.retail} · PackOnat {operations.productFamilyPieces.packOnat.retail} · Passport Wallet {operations.productFamilyPieces.passportWallet.retail}
              </p>
              <p className="mt-1">
                لو bulk/custom مش متسجل باسم صنف واضح، هيتحسب في Bulk pieces فوق، ومش هنحاول نرميه غلط على كفرات/باكونات/باسبور.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Orders" value={String(stats.totalOrders)} subtitle={`${stats.confirmedOrders} confirmed / ${stats.unconfirmedOrders} pending`} icon={ClipboardList} tone="dark" />
          <StatCard title="All Orders Subtotal" value={money.format(stats.allOrdersSubtotal)} subtitle="All loaded orders, shipping excluded" icon={Banknote} tone="gold" />
          <StatCard title="All Orders Total" value={money.format(stats.allOrdersValue)} subtitle={`${money.format(stats.allOrdersShipping)} shipping included`} icon={CreditCard} tone="dark" />
          <StatCard title="Confirmed Gross" value={money.format(stats.grossSales)} subtitle={`${stats.confirmedOrders} confirmed orders, shipping excluded`} icon={CheckCircle2} tone="green" />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Retail Pieces After Returns" value={String(stats.totalPieces)} subtitle="Confirmed non-returned catalog pieces only, bulk excluded" icon={PackageCheck} tone="green" />
          <StatCard title="Bulk Pieces After Returns" value={String(stats.customPieces)} subtitle={`${stats.customOrders} special bulk/custom orders, separate from retail`} icon={ReceiptText} tone={stats.customPieces ? "gold" : "dark"} />
          <StatCard title="All Pieces After Returns" value={String(stats.allPieces)} subtitle="Retail + special bulk/custom pieces" icon={PackageCheck} tone="dark" />
          <StatCard title="Pickup Orders" value={String(stats.pickupOrders)} subtitle={`${stats.deliveryOrders} delivery orders`} icon={Truck} tone="gold" />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Shipped Not Delivered" value={String(stats.shippedNotDeliveredOrders)} subtitle={money.format(stats.shippedNotDeliveredValue)} icon={AlertTriangle} tone={stats.shippedNotDeliveredOrders ? "gold" : "green"} />
          <StatCard title="Pending Difference" value={money.format(stats.allOrdersSubtotal - stats.grossSales)} subtitle="All subtotal minus confirmed gross" icon={AlertTriangle} tone={stats.allOrdersSubtotal - stats.grossSales > 0 ? "gold" : "green"} />
          <StatCard
            title="Special Custom Orders"
            value={money.format(stats.customOrdersValue)}
            subtitle={`${stats.customOrders} orders / ${stats.customPieces} pieces, excluded from retail stock/product ranking`}
            icon={ReceiptText}
            tone={stats.customOrders ? "gold" : "dark"}
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Spent" value={money.format(expenseStats.total)} subtitle={`${expenseStats.count} entered expenses`} icon={ReceiptText} tone={expenseStats.total ? "red" : "green"} />
          <StatCard title="Revenue" value={money.format(stats.netRevenue)} subtitle="After returns/cancellations" icon={Banknote} tone="green" />
          <StatCard title="Returns" value={String(stats.returnedOrders)} subtitle={money.format(stats.returnedValue)} icon={Undo2} tone={stats.returnedOrders ? "red" : "green"} />
          <StatCard title="Net After Spend" value={money.format(expenseStats.netAfterExpenses)} subtitle="Revenue minus entered expenses only" icon={CheckCircle2} tone={expenseStats.netAfterExpenses >= 0 ? "green" : "red"} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Money map</p>
                <h2 className="mt-2 text-2xl font-black">Where the money came from and where it stands</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#0F1A26]/55">
                  This separates collected online money, COD money still to collect, pending/unapproved money, and value blocked by fulfillment issues. A zero here means no matching orders in the selected period, unless Data Gaps shows missing totals.
                </p>
              </div>
              <Banknote className="h-8 w-8 shrink-0 text-[#EEBC3F]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DataPill label="paid online now" value={`${money.format(stats.paidOnlineValue)} / ${stats.paidOnlineOrders} orders`} />
              <DataPill label="cod expected to collect" value={`${money.format(stats.codToCollectValue)} / ${stats.codToCollectOrders} orders`} />
              <DataPill label="pending or unpaid" value={`${money.format(stats.unconfirmedValue)} / ${stats.unconfirmedOrders} orders`} />
              <DataPill label="returned or cancelled" value={`-${money.format(stats.returnedValue)}`} />
              <DataPill label="blocked by Bosta attention" value={`${money.format(stats.BostaBlockedValue)} / ${stats.BostaFailed + stats.BostaMissing} orders`} />
              <DataPill label="net revenue currently shown" value={money.format(stats.netRevenue)} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-[#0F1A26] p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Finance reading</p>
            <h2 className="mt-2 text-2xl font-black">What should the admin understand?</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-white/70">
              <p>
                Net revenue is confirmed paid/confirmable orders, after removing returned or cancelled value.
              </p>
              <p>
                COD is shown as expected collection, not guaranteed cash, until delivery and collection are confirmed.
              </p>
              <p>
                Courier attention means money or fulfillment can be at risk because tracking is missing, failed, returned, or blocked.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Confirmed Gross" value={money.format(stats.grossSales)} subtitle="Confirmed subtotal, shipping excluded" icon={Banknote} tone="gold" />
          <StatCard title="Net Revenue" value={money.format(stats.netRevenue)} subtitle="Confirmed/paid minus returned orders" icon={CheckCircle2} tone="green" />
          <StatCard title="Returned / Cancelled" value={money.format(stats.returnedValue)} subtitle="Auto deducted from revenue view" icon={Undo2} tone="red" />
          <StatCard title="Discounts" value={money.format(stats.discounts)} subtitle={`Shipping collected: ${money.format(stats.shippingCollected)}`} icon={CreditCard} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="All Orders Value" value={money.format(stats.allOrdersValue)} subtitle="All loaded orders, shipping included" icon={ClipboardList} tone="dark" />
          <StatCard title="Unconfirmed Value" value={money.format(stats.unconfirmedValue)} subtitle={`${stats.unconfirmedOrders} pending/unpaid orders`} icon={AlertTriangle} tone={stats.unconfirmedOrders ? "gold" : "dark"} />
          <StatCard title="Average Order Value" value={money.format(stats.averageOrderValue)} subtitle="Confirmed non-returned orders" icon={BarChart3} tone="dark" />
          <StatCard title="Data Gaps" value={String(stats.missingTotalOrders + stats.missingDateOrders + stats.missingItemsOrders + stats.missingCustomerOrders + stats.missingProductRevenueLines)} subtitle="Missing date/total/items/customer/product price fields" icon={ShieldCheck} tone={stats.missingTotalOrders + stats.missingDateOrders + stats.missingItemsOrders + stats.missingCustomerOrders + stats.missingProductRevenueLines ? "red" : "green"} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="COD Orders" value={String(stats.codOrders)} icon={Truck} />
          <StatCard title="Card Orders" value={String(stats.cardOrders)} icon={CreditCard} />
          <StatCard title="InstaPay Orders" value={String(stats.instapayOrders)} subtitle={`${stats.pendingInstaPay} waiting approval`} icon={WalletCards} tone={stats.pendingInstaPay ? "gold" : "dark"} />
          <StatCard title="Courier Attention" value={String(stats.BostaFailed + stats.BostaMissing + stats.BostaReplacement)} subtitle={`${stats.BostaWithTracking} with tracking / ${stats.BostaFailed} failed / ${stats.BostaMissing} missing / ${stats.BostaReplacement} need replacement`} icon={AlertTriangle} tone={stats.BostaFailed + stats.BostaMissing + stats.BostaReplacement ? "red" : "green"} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Finance equation</h2>
            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">How the visible finance numbers are currently calculated.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DataPill label="all orders subtotal" value={money.format(stats.allOrdersSubtotal)} />
              <DataPill label="all orders shipping" value={money.format(stats.allOrdersShipping)} />
              <DataPill label="all orders total" value={money.format(stats.allOrdersValue)} />
              <DataPill label="all orders discounts" value={`-${money.format(stats.allOrdersDiscounts)}`} />
              <DataPill label="confirmed subtotal" value={money.format(stats.grossSales)} />
              <DataPill label="confirmed total" value={money.format(stats.confirmedTotalValue)} />
              <DataPill label="order/code discounts" value={`-${money.format(stats.orderDiscounts)}`} />
              <DataPill label="payment discounts" value={`-${money.format(stats.paymentDiscounts)}`} />
              <DataPill label="shipping collected" value={money.format(stats.shippingCollected)} />
              <DataPill label="returned/cancelled deduction" value={`-${money.format(stats.returnedValue)}`} />
              <DataPill label="net revenue shown" value={money.format(stats.netRevenue)} />
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-[#0F1A26]/45">
              If subtotal is not stored on an old order, the dashboard derives it from total + discounts - shipping. If item line total is missing, product revenue uses unit price x quantity.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Data quality checks</h2>
            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">If a finance number looks empty, this tells you what data is missing from the order source.</p>
            <div className="mt-4 grid gap-3">
              <DataPill label="orders missing total" value={String(stats.missingTotalOrders)} />
              <DataPill label="orders missing date" value={String(stats.missingDateOrders)} />
              <DataPill label="orders missing items" value={String(stats.missingItemsOrders)} />
              <DataPill label="orders missing customer" value={String(stats.missingCustomerOrders)} />
              <DataPill label="item lines missing price" value={String(stats.missingProductRevenueLines)} />
              <DataPill label="empty sheet rows ignored" value={String(skippedEmptyOrderRows)} />
              <DataPill label="orders included in finance period" value={String(stats.totalOrders)} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Finance alerts</h2>
            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
              Only operational alerts based on real order/payment/shipping status are shown here.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {financeAlerts.map((alert) => (
                <div key={alert.label} className={`rounded-2xl p-4 ${alert.tone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">{alert.label}</p>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">{alert.value}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 opacity-70">{alert.detail}</p>
                </div>
              ))}
            </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="border-b border-[#0F1A26]/10 px-5 py-4">
            <h2 className="text-lg font-black">Daily close report</h2>
            <p className="text-xs font-bold text-[#0F1A26]/45">
              Day-by-day finance movement so the admin can reconcile money, orders, discounts, returns, and courier issues.
            </p>
            {stats.missingDateOrders > 0 && (
              <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-800">
                {stats.missingDateOrders} orders are excluded from Daily Close because their source date is missing or unreadable. Check Data quality above.
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Confirmed</th>
                  <th className="px-5 py-3">Units by category</th>
                  <th className="px-5 py-3">Gross</th>
                  <th className="px-5 py-3">Discounts</th>
                  <th className="px-5 py-3">Shipping</th>
                  <th className="px-5 py-3">Returns</th>
                  <th className="px-5 py-3">Expenses</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Net after expenses</th>
                  <th className="px-5 py-3">Courier issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {dailyClose.length ? dailyClose.map((day) => (
                  <tr key={day.date}>
                    <td className="px-5 py-4 font-black">{day.date}</td>
                    <td className="px-5 py-4 font-bold">{day.orders}</td>
                    <td className="px-5 py-4 font-bold">{day.confirmed}</td>
                    <td className="px-5 py-4">
                      <p className="font-black">{day.unitsByCategory.total} units</p>
                      <p className="mt-1 max-w-[260px] text-xs font-bold text-[#0F1A26]/50">
                        {formatDailyCategoryUnits(day.unitsByCategory)}
                      </p>
                    </td>
                    <td className="px-5 py-4">{money.format(day.gross)}</td>
                    <td className="px-5 py-4 text-emerald-700">-{money.format(day.discounts)}</td>
                    <td className="px-5 py-4">{money.format(day.shipping)}</td>
                    <td className="px-5 py-4 text-rose-700">{day.returned}</td>
                    <td className="px-5 py-4 text-rose-700">-{money.format(day.expenses)}</td>
                    <td className="px-5 py-4 font-black">{money.format(day.net)}</td>
                    <td className="px-5 py-4 font-black">{money.format(day.netAfterExpenses)}</td>
                    <td className="px-5 py-4 font-black">{day.BostaIssues}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={12} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
                      No daily finance rows in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Payment method finance breakdown</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">Gross, discounts, shipping, returns, and net by payment channel.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
                <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                  <tr>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Orders</th>
                    <th className="px-5 py-3">Gross</th>
                    <th className="px-5 py-3">Discounts</th>
                    <th className="px-5 py-3">Shipping</th>
                    <th className="px-5 py-3">Returns</th>
                    <th className="px-5 py-3">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1A26]/8">
                  {stats.paymentBreakdown.map((row) => (
                    <tr key={row.bucket}>
                      <td className="px-5 py-4 font-black uppercase">{row.bucket}</td>
                      <td className="px-5 py-4 font-bold">{row.orders}</td>
                      <td className="px-5 py-4">{money.format(row.gross)}</td>
                      <td className="px-5 py-4 text-emerald-700">-{money.format(row.discounts)}</td>
                      <td className="px-5 py-4">{money.format(row.shipping)}</td>
                      <td className="px-5 py-4 text-rose-700">{money.format(row.returns)}</td>
                      <td className="px-5 py-4 font-black">{money.format(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">Operations impact</p>
                <h2 className="mt-2 text-2xl font-black">What affects revenue?</h2>
              </div>
              <ShieldCheck className="h-8 w-8 text-[#EEBC3F]" />
            </div>
            <div className="mt-5 grid gap-3">
              <DataPill label="confirmed orders" value={String(stats.confirmedOrders)} />
              <DataPill label="delivered orders" value={String(stats.deliveredOrders)} />
              <DataPill label="pending / unpaid orders" value={String(stats.awaitingPaymentOrders)} />
              <DataPill label="returned or cancelled value" value={money.format(stats.returnedValue)} />
            </div>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">
              Courier numbers here are order-record based only. Manual gifts, influencer shipments, or shipments created directly in Bosta will not appear unless their tracking number is saved on an order row.
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Cash collection</p>
            <h2 className="mt-2 text-2xl font-black">COD money status</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#0F1A26]/55">
              COD is not treated like collected cash. This separates delivered COD from COD still moving through fulfillment.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DataPill label="cod delivered / collectable" value={`${money.format(operations.codDeliveredValue)} / ${operations.codDeliveredOrders} orders`} />
              <DataPill label="cod still pending delivery" value={`${money.format(operations.codPendingCollectionValue)} / ${operations.codPendingCollectionOrders} orders`} />
              <DataPill label="paid online collected" value={`${money.format(stats.paidOnlineValue)} / ${stats.paidOnlineOrders} orders`} />
              <DataPill label="returns deducted" value={`-${money.format(stats.returnedValue)}`} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Fulfillment finance impact</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">
                Courier state grouped with order value, so returns and shipment issues are visible financially.
              </p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {operations.fulfillmentRows.map((row) => (
                <div key={row.label} className={`rounded-2xl p-4 ${row.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{row.label}</p>
                      <p className="mt-1 text-xs font-bold opacity-65">{row.orders} orders</p>
                    </div>
                    <p className="text-sm font-black">{money.format(row.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="border-b border-[#0F1A26]/10 px-5 py-4">
            <h2 className="text-lg font-black">Customer notification health</h2>
            <p className="text-xs font-bold text-[#0F1A26]/45">
              Checks whether customer/admin emails were recorded for confirmation and InstaPay flows.
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {operations.notificationRows.map((row) => (
              <div key={row.label} className="rounded-2xl bg-[#F8F6F3] p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/45">{row.label}</p>
                <p className="mt-2 text-2xl font-black">{row.orders}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="border-b border-[#0F1A26]/10 px-5 py-4">
            <h2 className="text-lg font-black">Finance ledger explanation</h2>
            <p className="text-xs font-bold text-[#0F1A26]/45">
              Recent orders in the selected period, with exactly how each one affects finance.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Movement</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {financeLedger.length ? financeLedger.map((entry) => (
                  <tr key={`${entry.orderRef}-${entry.date}`}>
                    <td className="px-5 py-4 align-top">
                      <button onClick={() => setSelectedOrder(entry.order)} className="font-black text-[#0F1A26] underline-offset-4 hover:underline">
                        {entry.orderRef || "No ref"}
                      </button>
                      <p className="mt-1 text-xs font-bold text-[#0F1A26]/40">{formatAdminDateTime(getCreatedAt(entry.order)) || "No date"}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${entry.tone}`}>
                        {entry.movement}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top font-black uppercase">{entry.bucket}</td>
                    <td className="px-5 py-4 align-top font-black">{money.format(entry.amount)}</td>
                    <td className="max-w-[420px] px-5 py-4 align-top text-xs font-semibold leading-5 text-[#0F1A26]/55">
                      {entry.explanation}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
                      No finance movements in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Top selling products</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">Based on confirmed non-returned order lines. Revenue uses line total first, then unit price x quantity when needed.</p>
            </div>
            <div className="divide-y divide-[#0F1A26]/8">
              {operations.topProducts.length ? operations.topProducts.map((product, index) => (
                <div key={product.name} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F8F6F3] text-xs font-black">{index + 1}</span>
                  <div>
                    <p className="font-black">{product.name}</p>
                    <p className="text-xs font-bold text-[#0F1A26]/45">
                      {product.qty} units - {product.ordersCount} orders
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-[#0F1A26]/45">
                      Recorded line revenue: {money.format(product.directRevenue)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black">{money.format(product.revenue)}</p>
                    <p className="text-[11px] font-bold text-[#0F1A26]/40">
                      from item lines
                    </p>
                  </div>
                </div>
              )) : (
                <p className="p-5 text-sm font-bold text-[#0F1A26]/45">No product sales lines recorded yet.</p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Top delivery cities</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">Useful for ads, shipping focus, and courier issue tracking.</p>
            </div>
            <div className="divide-y divide-[#0F1A26]/8">
              {operations.topCities.length ? operations.topCities.map((city, index) => (
                <div key={city.city} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F8F6F3] text-xs font-black">{index + 1}</span>
                  <div>
                    <p className="font-black">{city.city}</p>
                    <p className="text-xs font-bold text-[#0F1A26]/45">{city.orders} orders</p>
                  </div>
                  <p className="font-black">{money.format(city.revenue)}</p>
                </div>
              )) : (
                <p className="p-5 text-sm font-bold text-[#0F1A26]/45">No city data recorded yet.</p>
              )}
            </div>
          </div>
        </section>
          </>
        )}

        {activeTab === "customers" && (
          <>
            <SectionHeader
              eyebrow="Customer intelligence"
              title="Customers"
              description="Customer profiles generated from order history. Uses the same period and filters as the rest of the dashboard."
            />

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Customers" value={String(customerStats.total)} subtitle={`${filteredMetricOrders.length} orders in scope`} icon={UserRound} tone="dark" />
              <StatCard title="Repeat customers" value={String(customerStats.repeat)} subtitle="Placed more than one order" icon={RefreshCw} tone={customerStats.repeat ? "green" : "dark"} />
              <StatCard title="Avg customer value" value={money.format(customerStats.averageCustomerValue)} subtitle="Confirmed non-returned revenue" icon={Banknote} tone="gold" />
              <StatCard title="Missing phone" value={String(customerStats.missingPhone)} subtitle="Need cleanup for WhatsApp/CRM" icon={AlertTriangle} tone={customerStats.missingPhone ? "red" : "green"} />
              <StatCard title="Missing email" value={String(customerStats.missingEmail)} subtitle="Need cleanup for email CRM" icon={AlertTriangle} tone={customerStats.missingEmail ? "gold" : "green"} />
            </section>

            {customerStats.top && (
              <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Top customer</p>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
                  <div>
                    <h2 className="text-2xl font-black">{customerStats.top.name}</h2>
                    <p className="mt-2 text-sm font-bold text-[#0F1A26]/55">
                      {customerStats.top.phone || "No phone"} - {customerStats.top.email || "No email"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0F1A26]/45">
                      {customerStats.top.city || "No city"} {customerStats.top.governorate ? `- ${customerStats.top.governorate}` : ""}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <DataPill label="orders" value={String(customerStats.top.orders)} />
                    <DataPill label="net value" value={money.format(customerStats.top.netValue)} />
                    <DataPill label="pieces" value={String(customerStats.top.pieces)} />
                    <DataPill label="last order" value={customerStats.top.lastOrderAt ? formatAdminDateTime(customerStats.top.lastOrderAt) : "No date"} />
                  </div>
                </div>
              </section>
            )}

            <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
              <div className="border-b border-[#0F1A26]/10 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black">Customer profiles from orders</h2>
                    <p className="text-xs font-bold text-[#0F1A26]/45">
                      Search by mobile number, customer name, city, area, governorate, address, order ref, or tracking number.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F1A26]/35" />
                      <input
                        value={customerQuery}
                        onChange={(event) => setCustomerQuery(event.target.value)}
                        placeholder="Search phone, name, city, area..."
                        className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] ps-11 pe-4 text-sm font-bold text-[#0F1A26] caret-[#EE1B25] outline-none transition placeholder:text-[#0F1A26]/35 focus:border-[#EEBC3F]"
                      />
                    </div>
                    {customerQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerQuery("")}
                        className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-white px-4 text-sm font-black text-[#0F1A26] transition hover:bg-[#F8F6F3]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">
                  Showing {filteredCustomers.length} of {customers.length} customers
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
                  <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.14em] text-[#0F1A26]/45">
                    <tr>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Orders</th>
                      <th className="px-5 py-3">Finance</th>
                      <th className="px-5 py-3">Products</th>
                      <th className="px-5 py-3">Order refs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F1A26]/8">
                    {filteredCustomers.length ? filteredCustomers.map((customer) => {
                      const productSummary = Array.from(customer.products.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([name, qty]) => `${name} x${qty}`)
                        .join(" - ");
                      const customerOrders = customer.orderRefs
                        .map((orderRef) => filteredMetricOrders.find((order) => getOrderRef(order) === orderRef))
                        .filter((order): order is AdminOrder => Boolean(order));

                      return (
                        <tr key={customer.key} className="align-top">
                          <td className="px-5 py-4">
                            <p className="font-black">{customer.name}</p>
                            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
                              {customer.city || "No city"} {customer.governorate ? `- ${customer.governorate}` : ""}
                            </p>
                            {customer.address && (
                              <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-[#0F1A26]/45">{customer.address}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold">{customer.phone || "No phone"}</p>
                            <p className="mt-1 text-xs font-semibold text-[#0F1A26]/50">{customer.email || "No email"}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-black">{customer.orders} total</p>
                            <p className="mt-1 text-xs font-bold text-emerald-700">{customer.confirmedOrders} confirmed</p>
                            <p className="mt-1 text-xs font-bold text-rose-700">{customer.returnedOrders} returned/cancelled</p>
                            <p className="mt-1 text-xs font-semibold text-[#0F1A26]/45">
                              Last: {customer.lastOrderAt ? formatAdminDateTime(customer.lastOrderAt) : "No date"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-black">{money.format(customer.netValue)}</p>
                            <p className="mt-1 text-xs font-semibold text-[#0F1A26]/50">All value: {money.format(customer.totalValue)}</p>
                            <p className="mt-1 text-xs font-semibold text-[#0F1A26]/50">Discounts: -{money.format(customer.discounts)}</p>
                            <p className="mt-1 text-xs font-semibold text-[#0F1A26]/50">Shipping: {money.format(customer.shipping)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-black">{customer.pieces} pieces</p>
                            <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-[#0F1A26]/50">
                              {productSummary || "No products recorded"}
                            </p>
                            <p className="mt-2 text-xs font-bold text-[#0F1A26]/45">
                              {[...customer.paymentMethods].join(", ") || "unknown"} - {[...customer.statuses].slice(0, 2).join(", ")}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex max-w-sm flex-wrap gap-2">
                              {customerOrders.slice(0, 6).map((order) => (
                                <button
                                  key={getOrderRef(order)}
                                  onClick={() => setSelectedOrder(order)}
                                  className="rounded-full bg-[#F8F6F3] px-3 py-1 text-xs font-black text-[#0F1A26] transition hover:bg-[#EEBC3F]"
                                >
                                  {getOrderRef(order)}
                                </button>
                              ))}
                            </div>
                            {customer.trackingNumbers.length > 0 && (
                              <p className="mt-2 text-xs font-semibold text-[#0F1A26]/45">
                                Tracking: {customer.trackingNumbers.slice(0, 2).join(", ")}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
                          No customers match this search/period/filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "stock" && (
          <>
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">Inventory Control</p>
                <h2 className="mt-2 text-2xl font-black">Stock health</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#0F1A26]/55">
                  Reads current product and size availability directly from Sanity CMS, with warnings for low or out-of-stock items.
                </p>
                {inventoryFetchedAt && (
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">
                    Live CMS sync: {formatAdminDateTime(inventoryFetchedAt)}
                  </p>
                )}
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0F1A26] text-white">
                <Boxes className="h-6 w-6" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F8F6F3] p-4">
                <p className="text-xs font-black uppercase text-[#0F1A26]/45">Products</p>
                <p className="mt-2 text-2xl font-black">{inventoryStats.products}</p>
              </div>
              <div className="rounded-2xl bg-[#F8F6F3] p-4">
                <p className="text-xs font-black uppercase text-[#0F1A26]/45">Tracked variants</p>
                <p className="mt-2 text-2xl font-black">{inventoryStats.trackedVariants}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-black uppercase text-amber-700/70">Low stock</p>
                <p className="mt-2 text-2xl font-black text-amber-700">{inventoryStats.lowItems.length}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs font-black uppercase text-rose-700/70">Out of stock</p>
                <p className="mt-2 text-2xl font-black text-rose-700">{inventoryStats.outItems.length}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#0F1A26]/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">Inventory warnings</h2>
                <p className="text-xs font-bold text-[#0F1A26]/45">
                  {inventoryLoading ? "Loading inventory..." : `${inventoryStats.lowItems.length + inventoryStats.outItems.length} products need attention`}
                </p>
              </div>
              <PackageX className="h-6 w-6 text-[#EEBC3F]" />
            </div>

            <div className="max-h-[360px] overflow-auto">
              {(inventoryStats.lowItems.length || inventoryStats.outItems.length) ? (
                <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
                  <thead className="sticky top-0 bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                    <tr>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Status by size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F1A26]/8">
                    {[...inventoryStats.outItems, ...inventoryStats.lowItems].slice(0, 30).map((item) => (
                      <tr key={item.slug}>
                        <td className="px-5 py-4 align-top">
                          <p className="font-black">{item.name}</p>
                          <p className="text-xs font-semibold text-[#0F1A26]/45">{item.type || item.slug}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {getSizeRows(item).map((row) => {
                              const isBad = row.status === "out_of_stock" || row.quantity === 0;
                              const isLow = row.status === "low_stock" || (typeof row.quantity === "number" && row.quantity > 0 && row.quantity <= 3);
                              return (
                                <span
                                  key={row.size}
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    isBad
                                      ? "bg-rose-100 text-rose-700"
                                      : isLow
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {row.size}: {typeof row.quantity === "number" ? row.quantity : row.status}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm font-bold text-[#0F1A26]/45">
                  No inventory warnings right now.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#0F1A26]/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Stock consumption forecast</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">
                Estimated usage from confirmed non-returned orders in the selected dashboard period.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/40">Coverage target</span>
              <select
                value={stockCoverageDays}
                onChange={(event) => setStockCoverageDays(Number(event.target.value))}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value={7}>Enough for 1 week</option>
                <option value={14}>Enough for 2 weeks</option>
                <option value={30}>Enough for 1 month</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <DataPill label="sales period used" value={`${stockConsumption.periodDays} days`} />
            <DataPill label="units consumed" value={String(stockConsumption.totalSold)} />
            <DataPill label={`needed for ${stockCoverageDays} days`} value={`${stockConsumption.totalRestockNeeded} units`} />
            <DataPill label="sold but stock untracked" value={String(stockConsumption.untrackedRows.length)} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Sold</th>
                  <th className="px-5 py-3">Daily use</th>
                  <th className="px-5 py-3">Current stock</th>
                  <th className="px-5 py-3">Coverage</th>
                  <th className="px-5 py-3">Conclusion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {stockConsumption.rows.length ? stockConsumption.rows.slice(0, 60).map((row) => {
                  const isRestock = row.restockNeeded > 0;
                  const isUntracked = row.currentStock === null;
                  const conclusion = isUntracked
                    ? "Add stock quantity in CMS to forecast this item."
                    : row.dailyConsumption <= 0
                      ? "No recent consumption in this period."
                      : isRestock
                        ? `Add ${row.restockNeeded} units to cover ${stockCoverageDays} days.`
                        : `Enough for ${row.coverageDays ?? "many"} days.`;

                  return (
                    <tr key={`${row.slug}-${row.size}`} className={isRestock ? "bg-amber-50/70" : isUntracked ? "bg-rose-50/60" : ""}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black">{row.product}</p>
                        <p className="text-xs font-semibold text-[#0F1A26]/45">{row.slug}</p>
                      </td>
                      <td className="px-5 py-4 align-top font-black">{row.size}</td>
                      <td className="px-5 py-4 align-top font-bold">{row.sold}</td>
                      <td className="px-5 py-4 align-top font-bold">{row.dailyConsumption.toFixed(2)} / day</td>
                      <td className="px-5 py-4 align-top font-bold">
                        {row.currentStock === null ? "Untracked" : row.currentStock}
                      </td>
                      <td className="px-5 py-4 align-top font-bold">
                        {row.coverageDays === null ? "-" : `${row.coverageDays} days`}
                      </td>
                      <td className="max-w-[340px] px-5 py-4 align-top">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          isUntracked
                            ? "bg-rose-100 text-rose-700"
                            : isRestock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {conclusion}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
                      No consumption data for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#0F1A26]/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-black">Full stock by product and size</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">This is read from Sanity CMS stock fields. Updating CMS stock updates this dashboard on refresh.</p>
            </div>
            <Boxes className="h-6 w-6 text-[#EEBC3F]" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Stock rows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {inventory.map((item) => (
                  <tr key={item.slug}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-black">{item.name}</p>
                      <p className="text-xs font-semibold text-[#0F1A26]/45">{item.slug}</p>
                    </td>
                    <td className="px-5 py-4 align-top font-bold">{item.type || "-"}</td>
                    <td className="px-5 py-4 align-top text-[#0F1A26]/60">{Array.isArray(item.category) ? item.category.join(", ") : item.category || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {getSizeRows(item).map((row) => {
                          const isBad = row.status === "out_of_stock" || row.quantity === 0;
                          const isLow = row.status === "low_stock" || (typeof row.quantity === "number" && row.quantity > 0 && row.quantity <= 3);
                          return (
                            <span
                              key={row.size}
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                isBad
                                  ? "bg-rose-100 text-rose-700"
                                  : isLow
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {row.size}: {typeof row.quantity === "number" ? `${row.quantity} left` : row.status}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
          </>
        )}

        {activeTab === "expenses" && (
          <>
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            eyebrow="Expense control"
            title="Entered expenses"
            description="These are only the expenses manually entered in Sanity CMS and filtered by the same date range as finance."
          />
            <button
              onClick={exportExpensesCsv}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Export expenses
            </button>
          </div>

          {expensesFetchedAt && (
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/35">
              Live CMS sync: {formatAdminDateTime(expensesFetchedAt)}
            </p>
          )}
          <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F1A26]/35" />
              <input
                value={expenseQuery}
                onChange={(event) => setExpenseQuery(event.target.value)}
                placeholder="Search title, vendor, order ref, notes..."
                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] ps-11 pe-4 text-sm font-bold text-[#0F1A26] caret-[#EE1B25] outline-none placeholder:text-[#0F1A26]/35 focus:border-[#EEBC3F]"
              />
            </div>
            <select
              value={expenseCategoryFilter}
              onChange={(event) => setExpenseCategoryFilter(event.target.value)}
              className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All categories ({visibleExpenses.length})</option>
              {expenseFilterOptions.categories.map(([category, count]) => (
                <option key={category} value={category}>{category.replaceAll("_", " ")} ({count})</option>
              ))}
            </select>
            <select
              value={expensePaymentFilter}
              onChange={(event) => setExpensePaymentFilter(event.target.value)}
              className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All payment methods ({visibleExpenses.length})</option>
              {expenseFilterOptions.paymentMethods.map(([paymentMethod, count]) => (
                <option key={paymentMethod} value={paymentMethod}>{paymentMethod.replaceAll("_", " ")} ({count})</option>
              ))}
            </select>
            {(expenseQuery || expenseCategoryFilter !== "all" || expensePaymentFilter !== "all") && (
              <button
                onClick={() => {
                  setExpenseQuery("");
                  setExpenseCategoryFilter("all");
                  setExpensePaymentFilter("all");
                }}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 px-4 text-sm font-black text-[#0F1A26]/65 transition hover:bg-[#F8F6F3]"
              >
                Reset expenses
              </button>
            )}
          </div>
          <p className="mt-3 text-xs font-bold text-[#0F1A26]/45">
            Showing {filteredExpenses.length} of {visibleExpenses.length} expense entries after filters.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Expenses" value={money.format(expenseStats.total)} subtitle={`${expenseStats.count} entries in period`} icon={ReceiptText} tone={expenseStats.total ? "red" : "green"} />
          <StatCard title="Net After Expenses" value={money.format(expenseStats.netAfterExpenses)} subtitle="Net revenue minus entered expenses" icon={Banknote} tone={expenseStats.netAfterExpenses >= 0 ? "green" : "red"} />
          <StatCard title="Expense Data Source" value="Sanity CMS" subtitle={expensesLoading ? "Loading expenses..." : "Manual operational expenses"} icon={ShieldCheck} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Expenses by category</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">Where money is going operationally.</p>
            </div>
            <div className="divide-y divide-[#0F1A26]/8">
              {expenseStats.categories.length ? expenseStats.categories.map((row) => (
                <div key={row.category} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4">
                  <div>
                    <p className="font-black capitalize">{row.category.replaceAll("_", " ")}</p>
                    <p className="text-xs font-bold text-[#0F1A26]/45">{row.count} entries</p>
                  </div>
                  <p className="font-black text-rose-700">{money.format(row.total)}</p>
                </div>
              )) : (
                <p className="p-5 text-sm font-bold text-[#0F1A26]/45">No expenses in this period.</p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
            <div className="border-b border-[#0F1A26]/10 px-5 py-4">
              <h2 className="text-lg font-black">Expenses by payment method</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">How expenses were paid.</p>
            </div>
            <div className="divide-y divide-[#0F1A26]/8">
              {expenseStats.paymentMethods.length ? expenseStats.paymentMethods.map((row) => (
                <div key={row.paymentMethod} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4">
                  <div>
                    <p className="font-black capitalize">{row.paymentMethod.replaceAll("_", " ")}</p>
                    <p className="text-xs font-bold text-[#0F1A26]/45">{row.count} entries</p>
                  </div>
                  <p className="font-black text-rose-700">{money.format(row.total)}</p>
                </div>
              )) : (
                <p className="p-5 text-sm font-bold text-[#0F1A26]/45">No payment method data yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="border-b border-[#0F1A26]/10 px-5 py-4">
            <h2 className="text-lg font-black">Expense ledger</h2>
            <p className="text-xs font-bold text-[#0F1A26]/45">
              Latest expense entries in the selected period. Add or edit them from Sanity CMS.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {expenseStats.recent.length ? expenseStats.recent.map((expense) => (
                  <tr key={expense._id}>
                    <td className="px-5 py-4 align-top font-bold">
                      {getExpenseDate(expense)?.toLocaleDateString("en-EG") || "-"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-black">{expense.title || "Expense"}</p>
                      {expense.notes && <p className="mt-1 max-w-[340px] text-xs font-semibold leading-5 text-[#0F1A26]/45">{expense.notes}</p>}
                    </td>
                    <td className="px-5 py-4 align-top font-bold capitalize">{(expense.category || "other").replaceAll("_", " ")}</td>
                    <td className="px-5 py-4 align-top font-black text-rose-700">{money.format(getExpenseAmount(expense))}</td>
                    <td className="px-5 py-4 align-top capitalize">{(expense.paymentMethod || "-").replaceAll("_", " ")}</td>
                    <td className="px-5 py-4 align-top">{expense.vendor || "-"}</td>
                    <td className="px-5 py-4 align-top font-bold">{expense.relatedOrderRef || "-"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
                      No expenses recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
          </>
        )}

        {activeTab === "orders" && (
          <>
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
          <SectionHeader
            eyebrow="Action Center"
            title="Orders that need attention"
              description="This queue separates payment approval, shipment creation/replacement, tracking refresh, pickup requests, and returns so the admin knows exactly which operation will run."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-amber-800">InstaPay approval</h3>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900">{operations.instapayAttention.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {operations.instapayAttention.length ? operations.instapayAttention.map((order) => (
                  <div key={getOrderRef(order)} className="rounded-2xl bg-white p-3 text-sm font-bold shadow-sm">
                    <button onClick={() => setSelectedOrder(order)} className="block w-full text-left">
                      <span className="block font-black">{getOrderRef(order)}</span>
                      <span className="text-[#0F1A26]/50">{money.format(getAmount(order))}</span>
                    </button>
                    <button
                      onClick={() => void approveInstaPayOrder(order)}
                      disabled={actionLoadingRef === `instapay:${getOrderRef(order)}`}
                      className="mt-3 h-9 w-full rounded-xl bg-[#0F1A26] text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {actionLoadingRef === `instapay:${getOrderRef(order)}` ? "Approving..." : "Approve payment"}
                    </button>
                  </div>
                )) : <p className="text-sm font-bold text-amber-800/60">No pending InstaPay orders.</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-rose-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-rose-800">Courier shipment actions</h3>
                <span className="rounded-full bg-rose-200 px-3 py-1 text-xs font-black text-rose-900">{operations.BostaAttention.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {operations.BostaAttention.length ? operations.BostaAttention.map((order) => (
                  <div key={getOrderRef(order)} className="rounded-2xl bg-white p-3 text-sm font-bold shadow-sm">
                    <button onClick={() => setSelectedOrder(order)} className="block w-full text-left">
                      <span className="block font-black">{getOrderRef(order)}</span>
                      <span className="line-clamp-2 text-[#0F1A26]/50">
                        {needsBostaReplacement(order)
                          ? getString(getBosta(order).replacementReason) || "Order changed after shipment creation. Replace courier shipment."
                          : getBostaError(order) || "Missing tracking on order row"}
                      </span>
                    </button>
                    {needsBosta(order) && (
                      <button
                        onClick={() => void createBostaShipmentFromOrder(order)}
                        disabled={actionLoadingRef === `Bosta-create:${getOrderRef(order)}`}
                        className="mt-3 h-9 w-full rounded-xl bg-emerald-600 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {actionLoadingRef === `Bosta-create:${getOrderRef(order)}` ? "Creating..." : "Create shipment"}
                      </button>
                    )}
                    {needsBostaReplacement(order) && (
                      <button
                        onClick={() => void terminateBostaShipmentForReplacement(order)}
                        disabled={actionLoadingRef === `bosta-terminate:${getOrderRef(order)}`}
                        className="mt-3 h-9 w-full rounded-xl bg-amber-500 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {actionLoadingRef === `bosta-terminate:${getOrderRef(order)}` ? "Terminating..." : "Terminate old Bosta shipment"}
                      </button>
                    )}
                    {(getTrackingNumber(order) || getBostaError(order)) && (
                      <button
                        onClick={() => void syncOneBosta(order)}
                        disabled={actionLoadingRef === `Bosta:${getOrderRef(order)}`}
                        className="mt-3 h-9 w-full rounded-xl border border-[#0F1A26]/10 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {actionLoadingRef === `Bosta:${getOrderRef(order)}` ? "Refreshing..." : "Refresh tracking status"}
                      </button>
                    )}
                    {needsOldTrackingCancellation(order) && (
                      <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs font-black text-amber-800">
                        Old tracking needs Bosta terminate/check before replacement.
                      </p>
                    )}
                  </div>
                )) : <p className="text-sm font-bold text-rose-800/60">No courier shipment actions needed.</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-[#F8F6F3] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-[#0F1A26]">Returns / cancelled</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0F1A26]">{operations.returnsAttention.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {operations.returnsAttention.length ? operations.returnsAttention.map((order) => (
                  <button key={getOrderRef(order)} onClick={() => setSelectedOrder(order)} className="block w-full rounded-2xl bg-white p-3 text-left text-sm font-bold shadow-sm">
                    <span className="block font-black">{getOrderRef(order)}</span>
                    <span className="text-[#0F1A26]/50">Deducted: {money.format(getAmount(order))}</span>
                  </button>
                )) : <p className="text-sm font-bold text-[#0F1A26]/45">No returns detected.</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-emerald-900">Bosta pickup</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900">Courier</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/65">
                Request one pickup for collected parcels. Bosta can reject duplicate pickup requests for the same date/location.
              </p>
              <div className="mt-3 grid gap-2">
                <label className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-900/55">
                  Pickup date
                  <input
                    type="date"
                    value={bostaPickupDraft.scheduledDate}
                    onChange={(event) => setBostaPickupDraft((current) => ({ ...current, scheduledDate: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-900/10 bg-white px-3 text-sm font-black text-[#0F1A26] outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-900/55">
                    Parcels
                    <input
                      type="number"
                      min={1}
                      value={bostaPickupDraft.numberOfParcels}
                      onChange={(event) => setBostaPickupDraft((current) => ({ ...current, numberOfParcels: event.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-emerald-900/10 bg-white px-3 text-sm font-black text-[#0F1A26] outline-none"
                    />
                  </label>
                  <label className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-900/55">
                    Type
                    <select
                      value={bostaPickupDraft.packageType}
                      onChange={(event) => setBostaPickupDraft((current) => ({ ...current, packageType: event.target.value as BostaPickupDraft["packageType"] }))}
                      className="mt-1 h-10 w-full rounded-xl border border-emerald-900/10 bg-white px-3 text-sm font-black text-[#0F1A26] outline-none"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Light Bulky">Light Bulky</option>
                      <option value="Heavy Bulky">Heavy Bulky</option>
                    </select>
                  </label>
                </div>
                <input
                  value={bostaPickupDraft.notes}
                  onChange={(event) => setBostaPickupDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Pickup note"
                  className="h-10 rounded-xl border border-emerald-900/10 bg-white px-3 text-sm font-bold text-[#0F1A26] outline-none"
                />
                <button
                  onClick={() => void createBostaPickupRequest()}
                  disabled={actionLoadingRef === "bosta-pickup"}
                  className="mt-1 h-10 rounded-xl bg-emerald-700 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {actionLoadingRef === "bosta-pickup" ? "Requesting..." : "Create Bosta pickup"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F1A26]/35" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOrdersPage(1);
                }}
                placeholder="Search order ref, phone, customer, city, tracking..."
                className="h-12 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] ps-11 pe-4 text-sm font-bold text-[#0F1A26] caret-[#EE1B25] outline-none placeholder:text-[#0F1A26]/35 focus:border-[#EEBC3F]"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All payments ({visibleOrders.length})</option>
              {orderFilterOptions.payments.map(([bucket, count]) => (
                <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
              ))}
            </select>
            <select
              value={deliveryFilter}
              onChange={(event) => setDeliveryFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All delivery ({visibleOrders.length})</option>
              {orderFilterOptions.deliveries.map(([bucket, count]) => (
                <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
              ))}
            </select>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All cities ({visibleOrders.length})</option>
              {orderFilterOptions.cities.map(([key, row]) => (
                <option key={key} value={key}>{row.label} ({row.count})</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All statuses ({visibleOrders.length})</option>
              {orderFilterOptions.statuses.map(([statusKey, row]) => (
                <option key={statusKey} value={statusKey}>{row.label} ({row.count})</option>
              ))}
            </select>
            <button
              onClick={() => refreshAll()}
              disabled={loading || inventoryLoading || BostaSyncing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading || inventoryLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={syncBosta}
              disabled={loading || BostaSyncing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EEBC3F] px-5 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Truck className={`h-4 w-4 ${BostaSyncing ? "animate-pulse" : ""}`} />
              Refresh Tracking Status
            </button>
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setOrdersPage(1);
                }}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#0F1A26]/10 px-5 text-sm font-black text-[#0F1A26]/65 transition hover:bg-[#F8F6F3]"
              >
                Clear search
              </button>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Courier status labels</p>
              <h2 className="text-lg font-black">Orders by courier timeline label</h2>
              <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
                Counts use the same period, payment, delivery, city, status, and search filters currently selected.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F6F3] px-4 py-3 text-right">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F1A26]/35">reconciliation</p>
              <p className="text-sm font-black text-[#0F1A26]">
                Cards total {shipmentStatusTotal} / Filtered orders {filteredMetricOrders.length}
              </p>
              <p className={`text-xs font-black ${shipmentStatusDifference === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {shipmentStatusDifference === 0
                  ? "All filtered orders are classified"
                  : `${shipmentStatusDifference} orders need classification review`}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 rounded-3xl bg-[#F8F6F3] p-4 text-xs font-bold text-[#0F1A26]/60 md:grid-cols-4">
            <p><span className="font-black text-emerald-700">Delivered</span> = بوسطة/التتبع بيقول إن العميل استلم.</p>
            <p><span className="font-black text-rose-700">Returned / Cancelled</span> = مرتجع أو ملغي، وبيتخصم من revenue.</p>
            <p><span className="font-black text-amber-700">Shipment Created</span> = الشحنة اتعملها tracking، لكنها لسه مش Delivered ومش Returned.</p>
            <p><span className="font-black text-[#0F1A26]">Custom / finance only</span> = أوردر متسجل ماليًا ومش مطلوب له شحنة.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shipmentStatusBreakdown.length ? shipmentStatusBreakdown.map((row) => (
              <button
                key={row.key}
                onClick={() => setStatusFilter(row.key)}
                className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  statusFilter === row.key
                    ? "border-[#EEBC3F] bg-[#FFF8E2]"
                    : "border-[#0F1A26]/10 bg-[#F8F6F3]"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1A26]/40">{row.label}</p>
                <p className="mt-2 text-3xl font-black">{row.count}</p>
                <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">{money.format(row.value)}</p>
              </button>
            )) : (
              <p className="rounded-2xl bg-[#F8F6F3] p-4 text-sm font-bold text-[#0F1A26]/45">No statuses in this period.</p>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#0F1A26]/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-black">Orders</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">
                {filteredOrders.length} visible orders - page {safeOrdersPage} of {ordersPageCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ordersPageSize}
                onChange={(event) => {
                  setOrdersPageSize(Number(event.target.value));
                  setOrdersPage(1);
                }}
                className="h-10 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-xs font-black outline-none"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
              <PackageCheck className="h-6 w-6 text-[#EEBC3F]" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Courier</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {paginatedOrders.map((order, index) => {
                  const customer = getCustomer(order);
                  const tracking = getTrackingNumber(order);
                  const BostaStatus = getBostaStatus(order);
                  const BostaCode = getBostaLatestCode(order);
                  const BostaUpdate = getBostaLatestUpdate(order);
                  const BostaLocation = getBostaLatestLocation(order);
                  const BostaSyncedAt = getBostaSyncedAt(order);
                  const BostaError = getBostaError(order);
                  const orderRef = getOrderRef(order);
                  const orderSource = getOrderSource(order);
                  const lastUpdateSource = getOrderLastUpdateSource(order);
                  const BostaConnectionIssue = hasBostaConnectionIssue(order);
                  const rowTone = isReturned(order)
                    ? "bg-rose-50/70"
                    : isPendingInstaPay(order)
                      ? "bg-amber-50/80"
                      : BostaError || needsBosta(order) || needsBostaReplacement(order)
                        ? "bg-orange-50/70"
                        : "";

                  return (
                    <tr key={`${orderRef}-${index}`} className={rowTone}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black text-[#0F1A26]">{orderRef || "No ref"}</p>
                        <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">
                          Created from: {orderSource || "-"}
                        </p>
                        {lastUpdateSource && lastUpdateSource !== orderSource && (
                          <p className="mt-1 text-xs font-bold text-[#0F1A26]/35">
                            Last update: {lastUpdateSource}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-bold text-[#0F1A26]/55">
                          Order created {formatAdminDateTime(getCreatedAt(order)) || "No date"}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold">{getString(customer.first_name) || "Customer"}</p>
                        <p className="text-xs font-semibold text-[#0F1A26]/50">{getString(customer.phone)}</p>
                        <p className="text-xs font-semibold text-[#0F1A26]/40">{getString(customer.city)}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black uppercase">{getPaymentMethod(order) || "-"}</p>
                        <p className="text-xs font-semibold text-[#0F1A26]/50">{getPaymentStatus(order) || "-"}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black">{money.format(getAmount(order))}</p>
                        {getDiscount(order) > 0 && (
                          <p className="text-xs font-bold text-emerald-600">Discount -{money.format(getDiscount(order))}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {tracking ? (
                          <>
                            <p className="font-black text-emerald-700">{tracking}</p>
                            {BostaStatus && <p className="mt-1 text-xs font-black text-[#0F1A26]">{BostaStatus}</p>}
                            {BostaCode && (
                              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#0F1A26]/45">
                                Code: {BostaCode}
                              </p>
                            )}
                            {BostaUpdate && <p className="mt-1 max-w-[260px] text-xs font-semibold text-[#0F1A26]/55">{BostaUpdate}</p>}
                            {BostaLocation && (
                              <p className="mt-1 max-w-[260px] text-xs font-bold text-[#0F1A26]/45">
                                Location: {BostaLocation}
                              </p>
                            )}
                            {BostaSyncedAt && (
                              <p className="mt-1 text-[11px] font-bold text-[#0F1A26]/35">
                                Refreshed {formatAdminDateTime(BostaSyncedAt) || BostaSyncedAt}
                              </p>
                            )}
                            {needsOldTrackingCancellation(order) && (
                              <p className="mt-1 rounded-xl bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-800">
                                Old tracking needs portal cancel/check
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="font-bold text-[#0F1A26]/40">No tracking</p>
                        )}
                        {BostaError && <p className="mt-1 max-w-[260px] text-xs font-bold text-rose-600">{BostaError}</p>}
                        {BostaConnectionIssue && (
                          <p className="mt-1 rounded-xl bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                            Check Bosta API key/token. Existing tracking is not marked for replacement.
                          </p>
                        )}
                        {needsBosta(order) && !BostaError && (
                          <p className="mt-1 text-xs font-bold text-orange-600">Needs courier shipment</p>
                        )}
                        {needsBostaReplacement(order) && (
                          <p className="mt-1 rounded-xl bg-orange-50 px-2 py-1 text-xs font-black text-orange-700">
                            Needs shipment replacement
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black">{getOrderShipmentStatusLabel(order)}</p>
                        <p className="mt-1 text-xs font-bold text-[#0F1A26]/40">Order: {getStatus(order) || "-"}</p>
                        {isPendingInstaPay(order) && (
                          <p className="mt-1 rounded-full bg-[#EEBC3F]/20 px-2 py-1 text-xs font-black text-[#7A5A00]">
                            Waiting approval
                          </p>
                        )}
                        {isReturned(order) && (
                          <p className="mt-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-700">
                            Deducted from net
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {needsBosta(order) && (
                          <button
                            onClick={() => void createBostaShipmentFromOrder(order)}
                            disabled={actionLoadingRef === `Bosta-create:${orderRef}`}
                            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                          >
                            <Truck className={`h-4 w-4 ${actionLoadingRef === `Bosta-create:${orderRef}` ? "animate-pulse" : ""}`} />
                            {actionLoadingRef === `Bosta-create:${orderRef}` ? "Creating..." : "Create shipment"}
                          </button>
                        )}
                        {needsBostaReplacement(order) && (
                          <button
                            onClick={() => void terminateBostaShipmentForReplacement(order)}
                            disabled={actionLoadingRef === `bosta-terminate:${orderRef}`}
                            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                          >
                            <PackageX className={`h-4 w-4 ${actionLoadingRef === `bosta-terminate:${orderRef}` ? "animate-pulse" : ""}`} />
                            {actionLoadingRef === `bosta-terminate:${orderRef}` ? "Terminating..." : "Terminate old shipment"}
                          </button>
                        )}
                        {(tracking || getBostaError(order)) && (
                          <button
                            onClick={() => void syncOneBosta(order)}
                            disabled={actionLoadingRef === `Bosta:${orderRef}`}
                            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#0F1A26]/10 bg-white px-4 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                          >
                            <RefreshCw className={`h-4 w-4 ${actionLoadingRef === `Bosta:${orderRef}` ? "animate-spin" : ""}`} />
                            Refresh tracking
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-4 text-xs font-black text-white transition hover:-translate-y-0.5"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#0F1A26]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[#0F1A26]/45">
              Showing {filteredOrders.length ? (safeOrdersPage - 1) * ordersPageSize + 1 : 0}
              {" - "}
              {Math.min(safeOrdersPage * ordersPageSize, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrdersPage((page) => Math.max(1, page - 1))}
                disabled={safeOrdersPage <= 1}
                className="h-10 rounded-2xl border border-[#0F1A26]/10 px-4 text-xs font-black text-[#0F1A26] transition hover:bg-[#F8F6F3] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-2xl bg-[#F8F6F3] px-4 py-2 text-xs font-black">
                {safeOrdersPage} / {ordersPageCount}
              </span>
              <button
                onClick={() => setOrdersPage((page) => Math.min(ordersPageCount, page + 1))}
                disabled={safeOrdersPage >= ordersPageCount}
                className="h-10 rounded-2xl border border-[#0F1A26]/10 px-4 text-xs font-black text-[#0F1A26] transition hover:bg-[#F8F6F3] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
          </>
        )}
          </>
        )}
      </div>
      {selectedOrder && (
        <OrderDetailsPanel
          key={`${getOrderRef(selectedOrder)}:${getUpdatedAt(selectedOrder)}`}
          order={selectedOrder}
          inventory={inventory}
          onClose={() => setSelectedOrder(null)}
          onApproveInstaPay={(order) => void approveInstaPayOrder(order)}
          onCreateBosta={(order) => void createBostaShipmentFromOrder(order)}
          onPrintBostaAwb={(order) => void printBostaAwb(order)}
          onSaveManualEdit={(order, draft) => void saveManualOrderEdit(order, draft)}
          onDeleteOrder={(order) => void deleteOrderEverywhere(order)}
          actionLoadingRef={actionLoadingRef}
        />
      )}
    </main>
  );
}

