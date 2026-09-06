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
  { id: 'g0qEr9scAqg', title: 'Cherry Dance Studios — Performance 6' },
  { id: 'oVPpJOhOHSA', title: 'Cherry Dance Studios — Performance 7' },
];

const highlights = ['All ages', 'Bollywood', 'Hip-hop', 'Freestyle', 'Indian'];

export default function About() {
  return (
    <section id="about" className="relative bg-white text-[#0a0a0f]">

      {/* ── Text content — white section ── */}
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-24 md:pb-24 md:pt-32">
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
          Where Ottawa comes
        </KineticHeading>
        <KineticHeading
          as="h2"
          split="word"
          gradient="cherry"
          className="-mt-2 text-[clamp(2.25rem,5.5vw,4rem)]"
        >
          to dance.
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
            Our instructors create a warm, inclusive environment where students of all
            ages build confidence, technique, and a genuine love of movement. Whether
            you&apos;re enrolling in weekly classes or stepping onto the stage for a
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
      </div>

      {/* ── Video section — full-bleed dark panel ── */}
      {/* Sits at the bottom of the About section and bleeds into the dark
          Classes section beneath it, creating a seamless transition. */}
      <div className="bg-[#0a0a0f] py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8 flex items-end justify-between gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                {youtubeVideos.length} performances
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white md:text-3xl">
                Performances on tape.
              </h3>
            </div>
            {/* Subtle divider accent */}
            <div className="hidden h-px flex-1 bg-white/8 md:block" />
          </motion.div>

          {/*
            Asymmetric grid — featured first video spans 2 columns on desktop,
            remaining four fill the second row evenly.

            lg (3-col):  [─────── V1 ───────][  V2  ]
                         [  V3  ][  V4  ][  V5  ]

            sm (2-col):  [───── V1 ─────]
                         [  V2  ][  V3  ]
                         [  V4  ][  V5  ]

            mobile:      stacked 1-col
          */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                viewport={{ once: true, margin: '-60px' }}
                className={i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}
              >
                <VideoEmbed
                  videoId={video.id}
                  title={video.title}
                  featured={i === 0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
