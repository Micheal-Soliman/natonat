import { NextResponse } from "next/server";
import crypto from "crypto";

type PaymobTransaction = {
  id?: string | number;
  order?: {
    id?: string | number;
    amount_cents?: number;
  };
  order_id?: string | number;
  merchant_order_id?: string;
  special_reference?: string;
  payment_key_claims?: {
    extra?: {
      order_ref?: string;
    };
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
  delivery_method?: string;
  customer?: unknown;
  aramex?: {
    trackingNumber?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
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

  console.log("Paymob webhook received:", {
    transaction_id: transaction.id || "",
    order_id: transaction.order?.id || transaction.order_id || "",
    success: !!transaction.success,
    pending: !!transaction.pending,
  });

  // Extract key payment details from Paymob payload
  const paymentDetails = {
    order_id: transaction?.order?.id || transaction?.order_id || "",
    merchant_order_id: transaction?.merchant_order_id || "",
    special_reference: transaction?.special_reference || transaction?.payment_key_claims?.extra?.order_ref || "",
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

  if (paymentDetails.special_reference) {
    try {
      await fetch(`${appOrigin}/api/orders/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "paymob_webhook",
          order_ref: paymentDetails.special_reference,
          status: transaction.success
            ? "confirmed"
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

  // Create Aramex shipment for successful card payments with delivery
  if (transaction?.success && paymentDetails.special_reference) {
    try {
      // Retrieve order details from order log
      const orderLogRes = await fetch(`${appOrigin}/api/orders/log?order_ref=${paymentDetails.special_reference}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (orderLogRes.ok) {
        const orderData = (await orderLogRes.json()) as OrderLogResponse;
        
        // --- PREVENT DUPLICATES ---
        // Only create shipment if it's a delivery order AND we haven't already created a tracking number for it
        if (orderData?.delivery_method === "delivery" && orderData?.customer && !orderData?.aramex?.trackingNumber) {
          console.log(`[Webhook] Proceeding with Aramex shipment for order: ${paymentDetails.special_reference}`);
          
          const shipmentRes = await fetch(`${appOrigin}/api/aramex/shipment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderRef: paymentDetails.special_reference,
              customer: orderData.customer,
              items: orderData.items?.map((item: { name: string; quantity: number }) => ({
                name: item.name,
                quantity: item.quantity,
              })) || [],
              totalValue: (paymentDetails.amount_cents || 0) / 100,
              cod: false,
            }),
          });

          const shipmentData = await shipmentRes.json();
          
          if (shipmentData.success) {
            console.log("[Webhook] Aramex shipment created:", shipmentData.trackingNumber);
            
            // Update order with tracking info
            await fetch(`${appOrigin}/api/orders/log`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "paymob_webhook_aramex",
                order_ref: paymentDetails.special_reference,
                status: "shipped", // Update overall status
                payment_status: "Paid", // Ensure payment status is updated
                aramex: {
                  trackingNumber: shipmentData.trackingNumber,
                  labelUrl: shipmentData.labelUrl,
                  guid: shipmentData.guid,
                },
                payment: paymentDetails,
                updated_at: new Date().toISOString(),
              }),
            });
          } else {
            console.error("[Webhook] Failed to create Aramex shipment:", shipmentData.error);
          }
        } else if (orderData?.aramex?.trackingNumber) {
          console.log(`[Webhook] Shipment already exists for order ${paymentDetails.special_reference}. Skipping Aramex.`);
        }
      }
    } catch (err) {
      console.error("[Webhook] Aramex shipment creation error:", err);
      // Don't block webhook response if shipment fails
    }
  }

  return NextResponse.json({ received: true, payment_status: paymentDetails.payment_status });
}
