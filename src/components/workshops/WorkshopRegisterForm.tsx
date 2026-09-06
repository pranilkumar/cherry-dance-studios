'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { GlowButton } from '../ui';
import { FaArrowRight, FaCheck } from 'react-icons/fa';
import { formatPrice } from '../../lib/workshops';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase =
  'w-full rounded-xl border border-[#0a0a0f]/12 bg-white px-4 py-3.5 text-base text-[#0a0a0f] placeholder:text-[#0a0a0f]/35 transition focus:border-[#d1060f] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/12';
const inputErr = 'border-[#d1060f] ring-2 ring-[#d1060f]/15';
function Field({ label, required = false, error = undefined, children }: { label: any; required?: any; error?: any; children: any }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#0a0a0f]/75">
        {label}
        {required && <span className="ml-1 text-[#d1060f]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-[#d1060f]">{error}</p>}
    </div>
  );
}

function SectionHead({ num, label }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="font-mono text-xs font-semibold tracking-wider text-[#d1060f]">{num}</span>
      <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0a0a0f]">
        {label}
      </span>
      <span className="ml-2 h-px flex-1 bg-[#0a0a0f]/8" />
    </div>
  );
}

export default function WorkshopRegisterForm({ workshop }) {
  const router = useRouter();
  const packages = Array.isArray(workshop.packages) ? workshop.packages : [];

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    packageId: packages.length === 1 ? packages[0].id : '',
    dietaryNotes: '',
    heardFrom: '',
  });
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [submitError, setSubmitError] = useState('');

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const selectedPkg = packages.find((p) => p.id === form.packageId);

  const validate = () => {
    const e: Record<string, any> = {};
    if (!form.name.trim()) e.name = 'Your name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Please enter a valid email address.';
    if (!form.phone || form.phone.length < 7) e.phone = 'A valid phone number is required.';
    if (packages.length > 0 && !form.packageId) e.packageId = 'Pick a package.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    setSubmitError('');

    try {
      // All validation, capacity enforcement, duplicate checking, and price
      // resolution happen server-side in /api/workshop-register so the client
      // cannot tamper with price, bypass capacity, or double-book.
      const res = await fetch('/api/workshop-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshop_id:   workshop.id,
          package_id:    selectedPkg?.id ?? null,
          parent_name:   form.name.trim(),
          parent_email:  form.email.trim(),
          parent_phone:  form.phone,
          children:      [],
          dietary_notes: form.dietaryNotes.trim() || null,
          heard_from:    form.heardFrom || null,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(result.error || 'Something went wrong. Please WhatsApp us at 613-890-3789.');
        setStatus('error');
        return;
      }

      if (!result.qr_token) {
        throw new Error('No token returned from server.');
      }

      // Fire-and-forget admin notification — failure must not affect the user's UX.
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          'workshop',
          workshopTitle: workshop.title ?? workshop.name ?? 'Workshop',
          parentName:    form.name.trim(),
          email:         form.email.trim(),
          phone:         form.phone,
          children:      [],
          packageLabel:  selectedPkg?.label ?? null,
          dietaryNotes:  form.dietaryNotes.trim() || null,
        }),
      }).catch(() => {});

      router.push(`/workshops/${workshop.slug}/ticket/${result.qr_token}`);
    } catch (err) {
      console.error('[workshop register] failed:', err);
      setSubmitError('Something went wrong. Please WhatsApp us at 613-890-3789 to register.');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f8]">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#0a0a0f] pb-12 pt-32 text-white md:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(209,6,15,0.22) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#ee2435] md:text-xs">
            Register · {workshop.title}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] font-bold leading-[1] tracking-[-0.04em] md:text-5xl text-4xl">
            Reserve your spot.
          </h1>
          <p className="mt-3 text-sm text-white/65 md:text-base">
            Fill in the details — we&rsquo;ll confirm by email within 24 hours.
          </p>
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
              {/* 01 — Your details */}
              <div>
                <SectionHead num="01" label="Your details" />
                <Field label="Full name" required error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    autoComplete="name"
                    className={`${inputBase} ${errors.name ? inputErr : ''}`}
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

              {/* 02 — Package */}
              {packages.length > 0 && (
                <div>
                  <SectionHead num="02" label="Pick your package" />
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => {
                      const active = form.packageId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => set('packageId', pkg.id)}
                          className={`relative rounded-2xl border p-5 text-left transition ${
                            active
                              ? 'border-[#d1060f] bg-[#d1060f]/[0.04] ring-2 ring-[#d1060f]/20'
                              : 'border-[#0a0a0f]/12 bg-white hover:border-[#0a0a0f]/25'
                          }`}
                        >
                          <p className={`font-[family-name:var(--font-display)] text-base font-bold tracking-tight ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                            {pkg.label}
                          </p>
                          {pkg.desc && <p className="mt-1 text-xs text-[#0a0a0f]/55">{pkg.desc}</p>}
                          <p className={`mt-4 font-[family-name:var(--font-display)] text-2xl font-bold ${active ? 'text-[#d1060f]' : 'text-[#0a0a0f]'}`}>
                            {formatPrice(pkg.price_cents)}
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
                  {errors.packageId && (
                    <p className="mt-2 text-xs font-medium text-[#d1060f]">{errors.packageId}</p>
                  )}
                </div>
              )}

              {/* 03 — Notes */}
              <div>
                <SectionHead num={packages.length > 0 ? '03' : '02'} label="Anything else? (optional)" />
                <Field label="Dietary notes or allergies">
                  <textarea
                    value={form.dietaryNotes}
                    onChange={(e) => set('dietaryNotes', e.target.value)}
                    rows={2}
                    placeholder="e.g. peanut allergy, dairy-free…"
                    className={`${inputBase} resize-none`}
                  />
                </Field>
                <div className="mt-5">
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
                      {formatPrice(selectedPkg.price_cents)}
                    </span>
                  </div>
                  {workshop.payment_info && (
                    <p className="mt-1 text-xs text-[#0a0a0f]/55">{workshop.payment_info}</p>
                  )}
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
                  disabled={status === 'submitting'}
                  icon={status === 'submitting' ? null : <FaArrowRight />}
                >
                  {status === 'submitting' ? 'Reserving…' : 'Reserve my spot'}
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
