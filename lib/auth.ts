/**
 * Shared-secret gate for the observatory.
 *
 * A single shared key (OBSERVATORY_SHARED_SECRET) lets a user in. On success a
 * signed, HMAC'd session cookie is issued (OBSERVATORY_COOKIE_SECRET signs it),
 * and the proxy verifies that cookie on every request. No user accounts.
 */
const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "noeud_regime_session";
const DEFAULT_SHARED_SECRET = "noeud-regime-dev";
const DEFAULT_COOKIE_SECRET = "noeud-regime-cookie-dev";

function readSharedSecret(): string {
  return process.env.OBSERVATORY_SHARED_SECRET?.trim() || DEFAULT_SHARED_SECRET;
}

function readCookieSecret(): string {
  return process.env.OBSERVATORY_COOKIE_SECRET?.trim() || DEFAULT_COOKIE_SECRET;
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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
  const payload = JSON.stringify({ scope: "observatory", created_at: Date.now() });
  const encodedPayload = toBase64Url(encoder.encode(payload));
  const signature = await hmacSha256(encodedPayload, readCookieSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = await hmacSha256(payload, readCookieSecret());
  return signature === expected;
}

export function isPasswordValid(candidate: string): boolean {
  return candidate === readSharedSecret();
}
