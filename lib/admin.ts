import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const raw = process.env.ADMIN_PASSWORD;
  if (raw === undefined || raw === "") {
    throw new Error("ADMIN_PASSWORD is not set in environment");
  }
  // Trim so trailing newline/space in .env doesn't break login
  return raw.trim();
}

export function createSessionToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", secret).update(timestamp).digest("hex");
  return `${timestamp}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const secret = getSecret();
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) return false;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age < 0 || age > SESSION_MAX_AGE_MS) return false;

    const expected = createHmac("sha256", secret).update(timestamp).digest("hex");
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  try {
    const secret = getSecret();
    if (!secret) return false;
    const expected = createHmac("sha256", secret).update(secret).digest();
    const actual = createHmac("sha256", secret).update(password).digest();
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function requireAdminSession(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return !!(token && verifySessionToken(token));
}

export { ADMIN_COOKIE_NAME };
