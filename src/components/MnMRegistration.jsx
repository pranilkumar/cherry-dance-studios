'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/Register.css';
import { supabase } from '../lib/supabaseClient';
import { GlowButton, KineticHeading, GradientMesh } from './ui';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheck,
  FaArrowRight,
  FaHeart,
} from 'react-icons/fa';

const FORMSPREE_ID = 'xvzlzdnr';

const PACKAGES = [
  { value: 'mom_1kid',  label: 'Mom + 1 Child',    price: '$25', desc: 'One mom, one little dancer' },
  { value: 'mom_2kids', label: 'Mom + 2 Children', price: '$30', desc: 'Double the fun, double the love' },
  { value: 'mom_3kids', label: 'Mom + 3 Children', price: '$35', desc: 'Three times the joy!' },
];

const AGES = ['Under 1', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, '12+'];

const inputBase =
  'w-full rounded-xl border border-[#0a0a0f]/12 bg-white px-4 py-3.5 text-base text-[#0a0a0f] placeholder:text-[#0a0a0f]/35 transition focus:border-[#d1060f] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/12';
const inputErr = 'border-[#d1060f] ring-2 ring-[#d1060f]/15';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230a0a0f%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat pr-10";

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-[#0a0a0f]/75">
      {label}
      {required && <span className="ml-1 text-[#d1060f]">*</span>}
    </label>
    {children}
    {error && <p className="mt-1.5 text-xs font-medium text-[#d1060f]">{error}</p>}
  </div>
);

const SectionHead = ({ num, label }) => (
  <div className="mb-6 flex items-center gap-3">
    <span className="font-mono text-xs font-semibold tracking-wider text-[#d1060f]">{num}</span>
    <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0a0a0f]">
      {label}
    </span>
    <span className="ml-2 h-px flex-1 bg-[#0a0a0f]/8" />
  </div>
);

export default function MnMRegistration() {
  const [form, setForm] = useState({
    parentName: '', phone: '', email: '',
    child1Name: '', child1Age: '',
    package: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '',
    allergy: 'no', allergyText: '', source: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.parentName.trim()) e.parentName = 'Please enter your full name.';
    if (!form.phone || form.phone.length < 7) e.phone = 'Please enter a valid phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!form.child1Name.trim()) e.child1Name = "Please enter your child's name.";
    if (!form.child1Age) e.child1Age = "Please select your child's age.";
    if (!form.package) e.package = true;
    if (form.package === 'mom_2kids' || form.package === 'mom_3kids') {
      if (!form.child2Name.trim()) e.child2Name = "Please enter your second child's name.";
      if (!form.child2Age) e.child2Age = "Please select your second child's age.";
    }
    if (form.package === 'mom_3kids') {
      if (!form.child3Name.trim()) e.child3Name = "Please enter your third child's name.";
      if (!form.child3Age) e.child3Age = "Please select your third child's age.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const { error: dbError } = await supabase
        .from('workshop_registrations')
        .insert([{
          parent_name:    form.parentName.trim(),
          phone:          form.phone,
          email:          form.email.trim(),
          child1_name:    form.child1Name.trim(),
          child1_age:     String(form.child1Age),
          package:        form.package,
          child2_name:    (form.package === 'mom_2kids' || form.package === 'mom_3kids') ? form.child2Name.trim() : null,
          child2_age:     (form.package === 'mom_2kids' || form.package === 'mom_3kids') ? String(form.child2Age) : null,
          child3_name:    form.package === 'mom_3kids' ? form.child3Name.trim() : null,
          child3_age:     form.package === 'mom_3kids' ? String(form.child3Age) : null,
          food_allergies: form.allergy === 'yes' ? (form.allergyText.trim() || 'Yes (not specified)') : null,
          heard_from:     form.source || null,
          payment_status: 'pending',
        }]);
      if (dbError) throw dbError;

      const pkgLabel =
        form.package === 'mom_1kid' ? 'Mom + 1 Child — $25' :
        form.package === 'mom_2kids' ? 'Mom + 2 Children — $30' :
        'Mom + 3 Children — $35';
      const has2 = form.package === 'mom_2kids' || form.package === 'mom_3kids';

      await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'Parent Name':    form.parentName.trim(),
          'Phone':          form.phone,
          'Email':          form.email.trim(),
          'Child 1 Name':   form.child1Name.trim(),
          'Child 1 Age':    form.child1Age,
          'Package':        pkgLabel,
          'Child 2 Name':   has2 ? form.child2Name.trim() : 'N/A',
          'Child 2 Age':    has2 ? form.child2Age : 'N/A',
          'Child 3 Name':   form.package === 'mom_3kids' ? form.child3Name.trim() : 'N/A',
          'Child 3 Age':    form.package === 'mom_3kids' ? form.child3Age : 'N/A',
          'Food Allergies': form.allergy === 'yes' ? (form.allergyText.trim() || 'Yes (not specified)') : 'None',
          'Heard From':     form.source || 'Not specified',
        }),
      });

      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please WhatsApp us at 613-890-3789 to register.');
    }
    setSubmitting(false);
  };

  const selectedPkg = PACKAGES.find((p) => p.value === form.package);

  // ── Success state ──
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f5f5f8]">
        <section className="relative overflow-hidden bg-[#0a0a0f] pb-20 pt-32 text-white md:pb-24 md:pt-40">
          <GradientMesh variant="cherry" intensity={0.5} />
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_48px_rgba(209,6,15,0.55)]"
            >
              <FaCheck className="text-3xl" />
            </motion.div>

            <KineticHeading
              as="h1"
              split="word"
              className="mt-8 text-[clamp(2.5rem,7vw,4.5rem)] text-white"
            >
              You&rsquo;re in.
            </KineticHeading>
            <p className="mt-4 text-base text-white/70 md:text-lg">
              Thanks for registering, <strong className="text-white">{form.parentName.split(' ')[0]}</strong>.
              We can&apos;t wait to dance with you.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-6">
            <div className="rounded-3xl border border-[#0a0a0f]/8 bg-white p-7 shadow-[0_12px_48px_rgba(10,10,15,0.06)] md:p-9">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                Your booking
              </h3>
              <dl className="mt-5 divide-y divide-[#0a0a0f]/8 text-sm">
                {[
                  ['Date', 'Saturday, May 9, 2026'],
                  ['Time', '6:00 PM – 8:00 PM'],
                  ['Package', `${selectedPkg?.label} — ${selectedPkg?.price}`],
                  ['Payment', 'E-transfer'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-3">
                    <dt className="text-[#0a0a0f]/55">{k}</dt>
                    <dd className="font-semibold text-[#0a0a0f]">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 rounded-2xl border border-[#d1060f]/20 bg-[#d1060f]/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d1060f]">
                  E-transfer details
                </p>
                <p className="mt-2 text-sm text-[#0a0a0f]/85">
                  Send to{' '}
                  <strong className="font-semibold">cherrydancestudio.cds@gmail.com</strong>
                </p>
                <p className="mt-1 text-sm text-[#0a0a0f]/85">
                  Message: <strong className="font-semibold">MnM – {form.parentName}</strong>
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-[#0a0a0f]/55">
                Questions?{' '}
                <a href="https://wa.me/16138903789" className="font-semibold text-[#d1060f]">
                  WhatsApp 613-890-3789
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ── Main page ──
  return (
    <main className="min-h-screen bg-[#f5f5f8]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-16 pt-32 text-white md:pb-20 md:pt-40">
        <GradientMesh variant="noir" intensity={0.7} />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.4em] text-white/65"
          >
            Cherry{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Dance Studios
            </span>
            <span className="ml-3 text-white/40">presents</span>
          </motion.span>

          <KineticHeading
            as="h1"
            split="char"
            gradient="cherry"
            className="mt-6 text-[clamp(4rem,15vw,9rem)] leading-none"
          >
            MnM
          </KineticHeading>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-2 flex items-center justify-center gap-2 font-[family-name:var(--font-display)] text-lg italic text-white/85 md:text-2xl"
          >
            <FaHeart className="text-sm text-[#ee2435]" />
            Mom &amp; Me — celebrate the bond through dance
          </motion.p>

          {/* Detail pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { icon: FaCalendarAlt, text: 'Sat, May 9, 2026' },
              { icon: FaClock, text: '6:00 – 8:00 PM' },
              { icon: FaMapMarkerAlt, text: 'Barrhaven, Ottawa' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.text}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur-md"
                >
                  <Icon className="text-xs text-[#ee2435]" />
                  {p.text}
                </div>
              );
            })}
          </motion.div>

          {/* Perks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs uppercase tracking-[0.15em] text-white/50"
          >
            {['Video recording included', 'Snacks included', 'No experience needed'].map((p, i) => (
              <span key={p} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/25">·</span>}
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[#0a0a0f]/8 bg-white p-6 shadow-[0_12px_48px_rgba(10,10,15,0.06)] md:p-10"
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-10">
              {/* 01 — Parent */}
              <div>
                <SectionHead num="01" label="Parent information" />
                <Field label="Full name" required error={errors.parentName}>
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
                  <Field label="WhatsApp / Phone" required error={errors.phone}>
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
                  <Field label="Email address" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="sarah@email.com"
                      autoComplete="email"
                      className={`${inputBase} ${errors.email ? inputErr : ''}`}
                    />
                  </Field>
                </div>
              </div>

              {/* 02 — Child */}
              <div>
                <SectionHead num="02" label="Your child" />
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Child's name" required error={errors.child1Name}>
                    <input
                      type="text"
                      value={form.child1Name}
                      onChange={(e) => set('child1Name', e.target.value)}
                      placeholder="e.g. Emma"
                      className={`${inputBase} ${errors.child1Name ? inputErr : ''}`}
                    />
                  </Field>
                  <Field label="Child's age" required error={errors.child1Age}>
                    <select
                      value={form.child1Age}
                      onChange={(e) => set('child1Age', e.target.value)}
                      className={`${inputBase} ${selectChevron} ${errors.child1Age ? inputErr : ''}`}
                    >
                      <option value="">Select age</option>
                      {AGES.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* 03 — Package */}
              <div>
                <SectionHead num="03" label="Pick your package" />
                <div className="grid gap-3 md:grid-cols-3">
                  {PACKAGES.map((pkg) => {
                    const active = form.package === pkg.value;
                    return (
                      <button
                        key={pkg.value}
                        type="button"
                        onClick={() => set('package', pkg.value)}
                        className={`relative rounded-2xl border p-5 text-left transition ${
                          active
                            ? 'border-[#d1060f] bg-[#d1060f]/[0.04] ring-2 ring-[#d1060f]/20'
                            : 'border-[#0a0a0f]/12 bg-white hover:border-[#0a0a0f]/25'
                        }`}
                      >
                        <p className={`font-[family-name:var(--font-display)] text-base font-bold tracking-tight ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                          {pkg.label}
                        </p>
                        <p className="mt-1 text-xs text-[#0a0a0f]/55">{pkg.desc}</p>
                        <p className={`mt-4 font-[family-name:var(--font-display)] text-2xl font-bold ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                          {pkg.price}
                        </p>
                        {active && (
                          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#d1060f] text-[10px] text-white">
                            <FaCheck />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.package && (
                  <p className="mt-2 text-xs font-medium text-[#d1060f]">Please select a package.</p>
                )}

                <div className="mt-4 rounded-xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-4 text-sm">
                  <strong className="text-[#0a0a0f]">E-transfer payment</strong>
                  <p className="mt-1 text-[#0a0a0f]/65">
                    Send to <strong>cherrydancestudio.cds@gmail.com</strong> · Message:{' '}
                    <strong>MnM – [Your Name]</strong>
                  </p>
                </div>

                {/* Second child */}
                {(form.package === 'mom_2kids' || form.package === 'mom_3kids') && (
                  <div className="mt-6 rounded-2xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-5 md:p-6">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0f]/55">
                      Second child
                    </p>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Name" required error={errors.child2Name}>
                        <input
                          type="text"
                          value={form.child2Name}
                          onChange={(e) => set('child2Name', e.target.value)}
                          placeholder="e.g. Lily"
                          className={`${inputBase} ${errors.child2Name ? inputErr : ''}`}
                        />
                      </Field>
                      <Field label="Age" required error={errors.child2Age}>
                        <select
                          value={form.child2Age}
                          onChange={(e) => set('child2Age', e.target.value)}
                          className={`${inputBase} ${selectChevron} ${errors.child2Age ? inputErr : ''}`}
                        >
                          <option value="">Select age</option>
                          {AGES.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {/* Third child */}
                {form.package === 'mom_3kids' && (
                  <div className="mt-4 rounded-2xl border border-[#0a0a0f]/8 bg-[#f5f5f8] p-5 md:p-6">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0f]/55">
                      Third child
                    </p>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Name" required error={errors.child3Name}>
                        <input
                          type="text"
                          value={form.child3Name}
                          onChange={(e) => set('child3Name', e.target.value)}
                          placeholder="e.g. Zara"
                          className={`${inputBase} ${errors.child3Name ? inputErr : ''}`}
                        />
                      </Field>
                      <Field label="Age" required error={errors.child3Age}>
                        <select
                          value={form.child3Age}
                          onChange={(e) => set('child3Age', e.target.value)}
                          className={`${inputBase} ${selectChevron} ${errors.child3Age ? inputErr : ''}`}
                        >
                          <option value="">Select age</option>
                          {AGES.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* 04 — Allergies */}
              <div>
                <SectionHead num="04" label="Snack & allergy info" />
                <Field label="Any food allergies?">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { v: 'no', label: 'No allergies' },
                      { v: 'yes', label: "Yes, I'll specify" },
                    ].map((opt) => {
                      const active = form.allergy === opt.v;
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => set('allergy', opt.v)}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            active
                              ? 'border-[#d1060f] bg-[#d1060f]/[0.04] text-[#d1060f] ring-2 ring-[#d1060f]/15'
                              : 'border-[#0a0a0f]/12 bg-white text-[#0a0a0f] hover:border-[#0a0a0f]/25'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {form.allergy === 'yes' && (
                  <div className="mt-4">
                    <textarea
                      value={form.allergyText}
                      onChange={(e) => set('allergyText', e.target.value)}
                      placeholder="e.g. peanut allergy, dairy-free, gluten-free…"
                      rows={3}
                      className={`${inputBase} resize-none`}
                    />
                  </div>
                )}
                <p className="mt-3 text-xs text-[#0a0a0f]/55">
                  <strong className="text-[#0a0a0f]/75">Snacks are included</strong> for moms and kids — we want everyone safe and happy.
                </p>
              </div>

              {/* 05 — Source */}
              <div>
                <SectionHead num="05" label="How did you hear about us? (optional)" />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { v: 'instagram', label: 'Instagram' },
                    { v: 'whatsapp', label: 'WhatsApp' },
                    { v: 'friend', label: 'Friend / Family' },
                    { v: 'other', label: 'Other' },
                  ].map((opt) => {
                    const active = form.source === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => set('source', active ? '' : opt.v)}
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
              </div>

              {/* Summary */}
              {selectedPkg && (
                <div className="rounded-2xl border border-[#d1060f]/20 bg-[#d1060f]/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[#0a0a0f]">
                      {selectedPkg.label}
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#d1060f]">
                      {selectedPkg.price}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#0a0a0f]/55">
                    E-transfer to cherrydancestudio.cds@gmail.com
                  </p>
                </div>
              )}

              {submitError && (
                <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/5 p-4 text-sm text-[#d1060f]">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <GlowButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={submitting ? null : <FaArrowRight />}
                  className={submitting ? 'pointer-events-none opacity-60' : ''}
                >
                  {submitting ? 'Registering…' : 'Reserve my spot'}
                </GlowButton>
                <p className="text-xs text-[#0a0a0f]/55">
                  Need help?{' '}
                  <a href="https://wa.me/16138903789" className="font-semibold text-[#d1060f]">
                    WhatsApp 613-890-3789
                  </a>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
