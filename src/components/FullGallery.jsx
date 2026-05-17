'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GlowButton, KineticHeading } from './ui';

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

export default function FullGallery() {
  const [openIndex, setOpenIndex] = useState(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? 0 : (i + 1) % galleryImages.length));
  }, []);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? 0 : (i - 1 + galleryImages.length) % galleryImages.length
    );
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, close, next, prev]);

  return (
    <main className="min-h-screen bg-[#f5f5f8]">
      {/* Hero header */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-16 pt-32 text-white md:pb-20 md:pt-40">
        {/* Red glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(209,6,15,0.2) 0%, transparent 60%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.4em] text-white/65"
          >
            Cherry{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Dance Studios
            </span>
          </motion.span>

          <KineticHeading
            as="h1"
            split="word"
            className="mt-5 text-[clamp(2.5rem,7vw,5rem)] text-white"
          >
            The full
          </KineticHeading>
          <KineticHeading
            as="h1"
            split="word"
            gradient="cherry"
            className="-mt-2 text-[clamp(2.5rem,7vw,5rem)]"
          >
            gallery.
          </KineticHeading>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 text-base text-white/65 md:text-lg"
          >
            Performances, festivals, workshops — every moment from the studio.
            <span className="ml-2 font-mono text-sm text-white/50">
              {galleryImages.length} photos
            </span>
          </motion.p>
        </div>
      </section>

      {/* Masonry grid */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
            }}
            className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4 xl:columns-5"
          >
            {galleryImages.map((image, i) => (
              <motion.button
                key={i}
                variants={{
                  hidden: { y: 16, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                onClick={() => setOpenIndex(i)}
                className="group relative mb-3 block w-full overflow-hidden rounded-2xl bg-[#0a0a0f]/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1060f] md:mb-4"
                style={{ breakInside: 'avoid' }}
                aria-label={`Open ${image.alt}`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="block w-full transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 left-3 translate-y-2 rounded-full bg-[#d1060f] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  {image.tag}
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* Back to home */}
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-[#0a0a0f]/55">
              That&apos;s the lot. Want to see them in motion?
            </p>
            <Link href="/" passHref legacyBehavior>
              <GlowButton variant="ghost" size="md" icon={<FaArrowLeft />} iconPosition="left">
                Back to home
              </GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
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

            <button
              aria-label="Close"
              onClick={close}
              className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <FaTimes />
            </button>

            <button
              aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <FaArrowLeft />
            </button>
            <button
              aria-label="Next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
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
