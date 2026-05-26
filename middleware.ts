import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'cds_admin_token';

/** Decode a base64url string to a Uint8Array (Edge-safe, no Node crypto). */
function base64urlToBytes(str) {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Verify an HMAC-SHA256 admin token using the Web Crypto API.
 * Mirrors the logic in src/lib/adminAuth.js but uses SubtleCrypto so it
 * runs in the Edge runtime without importing Node's `crypto` module.
 */
async function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const sig     = token.slice(dotIndex + 1);

  const secret =
    process.env.ADMIN_JWT_SECRET ||
    `cds-admin-dev-secret-${process.env.ADMIN_PASSWORD || 'changeme'}`;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlToBytes(sig),
      encoder.encode(payload),
    );
    if (!valid) return false;

    const data = JSON.parse(new TextDecoder().decode(base64urlToBytes(payload)));
    return typeof data.exp === 'number' && data.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/**
 * Protect all /admin/* routes (everything except the login page at /admin).
 * The token is verified cryptographically here — not just checked for presence —
 * so this replaces the client-side useEffect auth gate in AdminLayoutWrapper.
 */
export async function middleware(request) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = await verifyAdminToken(token);

  if (!valid) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Only intercept sub-routes of /admin, not the login page itself.
export const config = {
  matcher: ['/admin/:path+'],
};
