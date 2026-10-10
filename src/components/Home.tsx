'use client';

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { GlowButton } from './ui';

import ugadiOTA2026        from '../assets/images/Ugadi OTA 2026.jpg';
import ugadiOTA20262       from '../assets/images/Ugadi OTA 2026 2.JPG';
import holiImage1          from '../assets/images/holi1.jpg';
import holiImage3          from '../assets/images/holi3.jpg';
import holiImage4          from '../assets/images/holi4.jpg';
import mothersDayWorkshop  from '../assets/images/Mothers day workshop.jpg';
import ugadiKids           from '../assets/images/ugadi kids.jpg';
import ugadiDhamaka        from '../assets/images/ugadi dhamaka.jpg';

// Positions are percentages inside a 150vw-wide, full-height stageInner div.
// stageInner left edge = -25% of viewport. viewport starts at ~16.7% of stage.
// viewport right = 100% + 25% of viewport = ~83.3% of stage (at 1440px: stageW=2160px)
// Left-side photos bleed off left edge but stay partially visible (35–55% showing).
// y: '-50%' vertically centres photo around its top anchor
const HERO_FLOATS = [
  { src: ugadiOTA2026.src,       alt: 'Ugadi OTA 2026',        left: '7%',  top: '5%',  width: '18%',                rotate: '-3deg'  },
  { src: ugadiOTA20262.src,      alt: 'Ugadi OTA 2026 Group',  left: '73%', top: '2%',  width: '22%',                rotate:  '2deg'  },
  { src: holiImage3.src,         alt: 'Holi Festival',         left: '5%',  top: '42%', width: '16%', y: '-50%',     rotate:  '2deg'  },
  { src: mothersDayWorkshop.src, alt: "Mother's Day Workshop",  left: '77%', top: '40%', width: '14%', y: '-50%',     rotate: '-2deg'  },
  { src: ugadiKids.src,          alt: 'Ugadi Kids',            left: '8%',  top: '72%', width: '17%',                rotate:  '1.5deg'},
  { src: holiImage4.src,         alt: 'Holi Team',             left: '66%', top: '75%', width: '15%',                rotate: '-1.5deg'},
  { src: ugadiDhamaka.src,       alt: 'Ugadi Dhamaka',         left: '25%', top: '8%',  width: '10%',                rotate:  '2.5deg'},
  { src: holiImage1.src,         alt: 'Holi Celebration',      left: '56%', top: '76%', width: '9%',                 rotate: '-2.5deg'},
] as const;

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
    // overflow: clip (not hidden) — lets absolutely-positioned children bleed
    // beyond the section edge without creating scrollbars
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col bg-[#0a0a0f] text-white"
      style={{ overflow: 'clip' }}
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

      {/* ── Photo stage — xl screens only ── */}
      {/*
        Outer wrapper fills the section.
        stageInner is 150% wide and centered so photos can bleed off both edges.
      */}
      <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            width: '150%',
            maxWidth: '2500px',
            height: '100%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {HERO_FLOATS.map(({ src, alt, left, top, width, rotate, y }, i) => (
            // Outer div: entrance animation only
            <motion.div
              key={i}
              className="absolute"
              style={{ left, top, width, aspectRatio: '16/9', rotate, y: y ?? '0%' }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Inner div: hover scale only — fast separate transition */}
              <motion.div
                className="pointer-events-auto h-full w-full overflow-hidden rounded-2xl shadow-[0_20px_64px_rgba(0,0,0,0.7)]"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <img src={src} alt={alt} className="block h-full w-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-[#0a0a0f]/15" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Centred text content ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-28 text-center lg:pt-36 xl:px-80" style={{ zIndex: 10 }}>

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
      <div className="relative overflow-hidden border-t border-white/8 bg-[#0a0a0f]" style={{ zIndex: 10 }}>
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
      <div aria-hidden className="relative h-16 w-full overflow-hidden bg-[#0a0a0f]" style={{ zIndex: 10 }}>
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
