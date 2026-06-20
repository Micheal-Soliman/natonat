import { NextResponse } from "next/server";

type CreateIntentionItem = {
  name: string;
  amount: number;
  description?: string;
  quantity?: number;
};

type CreateIntentionBody = {
  amount: number;
  currency: string;
  payment_methods: number[];
  items?: CreateIntentionItem[];
  billing_data: {
    apartment?: string;
    first_name: string;
    last_name: string;
    street?: string;
    building?: string;
    phone_number: string;
    city?: string;
    country?: string;
    email: string;
    floor?: string;
    state?: string;
  };
  extras?: Record<string, unknown>;
  special_reference?: string;
  notification_url?: string;
  redirection_url?: string;
  expiration?: number;
};

export async function POST(req: Request) {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const baseUrl = process.env.PAYMOB_BASE_URL || "https://accept.paymob.com";
  const defaultCurrency = process.env.PAYMOB_CURRENCY || "EGP";

  if (!secretKey) {
    return NextResponse.json(
      { error: "PAYMOB_SECRET_KEY is not set" },
      { status: 500 }
    );
  }

  let body: Partial<CreateIntentionBody>;

  try {
    body = (await req.json()) as Partial<CreateIntentionBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.amount || typeof body.amount !== "number") {
    return NextResponse.json({ error: "amount is required" }, { status: 400 });
  }

  if (!body.billing_data) {
    return NextResponse.json(
      { error: "billing_data is required" },
      { status: 400 }
    );
  }

  if (
    !body.billing_data.first_name ||
    !body.billing_data.last_name ||
    !body.billing_data.email ||
    !body.billing_data.phone_number
  ) {
    return NextResponse.json(
      {
        error:
          "billing_data.first_name, last_name, email, phone_number are required",
      },
      { status: 400 }
    );
  }

  const paymentMethodsFromEnv = (process.env.PAYMOB_INTEGRATION_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));

  const payment_methods =
    Array.isArray(body.payment_methods) && body.payment_methods.length > 0
      ? body.payment_methods
      : paymentMethodsFromEnv;

  if (!payment_methods || payment_methods.length === 0) {
    return NextResponse.json(
      {
        error:
          "payment_methods is required (or set PAYMOB_INTEGRATION_IDS env)",
      },
      { status: 400 }
    );
  }

  const requestOrigin = req.headers.get("origin") || "";
  const origin =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    requestOrigin;

  const locale =
    typeof body.extras?.locale === "string" && body.extras.locale
      ? body.extras.locale
      : "en";

  const orderRef = body.special_reference || "";

  const notification_url =
    body.notification_url ||
    (origin ? `${origin}/api/paymob/webhook` : undefined);

  const redirection_url =
    body.redirection_url ||
    (origin
      ? `${origin}/${locale}/order-confirmed${
          orderRef
            ? `?order_ref=${encodeURIComponent(orderRef)}&method=card`
            : "?method=card"
        }`
      : undefined);

  const payload: CreateIntentionBody = {
    amount: body.amount,
    currency: body.currency || defaultCurrency,
    payment_methods,
    items: body.items,
    billing_data: body.billing_data,
    extras: body.extras,
    special_reference: body.special_reference,
    notification_url,
    redirection_url,
    expiration: body.expiration,
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("Paymob intention payload:", {
      amount: payload.amount,
      currency: payload.currency,
      payment_methods: payload.payment_methods,
      special_reference: payload.special_reference,
      notification_url: payload.notification_url,
      redirection_url: payload.redirection_url,
    });
  }

  let res: Response;

  try {
    res = await fetch(`${baseUrl}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Paymob intention network error", {
      message: error instanceof Error ? error.message : String(error),
      baseUrl,
      special_reference: payload.special_reference,
    });

    return NextResponse.json(
      {
        error: "Could not reach Paymob",
      },
      { status: 502 }
    );
  }

  const text = await res.text();

  let data: unknown = text;

  try {
    data = JSON.parse(text);
  } catch {
    // Keep as text
  }

  if (!res.ok) {
    console.error("Paymob intention rejected", {
      status: res.status,
      data,
      amount: payload.amount,
      currency: payload.currency,
      payment_methods: payload.payment_methods,
      has_items: Boolean(payload.items?.length),
      special_reference: payload.special_reference,
      notification_url: payload.notification_url,
      redirection_url: payload.redirection_url,
    });

    return NextResponse.json(
      {
        error: "Paymob request failed",
        status: res.status,
        data,
      },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
