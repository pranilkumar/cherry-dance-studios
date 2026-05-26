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

/**
 * Simple in-memory rate limiter — 10 attempts per IP per 15-minute window.
 * Resets on cold start (acceptable for a single-admin studio app).
 */
const attempts = new Map(); // ip → { count, resetAt }
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

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
  // Rate-limit by IP — 10 attempts per 15 minutes.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

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
