'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import {
  formatWorkshopDate,
  formatPrice,
  formatPackageRange,
} from '../../lib/workshops';

const PAY_BADGE = {
  pending:   { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', label: 'Pending' },
  paid:      { bg: '#ffffff', fg: '#0a0a0f', label: 'Paid' },
  cancelled: { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Cancelled' },
  refunded:  { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Refunded' },
};

export default function WorkshopDetailAdmin({ workshopId }) {
  const router = useRouter();
  const [workshop, setWorkshop] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: w, error: wErr }, { data: b, error: bErr }] = await Promise.all([
        supabase.from('workshops').select('*').eq('id', workshopId).maybeSingle(),
        supabase.from('workshop_bookings').select('*').eq('workshop_id', workshopId).order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      if (wErr) setError(wErr.message);
      if (bErr) setError((e) => e || bErr.message);
      setWorkshop(w);
      setBookings(b || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [workshopId]);

  const refresh = async () => {
    const { data } = await supabase.from('workshop_bookings').select('*').eq('workshop_id', workshopId).order('created_at', { ascending: false });
    setBookings(data || []);
    const { data: w } = await supabase.from('workshops').select('*').eq('id', workshopId).maybeSingle();
    setWorkshop(w);
  };

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 2500); };

  const markPaymentStatus = async (booking, newStatus) => {
    const { error } = await supabase.from('workshop_bookings').update({ payment_status: newStatus }).eq('id', booking.id);
    if (error) return flash('❌ ' + error.message);
    flash(`✓ Marked ${booking.parent_name} as ${newStatus}.`);
    refresh();
  };

  const toggleCheckIn = async (booking) => {
    const checkedIn = !!booking.checked_in_at;
    const { error } = await supabase.from('workshop_bookings').update({ checked_in_at: checkedIn ? null : new Date().toISOString() }).eq('id', booking.id);
    if (error) return flash('❌ ' + error.message);
    flash(checkedIn ? `↩︎ Un-checked-in ${booking.parent_name}.` : `✓ Checked in ${booking.parent_name}.`);
    refresh();
  };

  const handleDelete = async () => {
    if (!workshop) return;
    const confirmText = `Delete "${workshop.title}"? This also removes all ${bookings.length} booking${bookings.length === 1 ? '' : 's'}.`;
    if (!window.confirm(confirmText)) return;
    const { error } = await supabase.from('workshops').delete().eq('id', workshop.id);
    if (error) return alert(error.message);
    router.push('/admin/workshop');
  };

  if (loading) {
    return <div className="p-8 text-sm text-white/40">Loading…</div>;
  }
  if (error || !workshop) {
    return (
      <div className="p-8">
        <Link href="/admin/workshop" className="text-sm text-white/55 hover:text-white">← Back to workshops</Link>
        <p className="mt-4 rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/10 p-4 text-sm text-[#ee2435]">
          {error || 'Workshop not found.'}
        </p>
      </div>
    );
  }

  const isFull = workshop.capacity > 0 && workshop.registered_count >= workshop.capacity;
  const paidCount = bookings.filter((b) => b.payment_status === 'paid').length;
  const pendingCount = bookings.filter((b) => b.payment_status === 'pending').length;
  const checkedInCount = bookings.filter((b) => b.checked_in_at).length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/workshop" className="text-sm text-white/55 hover:text-white">← All workshops</Link>
      </div>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {workshop.featured && <span title="Featured" className="text-[#ee2435]">★</span>}
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">{workshop.title}</h1>
          </div>
          {workshop.subtitle && <p className="mt-1 text-white/65">{workshop.subtitle}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/55">
            <span>{formatWorkshopDate(workshop.starts_at)}</span>
            <span>·</span>
            <span>/{workshop.slug}</span>
            <span>·</span>
            <StatusBadge status={workshop.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/workshops/${workshop.slug}`} target="_blank"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
            View public page ↗
          </Link>
          <Link href={`/admin/workshop/${workshop.id}/edit`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:bg-white/90">
            Edit
          </Link>
          <button type="button" onClick={handleDelete}
            className="rounded-lg border border-[#d1060f]/40 bg-[#d1060f]/15 px-4 py-2 text-sm font-medium text-[#ee2435] hover:bg-[#d1060f]/25">
            Delete
          </button>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Bookings" value={workshop.capacity > 0 ? `${workshop.registered_count} / ${workshop.capacity}` : workshop.registered_count} featured={isFull} />
        <StatBox label="Paid" value={paidCount} />
        <StatBox label="Pending" value={pendingCount} featured />
        <StatBox label="Checked in" value={checkedInCount} />
      </div>

      {actionMsg && (
        <div className="mb-4 rounded-xl border border-white/15 bg-white/[0.06] p-3 text-sm text-white">{actionMsg}</div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
          Bookings ({bookings.length})
        </h2>
        {workshop.packages?.length > 0 && (
          <span className="text-xs text-white/55">Prices: {formatPackageRange(workshop.packages)}</span>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-sm text-white/55">
          No bookings yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <table className="w-full text-sm">
            <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3 text-left">Attendee</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {bookings.map((b) => {
                const pay = PAY_BADGE[b.payment_status] ?? PAY_BADGE.pending;
                return (
                  <tr key={b.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{b.parent_name}</div>
                      <div className="font-mono text-[10px] text-white/40">{b.qr_token ? `${b.qr_token.slice(0, 8)}…` : '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-white/85">{b.parent_email}</div>
                      <div className="text-white/55">{b.parent_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-white/85">{b.package_label || <span className="text-white/35">—</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/85">
                      {b.amount_cents != null ? formatPrice(b.amount_cents) : <span className="text-white/35">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: pay.bg, color: pay.fg }}
                        >
                          {pay.label}
                        </span>
                        {b.payment_status !== 'paid' && (
                          <button type="button" onClick={() => markPaymentStatus(b, 'paid')}
                            className="text-[11px] font-medium text-white hover:underline">
                            Mark paid
                          </button>
                        )}
                        {b.payment_status === 'paid' && (
                          <button type="button" onClick={() => markPaymentStatus(b, 'pending')}
                            className="text-[11px] font-medium text-white/55 hover:underline">
                            Undo
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleCheckIn(b)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          b.checked_in_at
                            ? 'bg-white text-[#0a0a0f] hover:bg-white/90'
                            : 'border border-white/15 bg-white/[0.04] text-white/85 hover:border-white/30'
                        }`}
                      >
                        {b.checked_in_at ? '✓ Checked in' : 'Check in'}
                      </button>
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

function StatusBadge({ status }) {
  const m = {
    draft:     { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Draft' },
    published: { bg: '#ffffff', fg: '#0a0a0f', label: 'Published' },
    sold_out:  { bg: '#d1060f', fg: '#ffffff', label: 'Sold out' },
    completed: { bg: 'rgba(255,255,255,0.10)', fg: 'rgba(255,255,255,0.65)', label: 'Past' },
    cancelled: { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Cancelled' },
  };
  const v = m[status] ?? m.draft;
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: v.bg, color: v.fg }}>
      {v.label}
    </span>
  );
}

function StatBox({ label, value, featured = false }: { label: any; value: any; featured?: any }) {
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md ${featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums ${featured ? 'text-[#ee2435]' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
