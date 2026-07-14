import crypto from "crypto";

type MetaEventInput = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  userData?: Record<string, unknown>;
  userAgent?: string | null;
  clientIp?: string | null;
};

const META_GRAPH_VERSION = "v20.0";

export const META_PIXEL_ID =
  process.env.META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  "2086939301892626";

function sha256(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function getMetaCookie(headers: Headers, name: string) {
  const cookieHeader = headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export function getMetaClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim();

  return headers.get("x-real-ip") || undefined;
}

export async function sendMetaConversionEvent(input: MetaEventInput) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    return { ok: true, skipped: "META_ACCESS_TOKEN is not set" };
  }

  const event = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    event_source_url: input.eventSourceUrl,
    user_data: {
      client_ip_address: input.clientIp || undefined,
      client_user_agent: input.userAgent || undefined,
      fbp: input.userData?.fbp,
      fbc: input.userData?.fbc,
      em: sha256(input.userData?.email),
      ph: sha256(input.userData?.phone),
    },
    custom_data: input.customData || {},
  };

  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Meta CAPI request failed", {
      status: res.status,
      data,
      event_name: input.eventName,
      event_id: input.eventId,
    });

    return { ok: false, status: res.status, data };
  }

  return { ok: true, data };
}
