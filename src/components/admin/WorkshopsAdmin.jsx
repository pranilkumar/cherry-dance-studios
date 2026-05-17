'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import {
  formatWorkshopDate,
  formatPackageRange,
} from '../../lib/workshops';

const STATUS_COLORS = {
  draft:      { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Draft' },
  published:  { bg: '#ffffff', fg: '#0a0a0f', label: 'Published' },
  sold_out:   { bg: '#d1060f', fg: '#ffffff', label: 'Sold out' },
  completed:  { bg: 'rgba(255,255,255,0.10)', fg: 'rgba(255,255,255,0.65)', label: 'Past' },
  cancelled:  { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Cancelled' },
};

export default function WorkshopsAdmin() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('starts_at', { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setWorkshops(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = workshops.filter((w) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return w.status === 'published' && new Date(w.starts_at) >= new Date();
    return w.status === filter;
  });

  const stats = {
    total: workshops.length,
    upcoming: workshops.filter((w) => w.status === 'published' && new Date(w.starts_at) >= new Date()).length,
    soldOut: workshops.filter((w) => w.status === 'sold_out').length,
    draft: workshops.filter((w) => w.status === 'draft').length,
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Workshops
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Manage workshops.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Create new workshops, view bookings, mark payments.
          </p>
        </div>
        <Link
          href="/admin/workshop/new"
          className="rounded-lg bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] hover:bg-[#b00310]"
        >
          + New workshop
        </Link>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Upcoming" value={stats.upcoming} featured />
        <StatCard label="Sold out" value={stats.soldOut} featured />
        <StatCard label="Drafts" value={stats.draft} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { v: 'all', label: `All (${workshops.length})` },
          { v: 'upcoming', label: `Upcoming (${stats.upcoming})` },
          { v: 'draft', label: `Drafts (${stats.draft})` },
          { v: 'sold_out', label: `Sold out (${stats.soldOut})` },
          { v: 'completed', label: 'Past' },
          { v: 'cancelled', label: 'Cancelled' },
        ].map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              filter === f.v
                ? 'border-[#d1060f] bg-[#d1060f] text-white'
                : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/10 p-4 text-sm text-[#ee2435]">{error}</div>
      )}
      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40 backdrop-blur-md">
          Loading workshops…
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <p className="text-base font-semibold text-white/85">
            {workshops.length === 0 ? 'No workshops yet.' : 'No workshops match this filter.'}
          </p>
          {workshops.length === 0 && (
            <p className="mt-2 text-sm text-white/55">Create your first one to start taking registrations.</p>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <table className="w-full text-sm">
            <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-5 py-3 text-left">Workshop</th>
                <th className="px-5 py-3 text-left">When</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Bookings</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map((w) => {
                const color = STATUS_COLORS[w.status] ?? STATUS_COLORS.draft;
                const isFull = w.capacity > 0 && w.registered_count >= w.capacity;
                return (
                  <tr key={w.id} className="hover:bg-white/[0.04]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {w.featured && <span title="Featured" className="text-[#ee2435]">★</span>}
                        <Link
                          href={`/admin/workshop/${w.id}`}
                          className="font-semibold text-white hover:text-[#ee2435]"
                        >
                          {w.title}
                        </Link>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-white/40">/{w.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-white/80">{formatWorkshopDate(w.starts_at)}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: color.bg, color: color.fg }}
                      >
                        {color.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {w.capacity > 0 ? (
                        <span className={isFull ? 'font-semibold text-[#ee2435]' : 'text-white/85'}>
                          {w.registered_count} / {w.capacity}
                        </span>
                      ) : (
                        <span className="text-white/55">{w.registered_count} / ∞</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-white/80">
                      {formatPackageRange(w.packages) || <span className="text-white/35">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/workshop/${w.id}`}
                          className="rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/85 hover:border-white/30"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/workshop/${w.id}/edit`}
                          className="rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/85 hover:border-white/30"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, featured = false }) {
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md ${featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${featured ? 'text-[#ee2435]' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
