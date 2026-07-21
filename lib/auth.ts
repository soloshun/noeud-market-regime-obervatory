/**
 * Shared-secret gate for the observatory.
 *
 * A single shared key (OBSERVATORY_SHARED_SECRET) lets a user in. On success a
 * signed, HMAC'd session cookie is issued (OBSERVATORY_COOKIE_SECRET signs it),
 * and the proxy verifies that cookie on every request. No user accounts.
 */
const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "noeud_regime_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
const DEFAULT_SHARED_SECRET = "noeud-regime-dev";
const DEFAULT_COOKIE_SECRET = "noeud-regime-cookie-dev";

function readSharedSecret(): string {
  const value = process.env.OBSERVATORY_SHARED_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("OBSERVATORY_SHARED_SECRET is required in production");
  }
  return DEFAULT_SHARED_SECRET;
}

function readCookieSecret(): string {
  const value = process.env.OBSERVATORY_COOKIE_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("OBSERVATORY_COOKIE_SECRET is required in production");
  }
  return DEFAULT_COOKIE_SECRET;
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signaturesMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now();
  const payload = JSON.stringify({
    scope: "observatory",
    issued_at: issuedAt,
    expires_at: issuedAt + SESSION_TTL_SECONDS * 1000,
  });
  const encodedPayload = toBase64Url(encoder.encode(payload));
  const signature = await hmacSha256(encodedPayload, readCookieSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = await hmacSha256(payload, readCookieSecret());
  if (!signaturesMatch(signature, expected)) return false;

  try {
    const decoded = JSON.parse(fromBase64Url(payload)) as {
      scope?: unknown;
      expires_at?: unknown;
    };
    return (
      decoded.scope === "observatory" &&
      typeof decoded.expires_at === "number" &&
      decoded.expires_at > Date.now()
    );
  } catch {
    return false;
  }
}

export function isPasswordValid(candidate: string): boolean {
  return candidate === readSharedSecret();
}
