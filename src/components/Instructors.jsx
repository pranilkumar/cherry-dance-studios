'use client';

import { motion } from 'framer-motion';
import { KineticHeading } from './ui';

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
  },
  {
    name: 'Shivangi Agrawal',
    image: instructor2,
    title: 'Co-Founder · Instructor',
    description:
      'Graceful instructor specializing in Bollywood and Indian semi-classical dance, known for soulful choreography, expressive storytelling, and bringing tradition to life on stage.',
    specialties: ['Bollywood', 'Semi-Classical', 'Storytelling'],
  },
];

export default function Instructors() {
  return (
    <section
      id="instructors"
      className="relative overflow-hidden bg-[#0a0a0f] py-24 text-white md:py-32"
    >
      {/* Subtle red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[20%] top-1/3 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(209,6,15,0.18) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur"
          >
            Meet the team
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-white"
          >
            The crew behind
          </KineticHeading>
          <KineticHeading
            as="h2"
            split="word"
            gradient="cherry"
            className="-mt-2 text-[clamp(2.25rem,5.5vw,4rem)]"
          >
            the choreography.
          </KineticHeading>
        </div>

        {/* Instructor cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {instructors.map((inst, i) => (
            <motion.article
              key={inst.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: '-80px' }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition hover:border-white/20"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]">
                <img
                  src={inst.image.src}
                  alt={inst.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />

                {/* Specialty pills (over image) */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {inst.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/20 bg-[#0a0a0f]/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ee2435]">
                  {inst.title}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
                  {inst.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {inst.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
