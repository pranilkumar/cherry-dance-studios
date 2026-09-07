'use client';

import { motion } from 'framer-motion';
import { FaBolt, FaPalette, FaTheaterMasks, FaArrowRight, FaClock } from 'react-icons/fa';
import { BentoCard, GlowButton } from './ui';

const classes = [
  {
    title: 'Little Stars',
    ageGroup: 'Ages 4–7',
    tagline: 'First steps, big smiles.',
    description:
      'A nurturing intro to dance. Coordination, confidence, and a love for movement — built one class at a time.',
    slots: [{ days: 'Tue & Thu', time: '5:45 – 6:30 PM' }],
    duration: '45 min',
    icon: FaPalette,
    gradient: 'cherry',
  },
  {
    title: 'The Crew',
    ageGroup: 'Ages 7–10',
    tagline: 'Where the squad forms.',
    description:
      'Structured choreography, rhythm training, and creative expression in a tight-knit crew. Two batch options.',
    slots: [
      { days: 'Mon & Wed', time: '6:00 – 7:00 PM' },
      { days: 'Tue & Thu', time: '6:30 – 7:30 PM' },
    ],
    duration: '60 min',
    icon: FaTheaterMasks,
    gradient: 'fire',
    featured: true,
  },
];

const slaySquad = {
  title: 'Slay Squad',
  ageGroup: 'Ages 10+',
  tagline: 'Train hard. Slay harder.',
  description:
    'Intensive Bollywood, hip-hop, freestyle, and choreography for dancers ready to level up. This is where serious training happens.',
  slots: [{ days: 'Mon & Wed', time: '7:00 – 8:00 PM' }],
  duration: '1 hr',
  icon: FaBolt,
  gradient: 'noir',
};

export default function Classes() {
  return (
    <section
      id="classes"
      className="relative overflow-hidden bg-[#0a0a0f] py-24 text-white md:py-32"
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">

        {/* Header — left-aligned, editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ee2435]">
              Our classes
            </span>
            <h2
              className="mt-3 font-[family-name:var(--font-display)] font-black leading-[0.92] tracking-[-0.04em] text-white"
              style={{ fontSize: 'clamp(2.75rem, 7vw, 5.5rem)' }}
            >
              Pick your level.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-white/55 md:text-right">
            Programs for every stage — from curious first-timers to dancers
            ready to perform on stage.
          </p>
        </motion.div>

        {/* Top row: Little Stars + The Crew side by side */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {classes.map((cls, i) => {
            const Icon = cls.icon;
            return (
              <motion.div
                key={cls.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-80px' }}
              >
                <BentoCard
                  gradient={cls.gradient}
                  glow={cls.featured}
                  className="flex h-full min-h-[340px] flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                      <Icon className="text-xl text-white" />
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                      {cls.ageGroup}
                    </span>
                  </div>

                  <div className="mt-8">
                    <h3 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight">
                      {cls.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-white/80">{cls.tagline}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{cls.description}</p>
                  </div>

                  <div className="mt-6 border-t border-white/15 pt-5">
                    <div className="space-y-2">
                      {cls.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white/90">{slot.days}</span>
                          <span className="font-mono text-xs text-white/65">{slot.time}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
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

        {/* Slay Squad — full width, horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-80px' }}
          className="mt-5"
        >
          <BentoCard gradient={slaySquad.gradient} className="overflow-hidden">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">

              {/* Left: identity */}
              <div className="flex shrink-0 items-center gap-5 md:flex-col md:items-start md:gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <slaySquad.icon className="text-2xl text-white" />
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                  {slaySquad.ageGroup}
                </span>
              </div>

              {/* Centre: title + description */}
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-display)] font-black leading-[0.92] tracking-[-0.03em] text-white"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {slaySquad.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-white/75">{slaySquad.tagline}</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                  {slaySquad.description}
                </p>
              </div>

              {/* Right: schedule + CTA */}
              <div className="shrink-0 md:min-w-[200px]">
                <div className="space-y-2 border-t border-white/15 pt-5 md:border-t-0 md:pt-0">
                  {slaySquad.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-6 text-sm md:flex-col md:items-start md:gap-1">
                      <span className="font-semibold text-white/90">{slot.days}</span>
                      <span className="font-mono text-xs text-white/65">{slot.time}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <FaClock className="text-[10px]" />
                    <span>{slaySquad.duration} per class</span>
                  </div>
                </div>
                <a
                  href="#register"
                  className="group mt-5 flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Enrol now
                  <FaArrowRight className="text-xs opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </a>
              </div>

            </div>
          </BentoCard>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center gap-4 text-center"
        >
          <p className="text-base text-white/55">
            Not sure which fits? Register and we&apos;ll match your dancer to the right crew.
          </p>
          <GlowButton variant="primary" size="lg" href="#register" icon={<FaArrowRight />}>
            Register your dancer
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
}
