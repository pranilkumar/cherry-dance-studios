'use client';

import { motion } from 'framer-motion';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from 'react-icons/fa';
import { KineticHeading } from './ui';

const contactCards = [
  {
    icon: FaMapMarkerAlt,
    title: 'Visit',
    primary: 'Barrhaven, Ottawa, ON',
    secondary: 'DM us for the exact address',
  },
  {
    icon: FaPhone,
    title: 'Call · Text',
    primary: '+1 (613) 890-3789',
    secondary: 'Mon–Fri · 6–8 PM',
    href: 'tel:+16138903789',
  },
  {
    icon: FaEnvelope,
    title: 'Email',
    primary: 'cherrydancestudio.cds@gmail.com',
    secondary: 'We reply within 24 hours',
    href: 'mailto:cherrydancestudio.cds@gmail.com',
  },
  {
    icon: FaClock,
    title: 'Studio hours',
    primary: 'Mon–Fri · 6–8 PM',
    secondary: 'Two slots: 6–7 PM, 7–8 PM',
  },
];

const socials = [
  { icon: FaInstagram, name: 'Instagram', href: 'https://www.instagram.com/cherrypranil?igsh=MXIzYXE0OGt4ZmJ0Zg==' },
  { icon: FaFacebookF, name: 'Facebook', href: 'https://www.facebook.com/share/1A4R3ZMtZS/' },
  { icon: FaWhatsapp, name: 'WhatsApp', href: 'https://wa.me/16138903789' },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#0a0a0f] py-24 text-white md:py-32"
    >
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 right-0 h-[60vh] w-[60vh] rounded-full blur-3xl"
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
            Get in touch
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-white"
          >
            Say hi.
          </KineticHeading>
          <KineticHeading
            as="h2"
            split="word"
            gradient="cherry"
            className="-mt-2 text-[clamp(2.25rem,5.5vw,4rem)]"
          >
            We&rsquo;re listening.
          </KineticHeading>
        </div>

        {/* Contact card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((c, i) => {
            const Icon = c.icon;
            const Wrapper = c.href ? motion.a : motion.div;
            return (
              <Wrapper
                key={c.title}
                href={c.href}
                target={c.href?.startsWith('http') ? '_blank' : undefined}
                rel={c.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-50px' }}
                whileHover={c.href ? { y: -4 } : undefined}
                className={`block rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition ${
                  c.href ? 'cursor-pointer hover:border-white/25 hover:bg-white/[0.06]' : ''
                }`}
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#d1060f]/20 text-[#ee2435]">
                  <Icon className="text-base" />
                </div>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  {c.title}
                </h3>
                <p className="mt-2 break-words font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-white">
                  {c.primary}
                </p>
                <p className="mt-1 text-xs text-white/55">{c.secondary}</p>
              </Wrapper>
            );
          })}
        </div>

        {/* Socials */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            Follow the studio
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-white/85 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Floating WhatsApp */}
      <motion.a
        href="https://wa.me/16138903789"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp us"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_12px_40px_rgba(209,6,15,0.5)]"
        style={{ background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)' }}
      >
        <FaWhatsapp className="text-xl" />
      </motion.a>
    </section>
  );
}
