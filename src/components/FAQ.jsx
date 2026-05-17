'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { GlowButton, KineticHeading } from './ui';

const faqData = [
  {
    question: 'Do I need prior dance experience to join?',
    answer:
      "Not at all! We welcome dancers of all levels, from complete beginners to advanced performers. Our instructors tailor their teaching to match each student's pace. Just register and we'll guide you from there!",
  },
  {
    question: 'What should I wear to class?',
    answer:
      'Wear comfortable, breathable clothing that allows you to move freely — like athletic wear, leggings, or shorts. Clean indoor sneakers or dance shoes work best. Some styles may be done barefoot.',
  },
  {
    question: 'How do I register for classes?',
    answer:
      'Simply fill out the registration form on this website and our team will get in touch to confirm your spot and discuss details. You can also reach us directly at 613 890 3789 or email cherrydancestudio.cds@gmail.com.',
  },
  {
    question: 'What age groups do you teach?',
    answer:
      "We offer classes for three age groups: Little Stars (Ages 4–7), The Crew (Ages 7–10), and Slay Squad (10+). There's a place for every young dancer at Cherry Dance Studios!",
  },
  {
    question: 'What are the class timings?',
    answer:
      'Classes run on weekday evenings. Little Stars meet Tuesday & Thursday (5:45–6:30 PM). The Crew has two batch options: Mon & Wed (6:00–7:00 PM) or Tue & Thu (6:30–7:30 PM). Slay Squad trains Mon & Wed (7:00–8:00 PM).',
  },
  {
    question: 'What dance styles do you teach?',
    answer:
      'We specialize in Bollywood, Hip-Hop, Contemporary, and Indian semi-classical dance. Our instructors bring energy, tradition, and creativity into every class.',
  },
  {
    question: 'Do you offer private lessons?',
    answer:
      'Yes! We offer personalized sessions for students who want individual attention or want to prepare for a specific event or performance. Contact us for availability.',
  },
  {
    question: 'What if I have more questions?',
    answer:
      "We're always happy to help! Reach us at 613 890 3789, email cherrydancestudio.cds@gmail.com, or send us a message on Instagram or Facebook. Studio hours are weekdays 6:00 PM – 8:00 PM.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative bg-white py-24 text-[#0a0a0f] md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-[#0a0a0f]/10 bg-[#0a0a0f]/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#0a0a0f]/65"
          >
            FAQ
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-[#0a0a0f]"
          >
            Quick answers.
          </KineticHeading>
        </div>

        {/* Accordion */}
        <div className="divide-y divide-[#0a0a0f]/8">
          {faqData.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                viewport={{ once: true, margin: '-50px' }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-5 py-5 text-left transition hover:opacity-85"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-xs font-medium tabular-nums text-[#d1060f]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight md:text-xl">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-[#0a0a0f]/12 text-[#0a0a0f]/60"
                  >
                    <FaPlus className="text-xs" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pl-12 pr-12 text-base leading-relaxed text-[#0a0a0f]/70">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 rounded-3xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-8 text-center md:p-10"
        >
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight md:text-3xl">
            Still have questions?
          </h3>
          <p className="mt-2 text-base text-[#0a0a0f]/65">
            Our team replies within 24 hours.
          </p>
          <div className="mt-6">
            <GlowButton variant="primary" size="md" href="#contact">
              Contact us
            </GlowButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
