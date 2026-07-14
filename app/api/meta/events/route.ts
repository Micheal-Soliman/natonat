import { NextResponse } from "next/server";

import {
  getMetaClientIp,
  getMetaCookie,
  META_PIXEL_ID,
  sendMetaConversionEvent,
} from "@/lib/meta-capi";

type MetaEventBody = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
  user_data?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: MetaEventBody;

  try {
    body = (await req.json()) as MetaEventBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.event_name) {
    return NextResponse.json({ error: "event_name is required" }, { status: 400 });
  }

  const result = await sendMetaConversionEvent({
    eventName: body.event_name,
    eventId: body.event_id || `${body.event_name}.${Date.now()}`,
    eventSourceUrl: body.event_source_url,
    customData: body.custom_data || {},
    userData: {
      ...(body.user_data || {}),
      email: body.user_data?.email || body.custom_data?.email,
      phone: body.user_data?.phone || body.custom_data?.phone,
      fbp: getMetaCookie(req.headers, "_fbp"),
      fbc: getMetaCookie(req.headers, "_fbc"),
    },
    userAgent: req.headers.get("user-agent"),
    clientIp: getMetaClientIp(req.headers),
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Meta CAPI request failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, pixel_id: META_PIXEL_ID, data: result.data, skipped: result.skipped });
}
