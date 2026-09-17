import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../src/lib/supabaseAdmin';

// Must be force-dynamic so Next.js doesn't buffer/parse the body before we read it
export const dynamic = 'force-dynamic';

const esc = (v: any) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c] ?? c));

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId   = session.metadata?.booking_id;
    const qrToken     = session.metadata?.qr_token;
    const workshopSlug = session.metadata?.workshop_slug;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking_id in metadata' }, { status: 400 });
    }

    // Mark booking as paid
    const { error: updateErr } = await supabaseAdmin
      .from('workshop_bookings')
      .update({
        payment_status: 'paid',
        stripe_payment_intent: session.payment_intent as string ?? null,
      })
      .eq('id', bookingId);

    if (updateErr) {
      console.error('[stripe-webhook] failed to update booking:', updateErr);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    // Fetch booking + workshop for confirmation email
    const { data: booking } = await supabaseAdmin
      .from('workshop_bookings')
      .select('*, workshops(*)')
      .eq('id', bookingId)
      .maybeSingle();

    if (booking) {
      const workshop = (booking as any).workshops;
      const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';
      const ticketUrl = qrToken && workshopSlug
        ? `${siteUrl}/workshops/${workshopSlug}/ticket/${qrToken}`
        : null;

      // Send payment confirmation email (same template as admin "Mark paid")
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && booking.parent_email && workshop) {
        const dateStr = workshop.starts_at
          ? new Date(workshop.starts_at).toLocaleDateString('en-CA', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              timeZone: 'America/Toronto',
            })
          : null;

        fetch(`${siteUrl}/api/workshop-payment-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-webhook': process.env.STRIPE_WEBHOOK_SECRET! },
          body: JSON.stringify({
            email:         booking.parent_email,
            parentName:    booking.parent_name,
            workshopTitle: workshop.title,
            workshopDate:  dateStr,
            workshopVenue: workshop.venue_address || workshop.venue_name || null,
            packageLabel:  booking.package_label  || null,
            amountCents:   booking.amount_cents    || null,
            ticketUrl,
          }),
        }).catch((err) => console.error('[stripe-webhook] confirmation email failed:', err));
      }

      // Notify admin
      fetch(`${siteUrl}/api/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          'workshop',
          workshopTitle: workshop?.title ?? 'Workshop',
          parentName:    booking.parent_name,
          email:         booking.parent_email,
          phone:         booking.parent_phone,
          children:      booking.children ?? [],
          packageLabel:  booking.package_label ?? null,
          dietaryNotes:  booking.dietary_notes ?? null,
        }),
      }).catch(() => {});
    }
  }

  // Acknowledge other event types without error
  return NextResponse.json({ received: true });
}
