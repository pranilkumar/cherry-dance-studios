'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
  FaHeart,
  FaArrowRight,
  FaBirthdayCake,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal home — welcome + kid card(s) + quick stats.
 * Fetches students where students.email matches the signed-in user's email.
 * Same email-match strategy as the rest of the portal.
 */

/** Parse "YYYY-MM-DD" as a local-time date (avoids UTC timezone shift). */
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

function formatNextBirthday(dobIso) {
  const d = parseLocalDate(dobIso);
  if (!d) return null;
  const today = new Date();
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  const days = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  return {
    date: new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric' }).format(next),
    daysAway: days,
  };
}

function suggestTier(age) {
  if (age == null) return null;
  if (age <= 7) return 'Little Stars';
  if (age <= 10) return 'The Crew';
  return 'Slay Squad';
}

export default function PortalDashboard() {
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [workshopBookings, setWorkshopBookings] = useState([]);
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const email = user.email;
      const fallbackName = email.split('@')[0];
      setParentName(user.user_metadata?.full_name || fallbackName);

      // Pull students linked to this parent's email (existing roster)
      const [
        { data: stu },
        { data: regs },
        { data: workshops },
      ] = await Promise.all([
        supabase.from('students').select('*, class_batch:class_batches(id, name, weekdays, start_time, end_time)').eq('email', email),
        supabase.from('registrations').select('*').eq('email', email).order('created_at', { ascending: false }),
        supabase
          .from('workshop_bookings')
          .select('*, workshop:workshops(slug, title, starts_at, venue_name)')
          .eq('parent_email', email)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      const studentList = stu || [];
      setStudents(studentList);
      setRegistrations(regs || []);
      setWorkshopBookings(workshops || []);

      // Fetch outstanding fees (pending and due today or earlier, or no due date)
      // Excludes future-scheduled fees so the count matches what PortalFees shows as "outstanding"
      if (studentList.length > 0) {
        const ids = studentList.map((s) => s.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: fees } = await supabase
          .from('fees')
          .select('*')
          .in('student_id', ids)
          .eq('payment_status', 'pending')
          .or(`due_date.is.null,due_date.lte.${todayStr}`)
          .order('due_date', { ascending: true });
        if (!cancelled) setPendingFees(fees || []);
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = parentName.split(' ')[0];

  return (
    <div className="relative p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(209,6,15,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative">
        {/* Header */}
        <header className="mb-10">
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Portal · Home
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white md:text-5xl">
            {loading ? 'Welcome back.' : `Hey, ${firstName}.`}
          </h1>
          <p className="mt-2 text-sm text-white/55 md:text-base">
            {loading
              ? 'Loading your dancers…'
              : students.length > 0
              ? `Here's what's happening with ${students.length === 1 ? 'your dancer' : 'your dancers'}.`
              : "We couldn't find a dancer linked to your email yet."}
          </p>
        </header>

        {/* Unlinked state */}
        {!loading && students.length === 0 && registrations.length === 0 && workshopBookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
              No dancers linked to this email.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Did you register with a different email? Contact us at{' '}
              <a href="mailto:cherrydancestudio.cds@gmail.com" className="text-[#ee2435] underline-offset-4 hover:underline">
                cherrydancestudio.cds@gmail.com
              </a>{' '}
              and we&rsquo;ll link you up.
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310]"
              >
                Enrol a dancer <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        )}

        {/* Pending registration state — they enrolled but haven't been "converted" to student yet */}
        {!loading && students.length === 0 && registrations.length > 0 && (
          <div className="rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/[0.06] p-6 backdrop-blur-md">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              Your enrolment is being reviewed.
            </p>
            <p className="mt-2 text-sm text-white/75">
              We received your registration for{' '}
              <strong className="text-white">{registrations[0].student_name}</strong>. Cherry or
              Pranil will confirm shortly. Once approved, your full dashboard will appear here.
            </p>
          </div>
        )}

        {/* Dancer cards */}
        {students.length > 0 && (
          <section className="mb-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {students.length === 1 ? 'Your dancer' : 'Your dancers'}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {students.map((s) => {
                const age = calcAge(s.date_of_birth);
                const tier = suggestTier(age);
                const bday = formatNextBirthday(s.date_of_birth);
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
                          {s.student_name}
                        </h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/55">
                          {age != null && `${age} years old`}
                          {tier && (
                            <>
                              <span className="mx-2 text-[#ee2435]">●</span>
                              {tier}
                            </>
                          )}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: s.status === 'active' ? '#ffffff' : 'rgba(209,6,15,0.18)',
                          color: s.status === 'active' ? '#0a0a0f' : '#ee2435',
                        }}
                      >
                        {s.status || 'pending'}
                      </span>
                    </div>

                    {/* Inline meta */}
                    <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/8 pt-5 text-xs">
                      <KV k="Preferred class" v={s.preferred_class} />
                      <KV k="Experience" v={s.experience_level} />
                    </dl>

                    {/* Birthday callout */}
                    {bday && (
                      <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#d1060f]/20 bg-[#d1060f]/[0.06] px-4 py-3 text-sm">
                        <FaBirthdayCake className="text-[#ee2435]" />
                        <span className="text-white/85">
                          {bday.daysAway === 0
                            ? <>🎉 <strong className="text-white">{s.student_name?.split(' ')[0]}&rsquo;s birthday is today!</strong></>
                            : <>Next birthday: <strong className="text-white">{bday.date}</strong> · {bday.daysAway} day{bday.daysAway === 1 ? '' : 's'} away</>
                          }
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick links + summary stats */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SummaryCard
              icon={FaDollarSign}
              label="Pending fees"
              value={pendingFees.length}
              sub={pendingFees.length === 0 ? "You're all caught up." : `${pendingFees.length} payment${pendingFees.length === 1 ? '' : 's'} due`}
              href="/portal/fees"
              featured={pendingFees.length > 0}
            />
            <SummaryCard
              icon={FaHeart}
              label="Workshop tickets"
              value={workshopBookings.length}
              sub={
                workshopBookings.length === 0
                  ? 'No workshops booked yet.'
                  : `Latest: ${workshopBookings[0]?.workshop?.title ?? 'Workshop'}`
              }
              href="/portal/workshops"
            />
            <SummaryCard
              icon={FaCalendarAlt}
              label="Next class"
              value={(() => {
                const active = students.find((s) => s.status === 'active');
                if (!active) return '—';
                const batch = active.class_batch;
                if (batch?.weekdays?.length && batch.start_time) {
                  // Calculate next occurrence
                  const DAY_NUM = { Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6 };
                  const [h, m] = batch.start_time.split(':').map(Number);
                  const now = new Date();
                  const dow = now.getDay();
                  let min = null;
                  for (const day of batch.weekdays) {
                    let d = (DAY_NUM[day] - dow + 7) % 7;
                    if (d === 0) {
                      const t = new Date(now); t.setHours(h, m, 0, 0);
                      if (t <= now) d = 7;
                    }
                    if (min === null || d < min) min = d;
                  }
                  if (min !== null) {
                    const next = new Date(now);
                    next.setDate(now.getDate() + min);
                    next.setHours(h, m, 0, 0);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    const time = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
                    if (min === 0) return `Today ${time}`;
                    if (min === 1) return `Tomorrow ${time}`;
                    return `${next.toLocaleDateString('en-CA', { weekday: 'short' })} ${time}`;
                  }
                }
                return active.preferred_class || '—';
              })()}
              sub={(() => {
                const active = students.find((s) => s.status === 'active');
                if (!active) return 'No active dancer yet.';
                const batch = active.class_batch;
                if (batch) return batch.name;
                const day = active.preferred_weekday;
                return day ? `Preferred: ${day}` : 'See Classes for schedule';
              })()}
              href="/portal/classes"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">{k}</dt>
      <dd className="mt-0.5 text-sm text-white">{v || <span className="text-white/35">—</span>}</dd>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, href, featured = false }) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 backdrop-blur-md transition ${
        featured
          ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06] hover:bg-[#d1060f]/[0.1]'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-full ${
            featured ? 'bg-[#d1060f] text-white' : 'bg-white/10 text-white'
          }`}
        >
          <Icon className="text-base" />
        </div>
        <FaArrowRight className="text-xs text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${
          featured ? 'text-[#ee2435]' : 'text-white'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-white/55">{sub}</p>
    </Link>
  );
}
