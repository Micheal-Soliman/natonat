import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    payload = await req.text();
  }

  console.log("Paymob webhook received:", payload);

  // Extract key payment details from Paymob payload
  const paymentDetails = {
    order_id: payload?.order?.id || payload?.order_id || "",
    merchant_order_id: payload?.merchant_order_id || "",
    special_reference: payload?.special_reference || payload?.payment_key_claims?.extra?.order_ref || "",
    payment_status: payload?.success ? "Paid" : payload?.pending ? "Pending" : "Failed",
    transaction_id: payload?.id || "",
    amount_cents: payload?.amount_cents || payload?.order?.amount_cents || 0,
    currency: payload?.currency || "EGP",
    payment_method: payload?.source_data?.type || payload?.payment_method || "",
    card_last_four: payload?.source_data?.pan || payload?.source_data?.last_four || "",
    card_sub_type: payload?.source_data?.sub_type || "",
    gateway_integration_id: payload?.gateway_integration_id || "",
    created_at: payload?.created_at || new Date().toISOString(),
    error_occured: payload?.error_occured || false,
    is_refunded: payload?.is_refunded || false,
    refunded_amount_cents: payload?.refunded_amount_cents || 0,
    captured_amount: payload?.captured_amount || 0,
    source: "paymob_webhook",
    received_at: new Date().toISOString(),
    raw_payload: payload,
  };

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentDetails),
        cache: "no-store",
      });
    } catch {
      // ignore forwarding errors
    }
  }

  // Create Aramex shipment for successful card payments with delivery
  if (payload?.success && paymentDetails.special_reference) {
    try {
      // Retrieve order details from order log
      const orderLogRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/orders/log?order_ref=${paymentDetails.special_reference}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (orderLogRes.ok) {
        const orderData = await orderLogRes.json();
        
        // Only create shipment for delivery orders (not pickup)
        if (orderData?.delivery_method === "delivery" && orderData?.customer) {
          const shipmentRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/aramex/shipment`, {
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
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/orders/log`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "paymob_webhook_aramex",
                order_ref: paymentDetails.special_reference,
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
        }
      }
    } catch (err) {
      console.error("[Webhook] Aramex shipment creation error:", err);
      // Don't block webhook response if shipment fails
    }
  }

  return NextResponse.json({ received: true, payment_status: paymentDetails.payment_status });
}
