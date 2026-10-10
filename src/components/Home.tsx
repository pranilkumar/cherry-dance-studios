'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { GlowButton } from './ui';

const TICKER = ['Indian Dance', 'Bollywood', 'Semi-Classical', 'Hip-Hop', 'Freestyle'];

function scrollToSection(id: string) {
  return (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

export default function Home() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0a0f] text-white"
    >
      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Red centre glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(209,6,15,0.14) 0%, transparent 62%)',
        }}
      />

      {/* ── Centred text content ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-28 text-center lg:pt-36">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <span className="h-[1px] w-6 bg-[#ee2435]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
            Ottawa · Est. 2024
          </span>
          <span className="h-[1px] w-6 bg-[#ee2435]" />
        </motion.div>

        {/* Giant headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 font-[family-name:var(--font-display)] font-black leading-[0.9] tracking-[-0.045em]"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
        >
          <span className="block text-white">CHERRY</span>
          <span className="block bg-gradient-to-r from-[#ee2435] via-[#d1060f] to-[#8f0b16] bg-clip-text text-transparent">
            DANCE
          </span>
          <span className="block text-white">STUDIOS.</span>
        </motion.h1>

        {/* Red rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 h-[2px] w-48 origin-center"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, #ee2435 30%, #d1060f 60%, transparent 100%)',
          }}
        />

        {/* Dance styles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
        >
          {TICKER.map((s, i) => (
            <span key={s} className="flex items-center gap-4">
              {i > 0 && <span className="text-white/20">·</span>}
              <span className="text-sm font-medium text-white/60">{s}</span>
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/30"
        >
          By Cherry &amp; Pranil
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <GlowButton
            variant="primary"
            size="lg"
            href="#register"
            onClick={scrollToSection('register')}
            icon={<FaArrowRight />}
          >
            Register now
          </GlowButton>
          <a
            href="#classes"
            onClick={scrollToSection('classes')}
            className="group flex items-center gap-2 text-sm font-medium text-white/55 transition hover:text-white"
          >
            Explore classes
            <span className="transition group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </div>

      {/* ── Ticker strip ── */}
      <div className="relative z-10 overflow-hidden border-t border-white/8 bg-[#0a0a0f]">
        <motion.div
          className="flex w-max items-center gap-0 py-3.5 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.28em] text-white/25"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              <span className="px-10">Bollywood</span>
              <span className="text-[#ee2435]">✦</span>
              <span className="px-10">Hip-Hop</span>
              <span className="text-[#ee2435]">✦</span>
              <span className="px-10">Freestyle</span>
              <span className="text-[#ee2435]">✦</span>
              <span className="px-10">Semi-Classical</span>
              <span className="text-[#ee2435]">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Diagonal SVG cut */}
      <div aria-hidden className="relative z-10 h-16 w-full overflow-hidden bg-[#0a0a0f]">
        <svg
          viewBox="0 0 1440 64"
          className="absolute bottom-0 left-0 w-full"
          preserveAspectRatio="none"
        >
          <polygon points="0,64 1440,0 1440,64" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
}
