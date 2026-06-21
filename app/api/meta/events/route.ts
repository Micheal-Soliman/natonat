import crypto from "crypto";
import { NextResponse } from "next/server";

type MetaEventBody = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
  user_data?: Record<string, unknown>;
};

const META_PIXEL_ID =
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

function getCookie(headers: Headers, name: string) {
  const cookieHeader = headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim();

  return headers.get("x-real-ip") || undefined;
}

export async function POST(req: Request) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ ok: true, skipped: "META_ACCESS_TOKEN is not set" });
  }

  let body: MetaEventBody;

  try {
    body = (await req.json()) as MetaEventBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.event_name) {
    return NextResponse.json({ error: "event_name is required" }, { status: 400 });
  }

  const event = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id,
    action_source: "website",
    event_source_url: body.event_source_url,
    user_data: {
      client_ip_address: getClientIp(req.headers),
      client_user_agent: req.headers.get("user-agent") || undefined,
      fbp: getCookie(req.headers, "_fbp"),
      fbc: getCookie(req.headers, "_fbc"),
      em: sha256(body.user_data?.email || body.custom_data?.email),
      ph: sha256(body.user_data?.phone || body.custom_data?.phone),
    },
    custom_data: body.custom_data || {},
  };

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
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
      event_name: body.event_name,
    });

    return NextResponse.json({ error: "Meta CAPI request failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, data });
}
