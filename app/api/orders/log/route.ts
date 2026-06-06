import { NextResponse } from "next/server";
import { sendOrderEmail, sendCustomerConfirmationEmail } from "@/lib/email";
import { getCatalogProducts } from "@/lib/sanity-products";
import type { Product } from "@/lib/products";

type OrderLogBody = Record<string, unknown>;
type OrderHistoryEntry = {
  status: string;
  timestamp: string;
  source: unknown;
};

type StoredOrder = OrderLogBody & {
  status?: string;
  history?: OrderHistoryEntry[];
  aramex?: {
    trackingNumber?: string;
  };
};

type OrderItem = {
  id?: number;
  name?: string;
  slug?: string;
  type?: string;
  color?: string;
  size?: string;
  bundleSelections?: BundleOrderItem[];
  [key: string]: unknown;
};

type BundleOrderItem = {
  productId?: number;
  productName?: string;
  productSlug?: string;
  productType?: string;
  label?: string;
  size?: string;
  color?: string;
  price?: number;
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

async function enrichOrderItemsFromCms(body: OrderLogBody) {
  if (!Array.isArray(body.items) || body.items.length === 0) return body;

  const catalog = await getCatalogProducts();
  const productById = new Map(catalog.map((product) => [product.id, product]));

  const items = (body.items as OrderItem[]).map((item) => {
    const product = typeof item.id === "number" ? productById.get(item.id) : undefined;

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

      return {
        ...selection,
        productName: selectedProduct?.name || selection.productName,
        productSlug: selectedProduct?.slug || selection.productSlug,
        productType: selectedProduct?.type || selection.productType,
        label: product?.bundleItems?.[index]?.label || selection.label,
        color: getProductColor(selectedProduct, selection.color),
        price: selection.price ?? selectedSizePrice?.price ?? selectedProduct?.price,
        originalPrice:
          selection.originalPrice ??
          selectedSizePrice?.originalPrice ??
          selectedProduct?.originalPrice,
      };
    });

    return {
      ...item,
      name: product?.name || item.name,
      slug: product?.slug || item.slug,
      type: product?.type || item.type,
      color: getProductColor(product, item.color),
      bundleSelections,
      catalog_source: product ? "sanity" : "order_payload",
    };
  });

  return {
    ...body,
    items,
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

  return NextResponse.json(order);
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
    const existing = orderStore.get(orderRef) as StoredOrder | undefined;
    
    // Build status history
    const newStatus = (body.status || existing?.status || "confirmed") as string;
    const historyEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      source: body.source || "manual"
    };

    const history = existing?.history ? [...existing.history, historyEntry] : [historyEntry];
    
    // Add Aramex tracking link if tracking number exists
    const bodyAramex = body.aramex as StoredOrder["aramex"] | undefined;
    const trackingNumber = bodyAramex?.trackingNumber || existing?.aramex?.trackingNumber;
    const trackingLink = trackingNumber 
      ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`
      : "";

    const updatedOrder = { 
      ...existing, 
      ...body, 
      history,
      tracking_link: trackingLink 
    };

    orderStore.set(orderRef, updatedOrder);
    
    // Send email notification for new orders from checkout
    if (body.source === "checkout") {
      // Don't await to avoid blocking the response
      sendOrderEmail(updatedOrder).catch(err => console.error("Failed to send order email:", err));
      sendCustomerConfirmationEmail(updatedOrder).catch(err => console.error("Failed to send customer confirmation email:", err));
    }

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
