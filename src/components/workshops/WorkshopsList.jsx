'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChevronDown } from 'react-icons/fa';
import WorkshopCard from './WorkshopCard';
import { GlowButton } from '../ui';

/**
 * /workshops list view — receives the workshops array from the server-side
 * page and splits into "Upcoming" + "Past" sections with a collapse-control.
 */
export default function WorkshopsList({ upcoming, past }) {
  const [showPast, setShowPast] = useState(false);

  const hasAny = upcoming.length + past.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero header */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-16 pt-32 md:pb-20 md:pt-40">
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
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
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
            style={{ fontSize: 'clamp(2.5rem, 9vw, 7rem)' }}
          >
            Workshops on{' '}
            <span className="bg-gradient-to-br from-[#ee2435] via-[#d1060f] to-[#910813] bg-clip-text text-transparent">
              the slate.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-base text-white/70 md:text-lg"
          >
            Drop-in days, weekend intensives, parent-and-me sessions. Pick one,
            register your dancer, show up.
          </motion.p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#0a0a0f] pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-6">
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

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <SectionHeader
                eyebrow={`${upcoming.length} upcoming`}
                title="Open for registration"
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((w, i) => (
                  <WorkshopCard key={w.id} workshop={w} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Past — collapsed by default */}
          {past.length > 0 && (
            <div className={upcoming.length > 0 ? 'mt-20' : ''}>
              <SectionHeader
                eyebrow={`${past.length} past`}
                title="From the archive"
              />
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-white/30"
              >
                {showPast ? 'Hide past workshops' : `Show ${past.length} past workshop${past.length === 1 ? '' : 's'}`}
                <motion.span
                  animate={{ rotate: showPast ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <FaChevronDown className="text-xs" />
                </motion.span>
              </button>
              {showPast && (
                <div className="grid gap-5 opacity-75 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((w, i) => (
                    <WorkshopCard key={w.id} workshop={w} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#ee2435]">
          {eyebrow}
        </span>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
    </div>
  );
}
