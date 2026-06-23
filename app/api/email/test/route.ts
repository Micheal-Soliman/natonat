import crypto from "crypto";
import { NextResponse } from "next/server";

import { sendSmtpTestEmail } from "@/lib/email";

const TEST_KEY_HASH = "846133f0c540f920f63fbbefceacce0e4b459ac03712d917d7112ad509053a28";

export async function POST(req: Request) {
  const key = req.headers.get("x-email-test-key") || "";
  const receivedHash = crypto.createHash("sha256").update(key).digest("hex");

  if (!key || receivedHash !== TEST_KEY_HASH) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await sendSmtpTestEmail();
    return NextResponse.json(result);
  } catch (error) {
    console.error("SMTP test failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SMTP test failed" },
      { status: 502 },
    );
  }
}
