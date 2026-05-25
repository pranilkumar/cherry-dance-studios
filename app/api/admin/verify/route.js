import { NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '../../../../src/lib/adminAuth';

/**
 * GET /api/admin/verify
 * Reads the httpOnly admin cookie and verifies the HMAC token.
 * Returns { ok: true, email } on success or { ok: false } on failure.
 * Called by AdminLayoutWrapper on every mount to gate access.
 */
export async function GET(request) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const data  = verifyAdminToken(token);

  if (!data) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, email: data.email });
}
