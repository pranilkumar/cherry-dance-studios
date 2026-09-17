import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    workshop_id,
    package_id,
    parent_name,
    parent_email,
    parent_phone,
    children,
    gender,
    song_suggestion,
    dietary_notes,
    heard_from,
    payment_method,
  } = body as Record<string, any>;

  if (!workshop_id || !parent_name || !parent_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const email = String(parent_email).trim().toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // ── Fetch workshop server-side ───────────────────────────────────────────────
  const { data: workshop, error: wErr } = await supabaseAdmin
    .from('workshops')
    .select('id, slug, title, status, capacity, packages, starts_at, venue_name, venue_address, payment_info')
    .eq('id', workshop_id)
    .maybeSingle();

  if (wErr || !workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }
  if (workshop.status !== 'published' && workshop.status !== 'sold_out') {
    return NextResponse.json({ error: 'Workshop is not accepting registrations' }, { status: 400 });
  }

  // ── Resolve package price server-side ────────────────────────────────────────
  const packages: Array<{ id: string; label: string; price_cents: number; deadline?: string }> =
    Array.isArray(workshop.packages) ? workshop.packages : [];

  let resolvedPkg: { id: string; label: string; price_cents: number } | null = null;
  if (package_id) {
    resolvedPkg = packages.find((p) => p.id === package_id) ?? null;
    if (!resolvedPkg) {
      return NextResponse.json({ error: 'Selected package is no longer available' }, { status: 400 });
    }
  } else if (packages.length === 1) {
    resolvedPkg = packages[0];
  }

  const amountCents = resolvedPkg?.price_cents ?? 0;

  // ── Capacity check ───────────────────────────────────────────────────────────
  if (workshop.capacity != null) {
    const { count, error: cErr } = await supabaseAdmin
      .from('workshop_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('workshop_id', workshop_id)
      .neq('payment_status', 'cancelled');

    if (cErr) {
      return NextResponse.json({ error: 'Could not verify capacity. Try again.' }, { status: 500 });
    }
    if ((count ?? 0) >= workshop.capacity) {
      return NextResponse.json({ error: 'Sorry, this workshop is now full.' }, { status: 409 });
    }
  }

  // Cancel any abandoned pending bookings for this email so they can retry cleanly
  await supabaseAdmin
    .from('workshop_bookings')
    .update({ payment_status: 'cancelled' })
    .eq('workshop_id', workshop_id)
    .eq('parent_email', email)
    .eq('payment_status', 'pending');

  // ── Create pending booking ───────────────────────────────────────────────────
  const { data: booking, error: insertErr } = await supabaseAdmin
    .from('workshop_bookings')
    .insert([{
      workshop_id,
      package_id:      resolvedPkg?.id    ?? null,
      package_label:   resolvedPkg?.label ?? null,
      amount_cents:    amountCents || null,
      parent_name:     String(parent_name).trim(),
      parent_email:    email,
      parent_phone:    parent_phone ? String(parent_phone).trim() : null,
      children:        Array.isArray(children) ? children : [],
      gender:          gender          ? String(gender).trim()          || null : null,
      song_suggestion: song_suggestion ? String(song_suggestion).trim() || null : null,
      dietary_notes:   dietary_notes   ? String(dietary_notes).trim()   || null : null,
      heard_from:      heard_from      ? String(heard_from)             || null : null,
      payment_status:  'pending',
    }])
    .select('id, qr_token')
    .single();

  if (insertErr || !booking?.qr_token) {
    console.error('[workshop-checkout] insert failed:', insertErr);
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

  // ── E-Transfer — skip Stripe, leave pending, show instructions ──────────────
  if (payment_method === 'etransfer' && amountCents > 0) {
    // Notify admin so they know to watch for the transfer
    fetch(`${siteUrl}/api/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:          'workshop',
        workshopTitle: workshop.title,
        parentName:    String(parent_name).trim(),
        email,
        phone:         parent_phone ?? null,
        children:      [],
        packageLabel:  resolvedPkg?.label ?? null,
        dietaryNotes:  dietary_notes ?? null,
        note:          `Payment method: Interac e-Transfer (pending)`,
      }),
    }).catch(() => {});

    return NextResponse.json({
      etransfer: true,
      ticketUrl: `${siteUrl}/workshops/${workshop.slug}/ticket/${booking.qr_token}`,
    });
  }

  // ── Free workshop — skip Stripe, mark paid immediately ──────────────────────
  if (amountCents === 0) {
    await supabaseAdmin
      .from('workshop_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', booking.id);

    return NextResponse.json({
      free: true,
      ticketUrl: `${siteUrl}/workshops/${workshop.slug}/ticket/${booking.qr_token}`,
    });
  }

  // ── Create Stripe Checkout Session ──────────────────────────────────────────
  const stripe = new Stripe(stripeKey);

  const dateStr = workshop.starts_at
    ? new Date(workshop.starts_at).toLocaleDateString('en-CA', {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Toronto',
      })
    : null;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'cad',
        unit_amount: amountCents,
        product_data: {
          name: workshop.title,
          description: [
            resolvedPkg?.label,
            dateStr,
            workshop.venue_address || workshop.venue_name,
          ].filter(Boolean).join(' · ') || undefined,
        },
      },
      quantity: 1,
    }],
    metadata: {
      booking_id:    booking.id,
      workshop_slug: workshop.slug,
      qr_token:      booking.qr_token,
    },
    success_url: `${siteUrl}/workshops/${workshop.slug}/ticket/${booking.qr_token}`,
    cancel_url:  `${siteUrl}/workshops/${workshop.slug}/register`,
    expires_at:  Math.floor(Date.now() / 1000) + 30 * 60, // 30-minute session
  });

  return NextResponse.json({ url: session.url });
}
