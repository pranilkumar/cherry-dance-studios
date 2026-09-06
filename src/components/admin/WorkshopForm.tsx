'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

const STATUS_OPTIONS = [
  { v: 'draft',      label: 'Draft (hidden from public)' },
  { v: 'published',  label: 'Published (visible, taking bookings)' },
  { v: 'sold_out',   label: 'Sold out' },
  { v: 'completed',  label: 'Completed (past event)' },
  { v: 'cancelled',  label: 'Cancelled' },
];

const empty = (existing = null) => ({
  slug:             existing?.slug ?? '',
  title:            existing?.title ?? '',
  subtitle:         existing?.subtitle ?? '',
  description:      existing?.description ?? '',
  cover_image_url:  existing?.cover_image_url ?? '',
  starts_at:        toLocalInput(existing?.starts_at),
  ends_at:          toLocalInput(existing?.ends_at),
  venue_name:       existing?.venue_name ?? 'Cherry Dance Studios',
  venue_address:    existing?.venue_address ?? 'Barrhaven, Ottawa, ON',
  instructor_names: (existing?.instructor_names || []).join(', '),
  capacity:         existing?.capacity ?? 0,
  waitlist_enabled: existing?.waitlist_enabled ?? false,
  status:           existing?.status ?? 'draft',
  featured:         existing?.featured ?? false,
  packages_json:    JSON.stringify(existing?.packages ?? [
    { id: 'single', label: 'Single', price_cents: 2500, desc: 'One spot' },
  ], null, 2),
  perks:            (existing?.perks || []).join(', '),
  payment_info:     existing?.payment_info ?? 'E-transfer to cherrydancestudio.cds@gmail.com',
});

export default function WorkshopForm({ workshop = null, mode = 'create' }) {
  const router = useRouter();
  const [form, setForm] = useState(empty(workshop));
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [autoSlug, setAutoSlug] = useState(mode === 'create');

  useEffect(() => {
    if (autoSlug) setForm((f) => ({ ...f, slug: slugify(f.title) }));
  }, [form.title, autoSlug]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Required.';
    if (!form.slug.trim()) e.slug = 'Required.';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Use lowercase, numbers, dashes only.';
    if (!form.starts_at) e.starts_at = 'Required.';

    let parsedPackages = [];
    try {
      parsedPackages = JSON.parse(form.packages_json || '[]');
      if (!Array.isArray(parsedPackages)) throw new Error('Must be an array.');
      parsedPackages.forEach((p, i) => {
        if (!p.id) throw new Error(`Package #${i + 1} is missing "id".`);
        if (!p.label) throw new Error(`Package #${i + 1} is missing "label".`);
        if (typeof p.price_cents !== 'number') throw new Error(`Package #${i + 1} "price_cents" must be a number.`);
      });
    } catch (err) {
      e.packages_json = err.message;
    }

    setErrors(e);
    return { ok: Object.keys(e).length === 0, parsedPackages };
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const { ok, parsedPackages } = validate();
    if (!ok) return;

    setSaving(true);
    setServerError('');

    const payload = {
      slug:             form.slug.trim(),
      title:            form.title.trim(),
      subtitle:         form.subtitle.trim() || null,
      description:      form.description.trim() || null,
      cover_image_url:  form.cover_image_url.trim() || null,
      starts_at:        new Date(form.starts_at).toISOString(),
      ends_at:          form.ends_at ? new Date(form.ends_at).toISOString() : null,
      venue_name:       form.venue_name.trim() || null,
      venue_address:    form.venue_address.trim() || null,
      instructor_names: form.instructor_names.split(',').map((s) => s.trim()).filter(Boolean),
      capacity:         Number(form.capacity) || 0,
      waitlist_enabled: form.waitlist_enabled,
      status:           form.status,
      featured:         form.featured,
      packages:         parsedPackages,
      perks:            form.perks.split(',').map((s) => s.trim()).filter(Boolean),
      payment_info:     form.payment_info.trim() || null,
    };

    try {
      if (mode === 'edit' && workshop?.id) {
        const { error } = await supabase.from('workshops').update(payload).eq('id', workshop.id);
        if (error) throw error;
        router.push(`/admin/workshop/${workshop.id}`);
      } else {
        const { data, error } = await supabase.from('workshops').insert([payload]).select('id').single();
        if (error) throw error;
        router.push(`/admin/workshop/${data.id}`);
      }
    } catch (err) {
      console.error('[workshop save] failed:', err);
      setServerError(err.message || 'Failed to save. Check the console.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={mode === 'edit' && workshop?.id ? `/admin/workshop/${workshop.id}` : '/admin/workshop'}
          className="text-sm text-white/55 hover:text-white"
        >
          ← Back
        </Link>
      </div>

      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          {mode === 'edit' ? 'Edit workshop' : 'New workshop'}
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          {mode === 'edit' ? form.title || 'Edit workshop' : 'Set up a workshop.'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basics">
          <Grid2>
            <Field label="Title" required error={errors.title}>
              <input type="text" value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Bollywood Summer Camp" className={inputCls(errors.title)} />
            </Field>
            <Field label="Slug (URL)" required hint="/workshops/[slug]" error={errors.slug}>
              <input type="text" value={form.slug}
                onChange={(e) => { setAutoSlug(false); set('slug', e.target.value); }}
                placeholder="bollywood-summer-2026" className={inputCls(errors.slug)} />
            </Field>
          </Grid2>

          <Field label="Subtitle">
            <input type="text" value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="3-day intensive for ages 8+" className={inputCls()} />
          </Field>

          <Field label="Description" hint="plain text">
            <textarea value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5} placeholder="What's included, what to bring, what to expect…"
              className={`${inputCls()} resize-none`} />
          </Field>

          <Field label="Cover image URL" hint="paste a hosted image URL">
            <input type="url" value={form.cover_image_url}
              onChange={(e) => set('cover_image_url', e.target.value)}
              placeholder="https://…" className={inputCls()} />
          </Field>
        </Card>

        <Card title="When & where">
          <Grid2>
            <Field label="Starts at" required error={errors.starts_at}>
              <input type="datetime-local" value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
                className={`${inputCls(errors.starts_at)} [color-scheme:dark]`} />
            </Field>
            <Field label="Ends at" hint="optional">
              <input type="datetime-local" value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                className={`${inputCls()} [color-scheme:dark]`} />
            </Field>
          </Grid2>

          <Grid2>
            <Field label="Venue name">
              <input type="text" value={form.venue_name}
                onChange={(e) => set('venue_name', e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Venue address">
              <input type="text" value={form.venue_address}
                onChange={(e) => set('venue_address', e.target.value)} className={inputCls()} />
            </Field>
          </Grid2>

          <Field label="Instructors" hint="comma-separated · e.g. Cherry, Pranil">
            <input type="text" value={form.instructor_names}
              onChange={(e) => set('instructor_names', e.target.value)}
              placeholder="Cherry, Pranil" className={inputCls()} />
          </Field>
        </Card>

        <Card title="Capacity & status">
          <Grid2>
            <Field label="Capacity" hint="0 = unlimited">
              <input type="number" min="0" value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Status">
              <select value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={`${inputCls()} ${selectChevron}`}>
                {STATUS_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </Field>
          </Grid2>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-white/85">
              <input type="checkbox" checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="h-4 w-4 accent-[#d1060f]" />
              <span className="font-medium">Feature on /workshops</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-white/85">
              <input type="checkbox" checked={form.waitlist_enabled}
                onChange={(e) => set('waitlist_enabled', e.target.checked)}
                className="h-4 w-4 accent-[#d1060f]" />
              <span className="font-medium">Show waitlist when full</span>
            </label>
          </div>
        </Card>

        <Card title="Packages (pricing)">
          <Field label="Packages JSON" required hint='array of {id, label, price_cents, desc, deadline?} — deadline is YYYY-MM-DD; first package whose deadline has not passed is auto-selected' error={errors.packages_json}>
            <textarea value={form.packages_json}
              onChange={(e) => set('packages_json', e.target.value)}
              rows={8} spellCheck={false}
              className={`${inputCls(errors.packages_json)} font-mono text-xs resize-none`} />
          </Field>

          <Field label="Perks" hint="comma-separated · shown as included-in chips">
            <input type="text" value={form.perks}
              onChange={(e) => set('perks', e.target.value)}
              placeholder="Snacks included, Final showcase, Take-home video"
              className={inputCls()} />
          </Field>

          <Field label="Payment info" hint="shown on detail + ticket pages">
            <input type="text" value={form.payment_info}
              onChange={(e) => set('payment_info', e.target.value)}
              className={inputCls()} />
          </Field>
        </Card>

        {serverError && (
          <div className="rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/10 p-4 text-sm text-[#ee2435]">
            {serverError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href={mode === 'edit' && workshop?.id ? `/admin/workshop/${workshop.id}` : '/admin/workshop'}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 hover:border-white/30"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] hover:bg-[#b00310] disabled:opacity-60"
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create workshop'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── primitives ── */

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({ label, hint = undefined, required = false, error = undefined, children }: { label: any; hint?: any; required?: any; error?: any; children: any }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/70">
        <span>{label}{required && <span className="ml-1 text-[#ee2435]">*</span>}</span>
        {hint && <span className="font-normal text-white/40">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#ee2435]">{error}</p>}
    </div>
  );
}

const inputCls = (err?: any) =>
  `w-full rounded-lg border ${err ? 'border-[#d1060f] ring-2 ring-[#d1060f]/20' : 'border-white/15'} bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25`;

const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";
