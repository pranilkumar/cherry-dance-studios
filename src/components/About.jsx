'use client';

import { motion } from 'framer-motion';
import VideoEmbed from './VideoEmbed';
import { KineticHeading } from './ui';

const youtubeVideos = [
  { id: 'E60sIwe5aIc', title: 'Cherry Dance Studios — Performance 1' },
  { id: 'spQKyyn5PNU', title: 'Cherry Dance Studios — Performance 2' },
  { id: 'rM1RA0EpXmg', title: 'Cherry Dance Studios — Performance 3' },
  { id: '9WHHmYyYs2k', title: 'Cherry Dance Studios — Performance 4' },
  { id: 'elTMH3JatwI', title: 'Cherry Dance Studios — Performance 5' },
];

const highlights = ['Ages 4 & up', 'Bollywood', 'Hip-hop', 'Freestyle', 'Indian'];

export default function About() {
  return (
    <section
      id="about"
      className="relative bg-white py-24 text-[#0a0a0f] md:py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-6 inline-block rounded-full border border-[#0a0a0f]/10 bg-[#0a0a0f]/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#0a0a0f]/65"
        >
          About us
        </motion.span>

        {/* Heading */}
        <KineticHeading
          as="h2"
          split="word"
          className="text-[clamp(2.25rem,5.5vw,4rem)] text-[#0a0a0f]"
        >
          Where Ottawa kids
        </KineticHeading>
        <KineticHeading
          as="h2"
          split="word"
          gradient="cherry"
          className="-mt-2 text-[clamp(2.25rem,5.5vw,4rem)]"
        >
          learn to dance.
        </KineticHeading>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-10 grid gap-8 text-lg leading-relaxed text-[#0a0a0f]/75 md:grid-cols-2"
        >
          <p>
            Cherry Dance Studios is an Ottawa-based dance school teaching every kind of
            dance worth knowing — Bollywood, hip-hop, freestyle, and Indian. Founded by
            Cherry and Pranil with a passion for making movement fun and accessible,
            we welcome everyone from curious beginners to seasoned performers.
          </p>
          <p>
            Our instructors create a warm, inclusive environment where students build
            confidence, technique, and a genuine love of movement. Whether you&apos;re
            enrolling your child in weekly classes or stepping onto the stage for a
            community showcase, Cherry Dance Studios is your home for dance in Ottawa.
          </p>
        </motion.div>

        {/* Highlight chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-wrap gap-2.5"
        >
          {highlights.map((h) => (
            <span
              key={h}
              className="inline-flex items-center gap-2 rounded-full border border-[#d1060f]/20 bg-[#d1060f]/[0.04] px-4 py-2 text-sm font-medium text-[#d1060f]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#d1060f]" />
              {h}
            </span>
          ))}
        </motion.div>

        {/* Video grid */}
        <div className="mt-20">
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl"
          >
            Performances on tape.
          </motion.h3>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true, margin: '-50px' }}
                className="overflow-hidden rounded-2xl border border-[#0a0a0f]/8 bg-[#0a0a0f]/[0.02] shadow-[0_4px_24px_rgba(10,10,15,0.06)] transition hover:shadow-[0_12px_40px_rgba(10,10,15,0.12)]"
              >
                <VideoEmbed videoId={video.id} title={video.title} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
