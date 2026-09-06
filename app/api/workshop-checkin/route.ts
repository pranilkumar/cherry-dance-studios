import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let token: string | null = null;
  try {
    const formData = await request.formData();
    token = formData.get('token') as string | null;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('workshop_bookings')
    .select('id, checked_in_at')
    .eq('qr_token', token)
    .maybeSingle();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (!booking.checked_in_at) {
    await supabaseAdmin
      .from('workshop_bookings')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', booking.id);
  }

  return NextResponse.redirect(new URL(`/checkin/${token}`, request.url));
}
