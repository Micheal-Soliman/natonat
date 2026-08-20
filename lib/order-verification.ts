import { createHmac, timingSafeEqual } from "node:crypto";

type VerificationOrder = Record<string, unknown>;

export function isOrderVerificationEnabled() {
  return process.env.ORDER_VERIFICATION_ENABLED === "true";
}

function getSecret() {
  return process.env.ORDER_CONFIRMATION_SECRET || "";
}

export function createOrderConfirmationToken(orderRef: string) {
  const secret = getSecret();
  if (!secret) throw new Error("ORDER_CONFIRMATION_SECRET is not configured");
  return createHmac("sha256", secret).update(orderRef).digest("base64url");
}

export function verifyOrderConfirmationToken(orderRef: string, token: string) {
  if (!orderRef || !token || !getSecret()) return false;
  const expected = createOrderConfirmationToken(orderRef);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
}

function getObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeEgyptPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = `20${phone.slice(1)}`;
  if (!phone.startsWith("20")) phone = `20${phone}`;
  return phone;
}

function getOrderDetails(order: VerificationOrder) {
  const items = Array.isArray(order.items) ? order.items : [];
  return items
    .map((item) => {
      const row = getObject(item);
      const quantity = Math.max(1, Number(row.quantity || 1));
      const price = Number(row.unit_price_egp || row.price_egp || row.price || 0);
      const variants = [row.size, row.color].filter(Boolean).join(" / ");
      return `${quantity}x ${String(row.name || "Product")}${variants ? ` (${variants})` : ""} - EGP ${Math.round(price * quantity)}`;
    })
    .join("\n")
    .slice(0, 900);
}

export async function sendOrderVerificationWhatsApp(
  order: VerificationOrder,
  options: { reminder?: boolean } = {},
) {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = options.reminder
    ? process.env.WHATSAPP_ORDER_REMINDER_TEMPLATE || process.env.WHATSAPP_ORDER_CONFIRMATION_TEMPLATE
    : process.env.WHATSAPP_ORDER_CONFIRMATION_TEMPLATE;
  const orderRef = String(order.order_ref || "");
  const customer = getObject(order.customer);
  const phone = normalizeEgyptPhone(customer.phone);

  if (!accessToken || !phoneNumberId || !templateName || !orderRef || phone.length < 11) {
    return { success: false, error: "WhatsApp order verification is not fully configured" };
  }

  const token = createOrderConfirmationToken(orderRef);
  const total = Number(order.amount_egp || 0);
  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: String(order.locale || "ar") === "ar" ? "ar" : "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(customer.first_name || "Customer") },
              { type: "text", text: getOrderDetails(order) || "natOnat order" },
              { type: "text", text: `EGP ${Math.round(total)}` },
              { type: "text", text: orderRef },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: `${encodeURIComponent(orderRef)}&token=${encodeURIComponent(token)}` }],
          },
        ],
      },
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  return response.ok
    ? { success: true, data }
    : { success: false, error: `WhatsApp Cloud API ${response.status}: ${JSON.stringify(data)}` };
}
