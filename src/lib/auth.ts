const COOKIE_NAME = "hc_library_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function encoder() {
  return new TextEncoder();
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function libraryPassword(): string | undefined {
  const value = process.env.LIBRARY_PASSWORD?.trim();
  return value ? value : undefined;
}

export function isLibraryGateEnabled(): boolean {
  return Boolean(libraryPassword());
}

export function sessionCookieName(): string {
  return COOKIE_NAME;
}

export async function createSessionToken(): Promise<string> {
  const secret = libraryPassword() ?? "dev-open-library";
  const expires = Date.now() + MAX_AGE_MS;
  const payload = `ok.${expires}`;
  const signature = await hmacHex(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [flag, expiresRaw, signature] = parts;
  if (flag !== "ok") return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const secret = libraryPassword() ?? "dev-open-library";
  const expected = await hmacHex(`${flag}.${expiresRaw}`, secret);
  return timingSafeEqual(signature, expected);
}

export function verifyPassword(password: string): boolean {
  const expected = libraryPassword();
  if (!expected) return true;
  return timingSafeEqual(password, expected);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(MAX_AGE_MS / 1000),
  };
}
