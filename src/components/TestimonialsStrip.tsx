'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Priya S.',
    role: 'Mom of Aarav, age 8',
    quote: 'Aarav begs to go to class every single week. Cherry and Pranil have a way of making every kid feel like a star.',
    batch: 'The Crew',
  },
  {
    name: 'Meena R.',
    role: 'Mom of Riya, age 6',
    quote: 'The warmth in this studio is unmatched. My daughter has grown so much in confidence since she joined.',
    batch: 'Little Stars',
  },
  {
    name: 'Sanjay K.',
    role: 'Dad of Kiran, age 12',
    quote: 'Kiran performed on stage for the first time at the Ugadi showcase. I cried happy tears the entire performance.',
    batch: 'Slay Squad',
  },
  {
    name: 'Anita V.',
    role: 'Mom of Naina, age 9',
    quote: "Naina's coordination and rhythm have improved dramatically. The instructors genuinely care about every child.",
    batch: 'The Crew',
  },
  {
    name: 'Rahul M.',
    role: 'Dad of Arjun, age 7',
    quote: 'Best decision we ever made for our son. Arjun found his passion here and practices every day at home.',
    batch: 'The Crew',
  },
  {
    name: 'Deepa N.',
    role: 'Mom of Kavya, age 10',
    quote: 'Cherry creates such a positive, inclusive environment. Every child is celebrated, not just the "best" ones.',
    batch: 'Slay Squad',
  },
];

// Duplicate for seamless infinite loop
const doubled = [...testimonials, ...testimonials];

export default function TestimonialsStrip() {
  return (
    <section className="overflow-hidden bg-[#0d0d15] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-[#ee2435]">
            What families say
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-bold leading-[1] tracking-[-0.04em] text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            In good company.
          </h2>
        </motion.div>
      </div>

      {/* Auto-scrolling strip */}
      <div className="relative">
        {/* Fade masks on edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0d0d15] to-transparent md:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0d0d15] to-transparent md:w-32" />

        <motion.div
          className="flex w-max gap-4 px-6 py-2"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((t, i) => (
            <div
              key={i}
              className="w-[300px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:w-[340px]"
            >
              <p className="text-sm leading-relaxed text-white/70">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                {/* Avatar initial */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d1060f]/20 text-xs font-bold text-[#ee2435]">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                  <p className="truncate text-xs text-white/40">{t.role}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-[#d1060f]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
                  {t.batch}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
