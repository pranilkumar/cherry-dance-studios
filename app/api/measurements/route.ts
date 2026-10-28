import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE } from '../../../src/lib/adminAuth';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';

export async function GET(request: Request) {
  // Admin-only — verify session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get('event')?.trim();

  let query = supabaseAdmin
    .from('costume_measurements')
    .select('*')
    .order('submitted_at', { ascending: true });

  if (eventSlug) {
    query = query.eq('event_slug', eventSlug);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[measurements GET]', error);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
