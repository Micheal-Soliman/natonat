import { NextResponse } from "next/server";
import { sendOrderEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { getCatalogProducts } from "@/lib/sanity-products";
import type { Product } from "@/lib/products";

type OrderLogBody = Record<string, unknown>;
type OrderHistoryEntry = {
  status: string;
  timestamp: string;
  source: unknown;
  event_key?: string;
};

type StoredOrder = OrderLogBody & {
  status?: string;
  history?: OrderHistoryEntry[];
  aramex?: {
    trackingNumber?: string;
  };
};

function getNestedString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return "";

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);

  return "";
}

function getOrderEventKey(body: OrderLogBody, status: string) {
  const source = typeof body.source === "string" ? body.source : "manual";
  const payment = body.payment;
  const aramex = body.aramex;
  const transactionId =
    getNestedString(payment, "transaction_id") ||
    getNestedString(payment, "id");
  const trackingNumber = getNestedString(aramex, "trackingNumber");
  return [
    source,
    status,
    transactionId,
    trackingNumber,
  ]
    .filter(Boolean)
    .join(":");
}

function hasCheckoutEmailAlreadySent(existing: StoredOrder | undefined) {
  return Boolean(
    existing?.email_sent_at ||
      existing?.history?.some((entry) => entry.source === "email_notification")
  );
}

function getOrderStatusValue(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function shouldSendOrderEmail(order: StoredOrder) {
  const source = getOrderStatusValue(order.source);
  const status = getOrderStatusValue(order.status);
  const paymentStatus = getOrderStatusValue(order.payment_status);
  const deliveryMethod = getOrderStatusValue(order.delivery_method);

  if (status === "created" || status === "pending" || paymentStatus === "pending") {
    return false;
  }

  if (source === "checkout") {
    return status === "confirmed" || paymentStatus === "cash on delivery";
  }

  if (source === "paymob_webhook_aramex") {
    return paymentStatus === "paid";
  }

  if (source === "paymob_webhook") {
    return paymentStatus === "paid" && deliveryMethod !== "delivery";
  }

  return false;
}

type OrderItem = {
  line_id?: string;
  id?: number;
  name?: string;
  slug?: string;
  type?: string;
  color?: string;
  size?: string;
  quantity?: number;
  price?: number;
  price_egp?: number;
  unit_price_egp?: number;
  line_total_egp?: number;
  isBundle?: boolean;
  bundleKey?: string;
  bundleSelections?: BundleOrderItem[];
  [key: string]: unknown;
};

type BundleOrderItem = {
  selection_id?: string;
  bundle_index?: number;
  productId?: number;
  productName?: string;
  productSlug?: string;
  productType?: string;
  label?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
  unit_price_egp?: number;
  line_total_egp?: number;
  originalPrice?: number;
  [key: string]: unknown;
};

// Simple in-memory store for orders (in production, use a database like Redis, Supabase, etc.)
const orderStore = new Map<string, OrderLogBody>();

function getProductColor(product: Product | undefined, selectedColor?: string) {
  return (
    product?.colors?.find((variant) => variant.id === selectedColor)?.name ||
    selectedColor ||
    product?.color
  );
}

function getOrderLineId(item: OrderItem) {
  return [
    item.id,
    item.slug,
    item.size || "no-size",
    item.color || "no-color",
    item.isBundle ? item.bundleKey || "bundle" : "",
  ]
    .filter(Boolean)
    .join(":");
}

function buildFlatOrderItems(items: OrderItem[]) {
  return items.flatMap((item, itemIndex) => {
    const baseRow = {
      row_type: item.isBundle ? "bundle" : "product",
      item_index: itemIndex + 1,
      line_id: item.line_id,
      product_id: item.id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      size: item.size,
      color: item.color,
      quantity: item.quantity || 1,
      unit_price_egp: item.unit_price_egp ?? item.price_egp ?? item.price,
      line_total_egp: item.line_total_egp,
    };

    const bundleRows = (item.bundleSelections || []).map((selection) => ({
      row_type: "bundle_selection",
      parent_line_id: item.line_id,
      item_index: itemIndex + 1,
      bundle_index: selection.bundle_index,
      selection_id: selection.selection_id,
      product_id: selection.productId,
      name: selection.productName,
      slug: selection.productSlug,
      type: selection.productType,
      label: selection.label,
      size: selection.size,
      color: selection.color,
      quantity: selection.quantity || 1,
      unit_price_egp: selection.unit_price_egp ?? selection.price,
      line_total_egp: selection.line_total_egp,
    }));

    return [baseRow, ...bundleRows];
  });
}

async function enrichOrderItemsFromCms(body: OrderLogBody) {
  if (!Array.isArray(body.items) || body.items.length === 0) return body;

  const catalog = await getCatalogProducts();
  const productById = new Map(catalog.map((product) => [product.id, product]));

  const items = (body.items as OrderItem[]).map((item) => {
    const product = typeof item.id === "number" ? productById.get(item.id) : undefined;
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price_egp ?? item.price_egp ?? item.price ?? product?.price ?? 0);
    const lineId = item.line_id || getOrderLineId(item);

    const bundleSelections = item.bundleSelections?.map((selection, index) => {
      const selectedProduct =
        typeof selection.productId === "number"
          ? productById.get(selection.productId)
          : undefined;
      const selectedSizePrice =
        selection.size && selectedProduct?.sizePrices
          ? selectedProduct.sizePrices[
              selection.size as keyof typeof selectedProduct.sizePrices
            ]
          : undefined;
      const selectionQuantity = Number(selection.quantity || 1);
      const selectionPrice = Number(
        selection.unit_price_egp ??
          selection.price ??
          selectedSizePrice?.price ??
          selectedProduct?.price ??
          0
      );

      return {
        ...selection,
        selection_id: selection.selection_id || `${lineId}:selection:${index + 1}`,
        bundle_index: selection.bundle_index || index + 1,
        productName: selectedProduct?.name || selection.productName,
        productSlug: selectedProduct?.slug || selection.productSlug,
        productType: selectedProduct?.type || selection.productType,
        label: product?.bundleItems?.[index]?.label || selection.label,
        color: getProductColor(selectedProduct, selection.color),
        price: selectionPrice,
        unit_price_egp: selectionPrice,
        line_total_egp: selection.line_total_egp ?? selectionPrice * selectionQuantity,
        originalPrice:
          selection.originalPrice ??
          selectedSizePrice?.originalPrice ??
          selectedProduct?.originalPrice,
      };
    });

    return {
      ...item,
      line_id: lineId,
      name: product?.name || item.name,
      slug: product?.slug || item.slug,
      type: product?.type || item.type,
      color: getProductColor(product, item.color),
      price_egp: item.price_egp ?? unitPrice,
      unit_price_egp: unitPrice,
      line_total_egp: item.line_total_egp ?? unitPrice * quantity,
      currency: item.currency || "EGP",
      bundleSelections,
      catalog_source: product ? "sanity" : "order_payload",
    };
  });

  return {
    ...body,
    items,
    items_flat: buildFlatOrderItems(items),
    catalog_enriched_at: new Date().toISOString(),
  };
}

async function fetchOrderFromGoogleSheets(orderRef: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    success?: boolean;
    order?: OrderLogBody;
  };

  return data.success && data.order ? data.order : null;
}

// GET endpoint to retrieve order by reference
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const order_ref = searchParams.get("order_ref");

  if (!order_ref) {
    return NextResponse.json(
      { error: "Missing order_ref parameter" },
      { status: 400 }
    );
  }

  const order = orderStore.get(order_ref) || await fetchOrderFromGoogleSheets(order_ref);
  
  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    order,
  });
}

export async function POST(req: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not set" },
      { status: 500 }
    );
  }

  let body: OrderLogBody;
  try {
    body = (await req.json()) as OrderLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  body = await enrichOrderItemsFromCms(body);

  // Store in memory for retrieval by webhook
  const orderRef = body.order_ref as string | undefined;
  if (orderRef) {
    const existing =
      (orderStore.get(orderRef) as StoredOrder | undefined) ||
      ((await fetchOrderFromGoogleSheets(orderRef)) as StoredOrder | null) ||
      undefined;
    
    // Build status history
    const newStatus = (body.status || existing?.status || "confirmed") as string;
    const eventKey = getOrderEventKey(body, newStatus);
    const historyEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      source: body.source || "manual",
      event_key: eventKey || undefined,
    };

    const existingHistory = existing?.history || [];
    const hasDuplicateHistoryEvent =
      eventKey &&
      existingHistory.some((entry) => entry.event_key && entry.event_key === eventKey);
    const history = hasDuplicateHistoryEvent
      ? existingHistory
      : [...existingHistory, historyEntry];
    
    // Add Aramex tracking link if tracking number exists
    const bodyAramex = body.aramex as StoredOrder["aramex"] | undefined;
    const trackingNumber = bodyAramex?.trackingNumber || existing?.aramex?.trackingNumber;
    const trackingLink = trackingNumber 
      ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`
      : "";

    let updatedOrder = {
      ...existing,
      ...body,
      history,
      tracking_link: trackingLink
    } as StoredOrder;

    // Send email notification only after the order is genuinely confirmable.
    // Card orders are first stored as created/Pending before Paymob redirects;
    // their email waits for a successful Paymob webhook.
    if (shouldSendOrderEmail(updatedOrder) && !hasCheckoutEmailAlreadySent(existing)) {
      const emailHistoryEntry: OrderHistoryEntry = {
        status: "email_sent",
        timestamp: new Date().toISOString(),
        source: "email_notification",
        event_key: `email_notification:${orderRef}`,
      };

      updatedOrder = {
        ...updatedOrder,
        email_sent_at: emailHistoryEntry.timestamp,
        history: [...history, emailHistoryEntry],
      };

      // Don't await to avoid blocking the response
      sendOrderEmail(updatedOrder).catch(err => console.error("Failed to send order email:", err));
      sendCustomerConfirmationEmail(updatedOrder).catch(err => console.error("Failed to send customer confirmation email:", err));
    }

    orderStore.set(orderRef, updatedOrder);

    // Forward the ENTIRE updated order to Google Sheets
    body = updatedOrder;

    // Clean up old orders after 48 hours (extended to cover weekend payments)
    setTimeout(() => {
      orderStore.delete(orderRef);
    }, 48 * 60 * 60 * 1000);
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to write to Google Sheets", status: res.status, data: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: text, order_ref: orderRef });
}
