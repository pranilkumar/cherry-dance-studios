'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import WorkshopCard from './WorkshopCard';
import { GlowButton } from '../ui';
import { formatWorkshopDate, formatPackageRange } from '../../lib/workshops';

export default function WorkshopsList({ upcoming, past }) {
  const [showPast, setShowPast] = useState(false);
  const hasAny = upcoming.length + past.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-0 pt-32 md:pt-44">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(209,6,15,0.22) 0%, transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 text-center md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-[family-name:var(--font-display)] text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-white/90 md:text-sm"
          >
            <span>Workshops</span>
            <span className="text-[#ee2435]">／</span>
            <span>Cherry Dance Studios</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-[family-name:var(--font-display)] font-bold leading-[1] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(2.75rem, 9vw, 7rem)' }}
          >
            Workshops{' '}
            <span className="bg-gradient-to-br from-[#ee2435] via-[#d1060f] to-[#910813] bg-clip-text text-transparent">
              on the slate.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-base text-white/65 md:text-lg"
          >
            Drop-in days, weekend intensives, parent-and-me sessions.
            Pick one, register your dancer, show up.
          </motion.p>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0f] pb-24 md:pb-36">
        <div className="mx-auto max-w-5xl px-6">

          {/* Empty state */}
          {!hasAny && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                No workshops just yet.
              </p>
              <p className="mt-3 text-white/65">
                We&rsquo;re planning the next round. Drop us a line and we&rsquo;ll let
                you know when registration opens.
              </p>
              <div className="mt-6">
                <GlowButton variant="primary" size="md" href="/#contact" icon={<FaArrowRight />}>
                  Get in touch
                </GlowButton>
              </div>
            </motion.div>
          )}

          {/* Upcoming — event list style */}
          {upcoming.length > 0 && (
            <div>
              <SectionLabel eyebrow={`${upcoming.length} upcoming`} title="Open for registration" />

              <div className="divide-y divide-white/8">
                {upcoming.map((w, i) => (
                  <EventRow key={w.id} workshop={w} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Past — collapsed card grid */}
          {past.length > 0 && (
            <div className={upcoming.length > 0 ? 'mt-24' : ''}>
              <SectionLabel eyebrow={`${past.length} past`} title="From the archive" />

              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-white/30"
              >
                {showPast
                  ? 'Hide past workshops'
                  : `Show ${past.length} past workshop${past.length === 1 ? '' : 's'}`}
                <motion.span
                  animate={{ rotate: showPast ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  ↓
                </motion.span>
              </button>

              {showPast && (
                <div className="grid gap-5 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((w, i) => (
                    <WorkshopCard key={w.id} workshop={w} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0d0d15] py-28 md:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(209,6,15,0.18) 0%, transparent 62%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/30"
          >
            Cherry Dance Studios
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-5 font-[family-name:var(--font-display)] font-bold leading-[0.92] tracking-[-0.04em] text-white"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
          >
            Want to be{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              notified first?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            viewport={{ once: true }}
            className="mx-auto mt-5 max-w-md text-base text-white/45"
          >
            New workshops sell out fast. Follow us on Instagram or WhatsApp to be the
            first to know when spots open.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <a
              href="https://www.instagram.com/cherrydancestudios/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#d1060f] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(209,6,15,0.4)] transition hover:bg-[#b00310]"
            >
              Follow on Instagram <FaArrowRight className="text-xs" />
            </a>
            <a
              href="https://wa.me/16138903789"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white/75 transition hover:border-white/40 hover:text-white"
            >
              Join WhatsApp group
            </a>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

/* ── Event row — horizontal card for upcoming workshops ─────────── */
function EventRow({ workshop, index }) {
  const {
    slug,
    title,
    subtitle,
    cover_image_url,
    starts_at,
    venue_name,
    venue_address,
    instructor_names,
    status,
    packages,
  } = workshop;

  const isSoldOut = status === 'sold_out';

  // Format the date into day-of-month + month + weekday for the big date display
  let dayNum = '';
  let monthStr = '';
  let weekdayStr = '';
  let timeStr = '';

  if (starts_at) {
    const d = new Date(starts_at);
    dayNum    = d.toLocaleDateString('en-CA', { day: 'numeric',   timeZone: 'America/Toronto' });
    monthStr  = d.toLocaleDateString('en-CA', { month: 'short',   timeZone: 'America/Toronto' }).toUpperCase();
    weekdayStr = d.toLocaleDateString('en-CA', { weekday: 'long', timeZone: 'America/Toronto' });
    timeStr   = d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' });
  }

  const venueLabel = venue_address || venue_name || null;
  const priceLabel = packages?.length > 0 ? formatPackageRange(packages) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-40px' }}
    >
      <Link
        href={`/workshops/${slug}`}
        className="group flex flex-col gap-5 py-8 transition md:flex-row md:items-center md:gap-8 md:py-10"
      >
        {/* Date block */}
        <div className="flex shrink-0 items-center gap-4 md:w-[120px] md:flex-col md:items-start md:gap-1">
          <span
            className="font-[family-name:var(--font-display)] font-black leading-none text-[#ee2435]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            {dayNum}
          </span>
          <div className="md:leading-none">
            <p className="text-sm font-bold uppercase tracking-widest text-white/90">{monthStr}</p>
            <p className="text-xs text-white/40">{weekdayStr}</p>
          </div>
        </div>

        {/* Divider (desktop) */}
        <div className="hidden shrink-0 w-px self-stretch bg-white/10 md:block" />

        {/* Optional cover thumbnail */}
        {cover_image_url && (
          <div className="hidden h-[90px] w-[130px] shrink-0 overflow-hidden rounded-xl md:block">
            <img
              src={cover_image_url}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight tracking-tight text-white transition group-hover:text-[#ee2435] md:text-2xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-white/55">{subtitle}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
            {timeStr && (
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-[10px]" />
                {timeStr}
              </span>
            )}
            {venueLabel && (
              <span className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-[10px]" />
                {venueLabel}
              </span>
            )}
            {instructor_names?.length > 0 && (
              <span>with {instructor_names.join(' · ')}</span>
            )}
          </div>
        </div>

        {/* Right: price + arrow */}
        <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-end md:gap-2">
          {priceLabel && (
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white md:text-xl">
              {priceLabel}
            </p>
          )}
          {isSoldOut ? (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/55">
              Sold out
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-[#d1060f]/40 bg-[#d1060f]/10 px-4 py-2 text-xs font-bold text-[#ee2435] transition group-hover:bg-[#d1060f] group-hover:text-white">
              Register <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Section label ───────────────────────────────────────────────── */
function SectionLabel({ eyebrow, title }) {
  return (
    <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#ee2435]">
          {eyebrow}
        </span>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="hidden h-px flex-1 bg-white/8 md:block" />
    </div>
  );
}
