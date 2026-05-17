import { NextResponse } from 'next/server';

/**
 * Server-side admin credential check. Reads ADMIN_EMAIL + ADMIN_PASSWORD
 * from non-public env vars (so they're not bundled into the client).
 *
 * Fallback defaults match the dev creds (admin@cherrydance.com / cherry123)
 * so existing local setups keep working — set ADMIN_EMAIL and ADMIN_PASSWORD
 * in production to override. CHANGE THESE BEFORE LAUNCH.
 *
 * Not real Supabase Auth — still a localStorage gate on the client side —
 * but at least the credentials aren't shipped to the browser anymore.
 */

const DEFAULT_EMAIL = 'admin@cherrydance.com';
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

  const validEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).toLowerCase();
  const validPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

  if (email.toLowerCase() === validEmail && password === validPassword) {
    return NextResponse.json({ ok: true, email: validEmail });
  }

  // Constant-ish delay to make brute-forcing slower
  await new Promise((r) => setTimeout(r, 250));
  return NextResponse.json(
    { ok: false, error: 'Invalid credentials.' },
    { status: 401 }
  );
}
