import { after, NextResponse } from "next/server";
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
  fetchOrderFromDatabaseIncludingDeleted,
  isDeletedOrderRecord,
  isOrderDatabaseConfigured,
  upsertOrderToDatabase,
} from "@/lib/order-database";
import {
  getMetaClientIp,
  getMetaCookie,
  sendMetaConversionEvent,
} from "@/lib/meta-capi";
import { createBostaDelivery } from "@/lib/bosta";
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
    provider?: string;
    trackingNumber?: string;
    trackingLink?: string;
    labelUrl?: string;
    guid?: string;
  };
  bosta?: StoredOrder["aramex"];
  shipment?: StoredOrder["aramex"];
  inventory?: {
    status?: string;
    adjustedProducts?: number;
    reason?: string;
    updatedAt?: string;
  };
  instapay_proof_email_sent_at?: string;
  instapay_pending_customer_email_sent_at?: string;
};

const UPDATE_ONLY_SOURCES = new Set([
  "admin_manual_order_edit",
  "admin_status_update",
  "admin_bosta_created",
  "admin_bosta_replaced",
  "admin_bosta_sync",
  "admin_bosta_terminated",
  "bosta_sync",
  "bosta_status_sync",
  "bosta_manual_tracking_update",
  "email_notification",
  "email_notification_failed",
  "email_notification_queued",
  "customer_email_notification",
  "meta_capi",
  "paymob_webhook",
  "paymob_webhook_aramex",
  "paymob_webhook_bosta",
]);

function getNestedString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return "";

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);

  return "";
}

function getBostaBundleSelections(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  const selections = item.bundleSelections || item.bundle_selections;
  if (!Array.isArray(selections) || selections.length === 0) return undefined;

  return selections
    .filter((selection) => selection && typeof selection === "object" && !Array.isArray(selection))
    .map((selection) => {
      const selectionRecord = selection as Record<string, unknown>;
      return {
        name:
          getNestedString(selectionRecord, "productName") ||
          getNestedString(selectionRecord, "name") ||
          getNestedString(selectionRecord, "title") ||
          "Bundle item",
        title: getNestedString(selectionRecord, "title"),
        slug: getNestedString(selectionRecord, "productSlug") || getNestedString(selectionRecord, "slug"),
        type: getNestedString(selectionRecord, "productType") || getNestedString(selectionRecord, "type"),
        size: getNestedString(selectionRecord, "size"),
        color: getNestedString(selectionRecord, "color"),
        quantity: Number(selectionRecord.quantity || selectionRecord.qty || 1) || 1,
      };
    });
}

function isUpdateOnlySource(value: unknown) {
  const source = getOrderStatusValue(value);
  return (
    UPDATE_ONLY_SOURCES.has(source) ||
    source.endsWith("_bosta_failed") ||
    source.endsWith("_bosta_created")
  );
}

function getPersistentOrderSource(existing: StoredOrder | undefined, incoming: OrderLogBody) {
  const incomingSource = typeof incoming.source === "string" ? incoming.source.trim() : "";
  const existingSource = typeof existing?.source === "string" ? existing.source.trim() : "";
  const existingOriginalSource =
    typeof existing?.original_source === "string" ? existing.original_source.trim() : "";

  if (incomingSource && !isUpdateOnlySource(incomingSource)) return incomingSource;
  if (existingOriginalSource && !isUpdateOnlySource(existingOriginalSource)) return existingOriginalSource;
  if (existingSource && !isUpdateOnlySource(existingSource)) return existingSource;

  const orderRef = typeof incoming.order_ref === "string" ? incoming.order_ref : existing?.order_ref;
  if (typeof orderRef === "string" && orderRef.startsWith("NAT-")) return "checkout";
  if (typeof orderRef === "string" && orderRef.startsWith("CUSTOM-")) return "admin_special_order";

  return incomingSource || existingSource || "manual";
}

function getOrderEventKey(body: OrderLogBody, status: string) {
  const source = typeof body.source === "string" ? body.source : "manual";
  const payment = body.payment;
  const shipment = body.bosta || body.shipment || body.aramex;
  const transactionId =
    getNestedString(payment, "transaction_id") ||
    getNestedString(payment, "id");
  const trackingNumber = getNestedString(shipment, "trackingNumber");
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
      existing?.history?.some((entry) =>
        entry.source === "email_notification"
      )
  );
}

function hasRecentCheckoutEmailAttempt(existing: StoredOrder | undefined) {
  const queuedAt =
    typeof existing?.email_queued_at === "string" ? Date.parse(existing.email_queued_at) : 0;
  if (Number.isFinite(queuedAt) && queuedAt > 0 && Date.now() - queuedAt < 3 * 60 * 1000) {
    return true;
  }

  return Boolean(
    existing?.history?.some((entry) => {
      if (entry.source !== "email_notification_queued") return false;
      const queuedEventAt = Date.parse(entry.timestamp);
      return Number.isFinite(queuedEventAt) && Date.now() - queuedEventAt < 3 * 60 * 1000;
    })
  );
}

function shouldEmailSourceTriggerSend(source: unknown) {
  const value = getOrderStatusValue(source);
  return (
    value !== "email_notification" &&
    value !== "email_notification_failed" &&
    value !== "email_notification_queued" &&
    value !== "customer_email_notification"
  );
}

function getOrderStatusValue(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function getNumberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(next) ? next : 0;
  }
  return 0;
}

function shouldSendOrderEmail(order: StoredOrder, triggerSource?: unknown) {
  const source = getOrderStatusValue(triggerSource) || getOrderStatusValue(order.source);
  const status = getOrderStatusValue(order.status);
  const paymentStatus = getOrderStatusValue(order.payment_status);
  const deliveryMethod = getOrderStatusValue(order.delivery_method);

  if (status === "created" || status === "pending" || paymentStatus === "pending") {
    return false;
  }

  if (source === "checkout") {
    return status === "confirmed" || status === "shipped" || paymentStatus === "cash on delivery";
  }

  if (source === "paymob_webhook_bosta" || source === "paymob_webhook_aramex") {
    return paymentStatus === "paid";
  }

  if (source === "paymob_webhook_bosta_failed" || source === "paymob_webhook_aramex_failed") {
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

function shouldSendMetaPurchase(order: StoredOrder) {
  const extras = order.extras;
  if (
    extras &&
    typeof extras === "object" &&
    !Array.isArray(extras) &&
    (extras as Record<string, unknown>).created_from_admin_manual_order
  ) {
    return false;
  }

  if (!shouldAdjustInventory(order)) return false;

  const orderRef = typeof order.order_ref === "string" ? order.order_ref : "";
  return !order.history?.some((entry) => entry.event_key === `meta_purchase:${orderRef}`);
}

function isSideEffectOnlySource(source: unknown) {
  const value = getOrderStatusValue(source);
  return value === "email_notification" || value === "email_notification_failed";
}

function getShipmentTracking(order: StoredOrder) {
  const shipment = order.bosta || order.shipment || order.aramex;
  return (
    getNestedString(shipment, "trackingNumber") ||
    getNestedString(order, "Bosta Tracking Number") ||
    getNestedString(order, "Aramex Tracking Number")
  );
}

function shouldCreateBostaFromOrderLog(order: StoredOrder) {
  const source = getOrderStatusValue(order.source);
  const status = getOrderStatusValue(order.status);
  const deliveryMethod = getOrderStatusValue(order.delivery_method);

  return (
    source === "checkout" &&
    deliveryMethod === "delivery" &&
    (status === "confirmed" || status === "shipped") &&
    !getShipmentTracking(order)
  );
}

async function attachBostaShipmentIfNeeded(order: StoredOrder) {
  if (!shouldCreateBostaFromOrderLog(order)) return order;
  const customer = order.customer;
  const items = order.items;
  if (!customer || typeof customer !== "object" || Array.isArray(customer) || !Array.isArray(items) || !items.length) {
    return {
      ...order,
      bosta: {
        provider: "bosta",
        status: "failed",
        error: "Bosta shipment skipped: missing customer or items",
      },
    } as StoredOrder;
  }

  const paymentMethod = getOrderStatusValue(order.payment_method);
  const paymentStatus = getOrderStatusValue(order.payment_status);
  const isCod = paymentMethod.includes("cod") || paymentStatus.includes("cash on delivery");
  const totalValue = getOrderAmountEgp(order);

  const result = await createBostaDelivery({
    orderRef: String(order.order_ref || ""),
    customer: customer as Parameters<typeof createBostaDelivery>[0]["customer"],
    items: (items as Array<Record<string, unknown>>).map((item) => ({
      name: getNestedString(item, "name") || getNestedString(item, "productName") || "Order item",
      title: getNestedString(item, "title"),
      slug: getNestedString(item, "slug"),
      type: getNestedString(item, "type"),
      size: getNestedString(item, "size"),
      color: getNestedString(item, "color"),
      quantity: Number(item.quantity || item.qty || 1) || 1,
      bundleSelections: getBostaBundleSelections(item),
    })),
    totalValue,
    cod: isCod,
    codAmount: isCod ? totalValue : 0,
  });

  const bosta = result.success
    ? {
        provider: "bosta",
        trackingNumber: result.trackingNumber,
        trackingLink: result.trackingLink,
        labelUrl: result.labelUrl,
        guid: result.guid,
        status: "Record created",
        error: "",
      }
    : {
        provider: "bosta",
        status: "failed",
        error: result.error || "Bosta shipment failed",
      };
  const bostaHistoryKey = result.success
    ? `bosta_shipment_created:${result.trackingNumber || order.order_ref || ""}`
    : `bosta_shipment_failed:${order.order_ref || ""}:${bosta.error || ""}`;
  const existingHistory = Array.isArray(order.history) ? order.history : [];
  const hasBostaHistory = existingHistory.some((entry) => entry.event_key === bostaHistoryKey);
  const history = hasBostaHistory
    ? existingHistory
    : [
        ...existingHistory,
        {
          status: result.success ? "shipped" : "shipment_failed",
          timestamp: new Date().toISOString(),
          source: result.success ? "bosta_shipment_created" : "bosta_shipment_failed",
          event_key: bostaHistoryKey,
        },
      ];

  return {
    ...order,
    status: result.success ? "shipped" : order.status,
    bosta,
    shipment: bosta,
    aramex: bosta,
    history,
    tracking_link: result.trackingLink || order.tracking_link,
  } as StoredOrder;
}

function getOrderAmountEgp(order: StoredOrder) {
  return (
    getNumberValue(order.amount_egp) ||
    getNumberValue(order["Total (EGP)"]) ||
    getNumberValue(order.amount_cents) / 100 ||
    getNumberValue(order["Total Cents"]) / 100
  );
}

function getMetaPurchaseContents(order: StoredOrder) {
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
  return items.map((item) => {
    const quantity = getNumberValue(item.quantity) || 1;
    const lineTotal = getNumberValue(item.line_total_egp);
    const itemPrice =
      getNumberValue(item.unit_price_egp) ||
      getNumberValue(item.price_egp) ||
      getNumberValue(item.price) ||
      (lineTotal > 0 ? lineTotal / quantity : 0);

    return {
      id: String(item.id || item.slug || item.line_id || item.name || "item"),
      quantity,
      item_price: itemPrice,
    };
  });
}

function getOrderCustomer(order: StoredOrder) {
  return order.customer && typeof order.customer === "object" && !Array.isArray(order.customer)
    ? (order.customer as Record<string, unknown>)
    : {};
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

  const databaseOrder = await fetchOrderFromDatabaseIncludingDeleted(order_ref);
  if (isDeletedOrderRecord(databaseOrder)) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  const order = databaseOrder || await fetchOrderFromGoogleSheets(order_ref);
  
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

async function mirrorOrderToGoogleSheets(webhookUrl: string, body: OrderLogBody) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let sheetsResponse: unknown = text;

  try {
    sheetsResponse = JSON.parse(text);
  } catch {
    // Keep the raw response for diagnostics.
  }

  const sheetsStored =
    res.ok &&
    !(
      sheetsResponse &&
      typeof sheetsResponse === "object" &&
      (
        (sheetsResponse as { success?: boolean }).success === false ||
        (sheetsResponse as { skipped?: boolean }).skipped === true
      )
    );

  return {
    response: sheetsResponse,
    stored: sheetsStored,
    error: sheetsStored
      ? ""
      : JSON.stringify({
          status: res.status,
          data: sheetsResponse,
        }),
  };
}

async function sendConfirmedOrderEmails(orderRef: string, order: StoredOrder) {
  const [adminEmailResult, customerEmailResult] = await Promise.allSettled([
    sendOrderEmail(order),
    sendCustomerConfirmationEmail(order),
  ]);

  const adminEmailOk =
    adminEmailResult.status === "fulfilled" &&
    Boolean((adminEmailResult.value as { success?: boolean } | undefined)?.success);
  const customerEmail = (order.customer as { email?: string } | undefined)?.email;
  const customerEmailOk =
    !customerEmail ||
    (
      customerEmailResult.status === "fulfilled" &&
      Boolean((customerEmailResult.value as { success?: boolean } | undefined)?.success)
    );
  const timestamp = new Date().toISOString();

  if (!adminEmailOk || !customerEmailOk) {
    const emailError = {
      admin:
        adminEmailResult.status === "rejected"
          ? String(adminEmailResult.reason)
          : (adminEmailResult.value as { error?: unknown } | undefined)?.error || "",
      customer:
        customerEmailResult.status === "rejected"
          ? String(customerEmailResult.reason)
          : (customerEmailResult.value as { error?: unknown } | undefined)?.error || "",
    };

    return {
      ...order,
      email_queued_at: "",
      email_error: emailError,
      history: [
        ...(order.history || []),
        {
          status: "email_failed",
          timestamp,
          source: "email_notification_failed",
          event_key: `email_notification_failed:${orderRef}`,
        },
      ],
      updated_at: timestamp,
    } as StoredOrder;
  }

  return {
    ...order,
    email_sent_at: timestamp,
    email_queued_at: "",
    email_error: "",
    history: [
      ...(order.history || []),
      {
        status: "email_sent",
        timestamp,
        source: "email_notification",
        event_key: `email_notification:${orderRef}`,
      },
    ],
    updated_at: timestamp,
  } as StoredOrder;
}

async function runPostStorageSideEffects(orderRef: string | undefined, body: OrderLogBody) {
  if (!orderRef) return body as StoredOrder;

  let storedOrder = body as StoredOrder;
  storedOrder = await attachBostaShipmentIfNeeded(storedOrder);

  if (shouldSendOrderEmail(storedOrder, storedOrder.source) && !hasCheckoutEmailAlreadySent(storedOrder)) {
    try {
      storedOrder = await sendConfirmedOrderEmails(orderRef, storedOrder);
    } catch (error) {
      console.error("Order email delivery failed:", {
        order_ref: orderRef,
        error: error instanceof Error ? error.message : String(error),
      });
      storedOrder = {
        ...storedOrder,
        email_queued_at: "",
        email_error: error instanceof Error ? error.message : "Order email delivery failed",
        updated_at: new Date().toISOString(),
      };
    }
  }

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
  } catch (error) {
    console.error("Failed to mirror order to Supabase", {
      order_ref: orderRef,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return storedOrder;
}

export async function POST(req: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const databaseConfigured = isOrderDatabaseConfigured();
  const requestedFastStore = new URL(req.url).searchParams.get("fast") === "1";
  const fastStore = requestedFastStore && databaseConfigured;

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
    isSideEffectOnlySource(body.source) ||
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
    const databaseExisting = (await fetchOrderFromDatabaseIncludingDeleted(orderRef)) as StoredOrder | null;
    if (isDeletedOrderRecord(databaseExisting)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "order_deleted",
        order_ref: orderRef,
      });
    }

    const existing =
      databaseExisting ||
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
    
    // Add Bosta tracking link if tracking number exists
    const bodyBosta = (body.bosta || body.shipment || body.aramex) as StoredOrder["bosta"] | undefined;
    const existingBosta = existing?.bosta || existing?.shipment || existing?.aramex;
    const trackingNumber = bodyBosta?.trackingNumber || existingBosta?.trackingNumber;
    const provider = getOrderStatusValue(bodyBosta?.provider || existingBosta?.provider || "bosta");
    const explicitTrackingLink = getNestedString(bodyBosta, "trackingLink") || getNestedString(existingBosta, "trackingLink");
    const trackingLink = explicitTrackingLink || (
      trackingNumber
        ? provider === "bosta"
          ? `https://bosta.co/tracking-shipments?shipmentNumber=${trackingNumber}`
          : `https://bosta.co/tracking-shipments?shipmentNumber=${trackingNumber}`
        : ""
    );

    const incomingBosta = ((body as StoredOrder).bosta || (body as StoredOrder).shipment || (body as StoredOrder).aramex) as StoredOrder["bosta"] | undefined;
    const persistentSource = getPersistentOrderSource(existing, body);
    const incomingSource = typeof body.source === "string" ? body.source.trim() : "";
    let updatedOrder = {
      ...existing,
      ...body,
      source: persistentSource,
      original_source: persistentSource,
      last_update_source: incomingSource && isUpdateOnlySource(incomingSource)
        ? incomingSource
        : existing?.last_update_source,
      bosta: incomingBosta == null ? existingBosta : incomingBosta,
      shipment: incomingBosta == null ? existingBosta : incomingBosta,
      aramex: incomingBosta == null ? existing?.aramex : incomingBosta,
      history,
      tracking_link: trackingLink
    } as StoredOrder;

    if (!fastStore) {
      updatedOrder = await attachBostaShipmentIfNeeded(updatedOrder);
    }

    // Send email notification only after the order is genuinely confirmable.
    // Card orders are first stored as created/Pending before Paymob redirects;
    // their email waits for a successful Paymob webhook.
    if (
      !fastStore &&
      shouldEmailSourceTriggerSend(body.source) &&
      shouldSendOrderEmail(updatedOrder, body.source) &&
      !hasCheckoutEmailAlreadySent(existing) &&
      !hasRecentCheckoutEmailAttempt(existing)
    ) {
      const emailQueuedAt = new Date().toISOString();
      const emailQueuedHistoryEntry: OrderHistoryEntry = {
        status: "email_queued",
        timestamp: emailQueuedAt,
        source: "email_notification_queued",
        event_key: `email_notification_queued:${orderRef}`,
      };
      updatedOrder = {
        ...updatedOrder,
        email_queued_at: emailQueuedAt,
        history: [...(updatedOrder.history || history), emailQueuedHistoryEntry],
      };
      const emailOrderSnapshot = updatedOrder;
      const appOrigin = new URL(req.url).origin;
      after(async () => {
        const [adminEmailResult, customerEmailResult] = await Promise.allSettled([
          sendOrderEmail(emailOrderSnapshot),
          sendCustomerConfirmationEmail(emailOrderSnapshot),
        ]);

        const adminEmailOk =
          adminEmailResult.status === "fulfilled" &&
          Boolean((adminEmailResult.value as { success?: boolean } | undefined)?.success);
        const customerEmail = (emailOrderSnapshot.customer as { email?: string } | undefined)?.email;
        const customerEmailOk =
          !customerEmail ||
          (
            customerEmailResult.status === "fulfilled" &&
            Boolean((customerEmailResult.value as { success?: boolean } | undefined)?.success)
          );

        if (!adminEmailOk || !customerEmailOk) {
          const emailError = {
            admin:
              adminEmailResult.status === "rejected"
                ? String(adminEmailResult.reason)
                : (adminEmailResult.value as { error?: unknown } | undefined)?.error || "",
            customer:
              customerEmailResult.status === "rejected"
                ? String(customerEmailResult.reason)
                : (customerEmailResult.value as { error?: unknown } | undefined)?.error || "",
          };
          console.error("Order email delivery failed:", { order_ref: orderRef, emailError });
          await fetch(`${appOrigin}/api/orders/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "email_notification_failed",
              order_ref: orderRef,
              email_queued_at: "",
              email_error: emailError,
              updated_at: new Date().toISOString(),
            }),
            cache: "no-store",
          }).catch((error) => {
            console.error("Failed to store order email error:", error);
          });
          return;
        }

        const emailSentAt = new Date().toISOString();
        const emailHistoryEntry: OrderHistoryEntry = {
          status: "email_sent",
          timestamp: emailSentAt,
          source: "email_notification",
          event_key: `email_notification:${orderRef}`,
        };

        await fetch(`${appOrigin}/api/orders/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "email_notification",
            order_ref: orderRef,
            email_sent_at: emailSentAt,
            email_queued_at: "",
            email_error: "",
            history: [...(emailOrderSnapshot.history || history), emailHistoryEntry],
            updated_at: emailSentAt,
          }),
          cache: "no-store",
        }).catch((error) => {
          console.error("Failed to store order email success:", error);
        });
      });
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

      after(async () => {
        try {
          await sendInstapayApprovalEmail(updatedOrder);
        } catch (err) {
          console.error("Failed to send InstaPay approval email:", err);
        }
      });
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

      after(async () => {
        try {
          await sendInstapayPendingCustomerEmail(updatedOrder);
        } catch (err) {
          console.error("Failed to send InstaPay pending customer email:", err);
        }
      });
    }

    if (shouldSendMetaPurchase(updatedOrder)) {
      const customer = getOrderCustomer(updatedOrder);
      const purchaseEventId = `Purchase:${orderRef}`;
      const purchaseHistoryEntry: OrderHistoryEntry = {
        status: "meta_purchase_sent",
        timestamp: new Date().toISOString(),
        source: "meta_capi",
        event_key: `meta_purchase:${orderRef}`,
      };

      updatedOrder = {
        ...updatedOrder,
        meta_purchase_sent_at: purchaseHistoryEntry.timestamp,
        history: [...(updatedOrder.history || history), purchaseHistoryEntry],
      };

      const referer = req.headers.get("referer") || process.env.NEXT_PUBLIC_APP_URL || undefined;
      const userAgent = req.headers.get("user-agent");
      const clientIp = getMetaClientIp(req.headers);
      const fbp = getMetaCookie(req.headers, "_fbp");
      const fbc = getMetaCookie(req.headers, "_fbc");

      after(async () => {
        try {
          await sendMetaConversionEvent({
            eventName: "Purchase",
            eventId: purchaseEventId,
            eventSourceUrl: referer,
            customData: {
              value: getOrderAmountEgp(updatedOrder),
              currency: "EGP",
              order_id: orderRef,
              transaction_id: getNestedString(updatedOrder.payment, "transaction_id") || orderRef,
              content_type: "product",
              content_ids: getMetaPurchaseContents(updatedOrder).map((item) => item.id),
              contents: getMetaPurchaseContents(updatedOrder),
              num_items: getMetaPurchaseContents(updatedOrder).reduce((sum, item) => sum + item.quantity, 0),
            },
            userData: {
              email: customer.email,
              phone: customer.phone,
              fbp,
              fbc,
            },
            userAgent,
            clientIp,
          });
        } catch (err) {
          console.error("Failed to send Meta Purchase CAPI event:", err);
        }
      });
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

  if (fastStore && databaseStored) {
    after(async () => {
      const sideEffectOrder = await runPostStorageSideEffects(orderRef, body);

      if (webhookUrl) {
        try {
          const result = await mirrorOrderToGoogleSheets(webhookUrl, sideEffectOrder);
          if (!result.stored) {
            console.error("Fast order Google Sheets mirror failed", {
              order_ref: orderRef,
              error: result.error,
            });
          }
        } catch (error) {
          console.error("Fast order Google Sheets mirror failed", {
            order_ref: orderRef,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    return NextResponse.json({
      ok: true,
      order_ref: orderRef,
      fast: true,
      storage: {
        supabase: "stored",
        google_sheets: webhookUrl ? "scheduled" : "not_configured",
      },
    });
  }

  let sheetsResponse: unknown = null;
  let sheetsStored = false;
  let sheetsError = "";

  if (webhookUrl) {
    const result = await mirrorOrderToGoogleSheets(webhookUrl, body);
    sheetsResponse = result.response;
    sheetsStored = result.stored;
    sheetsError = result.error;
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
    if (!isSideEffectOnlySource(storedOrder.source) && shouldAdjustInventory(storedOrder) && Array.isArray(storedOrder.items)) {
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

    if (!isSideEffectOnlySource(storedOrder.source) && shouldAdjustInventory(storedOrder)) {
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
