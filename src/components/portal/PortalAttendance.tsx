'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimes, FaClock, FaFire, FaChevronDown } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

// Default: show the last 3 months of records
function defaultFromDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}

const STATUS_META = {
  present: { icon: FaCheckCircle, color: 'text-emerald-400',  bg: 'bg-emerald-400/10',  label: 'Present' },
  late:    { icon: FaClock,       color: 'text-amber-400',    bg: 'bg-amber-400/10',    label: 'Late'    },
  absent:  { icon: FaTimes,       color: 'text-[#ee2435]',    bg: 'bg-[#d1060f]/10',    label: 'Absent'  },
};

export default function PortalAttendance() {
  const [students, setStudents]     = useState([]);
  const [attendance, setAttendance] = useState({}); // keyed by student_id
  const [loading, setLoading]       = useState(true);
  const [fromDate, setFromDate]     = useState(defaultFromDate);
  const [showAll, setShowAll]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) { setLoading(false); return; }

      const { data: studentData } = await supabase
        .from('students')
        .select('id, student_name, preferred_class, class_batch:class_batches(name)')
        .eq('email', user.email);

      if (cancelled || !studentData?.length) { setLoading(false); return; }

      setStudents(studentData);

      const ids = studentData.map((s) => s.id);
      let query = supabase
        .from('attendance')
        .select('*')
        .in('student_id', ids)
        .order('class_date', { ascending: false });

      // Limit to selected window unless "Show all" is active
      if (!showAll) query = query.gte('class_date', fromDate);

      const { data: attData, error: attErr } = await query;

      if (!cancelled) {
        if (attErr) {
          console.error('[portal-attendance] query error:', attErr);
          setFetchError(attErr.message);
        }
        const grouped = {};
        for (const row of (attData || [])) {
          if (!grouped[row.student_id]) grouped[row.student_id] = [];
          grouped[row.student_id].push(row);
        }
        setAttendance(grouped);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromDate, showAll]);

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Attendance
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Attendance history.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          A full record of every class your dancer has attended.
        </p>
        <div className="mt-4 inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55 backdrop-blur-sm">
          <span className="mt-0.5 shrink-0 text-[#ee2435]">ℹ</span>
          Attendance is marked by Cherry or Pranil at the start of each class — you don&rsquo;t need to check in yourself.
        </div>

        {/* Date range filter */}
        {!loading && !showAll && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white focus:border-[#ee2435] focus:outline-none"
              />
              <span>to today</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55 hover:text-white"
            >
              <FaChevronDown className="text-[9px]" /> Show all time
            </button>
          </div>
        )}
        {!loading && showAll && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => { setShowAll(false); setFromDate(defaultFromDate()); }}
              className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2"
            >
              Show last 3 months only
            </button>
          </div>
        )}
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
          Could not load attendance records: {fetchError}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading attendance…</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-white/55">
            No dancers linked to this account yet. Contact Cherry or Pranil to get set up.
          </p>
        </div>
      ) : (
        <>
          {/* Multi-student summary — only shown when there are 2+ dancers */}
          {students.length > 1 && (
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => {
                const records = attendance[student.id] || [];
                const total   = records.length;
                const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
                const rate    = total > 0 ? Math.round((present / total) * 100) : null;
                return (
                  <div key={student.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{student.student_name}</p>
                      <p className="mt-0.5 text-xs text-white/45">{total} class{total !== 1 ? 'es' : ''} recorded</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums ${
                        rate == null ? 'text-white/30' : rate >= 85 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-[#ee2435]'
                      }`}>
                        {rate == null ? '—' : `${rate}%`}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">attendance</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-8">
            {students.map((student) => (
              <StudentAttendance
                key={student.id}
                student={student}
                records={attendance[student.id] || []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Per-student card ── */

function StudentAttendance({ student, records }) {
  const total   = records.length;
  const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const absent  = records.filter((r) => r.status === 'absent').length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : null;

  // Streak = consecutive present/late records from the top (most recent first)
  let streak = 0;
  for (const r of records) {
    if (r.status === 'present' || r.status === 'late') streak++;
    else break;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      {/* Student name header */}
      <div className="border-b border-white/8 px-5 py-4">
        <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
          {student.student_name}
        </p>
        {(student.class_batch?.name || student.preferred_class) && (
          <p className="mt-0.5 text-xs text-white/45">
            {student.class_batch?.name || student.preferred_class}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-white/8 border-b border-white/8">
        <Stat label="Classes"    value={total} />
        <Stat label="Present"    value={present} />
        <Stat label="Absent"     value={absent}  accent={absent > 0} />
        <Stat
          label="Rate"
          value={rate !== null ? `${rate}%` : '—'}
          accent={rate !== null && rate < 80}
        />
      </div>

      {/* Streak banner — only shown when streak ≥ 3 */}
      {streak >= 3 && (
        <div className="flex items-center gap-2 border-b border-white/8 bg-[#d1060f]/[0.07] px-5 py-2.5 text-sm font-medium text-white/85">
          <FaFire className="text-yellow-300" />
          {streak}-class streak — keep it going!
        </div>
      )}

      {/* Attendance list */}
      {records.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-white/40">
          No attendance records yet.
        </div>
      ) : (
        <ul className="divide-y divide-white/8">
          {records.map((rec) => {
            const meta = STATUS_META[rec.status] || STATUS_META.present;
            const Icon = meta.icon;
            // Append T00:00 so Date parses as local midnight, not UTC midnight
            const d = new Date(rec.class_date + 'T00:00');
            return (
              <li key={rec.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.bg}`}>
                    <Icon className={`text-xs ${meta.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {d.toLocaleDateString('en-CA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {rec.class_type && (
                      <p className="text-xs text-white/45">{rec.class_type}</p>
                    )}
                    {rec.notes && (
                      <p className="text-xs text-white/35 italic">{rec.notes}</p>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${meta.color}`}>
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Stat tile ── */

function Stat({ label, value, accent = false }) {
  return (
    <div className="px-4 py-4 text-center">
      <p
        className={`font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums ${
          accent ? 'text-[#ee2435]' : 'text-white'
        }`}
      >
        {value ?? '—'}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </p>
    </div>
  );
}
