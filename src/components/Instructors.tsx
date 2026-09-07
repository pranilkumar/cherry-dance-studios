'use client';

import { motion } from 'framer-motion';

import instructor1 from '../assets/images/Pranil.png';
import instructor2 from '../assets/images/Shivangi.JPG';

const instructors = [
  {
    name: 'Pranil Kumar',
    image: instructor1,
    title: 'Co-Founder · Instructor',
    description:
      'Energetic instructor with 15+ years in freestyle and hip-hop, known for dynamic choreography and a vibrant teaching style that inspires confidence and creativity.',
    specialties: ['Freestyle', 'Hip-Hop', 'Choreography'],
    quote: 'Dance isn\'t just movement — it\'s how you find yourself.',
  },
  {
    name: 'Shivangi Agrawal',
    image: instructor2,
    title: 'Co-Founder · Instructor',
    description:
      'Graceful instructor specialising in Bollywood and Indian semi-classical dance, known for soulful choreography, expressive storytelling, and bringing tradition to life on stage.',
    specialties: ['Bollywood', 'Semi-Classical', 'Storytelling'],
    quote: 'Every step carries a story. We\'re here to help you tell yours.',
  },
];

export default function Instructors() {
  return (
    <section id="instructors" className="overflow-hidden bg-[#0a0a0f] text-white">

      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ee2435]">
              Meet the team
            </span>
            <h2
              className="mt-3 font-[family-name:var(--font-display)] font-black leading-[0.92] tracking-[-0.04em] text-white"
              style={{ fontSize: 'clamp(2.75rem, 7vw, 6rem)' }}
            >
              Cherry &amp;<br />Pranil.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-white/55 md:text-right">
            Two instructors, one studio. Between them: 25+ years of teaching,
            hundreds of dancers, and a whole lot of energy.
          </p>
        </motion.div>
      </div>

      {/* Instructor strips — alternating image/text */}
      <div className="divide-y divide-white/8 border-t border-white/8">
        {instructors.map((inst, i) => {
          const imageLeft = i % 2 === 0;
          return (
            <motion.div
              key={inst.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: '-100px' }}
              className={`flex flex-col ${imageLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
            >
              {/* Image panel — bleeds to the section edge */}
              <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[520px] lg:w-[48%]">
                <img
                  src={inst.image.src}
                  alt={inst.name}
                  className="h-full w-full object-cover object-top transition duration-700 hover:scale-105"
                />
                {/* Gradient toward text side */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: imageLeft
                      ? 'linear-gradient(to right, transparent 60%, #0a0a0f 100%)'
                      : 'linear-gradient(to left, transparent 60%, #0a0a0f 100%)',
                  }}
                />
                {/* Bottom fade for mobile */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0f] to-transparent lg:hidden" />
              </div>

              {/* Text panel */}
              <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:w-[52%] lg:px-16 xl:px-20">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ee2435]">
                  {inst.title}
                </p>

                <h3
                  className="mt-4 font-[family-name:var(--font-display)] font-black leading-[0.92] tracking-[-0.04em] text-white"
                  style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
                >
                  {inst.name}
                </h3>

                {/* Quote */}
                <blockquote className="mt-6 border-l-2 border-[#ee2435] pl-5 text-base italic leading-relaxed text-white/50">
                  "{inst.quote}"
                </blockquote>

                <p className="mt-6 text-base leading-relaxed text-white/65">
                  {inst.description}
                </p>

                {/* Specialty tags */}
                <div className="mt-8 flex flex-wrap gap-2">
                  {inst.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/70 backdrop-blur-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
