'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaArrowRight,
  FaCheckCircle, FaClock, FaUsers, FaQrcode, FaExternalLinkAlt,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { formatWorkshopDate, formatPrice } from '../../lib/workshops';

function PaymentBadge({ status }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a0a0f]">
        <FaCheckCircle className="text-[8px]" /> Paid
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#d1060f]/30 bg-[#d1060f]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
        <FaClock className="text-[8px]" /> Payment pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
      {status || 'unknown'}
    </span>
  );
}

function BookingCard({ booking, past = false }) {
  const { qr_token, package_label, amount_cents, children, payment_status, workshop } = booking;
  const childCount = Array.isArray(children) ? children.length : 0;
  const ticketHref = workshop?.slug && qr_token
    ? `/workshops/${workshop.slug}/ticket/${qr_token}`
    : null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border backdrop-blur-md ${
        past
          ? 'border-white/8 bg-white/[0.02]'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h3 className={`font-[family-name:var(--font-display)] text-lg font-bold tracking-tight ${past ? 'text-white/55' : 'text-white'}`}>
            {workshop?.title ?? 'Workshop'}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
            {workshop?.starts_at && (
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-[10px]" />
                {formatWorkshopDate(workshop.starts_at)}
              </span>
            )}
            {workshop?.venue_name && (
              <span className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-[10px]" />
                {workshop.venue_name}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <PaymentBadge status={payment_status} />
        </div>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3">
        <div className="flex items-center gap-4 text-xs text-white/50">
          {childCount > 0 && (
            <span className="flex items-center gap-1.5">
              <FaUsers className="text-[10px]" />
              {childCount} dancer{childCount !== 1 ? 's' : ''}
            </span>
          )}
          {package_label && (
            <span>{package_label}</span>
          )}
          {amount_cents != null && (
            <span className="font-semibold text-white/70">{formatPrice(amount_cents)}</span>
          )}
        </div>

        {ticketHref && (
          <Link
            href={ticketHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#d1060f]/40 hover:text-white"
          >
            <FaQrcode className="text-[10px]" />
            View ticket
            <FaExternalLinkAlt className="text-[8px] opacity-60" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PortalWorkshops() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from('workshop_bookings')
        .select('*, workshop:workshops(slug, title, starts_at, venue_name, venue_address)')
        .eq('parent_email', user.email)
        .order('created_at', { ascending: false });

      if (!cancelled) {
        setBookings(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.workshop?.starts_at && new Date(b.workshop.starts_at) >= now,
  );
  const past = bookings.filter(
    (b) => !b.workshop?.starts_at || new Date(b.workshop.starts_at) < now,
  );

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Workshops
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Your workshop tickets.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          All your workshop registrations with check-in QR codes.
        </p>
      </header>

      {loading && (
        <div className="py-20 text-center text-sm text-white/40">Loading your workshops…</div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="mb-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.05] text-white/35">
            <FaHeart className="text-xl" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
            No workshops booked yet.
          </p>
          <p className="mt-2 text-sm text-white/55">
            When you register for a workshop, your ticket will appear here.
          </p>
          <Link
            href="/workshops"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310]"
          >
            Browse upcoming workshops <FaArrowRight className="text-xs" />
          </Link>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {!loading && past.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Past workshops
          </h2>
          <div className="space-y-3">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} past />
            ))}
          </div>
        </section>
      )}

      {/* How to pay — shown when any upcoming booking has payment pending */}
      {!loading && upcoming.some((b) => b.payment_status === 'pending') && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            How to pay
          </h2>
          <div className="space-y-2 text-sm text-white/75">
            <p>
              <span className="font-semibold text-white">E-transfer</span>{' '}
              — send to{' '}
              <a href="mailto:cherrydancestudio.cds@gmail.com" className="text-[#ee2435] hover:underline">
                cherrydancestudio.cds@gmail.com
              </a>
              {' '}and include your dancer&rsquo;s name and the workshop name in the message.
            </p>
            <p>
              <span className="font-semibold text-white">Cash</span>{' '}
              — hand it to Cherry or Pranil at the studio.
            </p>
            <p>
              <span className="font-semibold text-white">Questions?</span>{' '}
              <a href="https://wa.me/16138903789" className="text-[#ee2435] hover:underline" target="_blank" rel="noreferrer">
                WhatsApp us at 613-890-3789
              </a>
            </p>
          </div>
        </section>
      )}

      {!loading && bookings.length > 0 && (
        <div className="mt-4">
          <Link
            href="/workshops"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-[#d1060f]/40 hover:text-white"
          >
            Browse more workshops <FaArrowRight className="text-xs" />
          </Link>
        </div>
      )}
    </div>
  );
}
