'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import logo from '../assets/icons/logo.png';
import { GlowButton } from './ui';

function scrollToSection(id) {
  return (e) => {
    if (typeof window === 'undefined') return;
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 800);
  };
}

const TICKER = ['Indian Dance', 'Bollywood', 'Semi-Classical', 'Hip-Hop', 'Freestyle'];

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

      {/* ── Main split layout ── */}
      <div className="relative z-10 flex flex-1 flex-col lg:flex-row">

        {/* Left column — all text */}
        <div className="flex flex-1 flex-col justify-center px-6 pb-12 pt-28 md:px-12 lg:max-w-[58%] lg:px-16 lg:pt-36 xl:px-24">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="h-[1px] w-8 bg-[#ee2435]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
              Ottawa · Est. 2024
            </span>
          </motion.div>

          {/* Giant headline — three-line stacked block */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-[family-name:var(--font-display)] font-black leading-[0.9] tracking-[-0.045em]"
            style={{ fontSize: 'clamp(3.75rem, 10.5vw, 9rem)' }}
          >
            <span className="block text-white">CHERRY</span>
            <span className="block bg-gradient-to-r from-[#ee2435] via-[#d1060f] to-[#8f0b16] bg-clip-text text-transparent">
              DANCE
            </span>
            <span className="block text-white">STUDIOS.</span>
          </motion.h1>

          {/* Red rule — animates in from left */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 h-[2px] w-full origin-left"
            style={{
              background:
                'linear-gradient(90deg, #ee2435 0%, #d1060f 40%, rgba(209,6,15,0.15) 80%, transparent 100%)',
            }}
          />

          {/* Styles + founder row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1.5"
          >
            {TICKER.map((s, i) => (
              <span key={s} className="flex items-center gap-5">
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
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <GlowButton
              variant="primary"
              size="lg"
              href="#register"
              onClick={scrollToSection('register')}
              icon={<FaArrowRight />}
            >
              Register your dancer
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

          {/* Mini stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.6 }}
            className="mt-14 flex items-center gap-8 border-t border-white/10 pt-8 lg:mt-16"
          >
            {[
              { num: 'All', label: 'Ages Welcome' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-white">
                  {s.num}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right column — oversized logo */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-[42%] lg:items-center lg:justify-center">
          {/* Red atmospheric glow */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 55% 50%, rgba(209,6,15,0.22) 0%, transparent 65%)',
            }}
          />

          {/* Decorative concentric rings */}
          {[520, 680, 840].map((size, i) => (
            <motion.div
              key={size}
              aria-hidden
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.3 + i * 0.15,
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: `rgba(209,6,15,${0.14 - i * 0.04})`,
              }}
            />
          ))}

          {/* Logo — big, centred, glowing */}
          <motion.img
            src={logo.src}
            alt="Cherry Dance Studios"
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 h-auto w-[68%] max-w-xs drop-shadow-[0_0_100px_rgba(209,6,15,0.55)] xl:max-w-sm"
          />

          {/* Vertical text accent along right edge */}
          <div
            aria-hidden
            className="absolute right-5 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-semibold uppercase tracking-[0.38em] text-white/18 whitespace-nowrap select-none"
          >
            Cherry Dance Studios · Est. 2024 · Barrhaven, Ottawa
          </div>
        </div>
      </div>

      {/* ── Ticker strip — sits flush at the very bottom ── */}
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

      {/* Diagonal SVG cut — dark-to-white transition into About section */}
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
