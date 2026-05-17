'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaHeart,
  FaArrowRight,
} from 'react-icons/fa';
import { GlowButton } from './ui';

// Event expires end of May 9, 2026 (Barrhaven local time)
const EVENT_END = new Date('2026-05-10T04:00:00Z');

const details = [
  { icon: FaCalendarAlt, label: 'Date', value: 'Saturday, May 9, 2026' },
  { icon: FaClock, label: 'Time', value: '6:00 PM – 8:00 PM' },
  { icon: FaMapMarkerAlt, label: 'Venue', value: 'Barrhaven, Ottawa (TBC)' },
];

export default function EventBanner() {
  if (new Date() > EVENT_END) return null;

  return (
    <section className="bg-[#0a0a0f] py-12 text-white md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a0f] via-[#1c1c27] to-[#0a0a0f] p-8 md:p-12"
        >
          {/* Red glow accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-1/4 -top-1/2 h-[60vh] w-[60vh] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(209,6,15,0.28) 0%, transparent 65%)',
            }}
          />

          <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            {/* Left side */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#ee2435]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ee2435] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ee2435]" />
                </span>
                Upcoming workshop
              </span>

              <h2 className="mt-5 flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-5xl">
                <FaHeart className="text-[#ee2435]" />
                Mom &amp; Me
              </h2>
              <p className="mt-2 text-base text-white/70 md:text-lg">
                Mother&apos;s Day special — celebrate the bond through dance.
              </p>

              {/* Pricing pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm backdrop-blur-md">
                  Mom + 1 kid <strong className="ml-1 text-white">$25</strong>
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm backdrop-blur-md">
                  Mom + 2 kids <strong className="ml-1 text-white">$30</strong>
                </span>
              </div>

              {/* Perks */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['Video recording included', 'Snacks included', 'Limited spots'].map((p) => (
                  <span
                    key={p}
                    className="text-xs font-medium uppercase tracking-[0.15em] text-white/55"
                  >
                    · {p}
                  </span>
                ))}
              </div>

              <div className="mt-7">
                <Link href="/mnm" passHref legacyBehavior>
                  <GlowButton variant="primary" size="md" icon={<FaArrowRight />}>
                    Register now
                  </GlowButton>
                </Link>
              </div>
            </div>

            {/* Right: detail cards */}
            <div className="grid gap-3">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
                  >
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-[#ee2435]">
                      <Icon />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                        {d.label}
                      </p>
                      <p className="mt-0.5 font-[family-name:var(--font-display)] text-base font-semibold text-white">
                        {d.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
