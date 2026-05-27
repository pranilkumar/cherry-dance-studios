'use client';

import { useEffect, useState } from 'react';
import {
  FaClock, FaCalendarAlt, FaInfoCircle, FaArrowRight, FaUser, FaCheckCircle,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { fmt24, parseLocalDate, calcAge, getNextClassDate, formatNextClass } from '../../lib/dateUtils';

/* ── Helpers ── */

function fmtDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatDays(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val.filter(Boolean).join(', ') || null;
  const s = String(val).trim();
  return s || null;
}

function formatTimes(val) {
  if (!val) return null;
  const parts = Array.isArray(val) ? val : String(val).split(',').map((t) => t.trim());
  const formatted = parts
    .filter(Boolean)
    .map((t) => t.replace('pm', ' PM').replace('am', ' AM').replace('-', ' – '));
  return formatted.length ? formatted.join('  ·  ') : null;
}

const STATUS_META = {
  active:   { label: 'Active',   cls: 'bg-white text-[#0a0a0f]' },
  on_break: { label: 'On break', cls: 'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  pending:  { label: 'Pending',  cls: 'bg-[#d1060f]/20 text-[#ee2435] border border-[#d1060f]/30' },
};

/* ── Component ── */

export default function PortalClasses() {
  const [students, setStudents]           = useState([]);
  const [allBatches, setAllBatches]       = useState([]);
  /** batch_id → Set of "YYYY-MM-DD" cancelled date strings */
  const [cancelledByBatch, setCancelledByBatch] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      // Look 35 days ahead to cover getNextClassDate's max lookahead
      const today  = new Date().toISOString().split('T')[0];
      const ahead  = new Date(); ahead.setDate(ahead.getDate() + 35);
      const endStr = ahead.toISOString().split('T')[0];

      const [{ data: stuData }, { data: batchData }, { data: cancelData }] = await Promise.all([
        supabase
          .from('students')
          .select('id, student_name, date_of_birth, status, preferred_class, preferred_weekday, preferred_time_slot, experience_level, batch_days, class_batch:class_batches(id, name, tier, style, instructor, weekdays, start_time, end_time, notes)')
          .eq('email', user.email)
          .in('status', ['active', 'on_break', 'pending']),
        supabase
          .from('class_batches')
          .select('id, name, tier, style, instructor, weekdays, start_time, end_time, notes')
          .eq('is_active', true)
          .order('start_time'),
        supabase
          .from('class_cancellations')
          .select('batch_id, class_date')
          .gte('class_date', today)
          .lte('class_date', endStr),
      ]);

      if (!cancelled) {
        setStudents(stuData || []);
        setAllBatches(batchData || []);

        // Build batch_id → Set<YYYY-MM-DD>
        const map = new Map<string, Set<string>>();
        for (const row of (cancelData || [])) {
          if (!map.has(row.batch_id)) map.set(row.batch_id, new Set());
          map.get(row.batch_id)!.add(row.class_date);
        }
        setCancelledByBatch(map);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Batches this parent's dancers are actually enrolled in
  const myBatchIds = new Set(students.map((s) => s.class_batch?.id).filter(Boolean));

  // Show enrolled students in their class cards (active + on_break)
  const enrolledStudents = students.filter((s) => s.status === 'active' || s.status === 'on_break');

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Classes
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Weekly schedule.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {loading
            ? 'Loading…'
            : enrolledStudents.length > 0
            ? "Your dancer's confirmed class details, plus the full studio schedule."
            : 'Browse the studio schedule below.'}
        </p>
      </header>

      {/* ── Per-dancer cards (active + on_break) ── */}
      {!loading && enrolledStudents.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {enrolledStudents.length === 1 ? 'Your dancer' : 'Your dancers'}
          </h2>
          <div className="space-y-3">
            {enrolledStudents.map((s) => {
              const batch = s.class_batch;
              const studentDays = s.batch_days?.length ? s.batch_days : undefined;
              const nextDate = getNextClassDate(batch, studentDays, cancelledByBatch.get(batch?.id));
              const next = formatNextClass(nextDate);
              const days  = batch
                ? (studentDays || batch.weekdays || []).join(', ')
                : formatDays(s.preferred_weekday);
              const times = batch
                ? (batch.end_time
                    ? `${fmt24(batch.start_time)} – ${fmt24(batch.end_time)}`
                    : fmt24(batch.start_time))
                : formatTimes(s.preferred_time_slot);
              const age  = calcAge(s.date_of_birth);
              const tier = batch?.tier || batch?.name;
              const sm   = STATUS_META[s.status] || STATUS_META.active;
              const isOnBreak = s.status === 'on_break';

              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-5 backdrop-blur-md ${
                    isOnBreak
                      ? 'border-amber-400/20 bg-amber-400/[0.04]'
                      : 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
                        {s.student_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {tier && (
                          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                            {tier}
                          </span>
                        )}
                        {batch && tier !== batch.name && (
                          <span className="text-xs text-white/35">· {batch.name}</span>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sm.cls}`}>
                      {sm.label}
                    </span>
                  </div>

                  {/* On-break notice */}
                  {isOnBreak && (
                    <p className="mt-3 text-xs text-amber-300/80">
                      This dancer is on a break. Class details are shown for reference.
                    </p>
                  )}

                  {/* Next class callout */}
                  {next && !isOnBreak && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3">
                      <FaArrowRight className="shrink-0 text-[#ee2435]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                          Next class
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-white">
                          {next.dayLabel} · {next.timeLabel}
                          {next.diffDays > 1 && (
                            <span className="ml-2 text-xs font-normal text-white/45">
                              in {next.diffDays} days
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Class details grid */}
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">Style</dt>
                      <dd className="mt-0.5 text-sm font-medium text-white">
                        {batch?.style || s.preferred_class || <span className="text-white/35">—</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                        <FaCalendarAlt className="text-[8px]" /> Days
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-white">
                        {days || <span className="text-white/35">—</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                        <FaClock className="text-[8px]" /> Time
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-white">
                        {times || <span className="text-white/35">—</span>}
                      </dd>
                    </div>
                    {batch?.instructor && (
                      <div>
                        <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                          <FaUser className="text-[8px]" /> Instructor
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-white">{batch.instructor}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Admin class notes */}
                  {batch?.notes && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/75">
                      <span className="font-semibold text-white/55 uppercase tracking-[0.12em]">Note: </span>
                      {batch.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-white/40">
            <FaInfoCircle className="mt-0.5 shrink-0 text-[10px]" />
            Schedule changes? Cherry or Pranil will notify you directly.
          </p>
        </section>
      )}

      {/* ── Studio schedule — live from DB ── */}
      {!loading && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Studio schedule
          </h2>

          {allBatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/40">
              No classes published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allBatches.map((b) => {
                const isMine = myBatchIds.has(b.id);
                const days     = (b.weekdays || []).join(', ');
                const timeStr  = b.end_time
                  ? `${fmt24(b.start_time)} – ${fmt24(b.end_time)}`
                  : fmt24(b.start_time);
                const duration = fmtDuration(b.start_time, b.end_time);

                return (
                  <div
                    key={b.id}
                    className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition ${
                      isMine
                        ? 'border-[#d1060f]/40 bg-[#d1060f]/[0.08]'
                        : 'border-white/8 bg-white/[0.02]'
                    }`}
                  >
                    {isMine && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#d1060f]/30 bg-[#d1060f]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ee2435]">
                        <FaCheckCircle className="text-[8px]" /> Your class
                      </span>
                    )}

                    <h3 className={`font-[family-name:var(--font-display)] text-lg font-bold tracking-tight ${isMine ? 'text-white' : 'text-white/75'}`}>
                      {b.name}
                    </h3>
                    {b.tier && b.tier !== b.name && (
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                        {b.tier}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
                      {days && (
                        <div className="flex items-center gap-2 text-white/65">
                          <FaCalendarAlt className="text-[10px] shrink-0 text-white/35" />
                          <span>{days}</span>
                        </div>
                      )}
                      {timeStr && (
                        <div className="flex items-center gap-2 text-white/65">
                          <FaClock className="text-[10px] shrink-0 text-white/35" />
                          <span>{timeStr}{duration && <span className="ml-1.5 text-white/35">· {duration}</span>}</span>
                        </div>
                      )}
                      {b.instructor && (
                        <div className="flex items-center gap-2 text-white/65">
                          <FaUser className="text-[10px] shrink-0 text-white/35" />
                          <span>{b.instructor}</span>
                        </div>
                      )}
                    </div>

                    {b.notes && (
                      <p className="mt-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/60 italic">
                        {b.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <p className="mt-6 text-xs text-white/35">
        Questions about the schedule?{' '}
        <a href="https://wa.me/16138903789" className="text-white/55 hover:text-white">
          WhatsApp us at 613-890-3789
        </a>
        .
      </p>
    </div>
  );
}
