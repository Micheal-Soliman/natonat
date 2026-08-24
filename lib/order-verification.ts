import { createHmac, timingSafeEqual } from "node:crypto";

type VerificationOrder = Record<string, unknown>;
export type OrderVerificationAction = "confirm" | "cancel";

let cachedWhatsAppPhoneNumberId = "";

export function isOrderVerificationEnabled() {
  return process.env.ORDER_VERIFICATION_ENABLED === "true";
}

function getSecret() {
  return process.env.ORDER_CONFIRMATION_SECRET || "";
}

export function createOrderConfirmationToken(
  orderRef: string,
  action: OrderVerificationAction = "confirm",
) {
  const secret = getSecret();
  if (!secret) throw new Error("ORDER_CONFIRMATION_SECRET is not configured");
  return createHmac("sha256", secret)
    .update(`${action}:${orderRef}`)
    .digest("base64url");
}

export function verifyOrderConfirmationToken(
  orderRef: string,
  token: string,
  action: OrderVerificationAction = "confirm",
) {
  if (!orderRef || !token || !getSecret()) return false;
  const tokenBuffer = Buffer.from(token);
  const candidates = [createOrderConfirmationToken(orderRef, action)];
  // Keep confirmation links created by the previous URL-button version valid.
  if (action === "confirm") {
    candidates.push(createHmac("sha256", getSecret()).update(orderRef).digest("base64url"));
  }

  return candidates.some((expected) => {
    const expectedBuffer = Buffer.from(expected);
    return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
  });
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

async function resolveWhatsAppPhoneNumberId(configuredId: string, accessToken: string) {
  if (cachedWhatsAppPhoneNumberId) return cachedWhatsAppPhoneNumberId;

  const headers = { Authorization: `Bearer ${accessToken}` };
  const directResponse = await fetch(
    `https://graph.facebook.com/v23.0/${encodeURIComponent(configuredId)}?fields=id,display_phone_number`,
    { headers, cache: "no-store" },
  );
  const directData = await directResponse.json().catch(() => null) as {
    id?: string;
    display_phone_number?: string;
  } | null;

  if (directResponse.ok && directData?.id && directData.display_phone_number) {
    cachedWhatsAppPhoneNumberId = directData.id;
    return cachedWhatsAppPhoneNumberId;
  }

  // Meta exposes the WABA ID and Phone Number ID in adjacent screens. Accept
  // either value so a WABA ID cannot silently break order confirmations.
  const listResponse = await fetch(
    `https://graph.facebook.com/v23.0/${encodeURIComponent(configuredId)}/phone_numbers?fields=id`,
    { headers, cache: "no-store" },
  );
  const listData = await listResponse.json().catch(() => null) as {
    data?: Array<{ id?: string }>;
  } | null;
  const phoneNumberId = listResponse.ok && listData?.data?.length === 1
    ? String(listData.data[0]?.id || "")
    : "";

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not a usable Phone Number ID or single-number WABA ID");
  }

  cachedWhatsAppPhoneNumberId = phoneNumberId;
  return cachedWhatsAppPhoneNumberId;
}

function getOrderTemplateFields(order: VerificationOrder) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((item) => getObject(item));
  const productNames = rows
    .map((row) => String(row.name || row.title || row.slug || "Product"))
    .filter(Boolean)
    .join("، ")
    .slice(0, 700);
  const sizes = rows
    .map((row) => String(row.size || "-").toUpperCase())
    .filter(Boolean)
    .join("، ")
    .slice(0, 300);
  const quantity = rows.reduce(
    (total, row) => total + Math.max(1, Number(row.quantity || row.qty || 1) || 1),
    0,
  );

  return {
    productNames: productNames || "natOnat order",
    sizes: sizes || "-",
    quantity: Math.max(1, quantity),
  };
}

export function createOrderVerificationPayload(
  orderRef: string,
  action: OrderVerificationAction,
) {
  return `${action}|${orderRef}|${createOrderConfirmationToken(orderRef, action)}`;
}

export function parseOrderVerificationPayload(payload: string) {
  const [actionValue, orderRefValue, token] = String(payload || "").split("|");
  const action: OrderVerificationAction | null = actionValue === "confirm" || actionValue === "cancel"
    ? actionValue
    : null;
  const orderRef = String(orderRefValue || "").trim().toUpperCase();

  if (!action || !orderRef || !token) return null;
  if (!verifyOrderConfirmationToken(orderRef, token, action)) return null;

  return { action, orderRef };
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

  const total = Number(order.amount_egp || 0);
  const fields = getOrderTemplateFields(order);
  let resolvedPhoneNumberId: string;
  try {
    resolvedPhoneNumberId = await resolveWhatsAppPhoneNumberId(phoneNumberId, accessToken);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not resolve WhatsApp Phone Number ID",
    };
  }

  const response = await fetch(`https://graph.facebook.com/v23.0/${resolvedPhoneNumberId}/messages`, {
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
        language: { code: process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE || "ar" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(customer.first_name || "Customer") },
              { type: "text", text: fields.productNames },
              { type: "text", text: fields.sizes },
              { type: "text", text: String(fields.quantity) },
              { type: "text", text: String(Math.round(total)) },
            ],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: createOrderVerificationPayload(orderRef, "confirm") }],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: createOrderVerificationPayload(orderRef, "cancel") }],
          },
        ],
      },
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  const messageId = data && typeof data === "object" && Array.isArray(data.messages)
    ? String(data.messages[0]?.id || "")
    : "";

  return response.ok
    ? { success: true, data, messageId }
    : { success: false, error: `WhatsApp Cloud API ${response.status}: ${JSON.stringify(data)}` };
}
