'use client';

import { useState, useRef } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from '../lib/supabaseClient';
import {
  FaArrowRight, FaCheck, FaMapMarkerAlt, FaCalendarAlt,
  FaStar, FaWhatsapp, FaInstagram, FaUsers, FaFire, FaClock,
} from 'react-icons/fa';
import logo from '../assets/icons/logo.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  experience: 'Beginner',
  heardFrom: '',
  notes: '',
};

const inputBase =
  'w-full rounded-xl border border-[#0a0a0f]/12 bg-white px-4 py-3.5 text-base text-[#0a0a0f] placeholder:text-[#0a0a0f]/35 transition focus:border-[#d1060f] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/12';
const inputErr = 'border-[#d1060f] ring-2 ring-[#d1060f]/15';

function Field({ label, required = false, error = undefined, hint = undefined, children }: any) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between text-sm font-medium text-[#0a0a0f]/75">
        <span>{label}{required && <span className="ml-1 text-[#d1060f]">*</span>}</span>
        {hint && <span className="text-xs font-normal text-[#0a0a0f]/45">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-[#d1060f]">{error}</p>}
    </div>
  );
}


export default function AdultBollywoodLanding() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const loadTime = useRef(Date.now());
  const { executeRecaptcha } = useGoogleReCaptcha();

  const set = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Your name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Please enter a valid email.';
    if (!form.phone || form.phone.length < 7) e.phone = 'A valid phone number is required.';
    setErrors(e);
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime.current < 3000) {
      setStatus('success');
      return;
    }
    // reCAPTCHA v3 verification
    if (executeRecaptcha) {
      try {
        const token = await executeRecaptcha('adult_registration');
        const captchaRes = await fetch('/api/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!captchaRes.ok) {
          setSubmitError('Security check failed. Please try again.');
          setStatus('idle');
          return;
        }
      } catch {
        // Non-fatal: proceed if captcha service is unreachable
      }
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) return;
    setStatus('submitting');
    setSubmitError('');

    const payload = {
      parent_name:      form.name.trim(),
      student_name:     form.name.trim(),
      email:            form.email.trim(),
      phone:            form.phone,
      preferred_class:  'Adult Bollywood',
      experience_level: form.experience,
      heard_from:       form.heardFrom || null,
      notes:            [
        'Adult Bollywood – September 8-Week Batch',
        form.notes.trim() ? form.notes.trim() : null,
      ].filter(Boolean).join(' | ') || null,
      status: 'pending',
    };

    try {
      const { error } = await supabase.from('registrations').insert([payload]);
      if (error) throw error;
      setStatus('success');
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'registration',
          studentName: payload.student_name,
          parentName: payload.parent_name,
          email: payload.email,
          phone: payload.phone,
          preferredClass: payload.preferred_class,
          experience: payload.experience_level,
          notes: payload.notes,
        }),
      }).catch(() => {});
    } catch (err: any) {
      setSubmitError(err?.message || 'Unknown error');
      setStatus('error');
    }
  };

  /* ── Success state ── */
  if (status === 'success') {
    const firstName = form.name.split(' ')[0];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-6 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_48px_rgba(209,6,15,0.55)]"
        >
          <FaCheck className="text-3xl" />
        </motion.div>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white md:text-5xl">
          You&rsquo;re on the list{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-4 max-w-md text-base text-white/60">
          We&rsquo;ve received your registration for the September Adult Bollywood batch.
          We&rsquo;ll WhatsApp you within <strong className="text-white">24 hours</strong> with schedule details and next steps.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="https://wa.me/16138903789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
          >
            <FaWhatsapp /> WhatsApp us
          </a>
          <Link href="/" className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Minimal nav ── */}
      <nav className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={logo.src} alt="Cherry Dance Studios" className="h-9 w-9 rounded-full" />
          <span className="hidden font-[family-name:var(--font-display)] text-sm font-bold text-white sm:block">
            Cherry <span className="text-[#ee2435]">Dance Studios</span>
          </span>
        </Link>
        <a
          href="https://wa.me/16138903789"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/10"
        >
          <FaWhatsapp className="text-[#25D366]" /> Questions? WhatsApp us
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0f] to-[#0a0a0f]" />

          {/* Left spotlight beam — cone from upper-left toward center */}
          <div
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 118deg at 10% -2%, transparent 0deg, rgba(255,255,255,0.09) 12deg, rgba(255,255,255,0.05) 32deg, transparent 46deg)',
            }}
          />
          {/* Left lamp orb */}
          <div
            className="absolute left-[9%] top-0 h-3 w-3 -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)', boxShadow: '0 0 18px 8px rgba(255,255,255,0.25)' }}
          />

          {/* Right spotlight beam — cone from upper-right toward center */}
          <div
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 214deg at 90% -2%, transparent 0deg, rgba(255,255,255,0.09) 12deg, rgba(255,255,255,0.05) 32deg, transparent 46deg)',
            }}
          />
          {/* Right lamp orb */}
          <div
            className="absolute right-[9%] top-0 h-3 w-3 translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)', boxShadow: '0 0 18px 8px rgba(255,255,255,0.25)' }}
          />

          {/* Red center glow */}
          <div
            className="absolute left-1/2 top-0 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #d1060f 0%, transparent 70%)' }}
          />
        </div>

        {/* Sparkle dots */}
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-white/40"
            style={{
              left: `${10 + (i * 37 + i * i * 3) % 80}%`,
              top: `${5 + (i * 23 + i * 7) % 70}%`,
              opacity: 0.2 + (i % 5) * 0.1,
            }}
          />
        ))}

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full border border-[#d1060f]/40 bg-[#d1060f]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#ee2435]">
              Starting September 2026 · Barrhaven
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.8rem,10vw,7rem)] font-black leading-[0.92] tracking-tight text-white"
          >
            Adult<br />
            <span
              className="text-[#ee2435]"
              style={{ textShadow: '0 0 60px rgba(238,36,53,0.5)' }}
            >
              Bollywood
            </span><br />
            Dance.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-6 max-w-md text-base text-white/60 md:text-lg"
          >
            An 8-week batch for adults — no experience needed. Just show up ready to move.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: FaUsers,        label: 'Limited spots' },
              { icon: FaStar,         label: 'Beginner friendly' },
              { icon: FaFire,         label: 'No prior dance experience required' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70">
                <Icon className="text-[#ee2435]" /> {label}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-white/40"
          >
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-[#ee2435]" /> Wednesdays 7–8 PM · 8 weeks · Sept 2026
            </span>
            <span className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-[#ee2435]" /> Barrhaven, Ottawa
            </span>
          </motion.div>

          <motion.a
            href="#register"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#d1060f] px-8 py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(209,6,15,0.45)] transition hover:bg-[#b00310] hover:shadow-[0_12px_40px_rgba(209,6,15,0.55)] active:scale-95"
          >
            Register now <FaArrowRight className="text-sm" />
          </motion.a>

          <p className="mt-4 text-xs text-white/35">Spots fill fast — secure yours today.</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="h-8 w-5 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-0.5 rounded-full bg-white" />
          </div>
        </div>
      </section>

      {/* ── What to expect ── */}
      <section className="border-t border-white/8 bg-[#0c0c14] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            What you get
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Bollywood fusion',
                body: 'High-energy routines blending Bollywood, bhangra and contemporary moves — the songs you actually know and love.',
              },
              {
                title: 'Beginner to confident',
                body: 'Zero experience? Perfect. We build from scratch. By week 8 you\'ll have a full routine under your belt.',
              },
              {
                title: 'Adult-only batch',
                body: 'Just adults, no pressure, great music. A fun, judgment-free space where you learn at your own pace.',
              },
              {
                title: '8 structured weeks',
                body: 'Each class builds on the last. Clear progression, visible improvement. Not a drop-in — a real learning journey.',
              },
              {
                title: 'Barrhaven studio',
                body: 'Right here in Barrhaven — no long drive across the city. Details shared on confirmation.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-3 h-1 w-8 rounded-full bg-[#d1060f]" />
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing & schedule ── */}
      <section className="border-t border-white/8 bg-[#0a0a0f] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Pricing
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-[family-name:var(--font-display)] text-7xl font-bold text-white md:text-8xl">$200</span>
            <span className="text-2xl font-medium text-white/40 md:text-3xl">CAD</span>
          </div>
          <p className="mt-2 text-sm text-white/40">for the full 8-week batch</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { icon: FaCalendarAlt, label: 'Every Wednesday' },
              { icon: FaClock,       label: '7:00 – 8:00 PM' },
              { icon: FaUsers,       label: '8 weeks' },
              { icon: FaMapMarkerAlt, label: 'Barrhaven, Ottawa' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/65">
                <Icon className="text-[#ee2435]" /> {label}
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-white/30">Payment is collected on the first class. Registering holds your spot.</p>
          <a
            href="#register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d1060f] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(209,6,15,0.4)] transition hover:bg-[#b00310]"
          >
            Reserve my spot <FaArrowRight className="text-xs" />
          </a>
        </div>
      </section>

      {/* ── Registration form ── */}
      <section id="register" className="bg-white px-6 py-20 text-[#0a0a0f]">
        <div className="mx-auto max-w-xl">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full border border-[#0a0a0f]/10 bg-[#0a0a0f]/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#0a0a0f]/55">
              Reserve your spot
            </span>
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#0a0a0f] md:text-5xl">
              Register now.
            </h2>
            <p className="mt-3 text-sm text-[#0a0a0f]/55">
              Takes 2 minutes. We&rsquo;ll confirm your spot and share the full schedule within 24 hours.
            </p>
          </div>

          <div className="rounded-3xl border border-[#0a0a0f]/8 bg-white p-6 shadow-[0_12px_48px_rgba(10,10,15,0.06)] md:p-10">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Honeypot — invisible to humans, bots fill it */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }}
              />

              <Field label="Your full name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  autoComplete="name"
                  className={`${inputBase} ${errors.name ? inputErr : ''}`}
                />
              </Field>

              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="priya@email.com"
                  autoComplete="email"
                  className={`${inputBase} ${errors.email ? inputErr : ''}`}
                />
              </Field>

              <Field label="Phone / WhatsApp" required error={errors.phone}>
                <PhoneInput
                  country="ca"
                  preferredCountries={['ca', 'us', 'in']}
                  disableCountryGuess
                  value={form.phone}
                  onChange={(val) => set('phone', val)}
                  inputProps={{ name: 'phone', required: true }}
                  containerClass="reg-phone-wrap"
                  inputClass={`reg-phone-input${errors.phone ? ' err' : ''}`}
                  buttonClass="reg-phone-btn"
                  enableSearch
                />
              </Field>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0a0a0f]/75">
                  Dance experience
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { v: 'Beginner',        sub: 'Never danced' },
                    { v: 'Some Experience', sub: 'A bit of background' },
                    { v: 'Experienced',     sub: '2+ years' },
                  ].map((lvl) => {
                    const active = form.experience === lvl.v;
                    return (
                      <button
                        key={lvl.v}
                        type="button"
                        onClick={() => set('experience', lvl.v)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? 'border-[#d1060f] bg-[#d1060f]/5 ring-2 ring-[#d1060f]/15'
                            : 'border-[#0a0a0f]/12 hover:border-[#0a0a0f]/25'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>{lvl.v}</p>
                        <p className="mt-0.5 text-[10px] text-[#0a0a0f]/45">{lvl.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0a0a0f]/75">
                  How did you hear about us?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { v: 'instagram', label: 'Instagram' },
                    { v: 'whatsapp', label: 'WhatsApp' },
                    { v: 'friend', label: 'Friend / Family' },
                    { v: 'other', label: 'Other' },
                  ].map((opt) => {
                    const active = form.heardFrom === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => set('heardFrom', active ? '' : opt.v)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'border-[#d1060f] bg-[#d1060f]/[0.04] text-[#d1060f]'
                            : 'border-[#0a0a0f]/12 text-[#0a0a0f]/70 hover:border-[#0a0a0f]/25'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Anything else?" hint="optional">
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Questions, scheduling constraints, anything we should know…"
                  className={`${inputBase} resize-none`}
                />
              </Field>

              {status === 'error' && (
                <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/5 p-4 text-sm text-[#d1060f]">
                  <p className="font-semibold">Something went wrong — please try again.</p>
                  {submitError && <p className="mt-1 font-mono text-xs opacity-70">{submitError}</p>}
                  <p className="mt-2 text-xs opacity-80">Or WhatsApp us at 613-890-3789.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d1060f] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(209,6,15,0.35)] transition hover:bg-[#b00310] hover:shadow-[0_12px_40px_rgba(209,6,15,0.45)] disabled:opacity-60 active:scale-[0.98]"
              >
                {status === 'submitting' ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Reserve my spot <FaArrowRight className="text-sm" /></>
                )}
              </button>

              <p className="text-center text-xs text-[#0a0a0f]/40">
                We&rsquo;ll confirm within 24 hours via WhatsApp or email. No payment needed now.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#0a0a0f] px-6 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/35">
          <Link href="/" className="hover:text-white">Home</Link>
          <a href="https://wa.me/16138903789" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
            <FaWhatsapp className="text-[#25D366]" /> 613-890-3789
          </a>
          <a href="https://instagram.com/cherrydancestudios" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
            <FaInstagram /> @cherrydancestudios
          </a>
          <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[#ee2435]" /> Barrhaven, Ottawa</span>
        </div>
        <p className="mt-6 text-xs text-white/20">© {new Date().getFullYear()} Cherry Dance Studios</p>
      </footer>
    </div>
  );
}
