import crypto from "crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getSessionSecret() {
  return (
    process.env.ADMIN_DASHBOARD_SESSION_SECRET ||
    process.env.ADMIN_DASHBOARD_PASSWORD ||
    (process.env.NODE_ENV !== "production" ? "dev-admin-session-secret" : "") ||
    ""
  );
}

function signSession(username: string, issuedAt: number) {
  const secret = getSessionSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(`${username}.${issuedAt}`)
    .digest("hex");
}

export function validateAdminCredentials(username: string, password: string) {
  const configuredUsername = process.env.ADMIN_DASHBOARD_USERNAME;
  const configuredPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!configuredUsername || !configuredPassword) {
    return process.env.NODE_ENV !== "production" && username === "admin" && password === "admin";
  }

  return safeEqual(username, configuredUsername) && safeEqual(password, configuredPassword);
}

export function createAdminSession(username: string) {
  const issuedAt = Date.now();
  const signature = signSession(username, issuedAt);
  if (!signature) return "";

  return `${Buffer.from(username).toString("base64url")}.${issuedAt}.${signature}`;
}

export function isAdminAuthorized(req: Request) {
  const providedToken = getBearerToken(req);
  if (!providedToken) return false;

  const [encodedUsername, issuedAtRaw, signature] = providedToken.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!encodedUsername || !Number.isFinite(issuedAt) || !signature) return false;
  if (Date.now() - issuedAt > SESSION_TTL_MS) return false;

  const username = Buffer.from(encodedUsername, "base64url").toString("utf8");
  const expected = signSession(username, issuedAt);
  return Boolean(expected && safeEqual(signature, expected));
}
