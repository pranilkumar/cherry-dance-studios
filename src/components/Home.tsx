'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { GlowButton } from './ui';

import ugadiOTA2026   from '../assets/images/Ugadi OTA 2026.jpg';
import ugadiOTA20262  from '../assets/images/Ugadi OTA 2026 2.JPG';
import holiImage1     from '../assets/images/holi1.jpg';
import holiImage3     from '../assets/images/holi3.jpg';
import mothersDayWorkshop from '../assets/images/Mothers day workshop.jpg';
import ugadiKids      from '../assets/images/ugadi kids.jpg';

// Floating photo cards for the hero right column
const HERO_PHOTOS = [
  { src: ugadiOTA2026.src,          alt: 'Ugadi OTA 2026',         top: '6%',   left: '4%',   width: '54%', rotate: '-2.5deg' },
  { src: ugadiOTA20262.src,         alt: 'Ugadi OTA 2026 — Group', top: '3%',   right: '2%',  width: '38%', rotate: '2deg'    },
  { src: holiImage3.src,            alt: 'Holi Festival',          top: '38%',  left: '6%',   width: '44%', rotate: '1.5deg'  },
  { src: mothersDayWorkshop.src,    alt: "Mother's Day Workshop",  bottom: '8%',right: '4%',  width: '46%', rotate: '-2deg'   },
  { src: ugadiKids.src,             alt: 'Ugadi Kids',             bottom: '6%',left: '22%',  width: '34%', rotate: '1deg'    },
  { src: holiImage1.src,            alt: 'Holi Celebration',       top: '50%',  right: '3%',  width: '32%', rotate: '-1.5deg' },
];

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

        {/* Right column — scattered floating photos */}
        <div className="relative hidden overflow-hidden lg:block lg:w-[42%]">
          {/* Red atmospheric glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(209,6,15,0.18) 0%, transparent 68%)',
            }}
          />

          {HERO_PHOTOS.map(({ src, alt, width, rotate, ...pos }, i) => (
            <motion.div
              key={i}
              aria-hidden
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              style={{ width, rotate, ...pos } as React.CSSProperties}
            >
              <img
                src={src}
                alt={alt}
                className="block h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[#0a0a0f]/15" />
            </motion.div>
          ))}

          {/* Vertical text accent along right edge */}
          <div
            aria-hidden
            className="absolute right-5 top-1/2 z-10 -translate-y-1/2 -rotate-90 select-none whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.38em] text-white/18"
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
