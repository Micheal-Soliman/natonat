import crypto from "crypto";

const CODE_PARTS = 5;

function getSecret() {
  return (
    process.env.RESCUE_DISCOUNT_SECRET ||
    ""
  );
}

function normalizePrefix(prefix?: string) {
  const clean = (prefix || "NAT").replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, 8) || "NAT";
}

function signCode(prefix: string, percent: number, expiresAt: number, random: string) {
  const secret = getSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(`${prefix}.${percent}.${expiresAt}.${random}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

export function generateConversionRescueCode({
  percent,
  prefix,
  validityHours,
}: {
  percent: number;
  prefix?: string;
  validityHours?: number;
}) {
  const normalizedPercent = Math.max(1, Math.min(90, Math.floor(Number(percent) || 0)));
  const normalizedPrefix = normalizePrefix(prefix);
  const hours = Math.max(1, Math.min(168, Math.floor(Number(validityHours) || 24)));
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const signature = signCode(normalizedPrefix, normalizedPercent, expiresAt, random);

  if (!signature) return null;

  return {
    code: `${normalizedPrefix}-${normalizedPercent}-${expiresAt.toString(36).toUpperCase()}-${random}-${signature}`,
    percent: normalizedPercent,
    expiresAt,
  };
}

export function validateConversionRescueCode(code: string) {
  const parts = code.trim().toUpperCase().split("-");
  if (parts.length !== CODE_PARTS) return null;

  const [prefix, percentPart, expiresAtPart, random, signature] = parts;
  const percent = Number(percentPart);
  const expiresAt = Number.parseInt(expiresAtPart, 36);

  if (!prefix || !Number.isFinite(percent) || !Number.isFinite(expiresAt) || !random || !signature) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return { valid: false as const, reason: "expired" };
  }

  const expected = signCode(prefix, percent, expiresAt, random);
  if (!expected || expected !== signature) {
    return { valid: false as const, reason: "invalid" };
  }

  return {
    valid: true as const,
    code: parts.join("-"),
    percent: Math.max(1, Math.min(90, Math.floor(percent))),
    expiresAt,
  };
}
