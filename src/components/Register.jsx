'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from '../lib/supabaseClient';
import { GlowButton, KineticHeading } from './ui';
import {
  FaCheck,
  FaArrowRight,
  FaBirthdayCake,
  FaShieldAlt,
} from 'react-icons/fa';

/* ─────────────────────────────────────────────────────────────────
   Helpers — age math, class tier suggestion, next-birthday display
   ──────────────────────────────────────────────────────────────── */

/**
 * Parse a "YYYY-MM-DD" string (from <input type="date">) into a local-time
 * Date. NEVER do `new Date("YYYY-MM-DD")` — that treats the string as UTC
 * midnight, which shifts to the previous day in timezones west of UTC
 * (e.g., Ottawa shows "Feb 24" for an input of "2026-02-25").
 */
function parseLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);  // local-time constructor — no timezone shift
}

function calcAge(dobIso) {
  const d = parseLocalDate(dobIso);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** What CDS class tier fits this age? Returns null if outside 4–17. */
function suggestTier(age) {
  if (age == null) return null;
  if (age < 4) return { name: null, copy: 'A touch young — we start at age 4. Drop us a line and we’ll keep you posted.' };
  if (age <= 7) return { name: 'Little Stars', copy: 'Looks like Little Stars territory.' };
  if (age <= 10) return { name: 'The Crew',     copy: 'Sounds like The Crew is the right fit.' };
  if (age <= 17) return { name: 'Slay Squad',   copy: 'Welcome to the Slay Squad.' };
  return { name: null, copy: 'Mostly we teach 4–17, but reach out about adult workshops.' };
}

function formatNextBirthday(dobIso) {
  const d = parseLocalDate(dobIso);
  if (!d) return null;
  const today = new Date();
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric' }).format(next);
}

/* ─────────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { v: '5:45pm-6:30pm', label: '5:45 – 6:30 PM', sub: 'Little Stars' },
  { v: '6:00pm-7:00pm', label: '6:00 – 7:00 PM', sub: 'The Crew' },
  { v: '6:30pm-7:30pm', label: '6:30 – 7:30 PM', sub: 'The Crew' },
  { v: '7:00pm-8:00pm', label: '7:00 – 8:00 PM', sub: 'Slay Squad' },
];

const EMPTY = {
  childName: '',
  childDob: '',
  parentName: '',
  email: '',
  emailSecondary: '',
  phone: '',
  preferredClass: '',
  preferredDays: [],
  preferredTimes: [],
  flexibleDays: false,
  experience: 'Beginner',
  allergies: '',
  emergencyContact: '',
  photoConsent: true,
  heardFrom: '',
  notes: '',
};

const inputBase =
  'w-full rounded-xl border border-[#0a0a0f]/12 bg-white px-4 py-3.5 text-base text-[#0a0a0f] placeholder:text-[#0a0a0f]/35 transition focus:border-[#d1060f] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/12';
const inputErr = 'border-[#d1060f] ring-2 ring-[#d1060f]/15';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230a0a0f%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat pr-10";

/* ─────────────────────────────────────────────────────────────────
   Small UI helpers
   ──────────────────────────────────────────────────────────────── */

function SectionHead({ num, label, icon: Icon }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="font-mono text-xs font-semibold tracking-wider text-[#d1060f]">{num}</span>
      <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0a0a0f]">
        {Icon && <Icon className="text-[#d1060f]" />}
        {label}
      </span>
      <span className="ml-2 h-px flex-1 bg-[#0a0a0f]/8" />
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between text-sm font-medium text-[#0a0a0f]/75">
        <span>
          {label}
          {required && <span className="ml-1 text-[#d1060f]">*</span>}
        </span>
        {hint && <span className="text-xs font-normal text-[#0a0a0f]/45">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-[#d1060f]">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────── */

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [submitError, setSubmitError] = useState('');

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const toggleInArray = (field, value) => {
    setForm((p) => {
      const cur = p[field] || [];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      return { ...p, [field]: next };
    });
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  // Live age + tier + next birthday — recomputed as DOB changes
  const age = useMemo(() => calcAge(form.childDob), [form.childDob]);
  const tier = useMemo(() => suggestTier(age), [age]);
  const nextBday = useMemo(() => formatNextBirthday(form.childDob), [form.childDob]);

  const validate = () => {
    const e = {};
    if (!form.childName.trim()) e.childName = "Dancer's name is required.";
    if (!form.childDob) {
      e.childDob = 'Date of birth is required.';
    } else {
      const d = parseLocalDate(form.childDob);
      const today = new Date();
      if (!d) e.childDob = 'Please enter a valid date.';
      else if (d > today) e.childDob = 'DOB cannot be in the future.';
      else if (today.getFullYear() - d.getFullYear() > 30) e.childDob = 'That date looks too far back. Please re-enter.';
    }
    if (!form.parentName.trim()) e.parentName = "Parent / guardian name is required.";
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Please enter a valid email address.';
    if (form.emailSecondary.trim() && !EMAIL_RE.test(form.emailSecondary))
      e.emailSecondary = 'Please enter a valid email address.';
    if (!form.phone || form.phone.length < 7) e.phone = 'A valid phone number is required.';
    if (!form.preferredClass) e.preferredClass = 'Please select a dance style.';
    if (!form.flexibleDays && form.preferredDays.length === 0) {
      e.preferredDays = 'Pick at least one day (or check "Flexible").';
    }
    if (form.preferredTimes.length === 0) {
      e.preferredTimes = 'Pick at least one time slot.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    setSubmitError('');

    const payload = {
      parent_name:           form.parentName.trim(),
      student_name:          form.childName.trim(),
      email:                 form.email.trim(),
      email_secondary:       form.emailSecondary.trim() || null,
      phone:                 form.phone,
      date_of_birth:         form.childDob,
      preferred_class:       form.preferredClass,
      preferred_weekdays:    form.flexibleDays ? ['Flexible'] : form.preferredDays,
      preferred_time_slots:  form.preferredTimes,
      experience_level:      form.experience,
      allergies:             form.allergies.trim() || null,
      emergency_contact:     form.emergencyContact.trim() || null,
      photo_consent:         form.photoConsent,
      heard_from:            form.heardFrom || null,
      notes:                 form.notes.trim() || null,
      status:                'pending',
    };

    try {
      const result = await supabase.from('registrations').insert([payload]).select();
      if (result.error) throw result.error;
      setStatus('success');
      // Fire-and-forget admin notification — failure must not affect the user's UX.
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          'registration',
          studentName:   payload.student_name,
          parentName:    payload.parent_name,
          email:         payload.email,
          phone:         payload.phone,
          dob:           payload.date_of_birth,
          preferredClass: payload.preferred_class,
          preferredDays:  payload.preferred_weekdays,
          preferredTimes: payload.preferred_time_slots,
          experience:    payload.experience_level,
          notes:         payload.notes,
        }),
      }).catch(() => {});
    } catch (err) {
      console.error('[register] insert failed:', err);
      const detail = err?.message || err?.details || err?.hint || 'Unknown error';
      setSubmitError(detail);
      setStatus('error');
    }
  };

  /* ── Success state ── */
  if (status === 'success') {
    const firstName = form.childName.split(' ')[0];
    return (
      <section id="register" className="relative bg-white py-24 text-[#0a0a0f] md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_48px_rgba(209,6,15,0.55)]"
          >
            <FaCheck className="text-3xl" />
          </motion.div>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-8 text-[clamp(2rem,5vw,3.5rem)] text-[#0a0a0f]"
          >
            Welcome to the crew{firstName ? `, ${firstName}` : ''}.
          </KineticHeading>

          <p className="mt-5 text-base text-[#0a0a0f]/65 md:text-lg">
            We&rsquo;ve received your enrolment. Cherry or Pranil will be in touch within{' '}
            <strong className="text-[#0a0a0f]">24 hours</strong> to confirm the spot and
            walk through fees.
          </p>

          {nextBday && (
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#d1060f]/20 bg-[#d1060f]/[0.04] px-5 py-2.5 text-sm text-[#d1060f]">
              <FaBirthdayCake />
              We&rsquo;ll celebrate {firstName ? `${firstName}'s` : 'the'} birthday on{' '}
              <strong>{nextBday}</strong>.
            </div>
          )}

          <div className="mt-10">
            <GlowButton
              variant="ghost"
              size="md"
              onClick={() => {
                setForm(EMPTY);
                setStatus('idle');
              }}
            >
              Enrol another dancer
            </GlowButton>
          </div>
        </div>
      </section>
    );
  }

  /* ── Form ── */
  return (
    <section
      id="register"
      className="relative bg-white py-24 text-[#0a0a0f] md:py-32"
    >
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
            Enrol
          </motion.span>

          <KineticHeading
            as="h2"
            split="word"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-[#0a0a0f]"
          >
            Enrol your dancer.
          </KineticHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-4 text-base text-[#0a0a0f]/65"
          >
            Five minutes. We&rsquo;ll be in touch within 24 hours.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, margin: '-50px' }}
          className="rounded-3xl border border-[#0a0a0f]/8 bg-white p-6 shadow-[0_12px_48px_rgba(10,10,15,0.06)] md:p-10"
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-10">
            {/* 01 — Your dancer (lead with the kid, they're the star) */}
            <div>
              <SectionHead num="01" label="Your dancer" />

              <Field label="Dancer's full name" required error={errors.childName}>
                <input
                  type="text"
                  value={form.childName}
                  onChange={(e) => set('childName', e.target.value)}
                  placeholder="e.g. Emma Johnson"
                  className={`${inputBase} ${errors.childName ? inputErr : ''}`}
                  autoComplete="off"
                />
              </Field>

              {/* DOB block — the spotlight, with live age + tier + birthday hint */}
              <div className="mt-5">
                <Field
                  label="Date of birth"
                  required
                  error={errors.childDob}
                  hint={age != null ? `${age} year${age === 1 ? '' : 's'} old` : null}
                >
                  <input
                    type="date"
                    value={form.childDob}
                    onChange={(e) => set('childDob', e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className={`${inputBase} ${errors.childDob ? inputErr : ''}`}
                  />
                </Field>

                {/* Birthday celebration note + tier suggestion */}
                {nextBday && !errors.childDob && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-3 flex flex-col gap-2 rounded-xl border border-[#d1060f]/15 bg-[#d1060f]/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 text-sm text-[#0a0a0f]/75">
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-[#d1060f]">
                        <FaBirthdayCake />
                      </span>
                      <span>
                        We&rsquo;ll celebrate at the studio on{' '}
                        <strong className="text-[#0a0a0f]">{nextBday}</strong>.
                      </span>
                    </div>
                    {tier?.name && (
                      <span className="self-start rounded-full border border-[#d1060f]/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#d1060f] sm:self-auto">
                        Fits {tier.name}
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Out-of-range tier hint */}
                {age != null && tier && !tier.name && (
                  <p className="mt-3 rounded-xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-4 text-sm text-[#0a0a0f]/70">
                    {tier.copy}
                  </p>
                )}
              </div>
            </div>

            {/* 02 — Parent / guardian */}
            <div>
              <SectionHead num="02" label="Parent / guardian" />

              <Field label="Your full name" required error={errors.parentName}>
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => set('parentName', e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  autoComplete="name"
                  className={`${inputBase} ${errors.parentName ? inputErr : ''}`}
                />
              </Field>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Email" required error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="sarah@email.com"
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
              </div>

              <div className="mt-5">
                <Field
                  label="Second parent / guardian email"
                  hint="Optional"
                  error={errors.emailSecondary}
                >
                  <input
                    type="email"
                    value={form.emailSecondary}
                    onChange={(e) => set('emailSecondary', e.target.value)}
                    placeholder="partner@email.com"
                    autoComplete="off"
                    className={`${inputBase} ${errors.emailSecondary ? inputErr : ''}`}
                  />
                  <p className="mt-1.5 text-xs text-[#0a0a0f]/45">
                    Both parents will receive fee receipts and updates.
                  </p>
                </Field>
              </div>
            </div>

            {/* 03 — Class preferences */}
            <div>
              <SectionHead num="03" label="Class preferences" />

              <Field label="Dance style" required error={errors.preferredClass}>
                <select
                  value={form.preferredClass}
                  onChange={(e) => set('preferredClass', e.target.value)}
                  className={`${inputBase} ${selectChevron} ${errors.preferredClass ? inputErr : ''}`}
                >
                  <option value="">Select a style…</option>
                  <option value="Bollywood">Bollywood</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="Freestyle">Freestyle / Choreo</option>
                  <option value="Indian">Indian (semi-classical)</option>
                  <option value="Contemporary">Contemporary</option>
                  <option value="Not Sure">Not sure — help me pick</option>
                </select>
              </Field>

              {/* Preferred days — multi-select chips */}
              <div className="mt-5">
                <Field
                  label="Preferred days"
                  required
                  hint="select any that work"
                  error={errors.preferredDays}
                >
                  <div
                    className={`grid grid-cols-3 gap-2 sm:grid-cols-5 ${
                      form.flexibleDays ? 'pointer-events-none opacity-40' : ''
                    }`}
                  >
                    {WEEKDAYS.map((day) => {
                      const active = form.preferredDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleInArray('preferredDays', day)}
                          aria-pressed={active}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? 'border-[#d1060f] bg-[#d1060f]/[0.04] text-[#d1060f] ring-2 ring-[#d1060f]/15'
                              : 'border-[#0a0a0f]/12 bg-white text-[#0a0a0f]/80 hover:border-[#0a0a0f]/25'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Flexible toggle — separate from the day grid, mutually exclusive in spirit */}
                  <label className="mt-3 flex items-center gap-2.5 text-sm text-[#0a0a0f]/75 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.flexibleDays}
                      onChange={(e) => {
                        set('flexibleDays', e.target.checked);
                        if (e.target.checked) set('preferredDays', []);
                      }}
                      className="h-4 w-4 accent-[#d1060f]"
                    />
                    I&rsquo;m flexible — any weekday works
                  </label>
                </Field>
              </div>

              {/* Preferred times — multi-select chips */}
              <div className="mt-5">
                <Field
                  label="Preferred times"
                  required
                  hint="select any that work"
                  error={errors.preferredTimes}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TIME_SLOTS.map((slot) => {
                      const active = form.preferredTimes.includes(slot.v);
                      return (
                        <button
                          key={slot.v}
                          type="button"
                          onClick={() => toggleInArray('preferredTimes', slot.v)}
                          aria-pressed={active}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                            active
                              ? 'border-[#d1060f] bg-[#d1060f]/[0.04] ring-2 ring-[#d1060f]/15'
                              : 'border-[#0a0a0f]/12 bg-white hover:border-[#0a0a0f]/25'
                          }`}
                        >
                          <span>
                            <span className={`block text-sm font-semibold ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                              {slot.label}
                            </span>
                            <span className="block text-xs text-[#0a0a0f]/55">{slot.sub}</span>
                          </span>
                          {active && (
                            <span className="ml-3 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[#d1060f] text-[10px] text-white">
                              <FaCheck />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#0a0a0f]/75">
                  Experience level
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    { v: 'Beginner', sub: 'New to dance' },
                    { v: 'Some Experience', sub: '1–2 years' },
                    { v: 'Experienced', sub: '3+ years' },
                  ].map((lvl) => {
                    const active = form.experience === lvl.v;
                    return (
                      <button
                        key={lvl.v}
                        type="button"
                        onClick={() => set('experience', lvl.v)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-[#d1060f] bg-[#d1060f]/5 ring-2 ring-[#d1060f]/15'
                            : 'border-[#0a0a0f]/12 bg-white hover:border-[#0a0a0f]/25'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                          {lvl.v}
                        </p>
                        <p className="mt-0.5 text-xs text-[#0a0a0f]/55">{lvl.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 04 — Safety & consent */}
            <div>
              <SectionHead num="04" label="Safety & consent" icon={FaShieldAlt} />

              <Field
                label="Allergies or medical notes"
                hint="optional"
              >
                <textarea
                  value={form.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  rows={2}
                  placeholder="e.g. peanut allergy, asthma, knee issue — anything we should know"
                  className={`${inputBase} resize-none`}
                />
              </Field>

              <div className="mt-5">
                <Field label="Emergency contact" hint="optional · if different from above">
                  <input
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => set('emergencyContact', e.target.value)}
                    placeholder="Name + phone (e.g. Dad — 613-555-0123)"
                    className={inputBase}
                  />
                </Field>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-4 cursor-pointer transition hover:border-[#0a0a0f]/20">
                <input
                  type="checkbox"
                  checked={form.photoConsent}
                  onChange={(e) => set('photoConsent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#d1060f]"
                />
                <span className="text-sm text-[#0a0a0f]/75">
                  <strong className="text-[#0a0a0f]">Photo &amp; video consent.</strong>{' '}
                  I&rsquo;m OK with my dancer appearing in studio photos and videos —
                  recital highlights, social posts, performance footage. Uncheck to opt
                  out.
                </span>
              </label>
            </div>

            {/* 05 — Optional */}
            <div>
              <SectionHead num="05" label="Anything else? (optional)" />

              <Field label="How did you hear about us?">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                            : 'border-[#0a0a0f]/12 bg-white text-[#0a0a0f]/75 hover:border-[#0a0a0f]/25'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="mt-5">
                <Field label="Additional notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    rows={3}
                    placeholder="Questions, scheduling constraints, anything we should know."
                    className={`${inputBase} resize-none`}
                  />
                </Field>
              </div>
            </div>

            {/* Submit */}
            {status === 'error' && (
              <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/5 p-4 text-sm text-[#d1060f]">
                <p className="font-semibold">Something went wrong saving your enquiry.</p>
                {submitError && (
                  <p className="mt-1.5 break-words font-mono text-xs opacity-80">
                    {submitError}
                  </p>
                )}
                <p className="mt-2 text-xs opacity-80">
                  Please try again or WhatsApp us at 613-890-3789.
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 pt-2">
              <GlowButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={status === 'submitting'}
                icon={status === 'submitting' ? null : <FaArrowRight />}
                className={status === 'submitting' ? 'pointer-events-none opacity-60' : ''}
              >
                {status === 'submitting' ? 'Sending…' : 'Enrol my dancer'}
              </GlowButton>
              <p className="text-xs text-[#0a0a0f]/50">
                We&rsquo;ll respond within 24 hours to confirm availability and fees.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
