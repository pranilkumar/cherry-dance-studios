import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';

/**
 * POST /api/workshop-register
 *
 * Server-side workshop booking handler. Performing this server-side rather
 * than directly from the browser gives us three guarantees the client cannot:
 *
 *  1. Price integrity  — we re-read the workshop's package list from the DB
 *     and use the server-authoritative price_cents, not the client-supplied one.
 *  2. Capacity guard   — we count current bookings and reject if the workshop
 *     is already full, reducing (but not eliminating*) the race window.
 *  3. Duplicate guard  — we re-check for existing bookings with the same email
 *     in case the client-side check was bypassed.
 *
 * * True atomic capacity enforcement requires a Postgres trigger or check
 *   constraint. This route provides a strong best-effort guard for the
 *   typical case.
 */

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
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
    dietary_notes,
    heard_from,
  } = body as Record<string, any>;

  // ── 1. Basic input validation ────────────────────────────────────────────────
  if (!workshop_id || !parent_name || !parent_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const email = String(parent_email).trim().toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // ── 2. Fetch the workshop server-side (authoritative price + capacity) ───────
  const { data: workshop, error: wErr } = await supabaseAdmin
    .from('workshops')
    .select('id, title, status, max_capacity, packages')
    .eq('id', workshop_id)
    .maybeSingle();

  if (wErr || !workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }
  if (workshop.status !== 'published' && workshop.status !== 'sold_out') {
    return NextResponse.json({ error: 'Workshop is not accepting registrations' }, { status: 400 });
  }

  // ── 3. Resolve the package price server-side ─────────────────────────────────
  const packages: Array<{ id: string; label: string; price_cents: number }> =
    Array.isArray(workshop.packages) ? workshop.packages : [];

  let resolvedPkg: { id: string; label: string; price_cents: number } | null = null;
  if (package_id) {
    resolvedPkg = packages.find((p) => p.id === package_id) ?? null;
    if (!resolvedPkg) {
      return NextResponse.json({ error: 'Selected package is no longer available' }, { status: 400 });
    }
  } else if (packages.length === 1) {
    // Single-package workshops — auto-select so the price is always set
    resolvedPkg = packages[0];
  }

  // ── 4. Capacity check ────────────────────────────────────────────────────────
  if (workshop.max_capacity != null) {
    const { count, error: cErr } = await supabaseAdmin
      .from('workshop_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('workshop_id', workshop_id);

    if (cErr) {
      console.error('[workshop-register] capacity check failed:', cErr);
      return NextResponse.json({ error: 'Could not verify capacity. Try again.' }, { status: 500 });
    }

    if ((count ?? 0) >= workshop.max_capacity) {
      return NextResponse.json({ error: 'Sorry, this workshop is now full.' }, { status: 409 });
    }
  }

  // ── 5. Duplicate check ───────────────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('workshop_bookings')
    .select('id')
    .eq('workshop_id', workshop_id)
    .eq('parent_email', email)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This email already has a booking for this workshop. Check your inbox for your ticket.' },
      { status: 409 }
    );
  }

  // ── 6. Insert ────────────────────────────────────────────────────────────────
  const { data: booking, error: insertErr } = await supabaseAdmin
    .from('workshop_bookings')
    .insert([{
      workshop_id,
      package_id:    resolvedPkg?.id    ?? null,
      package_label: resolvedPkg?.label ?? null,
      amount_cents:  resolvedPkg?.price_cents ?? null,  // server-resolved price
      parent_name:   String(parent_name).trim(),
      parent_email:  email,
      parent_phone:  parent_phone ? String(parent_phone).trim() : null,
      children:      Array.isArray(children)
        ? children.map((c: any) => ({ name: String(c.name ?? '').trim(), age: String(c.age ?? '') }))
        : [],
      dietary_notes: dietary_notes ? String(dietary_notes).trim() || null : null,
      heard_from:    heard_from    ? String(heard_from)            || null : null,
      payment_status: 'pending',
    }])
    .select('qr_token')
    .single();

  if (insertErr || !booking?.qr_token) {
    console.error('[workshop-register] insert failed:', insertErr);
    return NextResponse.json({ error: 'Booking failed. Please try again or contact us.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, qr_token: booking.qr_token });
}
