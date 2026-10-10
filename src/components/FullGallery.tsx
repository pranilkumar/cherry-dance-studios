'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GlowButton } from './ui';

// Normalise tags into filter categories
const TAG_MAP: Record<string, string> = {
  'Ugadi 2026': 'Ugadi',
  'Ugadi 2025': 'Ugadi',
  'Ugadi': 'Ugadi',
  'Holi': 'Holi',
  'IFF': 'IFF',
  'Workshop': 'Workshop',
  'Performance': 'Performance',
};
const FILTER_TABS = ['All', 'Ugadi', 'Holi', 'IFF', 'Workshop', 'Performance'] as const;
type Filter = typeof FILTER_TABS[number];

import galleryImage1 from '../assets/images/Image1.webp';
import galleryImage2 from '../assets/images/Image2.webp';
import galleryImage3 from '../assets/images/Image3.webp';
import galleryImage4 from '../assets/images/Image4.webp';
import galleryImage5 from '../assets/images/Image5.webp';
import galleryImage6 from '../assets/images/Image6.webp';
import galleryImage7 from '../assets/images/Image7.webp';
import galleryImage8 from '../assets/images/Image8.webp';
import holiImage1 from '../assets/images/holi1.jpg';
import holiImage3 from '../assets/images/holi3.jpg';
import holiImage4 from '../assets/images/holi4.jpg';
import iffGroup from '../assets/images/IFF Group Picture.JPG';
import mothersDayWorkshop from '../assets/images/Mothers day workshop.jpg';
import ugadiDhamaka from '../assets/images/ugadi dhamaka.jpg';
import ugadiKids from '../assets/images/ugadi kids.jpg';
import ugadiKids2 from '../assets/images/ugadi kids 2.jpg';
import ugadiOTA2025 from '../assets/images/Ugadi OTA 2025.png';
import ugadiOTA2026 from '../assets/images/Ugadi OTA 2026.jpg';
import ugadiOTA20262 from '../assets/images/Ugadi OTA 2026 2.JPG';

const galleryImages = [
  { src: ugadiOTA2026.src, alt: 'Ugadi OTA 2026', tag: 'Ugadi 2026' },
  { src: ugadiOTA20262.src, alt: 'Ugadi OTA 2026 — Group', tag: 'Ugadi 2026' },
  { src: ugadiKids.src, alt: 'Ugadi — Kids Performance', tag: 'Ugadi' },
  { src: ugadiKids2.src, alt: 'Ugadi — Kids Performance 2', tag: 'Ugadi' },
  { src: ugadiDhamaka.src, alt: 'Ugadi Dhamaka', tag: 'Ugadi' },
  { src: ugadiOTA2025.src, alt: 'Ugadi OTA 2025', tag: 'Ugadi 2025' },
  { src: iffGroup.src, alt: 'IFF Group Picture', tag: 'IFF' },
  { src: mothersDayWorkshop.src, alt: "Mother's Day Workshop", tag: 'Workshop' },
  { src: holiImage3.src, alt: 'Holi Festival — Group Pose', tag: 'Holi' },
  { src: holiImage1.src, alt: 'Holi Festival — Rang Barse', tag: 'Holi' },
  { src: holiImage4.src, alt: 'Holi Festival — Team Photo', tag: 'Holi' },
  { src: galleryImage1.src, alt: 'Dance Performance 1', tag: 'Performance' },
  { src: galleryImage2.src, alt: 'Dance Performance 2', tag: 'Performance' },
  { src: galleryImage3.src, alt: 'Dance Performance 3', tag: 'Performance' },
  { src: galleryImage4.src, alt: 'Dance Performance 4', tag: 'Performance' },
  { src: galleryImage5.src, alt: 'Dance Performance 5', tag: 'Performance' },
  { src: galleryImage6.src, alt: 'Dance Performance 6', tag: 'Performance' },
  { src: galleryImage7.src, alt: 'Dance Performance 7', tag: 'Performance' },
  { src: galleryImage8.src, alt: 'Dance Performance 8', tag: 'Performance' },
];

// Editorial grid layout: 3-col desktop, each item's column span and aspect ratio
const GRID_LAYOUT = [
  { cols: 2, aspect: '16/9' },
  { cols: 1, aspect: '3/4'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '3/4'  },
  { cols: 2, aspect: '16/9' },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 2, aspect: '16/9' },
  { cols: 1, aspect: '3/4'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '1/1'  },
  { cols: 1, aspect: '3/4'  },
  { cols: 2, aspect: '16/9' },
  { cols: 1, aspect: '1/1'  },
  { cols: 2, aspect: '16/9' },
];

// Positions for scattered hero photos
const HERO_FLOATS = [
  { idx: 0,  className: 'top-[10%] left-[-1%] w-[260px]',  rotate: '-2.5deg' },
  { idx: 1,  className: 'top-[5%] right-[-1%] w-[205px]',  rotate: '2deg'    },
  { idx: 2,  className: 'top-[42%] left-[0%] w-[225px] -translate-y-1/2', rotate: '2deg' },
  { idx: 3,  className: 'top-[38%] right-[0%] w-[185px] -translate-y-1/2', rotate: '-2deg' },
  { idx: 4,  className: 'bottom-[10%] left-[5%] w-[235px]', rotate: '1.5deg' },
  { idx: 5,  className: 'bottom-[6%] right-[3%] w-[210px]', rotate: '-1.5deg' },
  { idx: 8,  className: 'top-[3%] left-[25%] w-[130px]',   rotate: '1.5deg'  },
  { idx: 10, className: 'bottom-[12%] right-[20%] w-[140px]', rotate: '-2deg' },
];

export default function FullGallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  // Indices of images that pass the active filter
  const filteredIndices = useMemo(() => {
    if (activeFilter === 'All') return galleryImages.map((_, i) => i);
    return galleryImages
      .map((img, i) => ({ img, i }))
      .filter(({ img }) => TAG_MAP[img.tag] === activeFilter)
      .map(({ i }) => i);
  }, [activeFilter]);

  const close = useCallback(() => setOpenIndex(null), []);
  const next  = useCallback(() => setOpenIndex((i) => (i === null ? 0 : (i + 1) % galleryImages.length)), []);
  const prev  = useCallback(() => setOpenIndex((i) => (i === null ? 0 : (i - 1 + galleryImages.length) % galleryImages.length)), []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [openIndex, close, next, prev]);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">

      {/* ── Scattered-photo hero ────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f]">

        {/* Red ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(209,6,15,0.14) 0%, transparent 65%)' }}
        />

        {/* Floating photos — desktop only */}
        {HERO_FLOATS.map(({ idx, className, rotate }, i) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 * i, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setOpenIndex(idx)}
            aria-label={`Open ${galleryImages[idx].alt}`}
            className={`absolute hidden overflow-hidden rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.65)] transition duration-500 hover:z-20 hover:scale-[1.04] focus:outline-none xl:block ${className}`}
            style={{ transform: `rotate(${rotate})` }}
          >
            <img
              src={galleryImages[idx].src}
              alt={galleryImages[idx].alt}
              className="block h-full w-full object-cover"
            />
            {/* Subtle dark vignette */}
            <div className="absolute inset-0 bg-[#0a0a0f]/20" />
          </motion.button>
        ))}

        {/* Central text */}
        <div className="relative z-10 px-6 py-40 text-center">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/50"
          >
            Cherry{' '}
            <span className="text-[#ee2435]">Dance Studios</span>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-[family-name:var(--font-display)] font-bold leading-[0.9] tracking-[-0.04em] text-[clamp(3rem,9vw,6.5rem)] text-white"
          >
            The full<br />
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              gallery.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-sm text-white/45 md:text-base"
          >
            Performances, festivals, workshops — every moment from the studio.{' '}
            <span className="font-mono text-white/30">{galleryImages.length} photos</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-10 text-[10px] uppercase tracking-[0.35em] text-white/25"
          >
            ↓ scroll to browse
          </motion.p>
        </div>
      </section>

      {/* ── Editorial grid ──────────────────────────────────────────── */}
      <section className="bg-[#0d0d15] px-2 pb-24 pt-2 md:px-3">

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2 px-1 md:mb-6">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                activeFilter === tab
                  ? 'bg-[#d1060f] text-white shadow-[0_4px_16px_rgba(209,6,15,0.4)]'
                  : 'border border-white/15 text-white/55 hover:border-white/30 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="ml-2 text-xs text-white/25">{filteredIndices.length} photos</span>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3"
        >
          {filteredIndices.map((i, pos) => {
            const image = galleryImages[i];
            const { cols, aspect } = GRID_LAYOUT[i] ?? { cols: 1, aspect: '1/1' };
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (pos % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setOpenIndex(i)}
                aria-label={`Open ${image.alt}`}
                className={`group relative overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1060f] col-span-1 ${cols === 2 ? 'md:col-span-2' : ''}`}
                style={{ aspectRatio: aspect }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/75 via-[#0a0a0f]/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                {/* Tag pill */}
                <span className="absolute bottom-3 left-3 translate-y-2 rounded-full bg-[#d1060f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {image.tag}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Footer CTA */}
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-white/35">That&apos;s the lot.</p>
          <Link href="/" passHref legacyBehavior>
            <GlowButton variant="ghost" size="md" icon={<FaArrowLeft />} iconPosition="left">
              Back to home
            </GlowButton>
          </Link>
        </div>
      </section>

      {/* ── Lightbox ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]/95 p-4 backdrop-blur-xl"
            onClick={close}
          >
            <motion.img
              key={openIndex}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              src={galleryImages[openIndex].src}
              alt={galleryImages[openIndex].alt}
              className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            />

            <button aria-label="Close" onClick={close}
              className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10">
              <FaTimes />
            </button>
            <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10">
              <FaArrowLeft />
            </button>
            <button aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10">
              <FaArrowRight />
            </button>
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {openIndex + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
