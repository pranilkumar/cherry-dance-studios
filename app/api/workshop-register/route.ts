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
    .select('id, slug, title, status, capacity, packages, starts_at, venue_name, venue_address, payment_info')
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
  if (workshop.capacity != null) {
    const { count, error: cErr } = await supabaseAdmin
      .from('workshop_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('workshop_id', workshop_id);

    if (cErr) {
      console.error('[workshop-register] capacity check failed:', cErr);
      return NextResponse.json({ error: 'Could not verify capacity. Try again.' }, { status: 500 });
    }

    if ((count ?? 0) >= workshop.capacity) {
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

  // ── 7. Send confirmation email to attendee (fire-and-forget) ─────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && workshop.slug) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';
    const ticketUrl = `${siteUrl}/workshops/${workshop.slug}/ticket/${booking.qr_token}`;
    const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c] ?? c));
    const firstName = String(parent_name).trim().split(' ')[0];
    const dateStr = workshop.starts_at
      ? new Date(workshop.starts_at).toLocaleDateString('en-CA', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          timeZone: 'America/Toronto',
        })
      : null;
    const timeStr = workshop.starts_at
      ? new Date(workshop.starts_at).toLocaleTimeString('en-CA', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto',
        })
      : null;

    const rows = [
      dateStr ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);width:120px;">Date</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(dateStr)}${timeStr ? ' · ' + esc(timeStr) : ''}</td></tr>` : '',
      (workshop.venue_address || workshop.venue_name) ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);">Venue</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(workshop.venue_address || workshop.venue_name)}</td></tr>` : '',
      resolvedPkg ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);">Package</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(resolvedPkg.label)} — ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(resolvedPkg.price_cents / 100)}</td></tr>` : '',
    ].filter(Boolean).join('');

    const paymentNote = workshop.payment_info
      ? `<div style="margin:20px 0;background:rgba(209,6,15,0.12);border:1px solid rgba(209,6,15,0.3);border-radius:12px;padding:16px 20px;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#ee2435;">Next step — payment</p><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);">${esc(workshop.payment_info)}</p></div>`
      : '';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're registered · ${esc(workshop.title)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);" cellpadding="0" cellspacing="0">
      <tr><td style="background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);padding:24px 28px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Cherry Dance Studios · Registration confirmed</p>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">You're in, ${esc(firstName)}! 🎉</h1>
      </td></tr>
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.75);">Your spot is reserved for <strong style="color:#fff;">${esc(workshop.title)}</strong>. Here are your booking details:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table>
        ${paymentNote}
        <div style="margin:24px 0;text-align:center;">
          <a href="${esc(ticketUrl)}" style="display:inline-block;background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">View my ticket &amp; QR code →</a>
        </div>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">Save this email — your ticket link lives here. Questions? <a href="https://wa.me/16138903789" style="color:#ee2435;">WhatsApp 613-890-3789</a></p>
      </td></tr>
      <tr><td style="background:rgba(0,0,0,0.35);padding:14px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">Cherry Dance Studios · Barrhaven, Ottawa</p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Cherry Dance Studios <noreply@cherrydancestudios.com>',
        to: email,
        subject: `You're registered for ${workshop.title} 🎉`,
        html,
      }),
    }).catch((err) => console.error('[workshop-register] confirmation email failed:', err));
  }

  return NextResponse.json({ ok: true, qr_token: booking.qr_token });
}
