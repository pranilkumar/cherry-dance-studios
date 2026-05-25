import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '../../../../src/lib/adminAuth';

/**
 * POST /api/admin/logout
 * Clears the httpOnly admin session cookie.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/admin',
    maxAge:   0, // immediate expiry
  });
  return res;
}
