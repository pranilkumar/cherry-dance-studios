'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import logo from '../assets/icons/logo.png';
import { GlowButton } from './ui';

/**
 * Hero — confident, minimal, centered.
 * Style ticker · logo · headline · meta · CTAs.
 */

const STYLES = ['Bollywood', 'Hip-hop', 'Freestyle', 'Indian'];

export default function Home() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#0a0a0f] text-white"
    >
      {/* Single off-screen red glow — atmosphere, not decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 -right-1/4 h-[80vh] w-[80vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(209,6,15,0.28) 0%, transparent 60%)',
        }}
      />

      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-16 pt-28 text-center sm:pt-32 md:pb-24 md:pt-40">
        {/* Style ticker — what we teach */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-[family-name:var(--font-display)] text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-white/90 md:text-sm"
        >
          {STYLES.map((s, i) => (
            <span key={s} className="flex items-center gap-3">
              {i > 0 && <span className="text-[#ee2435]">／</span>}
              <span>{s}</span>
            </span>
          ))}
        </motion.div>

        {/* Big logo — the identity mark */}
        <motion.img
          src={logo.src}
          alt="Cherry Dance Studios"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 h-24 w-24 drop-shadow-[0_12px_48px_rgba(209,6,15,0.55)] sm:mt-10 sm:h-32 sm:w-32 md:mt-12 md:h-40 md:w-40 lg:h-48 lg:w-48"
        />

        {/* Editorial headline — brand name, centered. Allows wrap on narrow
            screens (otherwise forced-one-line shrinks the type too much). */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-[family-name:var(--font-display)] font-bold leading-[1.02] tracking-[-0.045em] sm:mt-8 sm:whitespace-nowrap sm:leading-[1]"
          style={{ fontSize: 'clamp(2.25rem, 8vw, 5.25rem)' }}
        >
          Cherry Dance{' '}
          <span className="bg-gradient-to-br from-[#ee2435] via-[#d1060f] to-[#910813] bg-clip-text text-transparent">
            Studios.
          </span>
        </motion.h1>

        {/* Meta line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6 font-[family-name:var(--font-display)] text-[0.65rem] uppercase tracking-[0.2em] text-white/55 sm:mt-8 sm:tracking-[0.25em] md:text-sm"
        >
          Barrhaven, Ottawa
          <span className="mx-3 text-[#d1060f]">●</span>
          Ages 4+
          <span className="mx-3 text-[#d1060f]">●</span>
          Cherry &amp; Pranil
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:mt-12"
        >
          <GlowButton
            variant="primary"
            size="lg"
            href="#register"
            icon={<FaArrowRight />}
          >
            Register your dancer
          </GlowButton>
          <a
            href="#classes"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white md:text-base"
          >
            See the classes
            <span className="transition group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </div>

    </section>
  );
}
