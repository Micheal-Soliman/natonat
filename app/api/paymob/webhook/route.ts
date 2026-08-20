import { NextResponse } from "next/server";
import { isOrderVerificationEnabled } from "@/lib/order-verification";
import crypto from "crypto";

type PaymobTransaction = {
  id?: string | number;
  order?: {
    id?: string | number;
    amount_cents?: number;
    merchant_order_id?: string;
  };
  order_id?: string | number;
  merchant_order_id?: string;
  special_reference?: string;
  payment_key_claims?: {
    extra?: {
      order_ref?: string;
      merchant_order_id?: string;
      order_snapshot?: unknown;
    } & Record<string, unknown>;
  };
  success?: boolean;
  pending?: boolean;
  amount_cents?: number;
  currency?: string;
  source_data?: {
    type?: string;
    pan?: string;
    last_four?: string;
    sub_type?: string;
  };
  payment_method?: string;
  gateway_integration_id?: string | number;
  created_at?: string;
  error_occured?: boolean;
  is_refunded?: boolean;
  has_parent_transaction?: boolean;
  integration_id?: string | number;
  is_3d_secure?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  owner?: string | number;
  refunded_amount_cents?: number;
  captured_amount?: number;
};

type PaymobPayload = PaymobTransaction & {
  hmac?: string;
  obj?: PaymobTransaction;
};

type OrderLogResponse = {
  success?: boolean;
  order?: LoggedOrder;
};

type LoggedOrder = {
  delivery_method?: string;
  customer?: unknown;
  bosta?: {
    trackingNumber?: string;
  };
  shipment?: {
    trackingNumber?: string;
  };
  aramex?: {
    trackingNumber?: string;
  };
  amount_egp?: number;
  amount_cents?: number;
  shipping_egp?: number;
  locale?: string;
  items?: Array<{
    name?: string;
    productName?: string;
    quantity?: number;
    [key: string]: unknown;
  }>;
};

const PAYMOB_HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getNestedValue(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function stringifyHmacValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function calculatePaymobHmac(transaction: PaymobTransaction, secret: string) {
  const message = PAYMOB_HMAC_FIELDS
    .map((field) => stringifyHmacValue(getNestedValue(transaction, field)))
    .join("");

  return crypto.createHmac("sha512", secret).update(message).digest("hex");
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const aBuffer = Buffer.from(a, "hex");
    const bBuffer = Buffer.from(b, "hex");

    return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
}

function getPaymobOrderRef(transaction: PaymobTransaction) {
  return firstNonEmpty(
    transaction.special_reference,
    transaction.payment_key_claims?.extra?.order_ref,
    transaction.payment_key_claims?.extra?.merchant_order_id,
    transaction.merchant_order_id,
    transaction.order?.merchant_order_id
  );
}

function getPaymobOrderSnapshot(transaction: PaymobTransaction): LoggedOrder | null {
  const snapshot = transaction.payment_key_claims?.extra?.order_snapshot;
  if (!snapshot || typeof snapshot !== "object") return null;

  const order = snapshot as LoggedOrder;
  if (!order.delivery_method || !order.customer || !Array.isArray(order.items)) return null;

  return order;
}

function getOrderAmountEgp(orderData: LoggedOrder | null, paymentAmountCents: number) {
  if (typeof orderData?.amount_egp === "number" && orderData.amount_egp > 0) {
    return orderData.amount_egp;
  }

  if (typeof orderData?.amount_cents === "number" && orderData.amount_cents > 0) {
    return orderData.amount_cents / 100;
  }

  return paymentAmountCents > 0 ? paymentAmountCents / 100 : 0;
}

function getShipmentItems(orderData: LoggedOrder) {
  return (orderData.items || [])
    .map((item) => ({
      name: item.name || item.productName || "Order item",
      title: item.title,
      slug: item.slug,
      type: item.type,
      size: item.size,
      selectedSize: item.selectedSize,
      variantSize: item.variantSize,
      color: item.color,
      selectedColor: item.selectedColor,
      variant: item.variant,
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      bundleSelections: Array.isArray(item.bundleSelections)
        ? item.bundleSelections
            .filter((selection) => selection && typeof selection === "object" && !Array.isArray(selection))
            .map((selection) => {
              const selectionRecord = selection as Record<string, unknown>;
              return {
                name:
                  String(selectionRecord.productName || selectionRecord.name || selectionRecord.title || "Bundle item").trim(),
                title: typeof selectionRecord.title === "string" ? selectionRecord.title : undefined,
                slug: String(selectionRecord.productSlug || selectionRecord.slug || "").trim(),
                type: String(selectionRecord.productType || selectionRecord.type || "").trim(),
                size: String(selectionRecord.size || "").trim(),
                color: String(selectionRecord.color || "").trim(),
                quantity: typeof selectionRecord.quantity === "number" && selectionRecord.quantity > 0
                  ? selectionRecord.quantity
                  : 1,
              };
            })
        : undefined,
    }))
    .filter((item) => item.name.trim().length > 0);
}

async function fetchLoggedOrder(appOrigin: string, orderRef: string) {
  try {
    const orderLogRes = await fetch(
      `${appOrigin}/api/orders/log?order_ref=${encodeURIComponent(orderRef)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!orderLogRes.ok) return null;

    const result = (await orderLogRes.json()) as OrderLogResponse;
    return result.order || null;
  } catch (error) {
    console.error("[Webhook] Failed to retrieve order details:", error);
    return null;
  }
}

export async function POST(req: Request) {
  let payload: PaymobPayload;
  try {
    payload = (await req.json()) as PaymobPayload;
  } catch {
    payload = {};
  }

  const transaction = payload.obj || payload;
  const receivedHmac = new URL(req.url).searchParams.get("hmac") || payload.hmac || "";
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  if (hmacSecret) {
    const calculatedHmac = calculatePaymobHmac(transaction, hmacSecret);

    if (!receivedHmac || !timingSafeEqualHex(calculatedHmac, receivedHmac)) {
      console.error("Paymob webhook rejected: invalid HMAC");
      return NextResponse.json({ error: "Invalid Paymob webhook signature" }, { status: 401 });
    }
  } else {
    console.warn("Paymob webhook HMAC verification skipped: PAYMOB_HMAC_SECRET is not set");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Paymob webhook received:", {
      transaction_id: transaction.id || "",
      order_id: transaction.order?.id || transaction.order_id || "",
      success: !!transaction.success,
      pending: !!transaction.pending,
    });
  }

  // Extract key payment details from Paymob payload
  const paymentDetails = {
    order_id: transaction?.order?.id || transaction?.order_id || "",
    merchant_order_id: transaction?.merchant_order_id || "",
    special_reference: getPaymobOrderRef(transaction),
    payment_status: transaction?.success ? "Paid" : transaction?.pending ? "Pending" : "Failed",
    transaction_id: transaction?.id || "",
    amount_cents: transaction?.amount_cents || transaction?.order?.amount_cents || 0,
    currency: transaction?.currency || "EGP",
    payment_method: transaction?.source_data?.type || transaction?.payment_method || "",
    card_last_four: transaction?.source_data?.pan || transaction?.source_data?.last_four || "",
    card_sub_type: transaction?.source_data?.sub_type || "",
    gateway_integration_id: transaction?.gateway_integration_id || transaction?.integration_id || "",
    created_at: transaction?.created_at || new Date().toISOString(),
    error_occured: transaction?.error_occured || false,
    is_refunded: transaction?.is_refunded || false,
    refunded_amount_cents: transaction?.refunded_amount_cents || 0,
    captured_amount: transaction?.captured_amount || 0,
    source: "paymob_webhook",
    received_at: new Date().toISOString(),
    raw_payload: payload,
  };

  const appOrigin =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;

  if (!paymentDetails.special_reference) {
    console.error("[Webhook] Missing order reference in Paymob payload", {
      transaction_id: transaction.id || "",
      order_id: transaction.order?.id || transaction.order_id || "",
      merchant_order_id: transaction.merchant_order_id || "",
    });
  }

  const loggedOrderBeforePaymentUpdate = paymentDetails.special_reference
    ? await fetchLoggedOrder(appOrigin, paymentDetails.special_reference)
    : null;
  const paymobOrderSnapshot = getPaymobOrderSnapshot(transaction);

  if (paymentDetails.special_reference) {
    try {
      await fetch(`${appOrigin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "paymob_webhook",
          order_ref: paymentDetails.special_reference,
          status: transaction.success
            ? isOrderVerificationEnabled()
              ? "pending_verification"
              : "confirmed"
            : transaction.pending
              ? "pending"
              : "failed",
          payment_status: paymentDetails.payment_status,
          payment: paymentDetails,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      });
    } catch (error) {
      console.error("[Webhook] Failed to update order payment status:", error);
    }
  }

  // Create Bosta shipment for successful card payments with delivery
  if (transaction?.success && paymentDetails.special_reference && !isOrderVerificationEnabled()) {
    try {
      const orderData =
        loggedOrderBeforePaymentUpdate ||
        (await fetchLoggedOrder(appOrigin, paymentDetails.special_reference)) ||
        paymobOrderSnapshot;
        
      if (orderData) {
        // --- PREVENT DUPLICATES ---
        // Only create shipment if it's a delivery order AND we haven't already created a tracking number for it
        const existingTracking =
          orderData?.bosta?.trackingNumber ||
          orderData?.shipment?.trackingNumber ||
          orderData?.aramex?.trackingNumber;

        if (orderData?.delivery_method === "delivery" && orderData?.customer && !existingTracking) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Webhook] Proceeding with Bosta shipment for order: ${paymentDetails.special_reference}`);
          }

          const shipmentItems = getShipmentItems(orderData);
          const shipmentTotalValue = getOrderAmountEgp(orderData, paymentDetails.amount_cents);
          
          const shipmentRes = await fetch(`${appOrigin}/api/bosta/shipment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-api-secret": process.env.BOSTA_INTERNAL_API_SECRET || "",
            },
            body: JSON.stringify({
              orderRef: paymentDetails.special_reference,
              customer: orderData.customer,
              items: shipmentItems,
              totalValue: shipmentTotalValue,
              cod: false,
              codAmount: 0,
            }),
          });

          const shipmentData = await shipmentRes.json();
          
          if (shipmentData.success) {
            if (process.env.NODE_ENV !== "production") {
              console.log("[Webhook] Bosta shipment created:", shipmentData.trackingNumber);
            }
            
            // Update order with tracking info
            await fetch(`${appOrigin}/api/orders/log`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "paymob_webhook_bosta",
                order_ref: paymentDetails.special_reference,
                status: "shipped", // Update overall status
                payment_status: "Paid", // Ensure payment status is updated
                bosta: {
                  provider: shipmentData.provider,
                  trackingNumber: shipmentData.trackingNumber,
                  trackingLink: shipmentData.trackingLink,
                  labelUrl: shipmentData.labelUrl,
                  guid: shipmentData.guid,
                },
                shipment: {
                  provider: "bosta",
                  trackingNumber: shipmentData.trackingNumber,
                  trackingLink: shipmentData.trackingLink,
                },
                payment: paymentDetails,
                updated_at: new Date().toISOString(),
              }),
            });
          } else {
            const bostaError =
              shipmentData.details ||
              shipmentData.error ||
              "Bosta shipment failed";
            console.error("[Webhook] Failed to create Bosta shipment:", bostaError, {
              status: shipmentRes.status,
              order_ref: paymentDetails.special_reference,
              totalValue: shipmentTotalValue,
              item_count: shipmentItems.length,
            });
            await fetch(`${appOrigin}/api/orders/log`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "paymob_webhook_bosta_failed",
                order_ref: paymentDetails.special_reference,
                status: "confirmed",
                payment_status: "Paid",
                bosta: {
                  error: bostaError,
                },
                payment: paymentDetails,
                updated_at: new Date().toISOString(),
              }),
            });
          }
        } else if (existingTracking) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Webhook] Shipment already exists for order ${paymentDetails.special_reference}. Skipping Bosta.`);
          }
        } else {
          console.error("[Webhook] Cannot create Bosta shipment: order is missing delivery/customer details", {
            order_ref: paymentDetails.special_reference,
            delivery_method: orderData?.delivery_method,
            has_customer: !!orderData?.customer,
          });
        }
      } else {
        console.error("[Webhook] Cannot create Bosta shipment: order details not found", {
          order_ref: paymentDetails.special_reference,
        });
      }
    } catch (err) {
      console.error("[Webhook] Bosta shipment creation error:", err);
      await fetch(`${appOrigin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "paymob_webhook_bosta_failed",
          order_ref: paymentDetails.special_reference,
          status: "confirmed",
          payment_status: "Paid",
          bosta: {
            error: err instanceof Error ? err.message : "Bosta shipment creation error",
          },
          payment: paymentDetails,
          updated_at: new Date().toISOString(),
        }),
      });
      // Don't block webhook response if shipment fails
    }
  }

  return NextResponse.json({ received: true, payment_status: paymentDetails.payment_status });
}
