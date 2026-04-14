import { NextResponse } from "next/server";

type OrderLogBody = Record<string, unknown>;

export async function POST(req: Request) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not set" },
      { status: 500 }
    );
  }

  let body: OrderLogBody;
  try {
    body = (await req.json()) as OrderLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to write to Google Sheets", status: res.status, data: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: text });
}
