'use client';

import { useEffect, useState } from 'react';
import { FaClock, FaPalette, FaTheaterMasks, FaBolt, FaCalendarAlt, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Portal — classes view.
 *
 * Primary: shows each dancer's confirmed class details from the DB
 *   (preferred_class, preferred_weekday, preferred_time_slot).
 * Secondary: studio weekly schedule with the student's tier highlighted.
 */

const TIERS = {
  'Little Stars': {
    icon: FaPalette,
    description: 'Ages 4–7 · A nurturing intro to dance.',
    slots: [{ days: 'Tue & Thu', time: '5:45 – 6:30 PM' }],
    duration: '45 min',
  },
  'The Crew': {
    icon: FaTheaterMasks,
    description: 'Ages 7–10 · Structured choreography + rhythm.',
    slots: [
      { days: 'Mon & Wed', time: '6:00 – 7:00 PM' },
      { days: 'Tue & Thu', time: '6:30 – 7:30 PM' },
    ],
    duration: '60 min',
  },
  'Slay Squad': {
    icon: FaBolt,
    description: 'Ages 10+ · Intensive Bollywood, hip-hop & freestyle.',
    slots: [{ days: 'Mon & Wed', time: '7:00 – 8:00 PM' }],
    duration: '2 hrs',
  },
};

/** Format "18:00" → "6:00 PM" */
function fmt24(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/* ── Next class calculation ── */

const DAY_NUM = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

/**
 * Given a class_batch, return the next Date this class occurs.
 * start_time is stored as "HH:MM" (24-hour).
 */
function getNextClassDate(batch) {
  if (!batch?.weekdays?.length || !batch.start_time) return null;
  const [hStr, mStr] = batch.start_time.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  const now = new Date();
  const todayDow = now.getDay();

  let minDaysAway = null;
  for (const day of batch.weekdays) {
    const dow = DAY_NUM[day];
    if (dow == null) continue;
    let daysAway = (dow - todayDow + 7) % 7;
    if (daysAway === 0) {
      // Same day — check if class time has already passed
      const classTime = new Date(now);
      classTime.setHours(hours, minutes, 0, 0);
      if (classTime <= now) daysAway = 7; // next week
    }
    if (minDaysAway === null || daysAway < minDaysAway) minDaysAway = daysAway;
  }

  if (minDaysAway === null) return null;
  const next = new Date(now);
  next.setDate(now.getDate() + minDaysAway);
  next.setHours(hours, minutes, 0, 0);
  next.setSeconds(0, 0);
  return next;
}

/** Format a next-class Date into a human-friendly label. */
function formatNextClass(date) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day - now) / (1000 * 60 * 60 * 24));
  const dayLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : date.toLocaleDateString('en-CA', { weekday: 'long' });
  const timeLabel = date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { dayLabel, timeLabel, diffDays };
}

function parseLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
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

function suggestTier(age) {
  if (age == null) return null;
  if (age <= 7) return 'Little Stars';
  if (age <= 10) return 'The Crew';
  return 'Slay Squad';
}

/**
 * preferred_weekday is stored as a comma-separated string (e.g. "Monday, Wednesday")
 * after the convert RPC runs array_to_string(). Handle both string and array just in case.
 */
function formatDays(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    if (val[0] === 'Flexible') return 'Flexible — any day';
    return val.join(', ');
  }
  const s = String(val).trim();
  if (!s) return null;
  if (s === 'Flexible') return 'Flexible — any day';
  return s;
}

/**
 * preferred_time_slot is stored as a comma-separated string (e.g. "6:00pm-7:00pm, 7:00pm-8:00pm").
 * Format each slot for readability.
 */
function formatTimes(val) {
  if (!val) return null;
  const parts = Array.isArray(val) ? val : String(val).split(',').map((t) => t.trim());
  const formatted = parts
    .filter(Boolean)
    .map((t) => t.replace('pm', ' PM').replace('am', ' AM').replace('-', ' – '));
  return formatted.length ? formatted.join('  ·  ') : null;
}

export default function PortalClasses() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from('students')
        .select('id, student_name, date_of_birth, status, preferred_class, preferred_weekday, preferred_time_slot, experience_level, class_batch:class_batches(id, name, tier, style, instructor, weekdays, start_time, end_time)')
        .eq('email', user.email);
      if (!cancelled) {
        setStudents(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const myTiers = new Set(
    students.map((s) => suggestTier(calcAge(s.date_of_birth))).filter(Boolean),
  );

  const activeStudents = students.filter((s) => s.status === 'active');

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
            : activeStudents.length > 0
            ? "Your dancer's confirmed class details are shown below."
            : 'Browse the schedule. Once your dancer is enrolled, their class will be highlighted.'}
        </p>
      </header>

      {/* ── Per-dancer class card ── */}
      {!loading && activeStudents.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {activeStudents.length === 1 ? 'Your dancer' : 'Your dancers'}
          </h2>
          <div className="space-y-3">
            {activeStudents.map((s) => {
              const batch = s.class_batch;
              const nextDate = getNextClassDate(batch);
              const next = formatNextClass(nextDate);
              // Fall back to registration preferences if no batch assigned yet
              const days = batch
                ? (batch.weekdays || []).join(', ')
                : formatDays(s.preferred_weekday);
              const times = batch
                ? (batch.end_time
                    ? `${fmt24(batch.start_time)} – ${fmt24(batch.end_time)}`
                    : fmt24(batch.start_time))
                : formatTimes(s.preferred_time_slot);
              const age = calcAge(s.date_of_birth);
              const tier = batch?.tier || suggestTier(age);

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/[0.06] p-5 backdrop-blur-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
                        {s.student_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {tier && (
                          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#ee2435]">
                            {tier}
                          </span>
                        )}
                        {batch && (
                          <span className="text-xs text-white/40">· {batch.name}</span>
                        )}
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a0a0f]">
                      Active
                    </span>
                  </div>

                  {/* Next class callout — only when batch is assigned */}
                  {next && (
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

                  <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
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
                  </dl>
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

      {/* ── Studio schedule ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Studio schedule
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(TIERS).map(([name, tier]) => {
            const Icon = tier.icon;
            const isMine = myTiers.has(name);
            return (
              <div
                key={name}
                className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition ${
                  isMine
                    ? 'border-white/20 bg-white/[0.06]'
                    : 'border-white/8 bg-white/[0.02]'
                }`}
              >
                {isMine && (
                  <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
                    Your tier
                  </span>
                )}

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                  <Icon className="text-base" />
                </div>

                <h3 className={`mt-4 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight ${isMine ? 'text-white' : 'text-white/70'}`}>
                  {name}
                </h3>
                <p className="mt-1 text-xs text-white/55">{tier.description}</p>

                <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
                  {tier.slots.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isMine ? 'text-white/85' : 'text-white/55'}`}>
                        {slot.days}
                      </span>
                      <span className="font-mono text-white/45">{slot.time}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-white/40">
                    <FaClock className="text-[8px]" />
                    {tier.duration} per session
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
