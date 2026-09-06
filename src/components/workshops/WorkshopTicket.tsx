'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaCheck,
  FaPrint,
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { formatWorkshopDate, formatPrice } from '../../lib/workshops';

/**
 * Workshop ticket — booking confirmation + QR code for door check-in.
 * Receives the booking joined with workshop data from the server.
 */
export default function WorkshopTicket({ booking }) {
  const {
    qr_token,
    parent_name,
    parent_email,
    package_label,
    amount_cents,
    children,
    payment_status,
    workshop,
  } = booking;

  return (
    <main className="min-h-screen bg-[#f5f5f8]">
      {/* Confirmation header */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-16 pt-32 text-white md:pb-20 md:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(209,6,15,0.28) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_48px_rgba(209,6,15,0.55)]"
          >
            <FaCheck className="text-3xl" />
          </motion.div>

          <h1 className="mt-7 font-[family-name:var(--font-display)] font-bold leading-[0.95] tracking-[-0.04em] md:text-6xl text-5xl">
            You&rsquo;re in.
          </h1>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            Thanks <strong className="text-white">{parent_name?.split(' ')[0]}</strong>.
            We&rsquo;ll see you{' '}
            <span className="text-white">
              {workshop?.title ? `at ${workshop.title}` : 'at the workshop'}
            </span>
            .
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/45">
            Confirmation sent to {parent_email}
          </p>
        </div>
      </section>

      {/* Ticket card */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="overflow-hidden rounded-3xl border border-[#0a0a0f]/8 bg-white shadow-[0_12px_48px_rgba(10,10,15,0.08)]">
            {/* Top — booking summary */}
            <div className="p-7 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#d1060f]">
                    Workshop ticket
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0a0a0f] md:text-3xl">
                    {workshop?.title ?? 'Workshop'}
                  </h2>
                </div>
                <PaymentBadge status={payment_status} />
              </div>

              {workshop?.starts_at && (
                <div className="mt-5 flex items-center gap-2.5 text-sm text-[#0a0a0f]/70">
                  <FaCalendarAlt className="text-[#d1060f]" />
                  {formatWorkshopDate(workshop.starts_at)}
                </div>
              )}
              {(workshop?.venue_address || workshop?.venue_name) && (
                <div className="mt-2 flex items-center gap-2.5 text-sm text-[#0a0a0f]/70">
                  <FaMapMarkerAlt className="text-[#d1060f]" />
                  {workshop.venue_address || workshop.venue_name}
                </div>
              )}

              <dl className="mt-7 divide-y divide-[#0a0a0f]/8">
                <Row k="Attendee" v={parent_name} />
                {package_label && <Row k="Package" v={package_label} />}
                {amount_cents != null && <Row k="Amount" v={formatPrice(amount_cents)} />}
              </dl>
            </div>

            {/* Perforated divider */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f5f5f8]"
              />
              <div
                aria-hidden
                className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f5f5f8]"
              />
              <div className="border-t border-dashed border-[#0a0a0f]/15 mx-7 md:mx-10" />
            </div>

            {/* QR */}
            <div className="grid items-center gap-7 p-7 md:grid-cols-[auto_1fr] md:gap-10 md:p-10">
              <div className="grid place-items-center rounded-2xl bg-white p-4 ring-1 ring-[#0a0a0f]/8">
                <QRCodeSVG
                  value={qr_token}
                  size={144}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="M"
                  marginSize={0}
                />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#d1060f]">
                  Check-in code
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0a0a0f]">
                  Show this at the door.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#0a0a0f]/65">
                  Save this page or take a screenshot. Our team will scan the QR to check
                  you in on the day of the workshop.
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#0a0a0f]/40">
                  {qr_token}
                </p>
              </div>
            </div>
          </div>

          {/* Payment instructions */}
          {workshop?.payment_info && payment_status === 'pending' && (
            <div className="mt-6 rounded-2xl border border-[#d1060f]/20 bg-[#d1060f]/[0.05] p-5 md:p-6">
              <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.25em] text-[#d1060f]">
                Next step — payment
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#0a0a0f]/80 md:text-base">
                {workshop.payment_info}{' '}
                <span className="text-[#0a0a0f]/55">
                  Reference: <strong className="text-[#0a0a0f]">{parent_name}</strong>
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-[#0a0a0f]/12 bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0f] transition hover:border-[#0a0a0f]/30"
            >
              <FaPrint className="text-xs" />
              Print ticket
            </button>
            <Link
              href="/workshops"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[#0a0a0f]/65 transition hover:text-[#0a0a0f]"
            >
              <FaArrowLeft className="text-xs" />
              Browse more workshops
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-[#0a0a0f]/55">{k}</dt>
      <dd className="font-semibold text-[#0a0a0f]">{v}</dd>
    </div>
  );
}

function PaymentBadge({ status }) {
  const map = {
    pending: {
      label: 'Payment pending',
      cls: 'border-[#d1060f]/30 bg-[#d1060f]/[0.08] text-[#d1060f]',
    },
    paid: {
      label: 'Paid',
      cls: 'border-[#0a0a0f] bg-[#0a0a0f] text-white',
    },
    cancelled: {
      label: 'Cancelled',
      cls: 'border-[#0a0a0f]/15 bg-[#0a0a0f]/[0.04] text-[#0a0a0f]/55',
    },
    refunded: {
      label: 'Refunded',
      cls: 'border-[#0a0a0f]/15 bg-[#0a0a0f]/[0.04] text-[#0a0a0f]/55',
    },
  };
  const v = map[status] || map.pending;
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] ${v.cls}`}
    >
      {v.label}
    </span>
  );
}
