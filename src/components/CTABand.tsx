'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

export default function CTABand() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0f] py-28 md:py-40">
      {/* Red atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(209,6,15,0.2) 0%, transparent 62%)',
        }}
      />

      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/30"
        >
          Cherry Dance Studios · Ottawa
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-5 font-[family-name:var(--font-display)] font-bold leading-[0.92] tracking-[-0.04em] text-white"
          style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
        >
          Ready to{' '}
          <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
            dance?
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto mt-6 max-w-md text-base text-white/45 md:text-lg"
        >
          Classes for every age, every level, every style. Join the Cherry family
          — and get your dancer on a stage.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href="#register"
            onClick={scrollTo('register')}
            className="inline-flex items-center gap-3 rounded-full bg-[#d1060f] px-8 py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(209,6,15,0.4)] transition hover:bg-[#b00310] hover:shadow-[0_14px_48px_rgba(209,6,15,0.55)] active:scale-95"
          >
            Register your dancer <FaArrowRight className="text-sm" />
          </a>
          <a
            href="/workshops"
            className="text-sm font-medium text-white/45 transition hover:text-white"
          >
            Browse workshops →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
