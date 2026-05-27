'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaCalendarDay, FaClock, FaUsers, FaBan, FaUndo,
  FaArrowRight, FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { fmt24, DAY_NUM } from '../../lib/dateUtils';

/** Number of weeks to show ahead in the schedule */
const WEEKS_AHEAD = 3;

/** Generate every class occurrence for the next N weeks from batch weekdays. */
function buildSchedule(
  batches: any[],
  weeks = WEEKS_AHEAD,
): Array<{ dateStr: string; date: Date; dayName: string; classes: any[] }> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days: Record<string, { date: Date; dateStr: string; dayName: string; classes: any[] }> = {};

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = d.toISOString().split('T')[0];

    for (const batch of batches) {
      if ((batch.weekdays || []).includes(dayName)) {
        if (!days[dateStr]) days[dateStr] = { date: d, dateStr, dayName, classes: [] };
        days[dateStr].classes.push(batch);
      }
    }
  }

  return Object.values(days).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });
}

function weekLabel(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 7)  return 'This week';
  if (diff < 14) return 'Next week';
  if (diff < 21) return 'In 2 weeks';
  return 'In 3 weeks';
}

export default function ClassSchedule() {
  const [batches, setBatches]           = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]           = useState(true);
  const [alert, setAlert]               = useState<{ type: string; message: string } | null>(null);
  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<{ batch: any; dateStr: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const end   = new Date();
      end.setDate(end.getDate() + WEEKS_AHEAD * 7);
      const endStr = end.toISOString().split('T')[0];

      const [{ data: batchData }, { data: cancelData }, { data: stuData }] = await Promise.all([
        supabase
          .from('class_batches')
          .select('id, name, tier, weekdays, start_time, end_time, instructor')
          .eq('is_active', true)
          .order('start_time'),
        supabase
          .from('class_cancellations')
          .select('*')
          .gte('class_date', today)
          .lte('class_date', endStr),
        supabase
          .from('students')
          .select('id, class_batch_id')
          .in('status', ['active', 'on_break']),
      ]);

      setBatches(batchData || []);
      setCancellations(cancelData || []);

      // Count students per batch
      const counts: Record<string, number> = {};
      for (const s of (stuData || [])) {
        if (s.class_batch_id) counts[s.class_batch_id] = (counts[s.class_batch_id] || 0) + 1;
      }
      setStudentCounts(counts);
    } catch (err) {
      console.error('[ClassSchedule] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelledKey = useMemo(() => {
    const set = new Set<string>();
    for (const c of cancellations) set.add(`${c.batch_id}::${c.class_date}`);
    return set;
  }, [cancellations]);

  const schedule = useMemo(() => buildSchedule(batches), [batches]);

  const isCancelled = (batchId: string, dateStr: string) =>
    cancelledKey.has(`${batchId}::${dateStr}`);

  const getCancellation = (batchId: string, dateStr: string) =>
    cancellations.find((c) => c.batch_id === batchId && c.class_date === dateStr);

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    const { error } = await supabase.from('class_cancellations').insert({
      batch_id:   cancelTarget.batch.id,
      class_date: cancelTarget.dateStr,
      reason:     cancelReason.trim() || null,
    });
    setSaving(false);
    if (error) {
      showAlert('error', error.message || 'Failed to cancel class.');
    } else {
      showAlert('success', `${cancelTarget.batch.name} on ${cancelTarget.dateStr} cancelled.`);
      setCancelTarget(null);
      setCancelReason('');
      fetchAll();
    }
  };

  const handleReinstate = async (batchId: string, dateStr: string) => {
    const row = getCancellation(batchId, dateStr);
    if (!row) return;
    const { error } = await supabase.from('class_cancellations').delete().eq('id', row.id);
    if (error) {
      showAlert('error', error.message || 'Failed to reinstate class.');
    } else {
      showAlert('success', 'Class reinstated.');
      fetchAll();
    }
  };

  // Group schedule days by week label
  const weeks = useMemo(() => {
    const groups: Record<string, typeof schedule> = {};
    for (const day of schedule) {
      const label = weekLabel(day.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(day);
    }
    return Object.entries(groups);
  }, [schedule]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#ee2435]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Schedule
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Recurring schedule.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Auto-generated from your batch weekdays · next {WEEKS_AHEAD} weeks. Cancel one-off classes below.
        </p>
      </header>

      {/* Alert */}
      {alert && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.06] text-white'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          {alert.message}
        </div>
      )}

      {batches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">
          No active batches yet.{' '}
          <Link href="/admin/classes" className="text-[#ee2435] hover:underline">Create one →</Link>
        </div>
      )}

      {/* Week groups */}
      <div className="space-y-10">
        {weeks.map(([weekLabel, days]) => (
          <section key={weekLabel}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {weekLabel}
            </h2>
            <div className="space-y-3">
              {days.map((day) => (
                <div key={day.dateStr}>
                  {/* Day header */}
                  <p className="mb-2 ml-1 text-sm font-semibold text-white/70">
                    {fmtDate(day.date)}
                    {day.dateStr === new Date().toISOString().split('T')[0] && (
                      <span className="ml-2 rounded-full bg-[#d1060f]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ee2435]">
                        Today
                      </span>
                    )}
                  </p>

                  <div className="space-y-2">
                    {day.classes.map((batch) => {
                      const cancelled = isCancelled(batch.id, day.dateStr);
                      const cancellation = getCancellation(batch.id, day.dateStr);
                      const timeStr = batch.end_time
                        ? `${fmt24(batch.start_time)} – ${fmt24(batch.end_time)}`
                        : fmt24(batch.start_time);
                      const count = studentCounts[batch.id] || 0;

                      return (
                        <div
                          key={batch.id}
                          className={`flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3.5 transition ${
                            cancelled
                              ? 'border-white/8 bg-white/[0.02] opacity-60'
                              : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
                          }`}
                        >
                          {/* Class info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`font-semibold ${cancelled ? 'text-white/40 line-through' : 'text-white'}`}>
                                {batch.name}
                              </p>
                              {cancelled && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#d1060f]/30 bg-[#d1060f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ee2435]">
                                  <FaBan className="text-[8px]" /> Cancelled
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-white/50">
                              {timeStr && (
                                <span className="flex items-center gap-1">
                                  <FaClock className="text-[9px]" /> {timeStr}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <FaUsers className="text-[9px]" /> {count} student{count !== 1 ? 's' : ''}
                              </span>
                              {batch.instructor && <span>{batch.instructor}</span>}
                            </div>
                            {cancellation?.reason && (
                              <p className="mt-1 text-xs text-white/40 italic">
                                Reason: {cancellation.reason}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {cancelled ? (
                              <button
                                type="button"
                                onClick={() => handleReinstate(batch.id, day.dateStr)}
                                className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/25 hover:text-white"
                              >
                                <FaUndo className="text-[9px]" /> Reinstate
                              </button>
                            ) : (
                              <>
                                <Link
                                  href={`/admin/attendance?date=${day.dateStr}&batch=${batch.id}`}
                                  className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/25 hover:text-white"
                                >
                                  <FaCheckCircle className="text-[9px]" />
                                  Mark attendance
                                  <FaArrowRight className="text-[9px] opacity-60" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => { setCancelTarget({ batch, dateStr: day.dateStr }); setCancelReason(''); }}
                                  className="flex items-center gap-1.5 rounded-lg border border-[#d1060f]/25 px-3 py-1.5 text-xs font-medium text-white/55 transition hover:border-[#d1060f]/50 hover:text-[#ee2435]"
                                >
                                  <FaBan className="text-[9px]" /> Cancel class
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12121a] p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-2 text-[#ee2435]">
              <FaExclamationTriangle />
              <span className="text-sm font-semibold uppercase tracking-wider">Cancel class</span>
            </div>
            <p className="mt-2 text-white">
              Cancel{' '}
              <strong>{cancelTarget.batch.name}</strong>{' '}
              on{' '}
              <strong>{fmtDate(new Date(cancelTarget.dateStr + 'T00:00:00'))}</strong>?
            </p>
            <p className="mt-1 text-xs text-white/50">
              Students' "next class" in the portal will skip this date. You can reinstate it anytime.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-white/55">
                Reason <span className="text-white/30">(optional — shown to you only)</span>
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Public holiday, instructor unavailable…"
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#ee2435] focus:outline-none"
                autoFocus
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5"
              >
                Keep class
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
              >
                {saving ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
