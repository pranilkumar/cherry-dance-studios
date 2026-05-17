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

// Full set — used for lightbox navigation.
const allImages = [
  { src: ugadiOTA2026.src, alt: 'Ugadi OTA 2026' },
  { src: ugadiOTA20262.src, alt: 'Ugadi OTA 2026 — Group' },
  { src: ugadiKids.src, alt: 'Ugadi — Kids Performance' },
  { src: ugadiKids2.src, alt: 'Ugadi — Kids Performance 2' },
  { src: ugadiDhamaka.src, alt: 'Ugadi Dhamaka' },
  { src: ugadiOTA2025.src, alt: 'Ugadi OTA 2025' },
  { src: iffGroup.src, alt: 'IFF Group Picture' },
  { src: mothersDayWorkshop.src, alt: "Mother's Day Workshop" },
  { src: holiImage3.src, alt: 'Holi Festival — Group Pose' },
  { src: holiImage1.src, alt: 'Holi Festival — Rang Barse' },
  { src: holiImage4.src, alt: 'Holi Festival — Team Photo' },
  { src: galleryImage1.src, alt: 'Dance Performance 1' },
  { src: galleryImage2.src, alt: 'Dance Performance 2' },
  { src: galleryImage3.src, alt: 'Dance Performance 3' },
  { src: galleryImage4.src, alt: 'Dance Performance 4' },
  { src: galleryImage5.src, alt: 'Dance Performance 5' },
  { src: galleryImage6.src, alt: 'Dance Performance 6' },
  { src: galleryImage7.src, alt: 'Dance Performance 7' },
  { src: galleryImage8.src, alt: 'Dance Performance 8' },
];

// Curated 12-image preview for the homepage section.
const previewImages = allImages.slice(0, 12);

export default function Gallery() {
  const [openIndex, setOpenIndex] = useState(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? 0 : (i + 1) % allImages.length));
  }, []);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? 0 : (i - 1 + allImages.length) % allImages.length
    );
  }, []);

  // Keyboard nav + body lock
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
    <section
      id="gallery"
      className="relative bg-[#f5f5f8] py-24 text-[#0a0a0f] md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-[#0a0a0f]/10 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#0a0a0f]/65"
          >
            Gallery
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-[#0a0a0f]"
          >
            Caught in motion.
          </KineticHeading>
        </div>

        {/* Masonry — CSS columns preserves natural aspect ratios */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
          className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4"
        >
          {previewImages.map((image, i) => (
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
              className="group mb-3 block w-full overflow-hidden rounded-2xl bg-[#0a0a0f]/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1060f] md:mb-4"
              style={{ breakInside: 'avoid' }}
              aria-label={`Open ${image.alt}`}
            >
              <div className="relative">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="block w-full transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-[#0a0a0f]/0 transition group-hover:bg-[#0a0a0f]/15" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-center gap-3 text-center"
        >
          <p className="text-sm text-[#0a0a0f]/60">
            {previewImages.length} of {allImages.length} shown
          </p>
          <Link href="/gallery" passHref legacyBehavior>
            <GlowButton variant="primary" size="md" icon={<FaArrowRight />}>
              View full gallery
            </GlowButton>
          </Link>
        </motion.div>
      </div>

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
              src={allImages[openIndex].src}
              alt={allImages[openIndex].alt}
              className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close */}
            <button
              aria-label="Close"
              onClick={close}
              className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <FaTimes />
            </button>

            {/* Prev / Next */}
            <button
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <FaArrowLeft />
            </button>
            <button
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <FaArrowRight />
            </button>

            {/* Counter */}
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {openIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
