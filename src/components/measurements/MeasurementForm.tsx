'use client';

import { useState } from 'react';

type Field = { id: string; label: string; hint?: string };

const LEHENGA_FIELDS: Field[] = [
  { id: 'lehengaWaist',  label: 'Waist',  hint: 'inches' },
  { id: 'lehengaLength', label: 'Length', hint: 'waist to hem, inches' },
];

const BLOUSE_FIELDS: Field[] = [
  { id: 'blouseChest',     label: 'Chest',        hint: 'inches' },
  { id: 'blouseLowerBust', label: 'Lower Bust',   hint: 'inches' },
  { id: 'blouseWaist',     label: 'Waist',        hint: 'inches' },
  { id: 'blouseShoulder',  label: 'Shoulder',     hint: 'inches' },
  { id: 'blouseSleeve',    label: 'Sleeve Length', hint: 'inches' },
  { id: 'blouseArmhole',   label: 'Armhole',      hint: 'inches' },
  { id: 'blouseFront',     label: 'Front Length', hint: 'inches' },
  { id: 'blouseBack',      label: 'Back Length',  hint: 'inches' },
];

type FormState = Record<string, string>;

const EMPTY: FormState = {
  childName: '', parentName: '', phone: '',
  lehengaWaist: '', lehengaLength: '',
  blouseChest: '', blouseLowerBust: '', blouseWaist: '', blouseShoulder: '',
  blouseSleeve: '', blouseArmhole: '', blouseFront: '', blouseBack: '',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <h2 className="mb-5 flex items-center gap-2.5 font-[family-name:var(--font-display)] text-base font-semibold text-[#ee2435]">
        <span className="h-[18px] w-[3px] rounded-full bg-[#d1060f]" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldInput({
  id, label, hint, numeric, value, error, onChange,
}: {
  id: string; label: string; hint?: string; numeric?: boolean;
  value: string; error: boolean; onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`mf-${id}`} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
        {label} *
      </label>
      <input
        id={`mf-${id}`}
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'decimal' : 'text'}
        min={numeric ? 0 : undefined}
        step={numeric ? 0.25 : undefined}
        placeholder={numeric ? 'e.g. 24' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`rounded-xl border px-3.5 py-2.5 text-sm text-white bg-white/[0.04] placeholder:text-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#d1060f]/40 ${
          error ? 'border-[#ee2435]/60' : 'border-white/10 focus:border-[#ee2435]'
        }`}
      />
      {hint && <span className="text-[10px] text-white/35">{hint}</span>}
    </div>
  );
}

export default function MeasurementForm({ eventSlug }: { eventSlug: string }) {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [errors, setErrors]   = useState<Record<string, boolean>>({});
  const [errMsg, setErrMsg]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: false }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');

    const allKeys = Object.keys(EMPTY);
    const newErrors: Record<string, boolean> = {};
    allKeys.forEach(k => { if (!form[k].trim()) newErrors[k] = true; });

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setErrMsg('Please fill in all required fields.');
      document.getElementById('mf-childName')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/measurements/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
      } else {
        setErrMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setErrMsg('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#d1060f]/20 text-3xl">
            🎉
          </div>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            Thank you, {form.parentName.split(' ')[0]}!
          </h2>
          <p className="text-sm text-white/60">
            {form.childName}'s measurements have been saved. Cherry Dance Studios will use them to
            prepare the costume. For corrections, please reach out to us directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errMsg && (
        <div className="rounded-xl border border-[#ee2435]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
          {errMsg}
        </div>
      )}

      <Section title="About Your Child">
        <div className="mb-4">
          <FieldInput id="childName" label="Child's Name" value={form.childName} error={errors.childName} onChange={v => set('childName', v)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldInput id="parentName" label="Parent's Name" value={form.parentName} error={errors.parentName} onChange={v => set('parentName', v)} />
          <FieldInput id="phone" label="Phone Number" value={form.phone} error={errors.phone} onChange={v => set('phone', v)} />
        </div>
      </Section>

      <Section title="Lehenga">
        <div className="mb-5 overflow-hidden rounded-xl border border-white/10">
          <img
            src="/measurement-guide-lehenga.png"
            alt="Lehenga measurement guide — waist round and waist to floor"
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {LEHENGA_FIELDS.map(f => (
            <FieldInput key={f.id} id={f.id} label={f.label} hint={f.hint} numeric
              value={form[f.id]} error={errors[f.id]} onChange={v => set(f.id, v)} />
          ))}
        </div>
      </Section>

      <Section title="Blouse">
        <div className="mb-5 space-y-3">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src="/measurement-guide-blouse.png"
              alt="Blouse measurement guide — chest, lower bust, waist and blouse length"
              className="w-full"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src="/measurement-guide-shoulder-sleeve.png"
              alt="Shoulder, sleeve and fit measurement guide"
              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {BLOUSE_FIELDS.map(f => (
            <FieldInput key={f.id} id={f.id} label={f.label} hint={f.hint} numeric
              value={form[f.id]} error={errors[f.id]} onChange={v => set(f.id, v)} />
          ))}
        </div>
      </Section>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.4)] transition hover:shadow-[0_12px_32px_rgba(209,6,15,0.55)] disabled:opacity-60 disabled:shadow-none"
        style={{ background: 'linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%)' }}
      >
        {loading ? 'Submitting…' : 'Submit Measurements'}
      </button>

      <p className="text-center text-xs text-white/30">
        🔒 Your information is only shared with Cherry Dance Studios.
      </p>
    </form>
  );
}
