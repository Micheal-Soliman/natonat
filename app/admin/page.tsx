"use client";

import { useEffect, useMemo, useState } from "react";
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
  aramex?: Record<string, unknown>;
  extras?: Record<string, unknown>;
};

type OrdersResponse = {
  success?: boolean;
  orders?: AdminOrder[];
  total?: number;
  returned?: number;
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
      if (nestedError) return [base, status, String(nestedError)].filter(Boolean).join(" · ");
    }

    if (typeof response === "string") return [base, status, response].filter(Boolean).join(" · ");
    if (status) return `${base} · ${status}`;
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

type AramexSyncResponse = {
  success?: boolean;
  synced?: number;
  failed?: number;
  checked?: number;
  error?: string;
};

type AdminActionResponse = {
  success?: boolean;
  error?: string;
  details?: unknown;
};

type AdminTab = "finance" | "orders" | "stock" | "expenses";
type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

type AdminStatusAction = {
  label: string;
  action: string;
  status: string;
  paymentStatus?: string;
  aramexStatus?: string;
  aramexError?: string;
  note: string;
  tone: string;
};

const money = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const ADMIN_STATUS_ACTIONS: AdminStatusAction[] = [
  {
    label: "Mark delivered",
    action: "mark_delivered",
    status: "delivered",
    paymentStatus: "Paid",
    aramexStatus: "Delivered",
    aramexError: "",
    note: "Admin marked this order as delivered.",
    tone: "bg-emerald-600 text-white",
  },
  {
    label: "Mark returned",
    action: "mark_returned",
    status: "returned",
    aramexStatus: "Returned",
    note: "Admin marked this order as returned. Finance should deduct this value.",
    tone: "bg-rose-600 text-white",
  },
  {
    label: "Mark cancelled",
    action: "mark_cancelled",
    status: "cancelled",
    aramexStatus: "Cancelled",
    note: "Admin marked this order as cancelled. Finance should deduct this value.",
    tone: "bg-[#0F1A26] text-white",
  },
  {
    label: "Resolve issue",
    action: "resolve_issue",
    status: "confirmed",
    aramexError: "",
    note: "Admin marked the operational issue as resolved.",
    tone: "bg-[#EEBC3F] text-[#0F1A26]",
  },
];

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function getNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
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

function getOrderRef(order: AdminOrder) {
  return getString(order.order_ref || order["Order Ref"]);
}

function getCustomer(order: AdminOrder) {
  return getObject(order.customer || order["Customer (Full JSON)"]);
}

function getAramex(order: AdminOrder) {
  return getObject(order.aramex);
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
  const raw = getCreatedAt(order) || getUpdatedAt(order);
  const date = raw ? new Date(raw) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function getExpenseDate(expense: AdminExpense) {
  const raw = expense.expenseDate || expense._updatedAt;
  const date = raw ? new Date(raw) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function getExpenseAmount(expense: AdminExpense) {
  return getNumber(expense.amountEgp);
}

function getSubtotal(order: AdminOrder) {
  const extras = getExtras(order);
  return (
    getNumber(extras.subtotal_egp) ||
    getNumber(order["Subtotal (EGP)"]) ||
    0
  );
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
    getNumber(extras.rescue_discount) ||
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
  return getNumber(item.line_total_egp ?? item.line_total ?? item.lineTotal ?? item.total);
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
  const aramex = getAramex(order);
  return getString(aramex.trackingNumber || order["Aramex Tracking Number"]);
}

function getAramexError(order: AdminOrder) {
  const aramex = getAramex(order);
  return getString(aramex.error || order["Aramex Error"]);
}

function getAramexStatus(order: AdminOrder) {
  const aramex = getAramex(order);
  return getString(aramex.status || order["Aramex Status"]);
}

function getAramexLatestUpdate(order: AdminOrder) {
  const aramex = getAramex(order);
  return getString(aramex.latestDescription || aramex.latestDate || order["Aramex Latest Update"]);
}

function getAramexSyncedAt(order: AdminOrder) {
  const aramex = getAramex(order);
  return getString(aramex.syncedAt || order["Aramex Synced At"]);
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
  const text = `${getStatus(order)} ${getPaymentStatus(order)} ${getAramexStatus(order)} ${getAramexLatestUpdate(order)}`.toLowerCase();
  return text.includes("return") || text.includes("rto") || text.includes("cancel");
}

function isDelivered(order: AdminOrder) {
  const text = `${getStatus(order)} ${getAramexStatus(order)} ${getAramexLatestUpdate(order)}`.toLowerCase();
  return text.includes("delivered") || text.includes("تم التسليم");
}

function isInTransit(order: AdminOrder) {
  const text = `${getAramexStatus(order)} ${getAramexLatestUpdate(order)}`.toLowerCase();
  return (
    text.includes("transit") ||
    text.includes("out for delivery") ||
    text.includes("forwarded") ||
    text.includes("departed") ||
    text.includes("arrived")
  );
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

function needsAramex(order: AdminOrder) {
  return (
    getDeliveryBucket(order) === "delivery" &&
    isConfirmed(order) &&
    !isPendingInstaPay(order) &&
    !getTrackingNumber(order)
  );
}

function getPaymentBucket(order: AdminOrder) {
  const method = getPaymentMethod(order);
  if (method.includes("card") || method.includes("paymob")) return "card";
  if (method.includes("instapay") || method.includes("wallet")) return "instapay";
  if (method.includes("cod") || method.includes("cash")) return "cod";
  return method || "unknown";
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

function DataPill({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${dark ? "border border-white/10 bg-white/10" : "bg-[#F8F6F3]"}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${dark ? "text-white/45" : "text-[#0F1A26]/40"}`}>{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${dark ? "text-white" : "text-[#0F1A26]"}`}>{value || "-"}</p>
    </div>
  );
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const rows = Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== "");

  if (!rows.length) {
    return <p className="rounded-2xl bg-[#F8F6F3] p-4 text-sm font-bold text-[#0F1A26]/45">No data recorded.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([key, value]) => (
        <DataPill
          key={key}
          label={key.replaceAll("_", " ")}
          value={typeof value === "object" ? JSON.stringify(value) : getString(value)}
        />
      ))}
    </div>
  );
}

function OrderDetailsPanel({
  order,
  onClose,
  onApproveInstaPay,
  onStatusAction,
  actionLoadingRef,
}: {
  order: AdminOrder;
  onClose: () => void;
  onApproveInstaPay: (order: AdminOrder) => void;
  onStatusAction: (order: AdminOrder, action: AdminStatusAction) => void;
  actionLoadingRef: string;
}) {
  const customer = getCustomer(order);
  const aramex = getAramex(order);
  const extras = getExtras(order);
  const items = getItems(order);
  const orderRef = getOrderRef(order);
  const auditRows = [...getArray(order.admin_audit), ...getArray(order.history)]
    .map((entry) => getObject(entry))
    .filter((entry) => Object.keys(entry).length > 0)
    .slice()
    .reverse()
    .slice(0, 12);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1A26]/50 p-3 backdrop-blur-sm sm:p-6">
      <div className="ms-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#0F1A26]/10 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EEBC3F]">Order full details</p>
            <h3 className="mt-2 text-2xl font-black">{getOrderRef(order) || "No order ref"}</h3>
            <p className="mt-1 text-sm font-semibold text-[#0F1A26]/50">
              {getCreatedAt(order) || "No creation date"} {getUpdatedAt(order) ? `- updated ${getUpdatedAt(order)}` : ""}
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
                    Approving this order marks payment as paid and creates Aramex shipment if delivery is required.
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
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ADMIN_STATUS_ACTIONS.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => onStatusAction(order, action)}
                    disabled={actionLoadingRef === `status:${orderRef}:${action.action}`}
                    className={`h-10 rounded-2xl px-3 text-xs font-black transition hover:-translate-y-0.5 disabled:opacity-60 ${action.tone}`}
                  >
                    {actionLoadingRef === `status:${orderRef}:${action.action}` ? "Saving..." : action.label}
                  </button>
                ))}
              </div>
            </div>
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
                  source: getString(order.source),
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
            <h4 className="mb-3 text-lg font-black">Aramex tracking</h4>
            <KeyValueGrid
              data={{
                tracking_number: getTrackingNumber(order),
                status: getAramexStatus(order),
                latest_update: getAramexLatestUpdate(order),
                synced_at: getAramexSyncedAt(order),
                error: getAramexError(order),
                ...aramex,
              }}
            />
          </section>

          <section className="mt-5 rounded-[1.5rem] border border-[#0F1A26]/10 p-4">
            <h4 className="mb-3 text-lg font-black">Customer notifications</h4>
            <KeyValueGrid
              data={{
                customer_confirmation_email: getCustomerEmailSentAt(order) || "Not recorded",
                instapay_pending_customer_email: getInstaPayPendingCustomerEmailSentAt(order) || "Not recorded",
                admin_instapay_approval_email: getInstaPayApprovalEmailSentAt(order) || "Not recorded",
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
            <h4 className="mb-3 text-lg font-black">Finance extras / raw order payload</h4>
            <div className="grid gap-5 lg:grid-cols-2">
              <KeyValueGrid data={extras} />
              <pre className="max-h-[360px] overflow-auto rounded-2xl bg-[#0F1A26] p-4 text-xs font-semibold leading-5 text-white/80">
                {JSON.stringify(order, null, 2)}
              </pre>
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
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [inventoryFetchedAt, setInventoryFetchedAt] = useState("");
  const [expensesFetchedAt, setExpensesFetchedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [aramexSyncing, setAramexSyncing] = useState(false);
  const [aramexSyncMessage, setAramexSyncMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
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
  const [actionLoadingRef, setActionLoadingRef] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(25);

  useEffect(() => {
    window.localStorage.removeItem("natonat-admin-token");
    const stored = window.localStorage.getItem("natonat-admin-session") || "";
    setSavedToken(stored);
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
    setInventory([]);
    setSelectedOrder(null);
  };

  const syncAramex = async () => {
    setAramexSyncing(true);
    setAramexSyncMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/aramex-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = (await res.json()) as AramexSyncResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not sync Aramex");
      }

      setAramexSyncMessage(`Aramex synced: ${data.synced || 0} updated, ${data.failed || 0} failed.`);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync Aramex");
    } finally {
      setAramexSyncing(false);
    }
  };

  const syncOneAramex = async (order: AdminOrder) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`aramex:${orderRef}`);
    setError("");

    try {
      const res = await fetch("/api/admin/aramex-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({ orderRefs: [orderRef], limit: 1 }),
      });
      const data = (await res.json()) as AramexSyncResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not sync this Aramex order");
      }

      setAramexSyncMessage(`Aramex synced for ${orderRef}: ${data.synced || 0} updated, ${data.failed || 0} failed.`);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync this Aramex order");
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

      setAramexSyncMessage(`InstaPay approved for ${orderRef}.`);
      setSelectedOrder(null);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve InstaPay order");
    } finally {
      setActionLoadingRef("");
    }
  };

  const updateOrderStatus = async (order: AdminOrder, statusAction: AdminStatusAction) => {
    const orderRef = getOrderRef(order);
    if (!orderRef) return;

    setActionLoadingRef(`status:${orderRef}:${statusAction.action}`);
    setError("");

    try {
      const res = await fetch("/api/admin/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          orderRef,
          action: statusAction.action,
          status: statusAction.status,
          paymentStatus: statusAction.paymentStatus,
          aramexStatus: statusAction.aramexStatus,
          aramexError: statusAction.aramexError,
          note: statusAction.note,
        }),
      });
      const data = (await res.json()) as AdminActionResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not update order status");
      }

      setAramexSyncMessage(`${statusAction.label} saved for ${orderRef}.`);
      setSelectedOrder(null);
      await loadOrders(savedToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order status");
    } finally {
      setActionLoadingRef("");
    }
  };

  const exportOrdersCsv = () => {
    const headers = [
      "order_ref",
      "created_at",
      "customer",
      "phone",
      "city",
      "payment_method",
      "payment_status",
      "status",
      "subtotal_egp",
      "discount_egp",
      "shipping_egp",
      "total_egp",
      "aramex_tracking",
      "aramex_status",
      "aramex_error",
    ];
    const rows = filteredOrders.map((order) => {
      const customer = getCustomer(order);
      return [
        getOrderRef(order),
        getCreatedAt(order),
        getString(customer.first_name || customer.name),
        getString(customer.phone),
        getString(customer.city),
        getPaymentMethod(order),
        getPaymentStatus(order),
        getStatus(order),
        String(getSubtotal(order)),
        String(getDiscount(order)),
        String(getShipping(order)),
        String(getAmount(order)),
        getTrackingNumber(order),
        getAramexStatus(order),
        getAramexError(order),
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
      ["gross_sales", String(stats.grossSales)],
      ["net_revenue_before_expenses", String(stats.netRevenue)],
      ["expenses", String(expenseStats.total)],
      ["net_after_expenses", String(expenseStats.netAfterExpenses)],
      ["orders_count", String(stats.totalOrders)],
      ["pickup_orders", String(stats.pickupOrders)],
      ["delivery_orders", String(stats.deliveryOrders)],
      ["pieces_sold", String(stats.totalPieces)],
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
      ["date", "orders", "confirmed", "gross", "discounts", "shipping", "returns", "expenses", "net", "net_after_expenses", "aramex_issues"],
      ...dailyClose.map((day) => [
        day.date,
        String(day.orders),
        String(day.confirmed),
        String(day.gross),
        String(day.discounts),
        String(day.shipping),
        String(day.returned),
        String(day.expenses),
        String(day.net),
        String(day.netAfterExpenses),
        String(day.aramexIssues),
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
    const statusBuckets = new Map<string, number>();

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

      const status = getStatus(order) || "unknown";
      statusBuckets.set(status, (statusBuckets.get(status) || 0) + 1);
    });

    return {
      payments: Array.from(paymentBuckets.entries()).sort((a, b) => b[1] - a[1]),
      deliveries: Array.from(deliveryBuckets.entries()).sort((a, b) => b[1] - a[1]),
      cities: Array.from(cityBuckets.entries()).sort((a, b) => b[1].count - a[1].count),
      statuses: Array.from(statusBuckets.entries()).sort((a, b) => b[1] - a[1]),
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

      if (statusFilter === "pending_instapay" && !isPendingInstaPay(order)) return false;
      if (statusFilter === "aramex_missing" && !needsAramex(order)) return false;
      if (statusFilter === "aramex_failed" && !getAramexError(order)) return false;
      if (statusFilter === "returned" && !isReturned(order)) return false;
      if (statusFilter === "confirmed" && !isConfirmed(order)) return false;
      if (statusFilter.startsWith("raw:") && getStatus(order) !== statusFilter.slice(4)) return false;

      return true;
    });
  }, [cityFilter, deliveryFilter, paymentFilter, statusFilter, visibleOrders]);

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
    const returnedOrders = confirmedOrders.filter(isReturned);
    const unconfirmedOrders = filteredMetricOrders.filter((order) => !isConfirmed(order) && !isReturned(order));
    const grossSales = confirmedOrders.reduce((sum, order) => sum + getSubtotal(order), 0);
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
    const cardOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "card");
    const codOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "cod");
    const instapayOrders = filteredMetricOrders.filter((order) => getPaymentBucket(order) === "instapay");
    const aramexFailed = filteredMetricOrders.filter((order) => getAramexError(order));
    const aramexMissing = filteredMetricOrders.filter(needsAramex);
    const aramexSynced = filteredMetricOrders.filter((order) => getAramexStatus(order));
    const pendingInstaPay = filteredMetricOrders.filter(isPendingInstaPay);
    const deliveredOrders = filteredMetricOrders.filter(isDelivered);
    const pickupOrders = filteredMetricOrders.filter((order) => getDeliveryBucket(order) === "pickup");
    const deliveryOrders = filteredMetricOrders.filter((order) => getDeliveryBucket(order) === "delivery");
    const shippedNotDeliveredOrders = filteredMetricOrders.filter((order) => isInTransit(order) && !isDelivered(order) && !isReturned(order));
    const totalPieces = revenueOrders.reduce((sum, order) => {
      const items = getItems(order);
      return sum + items.reduce((itemSum, item) => itemSum + getItemRecordedQuantity(item), 0);
    }, 0);
    const awaitingPaymentOrders = filteredMetricOrders.filter((order) => !isConfirmed(order) && !isReturned(order));
    const paidOnlineOrders = revenueOrders.filter((order) => ["card", "instapay"].includes(getPaymentBucket(order)));
    const codRevenueOrders = revenueOrders.filter((order) => getPaymentBucket(order) === "cod");
    const paidOnlineValue = paidOnlineOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const codToCollectValue = codRevenueOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const aramexBlockedValue = filteredMetricOrders
      .filter((order) => getAramexError(order) || needsAramex(order))
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
      awaitingPaymentOrders: awaitingPaymentOrders.length,
      averageOrderValue: revenueOrders.length ? collectedRevenue / revenueOrders.length : 0,
      paidOnlineOrders: paidOnlineOrders.length,
      paidOnlineValue,
      codToCollectOrders: codRevenueOrders.length,
      codToCollectValue,
      aramexBlockedValue,
      missingTotalOrders: missingTotalOrders.length,
      missingDateOrders: missingDateOrders.length,
      missingCustomerOrders: missingCustomerOrders.length,
      missingItemsOrders: missingItemsOrders.length,
      cardOrders: cardOrders.length,
      codOrders: codOrders.length,
      instapayOrders: instapayOrders.length,
      aramexFailed: aramexFailed.length,
      aramexMissing: aramexMissing.length,
      aramexSynced: aramexSynced.length,
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

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return filteredMetricOrders.filter((order) => {
      const customer = getCustomer(order);
      const searchable = [
        getOrderRef(order),
        getString(customer.first_name),
        getString(customer.phone),
        getString(customer.email),
        getString(customer.city),
        getTrackingNumber(order),
      ].join(" ").toLowerCase();

      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;

      return true;
    });
  }, [filteredMetricOrders, query]);

  const operations = useMemo(() => {
    const confirmedOrders = filteredMetricOrders.filter(isConfirmed);
    const revenueOrders = confirmedOrders.filter((order) => !isReturned(order));
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
        const name = getString(item.name || item.title || item.slug || item.id) || "Unknown product";
        const qty = getItemRecordedQuantity(item);
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

    const aramexAttention = filteredMetricOrders
      .filter((order) => getAramexError(order) || needsAramex(order))
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
      { label: "Missing Aramex", orders: filteredMetricOrders.filter(needsAramex).length, value: filteredMetricOrders.filter(needsAramex).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-amber-50 text-amber-800" },
      { label: "Aramex failed", orders: filteredMetricOrders.filter((order) => Boolean(getAramexError(order))).length, value: filteredMetricOrders.filter((order) => Boolean(getAramexError(order))).reduce((sum, order) => sum + getAmount(order), 0), tone: "bg-orange-50 text-orange-800" },
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
      aramexAttention,
      instapayAttention,
      returnsAttention,
      fulfillmentRows,
      notificationRows,
      codDeliveredOrders: codDelivered.length,
      codDeliveredValue: codDelivered.reduce((sum, order) => sum + getAmount(order), 0),
      codPendingCollectionOrders: codInTransit.length,
      codPendingCollectionValue: codInTransit.reduce((sum, order) => sum + getAmount(order), 0),
      attentionCount: aramexAttention.length + instapayAttention.length + returnsAttention.length,
    };
  }, [filteredMetricOrders]);

  const financeLedger = useMemo(() => {
    return filteredMetricOrders
      .map((order) => {
        const amount = getAmount(order);
        const bucket = getPaymentBucket(order);
        const returned = isReturned(order);
        const confirmed = isConfirmed(order);
        const aramexIssue = Boolean(getAramexError(order) || needsAramex(order));

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

        if (aramexIssue && !returned) {
          explanation += " Aramex needs attention before fulfillment is clean.";
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
          aramexIssue,
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
        aramexIssues: number;
      }
    >();

    filteredMetricOrders.forEach((order) => {
      const date = getOrderDate(order);
      const key = date ? date.toISOString().slice(0, 10) : "No date";
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
          aramexIssues: 0,
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
      if (getAramexError(order) || needsAramex(order)) row.aramexIssues += 1;
      dayMap.set(key, row);
    });

    filteredExpenses.forEach((expense) => {
      const date = getExpenseDate(expense);
      const key = date ? date.toISOString().slice(0, 10) : "No date";
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
          aramexIssues: 0,
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
        label: "Aramex attention",
        value: stats.aramexFailed + stats.aramexMissing,
        detail: "Orders with failed or missing shipment tracking need admin review.",
        tone: stats.aramexFailed + stats.aramexMissing ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Pending approvals",
        value: stats.pendingInstaPay,
        detail: "InstaPay orders waiting approval are not confirmed yet.",
        tone: stats.pendingInstaPay ? "bg-yellow-50 text-yellow-800" : "bg-emerald-50 text-emerald-700",
      },
    ];
  }, [stats.aramexFailed, stats.aramexMissing, stats.pendingInstaPay]);

  const ordersPageCount = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const safeOrdersPage = Math.min(ordersPage, ordersPageCount);
  const paginatedOrders = filteredOrders.slice(
    (safeOrdersPage - 1) * ordersPageSize,
    safeOrdersPage * ordersPageSize,
  );

  return (
    <main className="min-h-screen bg-[#F4EFE8] px-4 py-6 text-[#0F1A26] sm:px-6 lg:px-8" dir="ltr">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-[#0F1A26] p-6 text-white shadow-2xl shadow-[#0F1A26]/15 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">natOnat Admin</p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">Orders & Money Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/60">
                Track sales, payment methods, InstaPay approvals, Aramex shipment gaps, returns, and net revenue from one admin-only view.
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

        {aramexSyncMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {aramexSyncMessage}
          </div>
        )}

        {!savedToken ? (
          <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#EEBC3F]">Login required</p>
            <h2 className="mt-3 text-2xl font-black">Enter the admin username and password to load the dashboard.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-[#0F1A26]/55">
              Orders, finance, Aramex sync, and inventory data are hidden until you sign in.
            </p>
          </section>
        ) : (
          <>
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {([
              { id: "finance", label: "Finance", sub: "Revenue, discounts, returns", icon: BarChart3 },
              { id: "orders", label: "Orders", sub: "Full order lifecycle", icon: ClipboardList },
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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1A26]/45">Dashboard period</p>
              <p className="mt-1 text-lg font-black">{dateRange.label} · {visibleOrders.length} orders in view</p>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <select
                value={datePreset}
                onChange={(event) => setDatePreset(event.target.value as DatePreset)}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
              {datePreset === "custom" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(event) => setCustomDateFrom(event.target.value)}
                    className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
                  />
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(event) => setCustomDateTo(event.target.value)}
                    className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
                  />
                </div>
              )}
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All payments ({visibleOrders.length})</option>
                {orderFilterOptions.payments.map(([bucket, count]) => (
                  <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
                ))}
              </select>
              <select
                value={deliveryFilter}
                onChange={(event) => setDeliveryFilter(event.target.value)}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All delivery ({visibleOrders.length})</option>
                {orderFilterOptions.deliveries.map(([bucket, count]) => (
                  <option key={bucket} value={bucket}>{bucket.replaceAll("_", " ")} ({count})</option>
                ))}
              </select>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All cities ({visibleOrders.length})</option>
                {orderFilterOptions.cities.map(([key, row]) => (
                  <option key={key} value={key}>{row.label} ({row.count})</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
              >
                <option value="all">All statuses ({visibleOrders.length})</option>
                <option value="confirmed">Confirmed / paid ({visibleOrders.filter(isConfirmed).length})</option>
                <option value="returned">Returned / cancelled ({visibleOrders.filter(isReturned).length})</option>
                <option value="pending_instapay">Pending InstaPay ({visibleOrders.filter(isPendingInstaPay).length})</option>
                <option value="aramex_missing">Missing Aramex ({visibleOrders.filter(needsAramex).length})</option>
                <option value="aramex_failed">Aramex failed ({visibleOrders.filter((order) => Boolean(getAramexError(order))).length})</option>
                {orderFilterOptions.statuses.map(([status, count]) => (
                  <option key={status} value={`raw:${status}`}>{status.replaceAll("_", " ")} ({count})</option>
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
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#0F1A26]/10 px-4 text-sm font-black text-[#0F1A26]/65 transition hover:bg-[#F8F6F3]"
                >
                  Reset filters
                </button>
              )}
              <button
                onClick={exportOrdersCsv}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-[#0F1A26]/45">
            Showing {filteredMetricOrders.length} of {visibleOrders.length} orders after filters. All finance and operations cards follow these filters.
          </p>
        </section>

        {activeTab === "finance" && (
          <>
        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              eyebrow="Finance Control"
              title="Money view with real order-source numbers"
              description="These cards are calculated from confirmed orders returned by the orders API. Returned or cancelled Aramex statuses are deducted from net revenue, while discounts and shipping are shown separately."
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
            <DataPill label="data source" value="Google Sheets orders webhook + in-memory fallback for recent orders" />
            <DataPill label="auto refresh" value="Every 60 seconds while the admin page is open" />
            <DataPill label="aramex sync" value="Manual Sync Aramex button updates shipment status on stored orders" />
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Orders" value={String(stats.totalOrders)} subtitle={`${stats.confirmedOrders} confirmed / ${stats.unconfirmedOrders} pending`} icon={ClipboardList} tone="dark" />
          <StatCard title="Pieces Sold" value={String(stats.totalPieces)} subtitle="Confirmed non-returned order items" icon={PackageCheck} tone="green" />
          <StatCard title="Pickup Orders" value={String(stats.pickupOrders)} subtitle={`${stats.deliveryOrders} delivery orders`} icon={Truck} tone="gold" />
          <StatCard title="Shipped Not Delivered" value={String(stats.shippedNotDeliveredOrders)} subtitle={money.format(stats.shippedNotDeliveredValue)} icon={AlertTriangle} tone={stats.shippedNotDeliveredOrders ? "gold" : "green"} />
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
                  This separates collected online money, COD money still to collect, pending/unapproved money, and value blocked by fulfillment issues.
                </p>
              </div>
              <Banknote className="h-8 w-8 shrink-0 text-[#EEBC3F]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DataPill label="paid online now" value={`${money.format(stats.paidOnlineValue)} / ${stats.paidOnlineOrders} orders`} />
              <DataPill label="cod expected to collect" value={`${money.format(stats.codToCollectValue)} / ${stats.codToCollectOrders} orders`} />
              <DataPill label="pending or unpaid" value={`${money.format(stats.unconfirmedValue)} / ${stats.unconfirmedOrders} orders`} />
              <DataPill label="returned or cancelled" value={`-${money.format(stats.returnedValue)}`} />
              <DataPill label="blocked by aramex attention" value={`${money.format(stats.aramexBlockedValue)} / ${stats.aramexFailed + stats.aramexMissing} orders`} />
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
                Aramex attention means money or fulfillment can be at risk because tracking is missing, failed, returned, or blocked.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Gross Sales" value={money.format(stats.grossSales)} subtitle={`${stats.totalOrders} total orders`} icon={Banknote} tone="gold" />
          <StatCard title="Net Revenue" value={money.format(stats.netRevenue)} subtitle="Confirmed/paid minus returned orders" icon={CheckCircle2} tone="green" />
          <StatCard title="Returned / Cancelled" value={money.format(stats.returnedValue)} subtitle="Auto deducted from revenue view" icon={Undo2} tone="red" />
          <StatCard title="Discounts" value={money.format(stats.discounts)} subtitle={`Shipping collected: ${money.format(stats.shippingCollected)}`} icon={CreditCard} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="All Orders Value" value={money.format(stats.allOrdersValue)} subtitle="Raw total value for current period" icon={ClipboardList} tone="dark" />
          <StatCard title="Unconfirmed Value" value={money.format(stats.unconfirmedValue)} subtitle={`${stats.unconfirmedOrders} pending/unpaid orders`} icon={AlertTriangle} tone={stats.unconfirmedOrders ? "gold" : "dark"} />
          <StatCard title="Average Order Value" value={money.format(stats.averageOrderValue)} subtitle="Confirmed non-returned orders" icon={BarChart3} tone="dark" />
          <StatCard title="Data Gaps" value={String(stats.missingTotalOrders + stats.missingDateOrders + stats.missingItemsOrders + stats.missingCustomerOrders)} subtitle="Missing date/total/items/customer fields" icon={ShieldCheck} tone={stats.missingTotalOrders + stats.missingDateOrders + stats.missingItemsOrders + stats.missingCustomerOrders ? "red" : "green"} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="COD Orders" value={String(stats.codOrders)} icon={Truck} />
          <StatCard title="Card Orders" value={String(stats.cardOrders)} icon={CreditCard} />
          <StatCard title="InstaPay Orders" value={String(stats.instapayOrders)} subtitle={`${stats.pendingInstaPay} waiting approval`} icon={WalletCards} tone={stats.pendingInstaPay ? "gold" : "dark"} />
          <StatCard title="Aramex Attention" value={String(stats.aramexFailed + stats.aramexMissing)} subtitle={`${stats.aramexSynced} synced / ${stats.aramexFailed} failed / ${stats.aramexMissing} missing`} icon={AlertTriangle} tone={stats.aramexFailed + stats.aramexMissing ? "red" : "green"} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Finance equation</h2>
            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">How the visible finance numbers are currently calculated.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DataPill label="confirmed subtotal" value={money.format(stats.grossSales)} />
              <DataPill label="order/code discounts" value={`-${money.format(stats.orderDiscounts)}`} />
              <DataPill label="payment discounts" value={`-${money.format(stats.paymentDiscounts)}`} />
              <DataPill label="shipping collected" value={money.format(stats.shippingCollected)} />
              <DataPill label="returned/cancelled deduction" value={`-${money.format(stats.returnedValue)}`} />
              <DataPill label="net revenue shown" value={money.format(stats.netRevenue)} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Data quality checks</h2>
            <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">If a finance number looks empty, this tells you what data is missing from the order source.</p>
            <div className="mt-4 grid gap-3">
              <DataPill label="orders missing total" value={String(stats.missingTotalOrders)} />
              <DataPill label="orders missing date" value={String(stats.missingDateOrders)} />
              <DataPill label="orders missing items" value={String(stats.missingItemsOrders)} />
              <DataPill label="orders missing customer" value={String(stats.missingCustomerOrders)} />
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
              Day-by-day finance movement so the admin can reconcile money, orders, discounts, returns, and Aramex issues.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#0F1A26]/10 text-left text-sm">
              <thead className="bg-[#F8F6F3] text-xs uppercase tracking-[0.12em] text-[#0F1A26]/45">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Confirmed</th>
                  <th className="px-5 py-3">Gross</th>
                  <th className="px-5 py-3">Discounts</th>
                  <th className="px-5 py-3">Shipping</th>
                  <th className="px-5 py-3">Returns</th>
                  <th className="px-5 py-3">Expenses</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Net after expenses</th>
                  <th className="px-5 py-3">Aramex issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {dailyClose.length ? dailyClose.map((day) => (
                  <tr key={day.date}>
                    <td className="px-5 py-4 font-black">{day.date}</td>
                    <td className="px-5 py-4 font-bold">{day.orders}</td>
                    <td className="px-5 py-4 font-bold">{day.confirmed}</td>
                    <td className="px-5 py-4">{money.format(day.gross)}</td>
                    <td className="px-5 py-4 text-emerald-700">-{money.format(day.discounts)}</td>
                    <td className="px-5 py-4">{money.format(day.shipping)}</td>
                    <td className="px-5 py-4 text-rose-700">{day.returned}</td>
                    <td className="px-5 py-4 text-rose-700">-{money.format(day.expenses)}</td>
                    <td className="px-5 py-4 font-black">{money.format(day.net)}</td>
                    <td className="px-5 py-4 font-black">{money.format(day.netAfterExpenses)}</td>
                    <td className="px-5 py-4 font-black">{day.aramexIssues}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={11} className="px-5 py-8 text-center text-sm font-bold text-[#0F1A26]/45">
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
                Aramex state grouped with order value, so returns and shipment issues are visible financially.
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
                      <p className="mt-1 text-xs font-bold text-[#0F1A26]/40">{getCreatedAt(entry.order) || "No date"}</p>
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
              <p className="text-xs font-bold text-[#0F1A26]/45">Based on confirmed non-returned order lines.</p>
            </div>
            <div className="divide-y divide-[#0F1A26]/8">
              {operations.topProducts.length ? operations.topProducts.map((product, index) => (
                <div key={product.name} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F8F6F3] text-xs font-black">{index + 1}</span>
                  <div>
                    <p className="font-black">{product.name}</p>
                    <p className="text-xs font-bold text-[#0F1A26]/45">
                      {product.qty} units · {product.ordersCount} orders
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-[#0F1A26]/45">
                      Recorded line revenue: {money.format(product.directRevenue)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black">{money.format(product.revenue)}</p>
                    <p className="text-[11px] font-bold text-[#0F1A26]/40">
                      from item line totals only
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
              <p className="text-xs font-bold text-[#0F1A26]/45">Useful for ads, shipping focus, and Aramex issue tracking.</p>
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
                    Live CMS sync: {new Date(inventoryFetchedAt).toLocaleString("en-EG")}
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
              Live CMS sync: {new Date(expensesFetchedAt).toLocaleString("en-EG")}
            </p>
          )}
          <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F1A26]/35" />
              <input
                value={expenseQuery}
                onChange={(event) => setExpenseQuery(event.target.value)}
                placeholder="Search title, vendor, order ref, notes..."
                className="h-11 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] ps-11 pe-4 text-sm font-bold outline-none focus:border-[#EEBC3F]"
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
            description="This queue highlights operational risk: InstaPay orders waiting approval, Aramex failures or missing tracking, and returned/cancelled orders that affect finance."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
                <h3 className="font-black text-rose-800">Aramex issues</h3>
                <span className="rounded-full bg-rose-200 px-3 py-1 text-xs font-black text-rose-900">{operations.aramexAttention.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {operations.aramexAttention.length ? operations.aramexAttention.map((order) => (
                  <div key={getOrderRef(order)} className="rounded-2xl bg-white p-3 text-sm font-bold shadow-sm">
                    <button onClick={() => setSelectedOrder(order)} className="block w-full text-left">
                      <span className="block font-black">{getOrderRef(order)}</span>
                      <span className="line-clamp-2 text-[#0F1A26]/50">{getAramexError(order) || "Missing Aramex tracking"}</span>
                    </button>
                    {(getTrackingNumber(order) || getAramexError(order)) && (
                      <button
                        onClick={() => void syncOneAramex(order)}
                        disabled={actionLoadingRef === `aramex:${getOrderRef(order)}`}
                        className="mt-3 h-9 w-full rounded-xl border border-[#0F1A26]/10 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {actionLoadingRef === `aramex:${getOrderRef(order)}` ? "Syncing..." : "Sync tracking"}
                      </button>
                    )}
                  </div>
                )) : <p className="text-sm font-bold text-rose-800/60">No Aramex issues.</p>}
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
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#0F1A26]/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F1A26]/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order ref, phone, customer, city, tracking..."
                className="h-12 w-full rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] ps-11 pe-4 text-sm font-bold outline-none focus:border-[#EEBC3F]"
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
              <option value="confirmed">Confirmed / paid ({visibleOrders.filter(isConfirmed).length})</option>
              <option value="pending_instapay">Pending InstaPay ({visibleOrders.filter(isPendingInstaPay).length})</option>
              <option value="aramex_missing">Missing Aramex ({visibleOrders.filter(needsAramex).length})</option>
              <option value="aramex_failed">Aramex failed ({visibleOrders.filter((order) => Boolean(getAramexError(order))).length})</option>
              <option value="returned">Returned / cancelled ({visibleOrders.filter(isReturned).length})</option>
              {orderFilterOptions.statuses.map(([status, count]) => (
                <option key={status} value={`raw:${status}`}>{status.replaceAll("_", " ")} ({count})</option>
              ))}
            </select>
            <button
              onClick={() => refreshAll()}
              disabled={loading || inventoryLoading || aramexSyncing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F1A26] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading || inventoryLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={syncAramex}
              disabled={loading || aramexSyncing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EEBC3F] px-5 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Truck className={`h-4 w-4 ${aramexSyncing ? "animate-pulse" : ""}`} />
              Sync Aramex
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#0F1A26]/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#0F1A26]/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-black">Orders</h2>
              <p className="text-xs font-bold text-[#0F1A26]/45">
                {filteredOrders.length} visible orders · page {safeOrdersPage} of {ordersPageCount}
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
                  <th className="px-5 py-3">Aramex</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {paginatedOrders.map((order, index) => {
                  const customer = getCustomer(order);
                  const tracking = getTrackingNumber(order);
                  const aramexStatus = getAramexStatus(order);
                  const aramexUpdate = getAramexLatestUpdate(order);
                  const aramexSyncedAt = getAramexSyncedAt(order);
                  const aramexError = getAramexError(order);
                  const orderRef = getOrderRef(order);
                  const rowTone = isReturned(order)
                    ? "bg-rose-50/70"
                    : isPendingInstaPay(order)
                      ? "bg-amber-50/80"
                      : aramexError || needsAramex(order)
                        ? "bg-orange-50/70"
                        : "";

                  return (
                    <tr key={`${orderRef}-${index}`} className={rowTone}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black text-[#0F1A26]">{orderRef || "No ref"}</p>
                        <p className="mt-1 text-xs font-bold text-[#0F1A26]/45">{getString(order.source)}</p>
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
                            {aramexStatus && <p className="mt-1 text-xs font-black text-[#0F1A26]">{aramexStatus}</p>}
                            {aramexUpdate && <p className="mt-1 max-w-[260px] text-xs font-semibold text-[#0F1A26]/55">{aramexUpdate}</p>}
                            {aramexSyncedAt && <p className="mt-1 text-[11px] font-bold text-[#0F1A26]/35">Synced {aramexSyncedAt}</p>}
                          </>
                        ) : (
                          <p className="font-bold text-[#0F1A26]/40">No tracking</p>
                        )}
                        {aramexError && <p className="mt-1 max-w-[260px] text-xs font-bold text-rose-600">{aramexError}</p>}
                        {needsAramex(order) && !aramexError && (
                          <p className="mt-1 text-xs font-bold text-orange-600">Needs Aramex shipment</p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-black">{getStatus(order) || "-"}</p>
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
                        {(tracking || getAramexError(order)) && (
                          <button
                            onClick={() => void syncOneAramex(order)}
                            disabled={actionLoadingRef === `aramex:${orderRef}`}
                            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#0F1A26]/10 bg-white px-4 text-xs font-black text-[#0F1A26] transition hover:-translate-y-0.5 disabled:opacity-60"
                          >
                            <RefreshCw className={`h-4 w-4 ${actionLoadingRef === `aramex:${orderRef}` ? "animate-spin" : ""}`} />
                            Sync
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
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onApproveInstaPay={(order) => void approveInstaPayOrder(order)}
          onStatusAction={(order, action) => void updateOrderStatus(order, action)}
          actionLoadingRef={actionLoadingRef}
        />
      )}
    </main>
  );
}
