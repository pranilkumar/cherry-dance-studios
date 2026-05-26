'use client';

import { FaInstagram, FaFacebookF, FaEnvelope, FaArrowUp } from 'react-icons/fa';
import logo from '../assets/icons/logo.png';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Classes', href: '#classes' },
  { label: 'Workshops', href: '/workshops' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Instructors', href: '#instructors' },
  { label: 'Contact', href: '#contact' },
  { label: 'Register', href: '/register' },
];

const socials = [
  {
    icon: FaInstagram,
    label: 'Instagram',
    href: 'https://www.instagram.com/cherrypranil?igsh=MXIzYXE0OGt4ZmJ0Zg==',
  },
  {
    icon: FaFacebookF,
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1A4R3ZMtZS/',
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0a0a0f] text-white">
      {/* Top gradient accent line */}
      <div
        aria-hidden
        className="h-[2px] w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #b00310 30%, #ee2435 50%, #b00310 70%, transparent 100%)',
        }}
      />

      {/* Subtle gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(209,6,15,0.18) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Top row: brand + nav + socials */}
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src={logo.src}
                alt="Cherry Dance Studios"
                className="h-12 w-12 rounded-full"
              />
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                Cherry{' '}
                <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
                  Dance Studios
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">
              Ottawa&apos;s home for dance — Bollywood, hip-hop, freestyle, Indian.
              We turn first-timers into headliners, one routine at a time.
            </p>

            <a
              href="mailto:cherrydancestudio.cds@gmail.com"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/85 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <FaEnvelope className="text-xs text-[#ee2435]" />
              cherrydancestudio.cds@gmail.com
            </a>
          </div>

          {/* Nav */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Explore
            </h4>
            <ul className="mt-5 grid grid-cols-2 gap-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/75 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Follow along
            </h4>
            <div className="mt-5 flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="text-base" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/50">
            © {year} Cherry Dance Studios. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/portal/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/65 transition hover:border-[#d1060f]/40 hover:text-[#ee2435]"
            >
              Sign in
            </a>
            <a
              href="#home"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/65 transition hover:border-white/30 hover:text-white"
            >
              Back to top
              <FaArrowUp className="text-[10px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
