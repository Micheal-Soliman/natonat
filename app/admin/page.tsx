"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
  Truck,
  Undo2,
  WalletCards,
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

type AdminInventoryItem = {
  id: number;
  slug: string;
  name: string;
  type?: string;
  category?: string | string[];
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  stockQuantity?: number | null;
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

type AramexSyncResponse = {
  success?: boolean;
  synced?: number;
  failed?: number;
  checked?: number;
  error?: string;
};

const money = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

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
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function getDiscount(order: AdminOrder) {
  return (
    getNumber(order.discount_egp || order["Discount (EGP)"]) +
    getNumber(order.payment_discount_egp || order["Payment Discount (EGP)"])
  );
}

function getPaymentMethod(order: AdminOrder) {
  return getString(order.payment_method || order["Payment Method"]).toLowerCase();
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

function isReturned(order: AdminOrder) {
  const text = `${getStatus(order)} ${getPaymentStatus(order)} ${getAramexStatus(order)} ${getAramexLatestUpdate(order)}`.toLowerCase();
  return text.includes("return") || text.includes("rto") || text.includes("cancel");
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
    getString(order.delivery_method || order["Delivery Method"]).toLowerCase() === "delivery" &&
    isConfirmed(order) &&
    !isPendingInstaPay(order) &&
    !getTrackingNumber(order)
  );
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

export default function AdminDashboardPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [inventoryFetchedAt, setInventoryFetchedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [aramexSyncing, setAramexSyncing] = useState(false);
  const [aramexSyncMessage, setAramexSyncMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const stored = window.localStorage.getItem("natonat-admin-token") || "";
    setToken(stored);
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
        throw new Error(data.error || "Could not load orders");
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

  const refreshAll = (activeToken = savedToken) => {
    void loadOrders(activeToken);
    void loadInventory(activeToken);
  };

  const saveTokenAndLoad = () => {
    window.localStorage.setItem("natonat-admin-token", token);
    setSavedToken(token);
    refreshAll(token);
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

  useEffect(() => {
    if (!savedToken && process.env.NODE_ENV === "production") return;
    refreshAll(savedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  useEffect(() => {
    if (!savedToken && process.env.NODE_ENV === "production") return;

    const timer = window.setInterval(() => {
      refreshAll(savedToken);
    }, 60_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => !isReturned(order));
    const confirmedOrders = activeOrders.filter(isConfirmed);
    const grossSales = orders.reduce((sum, order) => sum + getAmount(order), 0);
    const netRevenue = confirmedOrders.reduce((sum, order) => sum + getAmount(order), 0);
    const returnedValue = orders.filter(isReturned).reduce((sum, order) => sum + getAmount(order), 0);
    const discounts = orders.reduce((sum, order) => sum + getDiscount(order), 0);
    const shippingCollected = orders.reduce((sum, order) => sum + getShipping(order), 0);
    const cardOrders = orders.filter((order) => getPaymentMethod(order).includes("card") || getPaymentMethod(order).includes("paymob"));
    const codOrders = orders.filter((order) => getPaymentMethod(order) === "cod");
    const instapayOrders = orders.filter((order) => getPaymentMethod(order) === "instapay");
    const aramexFailed = orders.filter((order) => getAramexError(order));
    const aramexMissing = orders.filter(needsAramex);
    const aramexSynced = orders.filter((order) => getAramexStatus(order));
    const pendingInstaPay = orders.filter(isPendingInstaPay);

    return {
      grossSales,
      netRevenue,
      returnedValue,
      discounts,
      shippingCollected,
      totalOrders: orders.length,
      cardOrders: cardOrders.length,
      codOrders: codOrders.length,
      instapayOrders: instapayOrders.length,
      aramexFailed: aramexFailed.length,
      aramexMissing: aramexMissing.length,
      aramexSynced: aramexSynced.length,
      pendingInstaPay: pendingInstaPay.length,
    };
  }, [orders]);

  const inventoryStats = useMemo(() => {
    const lowItems = inventory.filter((item) => isInventoryLow(item) && !isInventoryOut(item));
    const outItems = inventory.filter(isInventoryOut);
    const totalKnownUnits = inventory.reduce((sum, item) => {
      const rows = getSizeRows(item);
      const rowQuantity = rows.reduce(
        (rowSum, row) => rowSum + (typeof row.quantity === "number" && item.sizeStock?.[row.size.toLowerCase() as "s" | "m" | "l" | "xl"] ? row.quantity : 0),
        0,
      );
      return sum + (rowQuantity || (typeof item.stockQuantity === "number" ? item.stockQuantity : 0));
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

    return orders.filter((order) => {
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

      const method = getPaymentMethod(order);
      if (paymentFilter !== "all") {
        if (paymentFilter === "card" && !(method.includes("card") || method.includes("paymob"))) return false;
        if (paymentFilter !== "card" && method !== paymentFilter) return false;
      }

      if (statusFilter === "pending_instapay" && !isPendingInstaPay(order)) return false;
      if (statusFilter === "aramex_missing" && !needsAramex(order)) return false;
      if (statusFilter === "aramex_failed" && !getAramexError(order)) return false;
      if (statusFilter === "returned" && !isReturned(order)) return false;
      if (statusFilter === "confirmed" && !isConfirmed(order)) return false;

      return true;
    });
  }, [orders, paymentFilter, query, statusFilter]);

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
              <label className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Admin token</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  type="password"
                  placeholder="ADMIN_DASHBOARD_TOKEN"
                  className="h-11 min-w-[260px] rounded-xl border border-white/10 bg-white px-3 text-sm font-bold text-[#0F1A26] outline-none"
                />
                <button
                  onClick={saveTokenAndLoad}
                  className="h-11 rounded-xl bg-[#EEBC3F] px-5 text-sm font-black text-[#0F1A26] transition hover:-translate-y-0.5"
                >
                  Load
                </button>
              </div>
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

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Gross Sales" value={money.format(stats.grossSales)} subtitle={`${stats.totalOrders} total orders`} icon={Banknote} tone="gold" />
          <StatCard title="Net Revenue" value={money.format(stats.netRevenue)} subtitle="Confirmed/paid minus returned orders" icon={CheckCircle2} tone="green" />
          <StatCard title="Returned / Cancelled" value={money.format(stats.returnedValue)} subtitle="Auto deducted from revenue view" icon={Undo2} tone="red" />
          <StatCard title="Discounts" value={money.format(stats.discounts)} subtitle={`Shipping collected: ${money.format(stats.shippingCollected)}`} icon={CreditCard} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="COD Orders" value={String(stats.codOrders)} icon={Truck} />
          <StatCard title="Card Orders" value={String(stats.cardOrders)} icon={CreditCard} />
          <StatCard title="InstaPay Orders" value={String(stats.instapayOrders)} subtitle={`${stats.pendingInstaPay} waiting approval`} icon={WalletCards} tone={stats.pendingInstaPay ? "gold" : "dark"} />
          <StatCard title="Aramex Attention" value={String(stats.aramexFailed + stats.aramexMissing)} subtitle={`${stats.aramexSynced} synced / ${stats.aramexFailed} failed / ${stats.aramexMissing} missing`} icon={AlertTriangle} tone={stats.aramexFailed + stats.aramexMissing ? "red" : "green"} />
        </section>

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
              <option value="all">All payments</option>
              <option value="cod">COD</option>
              <option value="card">Card / Paymob</option>
              <option value="instapay">InstaPay</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-4 text-sm font-black outline-none"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed / paid</option>
              <option value="pending_instapay">Pending InstaPay</option>
              <option value="aramex_missing">Missing Aramex</option>
              <option value="aramex_failed">Aramex failed</option>
              <option value="returned">Returned / cancelled</option>
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
              <p className="text-xs font-bold text-[#0F1A26]/45">{filteredOrders.length} visible orders</p>
            </div>
            <PackageCheck className="h-6 w-6 text-[#EEBC3F]" />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1A26]/8">
                {filteredOrders.map((order, index) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
