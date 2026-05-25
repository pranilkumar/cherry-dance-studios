import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { signAdminToken, cookieOptions, ADMIN_COOKIE } from '../../../../src/lib/adminAuth';

/**
 * Admin credential check.
 * On success: signs an HMAC token and sets it as an httpOnly cookie.
 * The client never sees the token — it's sent automatically by the browser
 * on every subsequent /admin request and verified server-side.
 *
 * Required in your hosting environment:
 *   ADMIN_EMAIL        — login email
 *   ADMIN_PASSWORD     — login password
 *   ADMIN_JWT_SECRET   — random secret ≥ 32 chars for signing tokens
 *
 * Dev fallbacks are used only when NODE_ENV !== 'production'.
 */

const DEFAULT_EMAIL    = 'admin@cherrydance.com';
const DEFAULT_PASSWORD = 'cherry123';

/** Constant-time string comparison that also handles length differences. */
function safeEqual(a, b) {
  // Pad to the same length so timingSafeEqual doesn't throw on mismatched sizes,
  // but record any length difference as a separate flag to avoid length leaks.
  const aLen = Buffer.byteLength(a);
  const bLen = Buffer.byteLength(b);
  const maxLen = Math.max(aLen, bLen);
  const aBuf = Buffer.alloc(maxLen);
  const bBuf = Buffer.alloc(maxLen);
  aBuf.write(a);
  bBuf.write(b);
  return crypto.timingSafeEqual(aBuf, bBuf) && aLen === bLen;
}

export async function POST(request) {
  // In production, refuse to operate if login credentials are not explicitly configured.
  // (ADMIN_JWT_SECRET is optional — adminAuth.js derives a fallback from the password —
  //  but relying on defaults for the email/password itself is a security risk.)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('[admin/login] ADMIN_EMAIL and ADMIN_PASSWORD must be set in production.');
      return NextResponse.json({ ok: false, error: 'Server misconfiguration.' }, { status: 503 });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
  }

  const validEmail    = (process.env.ADMIN_EMAIL    || DEFAULT_EMAIL).toLowerCase();
  const validPassword =  process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

  // Both email and password use constant-time comparison to prevent timing attacks.
  const emailMatch    = safeEqual(email.toLowerCase(), validEmail);
  const passwordMatch = safeEqual(password, validPassword);

  if (emailMatch && passwordMatch) {
    const token = signAdminToken(validEmail);
    const opts  = cookieOptions();
    const res   = NextResponse.json({ ok: true, email: validEmail });

    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: opts.httpOnly,
      secure:   opts.secure,
      sameSite: opts.sameSite,
      path:     opts.path,
      maxAge:   opts.maxAge,
    });
    return res;
  }

  // Add a small delay to slow brute-force attempts
  await new Promise((r) => setTimeout(r, 350));
  return NextResponse.json({ ok: false, error: 'Invalid credentials.' }, { status: 401 });
}
