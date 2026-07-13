import { NextResponse } from "next/server";
import {
  sendOrderEmail,
  sendCustomerConfirmationEmail,
  sendInstapayApprovalEmail,
  sendInstapayPendingCustomerEmail,
} from "@/lib/email";
import { getCatalogProducts } from "@/lib/sanity-products";
import {
  adjustInventoryForConfirmedOrder,
  validateOrderInventory,
} from "@/lib/sanity-inventory";
import {
  ensureReferralRecordForOrder,
  markReferralConversionForOrder,
} from "@/lib/referrals";
import {
  fetchOrderFromDatabase,
  isOrderDatabaseConfigured,
  upsertOrderToDatabase,
} from "@/lib/order-database";
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
  inventory?: {
    status?: string;
    adjustedProducts?: number;
    reason?: string;
    updatedAt?: string;
  };
  instapay_proof_email_sent_at?: string;
  instapay_pending_customer_email_sent_at?: string;
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

  if (source === "paymob_webhook_aramex_failed") {
    return paymentStatus === "paid";
  }

  if (source === "paymob_webhook") {
    return paymentStatus === "paid" && deliveryMethod !== "delivery";
  }

  if (source === "instapay_admin_approved" || source === "admin_instapay_approved") {
    return paymentStatus === "paid";
  }

  return false;
}

function shouldSendInstapayApprovalEmail(order: StoredOrder) {
  const source = getOrderStatusValue(order.source);
  const status = getOrderStatusValue(order.status);
  const paymentMethod = getOrderStatusValue(order.payment_method);
  const paymentStatus = getOrderStatusValue(order.payment_status);

  return (
    source === "checkout_instapay_proof" &&
    paymentMethod === "instapay" &&
    status === "pending_instapay_approval" &&
    paymentStatus.includes("pending instapay approval") &&
    !order.instapay_proof_email_sent_at
  );
}

function shouldSendInstapayPendingCustomerEmail(order: StoredOrder) {
  const source = getOrderStatusValue(order.source);
  const status = getOrderStatusValue(order.status);
  const paymentMethod = getOrderStatusValue(order.payment_method);
  const paymentStatus = getOrderStatusValue(order.payment_status);

  return (
    source === "checkout_instapay_proof" &&
    paymentMethod === "instapay" &&
    status === "pending_instapay_approval" &&
    paymentStatus.includes("pending instapay approval") &&
    Boolean((order.customer as { email?: string } | undefined)?.email) &&
    !order.instapay_pending_customer_email_sent_at
  );
}

function stripInstapayProofAttachment(order: StoredOrder) {
  const proof = order.instapay_proof;
  if (!proof || typeof proof !== "object") return order;

  const proofMetadata = { ...(proof as Record<string, unknown>) };
  delete proofMetadata.data_url;

  return {
    ...order,
    instapay_proof: proofMetadata,
  };
}

function shouldAdjustInventory(order: StoredOrder) {
  if (getOrderStatusValue(order.source) === "admin_custom_order") return false;

  const extras = order.extras;
  if (
    extras &&
    typeof extras === "object" &&
    !Array.isArray(extras) &&
    (extras as Record<string, unknown>).exclude_from_stock_consumption
  ) {
    return false;
  }

  const status = getOrderStatusValue(order.status);
  const paymentStatus = getOrderStatusValue(order.payment_status);
  const paymentMethod = getOrderStatusValue(order.payment_method);
  const isConfirmed = status === "confirmed" || status === "shipped";
  const isPaid = paymentStatus === "paid";
  const isCashOnDelivery =
    paymentMethod === "cod" || paymentStatus === "cash on delivery";

  return isConfirmed && (isPaid || isCashOnDelivery);
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

  const order =
    await fetchOrderFromDatabase(order_ref) ||
    await fetchOrderFromGoogleSheets(order_ref);
  
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
  const databaseConfigured = isOrderDatabaseConfigured();

  if (!webhookUrl && !databaseConfigured) {
    return NextResponse.json(
      { error: "No order storage is configured. Set Supabase or GOOGLE_SHEETS_WEBHOOK_URL." },
      { status: 500 }
    );
  }

  let body: OrderLogBody;
  try {
    body = (await req.json()) as OrderLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const skipStockValidation =
    getOrderStatusValue(body.source) === "admin_custom_order" ||
    Boolean(
      body.extras &&
        typeof body.extras === "object" &&
        !Array.isArray(body.extras) &&
        (body.extras as Record<string, unknown>).exclude_from_stock_consumption,
    );

  if (!skipStockValidation && Array.isArray(body.items) && body.items.length > 0) {
    try {
      const stockValidation = await validateOrderInventory(body.items as OrderItem[]);
      if (!stockValidation.valid) {
        return NextResponse.json(
          { error: "Requested quantity exceeds available stock", issues: stockValidation.issues },
          { status: 409 },
        );
      }
    } catch (error) {
      console.error("Could not validate order inventory", error);
      return NextResponse.json({ error: "Stock validation unavailable" }, { status: 503 });
    }
  }

  const isInitialCardCheckout =
    getOrderStatusValue(body.source) === "checkout" &&
    getOrderStatusValue(body.payment_method) === "paymob_card" &&
    getOrderStatusValue(body.status) === "created" &&
    getOrderStatusValue(body.payment_status) === "pending";

  if (!isInitialCardCheckout) {
    body = await enrichOrderItemsFromCms(body);
  }

  const orderRef = body.order_ref as string | undefined;
  if (orderRef) {
    const existing =
      ((await fetchOrderFromDatabase(orderRef)) as StoredOrder | null) ||
      (isInitialCardCheckout
        ? undefined
        : ((await fetchOrderFromGoogleSheets(orderRef)) as StoredOrder | null)) ||
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

    if (shouldSendInstapayApprovalEmail(updatedOrder)) {
      const instapayEmailHistoryEntry: OrderHistoryEntry = {
        status: "instapay_approval_email_sent",
        timestamp: new Date().toISOString(),
        source: "email_notification",
        event_key: `instapay_approval_email:${orderRef}`,
      };

      updatedOrder = {
        ...updatedOrder,
        instapay_proof_email_sent_at: instapayEmailHistoryEntry.timestamp,
        history: [...(updatedOrder.history || history), instapayEmailHistoryEntry],
      };

      sendInstapayApprovalEmail(updatedOrder).catch((err) =>
        console.error("Failed to send InstaPay approval email:", err)
      );
    }

    if (shouldSendInstapayPendingCustomerEmail(updatedOrder)) {
      const instapayCustomerHistoryEntry: OrderHistoryEntry = {
        status: "instapay_pending_customer_email_sent",
        timestamp: new Date().toISOString(),
        source: "customer_email_notification",
        event_key: `instapay_pending_customer_email:${orderRef}`,
      };

      updatedOrder = {
        ...updatedOrder,
        instapay_pending_customer_email_sent_at: instapayCustomerHistoryEntry.timestamp,
        history: [...(updatedOrder.history || history), instapayCustomerHistoryEntry],
      };

      sendInstapayPendingCustomerEmail(updatedOrder).catch((err) =>
        console.error("Failed to send InstaPay pending customer email:", err)
      );
    }

    const storedOrder = stripInstapayProofAttachment(updatedOrder);

    // Forward the ENTIRE updated order to Google Sheets
    body = storedOrder;
  }

  let databaseStored = false;
  let databaseError = "";

  if (orderRef && databaseConfigured) {
    try {
      await upsertOrderToDatabase(body as OrderLogBody);
      databaseStored = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error);
      console.error("Failed to write order to Supabase", {
        order_ref: orderRef,
        error: databaseError,
      });
    }
  }

  let sheetsResponse: unknown = null;
  let sheetsStored = false;
  let sheetsError = "";

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    sheetsResponse = text;

    try {
      sheetsResponse = JSON.parse(text);
    } catch {
      // Keep the raw response for diagnostics.
    }

    sheetsStored =
      res.ok &&
      !(
        sheetsResponse &&
        typeof sheetsResponse === "object" &&
        (
          (sheetsResponse as { success?: boolean }).success === false ||
          (sheetsResponse as { skipped?: boolean }).skipped === true
        )
      );

    if (!sheetsStored) {
      sheetsError = JSON.stringify({
        status: res.status,
        data: sheetsResponse,
      });
    }
  }

  if (!databaseStored && !sheetsStored) {
    return NextResponse.json(
      {
        error: "Failed to store order",
        database: databaseError || (databaseConfigured ? "Unknown Supabase error" : "not_configured"),
        sheets: sheetsError || (webhookUrl ? "Unknown Google Sheets error" : "not_configured"),
      },
      { status: 502 },
    );
  }

  if (orderRef) {
    let storedOrder = body as StoredOrder;
    if (shouldAdjustInventory(storedOrder) && Array.isArray(storedOrder.items)) {
      try {
        const inventoryResult = await adjustInventoryForConfirmedOrder(
          orderRef,
          storedOrder.items as OrderItem[],
        );
        storedOrder = {
          ...storedOrder,
          inventory: {
            ...inventoryResult,
            updatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Failed to adjust Sanity inventory", {
          order_ref: orderRef,
          error: error instanceof Error ? error.message : String(error),
        });
        storedOrder = {
          ...storedOrder,
          inventory: {
            status: "failed",
            reason: error instanceof Error ? error.message : "Inventory update failed",
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }

    if (shouldAdjustInventory(storedOrder)) {
      try {
        const customerReferral = await ensureReferralRecordForOrder(storedOrder);
        const referralReward = await markReferralConversionForOrder(storedOrder);
        storedOrder = {
          ...storedOrder,
          referral: {
            ...(typeof storedOrder.referral === "object" && storedOrder.referral ? storedOrder.referral : {}),
            customer_code:
              customerReferral && "code" in customerReferral
                ? (customerReferral as { code?: string }).code
                : undefined,
            reward: referralReward || undefined,
            updatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Failed to update referral records", {
          order_ref: orderRef,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    try {
      await upsertOrderToDatabase(storedOrder);
      databaseStored = true;
    } catch (error) {
      console.error("Failed to mirror order to Supabase", {
        order_ref: orderRef,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    data: sheetsResponse,
    order_ref: orderRef,
    storage: {
      supabase: databaseStored ? "stored" : databaseConfigured ? "failed" : "not_configured",
      google_sheets: sheetsStored ? "stored" : webhookUrl ? "failed" : "not_configured",
    },
  });
}
