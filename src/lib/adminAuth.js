/**
 * Lightweight HMAC-SHA256 token helpers for the admin session cookie.
 *
 * Token format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)
 *
 * Why not a library?
 *   - No additional deps; Node's built-in `crypto` is available in Next.js API routes.
 *   - The signing key never leaves the server — tokens are verified server-side only.
 *
 * Required env vars:
 *   ADMIN_JWT_SECRET  — random secret used to sign tokens (min 32 chars recommended)
 *   ADMIN_EMAIL       — admin login email
 *   ADMIN_PASSWORD    — admin login password
 */

import crypto from 'crypto';

export const ADMIN_COOKIE   = 'cds_admin_token';
export const TOKEN_MAX_AGE  = 8 * 60 * 60; // 8 hours in seconds

function getSecret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) {
    // Fallback keeps local dev working; log a warning so it's obvious in CI/prod logs.
    if (process.env.NODE_ENV === 'production') {
      console.error('[admin auth] ADMIN_JWT_SECRET is not set — admin tokens are insecure! Add it to your environment variables immediately.');
    } else {
      console.warn('[admin auth] ADMIN_JWT_SECRET not set — using dev fallback. Set it in .env.local.');
    }
    return `cds-admin-dev-secret-${process.env.ADMIN_PASSWORD || 'changeme'}`;
  }
  return s;
}

/**
 * Create a signed token for the given email.
 * @param {string} email
 * @returns {string}
 */
export function signAdminToken(email) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ email, iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verify a token. Returns the decoded payload { email, iat, exp } or null.
 * @param {string|undefined} token
 * @returns {{ email: string, iat: number, exp: number } | null}
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig     = token.slice(dotIndex + 1);

  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  // Reject if lengths differ (avoids timingSafeEqual buffer-length assertion)
  if (sig.length !== expectedSig.length) return null;

  const sigBuf      = Buffer.from(sig,         'base64url');
  const expectedBuf = Buffer.from(expectedSig, 'base64url');

  try {
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Cookie options for Set-Cookie.
 * @param {number} maxAge  seconds until expiry (0 = delete)
 */
export function cookieOptions(maxAge = TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/',
    maxAge,
  };
}
