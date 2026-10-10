'use client';

import { motion } from 'framer-motion';
import { FaStar, FaUsers, FaHeart, FaTrophy } from 'react-icons/fa';

const features = [
  {
    icon: FaStar,
    title: 'Expert instruction',
    description:
      'Trained performers with real stage experience lead every class — not hobbyists. Technique, artistry, and passion in every session.',
  },
  {
    icon: FaUsers,
    title: 'All ages & levels',
    description:
      'Programs from age 4 to adults, complete beginners to advanced dancers. Find your class, join your crew.',
  },
  {
    icon: FaHeart,
    title: 'Community & culture',
    description:
      "A warm, inclusive studio rooted in Bollywood, Indian classical, and contemporary styles. Every family belongs here.",
  },
  {
    icon: FaTrophy,
    title: 'Stage-ready training',
    description:
      'We prepare every student for real performances, community showcases, and competitions — from classroom to spotlight.',
  },
];

export default function WhyCherry() {
  return (
    <section className="bg-[#0a0a0f] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">

        {/* Icon + headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="mb-5 flex justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
              <circle cx="24" cy="24" r="4.5" fill="#ee2435" opacity="0.9" />
              <ellipse cx="24" cy="10" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.35" />
              <ellipse cx="24" cy="38" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.35" />
              <ellipse cx="10" cy="24" rx="8.5" ry="5.5" fill="#ee2435" opacity="0.35" />
              <ellipse cx="38" cy="24" rx="8.5" ry="5.5" fill="#ee2435" opacity="0.35" />
              <ellipse cx="13.9" cy="13.9" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.2" transform="rotate(-45 13.9 13.9)" />
              <ellipse cx="34.1" cy="34.1" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.2" transform="rotate(-45 34.1 34.1)" />
              <ellipse cx="34.1" cy="13.9" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.2" transform="rotate(45 34.1 13.9)" />
              <ellipse cx="13.9" cy="34.1" rx="5.5" ry="8.5" fill="#ee2435" opacity="0.2" transform="rotate(45 13.9 34.1)" />
            </svg>
          </div>

          <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/35">
            Why Cherry Dance Studios
          </p>

          <h2
            className="mt-4 font-[family-name:var(--font-display)] font-bold leading-[1] tracking-[-0.04em] text-white"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
          >
            Dance your way
            <br />
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              to the stage.
            </span>
          </h2>
        </motion.div>

        {/* Feature rows */}
        <div className="divide-y divide-white/8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true, margin: '-40px' }}
                className="flex flex-col gap-5 py-8 md:flex-row md:items-center"
              >
                {/* Left: icon + title */}
                <div className="flex items-center gap-4 md:w-[44%]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10">
                    <Icon className="text-sm text-[#ee2435]" />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white md:text-xl">
                    {f.title}
                  </h3>
                </div>

                {/* Right: description */}
                <p className="text-sm leading-relaxed text-white/55 md:flex-1 md:pl-8 md:text-base">
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
