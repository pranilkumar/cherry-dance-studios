import { NextResponse } from 'next/server';
import { signAdminToken, cookieOptions, ADMIN_COOKIE } from '../../../../src/lib/adminAuth';

/**
 * Admin credential check.
 * On success: signs an HMAC token and sets it as an httpOnly cookie.
 * The client never sees the token — it's sent automatically by the browser
 * on every subsequent /admin request and verified server-side.
 *
 * Set in your hosting environment:
 *   ADMIN_EMAIL        — login email
 *   ADMIN_PASSWORD     — login password
 *   ADMIN_JWT_SECRET   — random secret ≥ 32 chars for signing tokens
 *
 * Dev fallbacks (admin@cherrydance.com / cherry123) are used when env vars
 * are absent so local dev keeps working without extra setup.
 */

const DEFAULT_EMAIL    = 'admin@cherrydance.com';
const DEFAULT_PASSWORD = 'cherry123';

export async function POST(request) {
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

  // Constant-time comparison to resist timing attacks on the password
  const emailMatch    = email.toLowerCase() === validEmail;
  const passwordMatch = password.length === validPassword.length &&
    (() => {
      try {
        return require('crypto').timingSafeEqual(
          Buffer.from(password),
          Buffer.from(validPassword),
        );
      } catch { return false; }
    })();

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
