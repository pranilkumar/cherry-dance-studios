'use client';

import { motion } from 'framer-motion';
import { FaBolt, FaPalette, FaTheaterMasks, FaArrowRight, FaClock } from 'react-icons/fa';
import { BentoCard, GlowButton, KineticHeading } from './ui';

const classes = [
  {
    title: 'Little Stars',
    ageGroup: 'Ages 4–7',
    tagline: 'First steps, big smiles.',
    description:
      'A nurturing intro to dance. Coordination, confidence, and a love for movement.',
    slots: [{ days: 'Tue & Thu', time: '5:45 – 6:30 PM' }],
    duration: '45 min',
    icon: FaPalette,
    gradient: 'cherry',
    span: { col: 1 },
  },
  {
    title: 'The Crew',
    ageGroup: 'Ages 7–10',
    tagline: 'Where the squad forms.',
    description:
      'Structured choreography, rhythm training, and creative expression in a tight-knit crew.',
    slots: [
      { days: 'Mon & Wed', time: '6:00 – 7:00 PM' },
      { days: 'Tue & Thu', time: '6:30 – 7:30 PM' },
    ],
    duration: '60 min',
    icon: FaTheaterMasks,
    gradient: 'fire',
    span: { col: 1 },
    featured: true,
  },
  {
    title: 'Slay Squad',
    ageGroup: 'Ages 10+',
    tagline: 'Train hard. Slay harder.',
    description:
      'Intensive Bollywood, hip-hop, freestyle, and choreography for dancers ready to level up.',
    slots: [{ days: 'Mon & Wed', time: '7:00 – 8:00 PM' }],
    duration: '1 hr',
    icon: FaBolt,
    gradient: 'noir',
    span: { col: 3 },
  },
];

export default function Classes() {
  return (
    <section
      id="classes"
      className="relative overflow-hidden bg-[#0a0a0f] py-24 text-white md:py-32"
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur"
          >
            Our classes
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            gradient="cherry"
            className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)]"
          >
            Pick your level.
          </KineticHeading>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-6 text-lg text-white/65"
          >
            Three programs built around how kids actually learn — by playing, by belonging,
            and by leveling up with people they love training with.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-[1fr]">
          {classes.map((cls, i) => {
            const Icon = cls.icon;
            return (
              <motion.div
                key={cls.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-80px' }}
                className={
                  cls.span.col === 2 ? 'md:col-span-2' : 'md:col-span-1'
                }
              >
                <BentoCard
                  gradient={cls.gradient}
                  glow={cls.featured}
                  className="flex h-full min-h-[360px] flex-col justify-between"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                      <Icon className="text-2xl text-white" />
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                      {cls.ageGroup}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-8">
                    <h3 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
                      {cls.title}
                    </h3>
                    <p className="mt-1 text-base font-medium text-white/85">
                      {cls.tagline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">
                      {cls.description}
                    </p>
                  </div>

                  {/* Schedule + enrol CTA */}
                  <div className="mt-6 border-t border-white/15 pt-5">
                    <div className="space-y-2">
                      {cls.slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-semibold text-white/95">{slot.days}</span>
                          <span className="font-mono text-xs text-white/75">{slot.time}</span>
                        </div>
                      ))}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-white/65">
                        <FaClock className="text-[10px]" />
                        <span>{cls.duration} per class</span>
                      </div>
                    </div>
                    <a
                      href="#register"
                      className="group mt-5 flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      Enrol in {cls.title}
                      <FaArrowRight className="text-xs opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
                    </a>
                  </div>
                </BentoCard>
              </motion.div>
            );
          })}
        </div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center gap-4 text-center"
        >
          <p className="text-base text-white/70">
            Not sure which fits? Register and we&apos;ll match your dancer to the right crew.
          </p>
          <GlowButton
            variant="primary"
            size="lg"
            href="#register"
            icon={<FaArrowRight />}
          >
            Register your dancer
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
}
