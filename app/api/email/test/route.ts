import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: string | undefined, fallback = true) {
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");
  if (!name || !domain) return value ? "***" : "";
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function POST(req: Request) {
  const configuredToken = process.env.EMAIL_TEST_TOKEN;
  const requestToken = req.headers.get("x-email-test-token") || "";

  if (!configuredToken || requestToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const to =
    getString(body.to) ||
    process.env.ORDER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.EMAIL_USER ||
    "";

  const host = process.env.INFO_EMAIL_SMTP_HOST;
  const port = Number(process.env.INFO_EMAIL_SMTP_PORT || 465);
  const secure = getBoolean(process.env.INFO_EMAIL_SMTP_SECURE, port === 465);
  const user = process.env.INFO_EMAIL_USER;
  const pass = process.env.INFO_EMAIL_PASS;
  const from = process.env.INFO_EMAIL_FROM || user;

  const missing = [
    ["INFO_EMAIL_SMTP_HOST", host],
    ["INFO_EMAIL_USER", user],
    ["INFO_EMAIL_PASS", pass],
    ["INFO_EMAIL_FROM or INFO_EMAIL_USER", from],
    ["recipient", to],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) {
    return NextResponse.json(
      {
        error: "Missing info email test configuration",
        missing,
      },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from,
      to,
      subject: "natOnat info email SMTP test",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>info@natonat.com SMTP test</h2>
          <p>This is a safe test email from the natOnat website.</p>
          <p>If you received this, the info email SMTP can send successfully.</p>
          <p style="color:#777;font-size:12px">Sent at ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      from: maskEmail(from || ""),
      to: maskEmail(to),
      host,
      port,
      secure,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        from: maskEmail(from || ""),
        to: maskEmail(to),
        host,
        port,
        secure,
      },
      { status: 502 },
    );
  }
}
