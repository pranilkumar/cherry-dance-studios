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
  FaMusic,
  FaClock,
  FaExclamationTriangle,
  FaBullhorn,
  FaBell,
  FaStar,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { parseLocalDate, calcAge, getNextClassDate, fmt24 } from '../../lib/dateUtils';
import { getInitials } from '../../lib/portalUtils';

/**
 * Parent portal home — welcome + kid card(s) + quick stats.
 * Fetches students where students.email matches the signed-in user's email.
 * Same email-match strategy as the rest of the portal.
 */

function formatNextBirthday(dobIso) {
  const d = parseLocalDate(dobIso);
  if (!d) return null;
  const today = new Date();
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  const days = Math.ceil((+next - +today) / (1000 * 60 * 60 * 24));
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

/** Returns a calcNextClass-compatible object but honours cancellations. */
function nextClassInfo(
  student: any,
  cancelledByBatch: Map<string, Set<string>>,
): { next: Date; daysAway: number; h: number; m: number; batchName: string } | null {
  const batch = student.class_batch;
  if (!batch?.weekdays?.length || !batch.start_time) return null;
  const studentDays = student.batch_days?.length ? student.batch_days : undefined;
  const nextDate = getNextClassDate(batch, studentDays, cancelledByBatch.get(batch.id));
  if (!nextDate) return null;
  const d1 = new Date(nextDate); d1.setHours(0, 0, 0, 0);
  const d2 = new Date();        d2.setHours(0, 0, 0, 0);
  const daysAway = Math.round((+d1 - +d2) / 86_400_000);
  return { next: nextDate, daysAway, h: nextDate.getHours(), m: nextDate.getMinutes(), batchName: batch.name };
}

export default function PortalDashboard() {
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [workshopBookings, setWorkshopBookings] = useState([]);
  const [audioMixCount, setAudioMixCount] = useState(0);
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);
  /** batch_id → Set of "YYYY-MM-DD" cancelled date strings */
  const [cancelledByBatch, setCancelledByBatch] = useState<Map<string, Set<string>>>(new Map());
  const [upcomingCancellations, setUpcomingCancellations] = useState([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setLoading(false); return; }

        const email = user.email;
        const fallbackName = email.split('@')[0];
        setParentName(user.user_metadata?.full_name || fallbackName);

        // Phase 1: parallel fetch — students, registrations, workshops
        const [{ data: stu }, { data: regs }, { data: workshops }] = await Promise.all([
          supabase.from('students').select('*, avatar_url, class_batch:class_batches(id, name, weekdays, start_time, end_time)').eq('email', email),
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

        // Phase 2: queries that depend on knowing this parent's students/batches
        if (studentList.length > 0) {
          const ids        = studentList.map((s) => s.id);
          const todayStr   = new Date().toISOString().split('T')[0];
          const aheadDate  = new Date(); aheadDate.setDate(aheadDate.getDate() + 35);
          const aheadStr   = aheadDate.toISOString().split('T')[0];

          // Audio count: filter to public mixes visible to this parent's batches
          const batchIds = studentList
            .filter((s) => s.status === 'active' || s.status === 'on_break')
            .map((s) => s.class_batch?.id)
            .filter(Boolean);
          let audioQ = supabase
            .from('audio_mixes')
            .select('id', { count: 'exact', head: true })
            .eq('is_public', true);
          audioQ = batchIds.length > 0
            ? audioQ.or(`batch_id.is.null,batch_id.in.(${batchIds.join(',')})`)
            : audioQ.is('batch_id', null);

          const nowIso = new Date().toISOString();
          const cancelQ = batchIds.length > 0
            ? supabase
                .from('class_cancellations')
                .select('batch_id, class_date, reason, batch:class_batches(name)')
                .in('batch_id', batchIds)
                .gte('class_date', todayStr)
                .lte('class_date', aheadStr)
                .order('class_date', { ascending: true })
            : { data: [] };

          const annQ = batchIds.length > 0
            ? supabase
                .from('announcements')
                .select('id, title, body, created_at')
                .eq('is_active', true)
                .or(`audience.eq.all,batch_id.in.(${batchIds.join(',')})`)
                .or(`expires_at.is.null,expires_at.gte.${todayStr}`)
                .order('created_at', { ascending: false })
                .limit(1)
            : supabase
                .from('announcements')
                .select('id, title, body, created_at')
                .eq('is_active', true)
                .eq('audience', 'all')
                .or(`expires_at.is.null,expires_at.gte.${todayStr}`)
                .order('created_at', { ascending: false })
                .limit(1);

          const [{ data: fees }, { count: mixCount }, { data: cancelData }, { data: annData }, { data: evData }] = await Promise.all([
            supabase
              .from('fees')
              .select('*')
              .in('student_id', ids)
              .eq('payment_status', 'pending')
              .or(`due_date.is.null,due_date.lte.${todayStr}`)
              .order('due_date', { ascending: true }),
            audioQ,
            cancelQ,
            annQ,
            supabase
              .from('events')
              .select('id, title, starts_at, location')
              .eq('is_public', true)
              .gte('starts_at', nowIso)
              .order('starts_at', { ascending: true })
              .limit(3),
          ]);

          if (!cancelled) {
            setPendingFees(fees || []);
            setAudioMixCount(mixCount ?? 0);
            setUpcomingCancellations(cancelData || []);
            setLatestAnnouncement((annData || [])[0] ?? null);
            setUpcomingEvents(evData || []);

            // Build batch_id → Set<YYYY-MM-DD> for cancellation-aware "next class"
            const cMap = new Map<string, Set<string>>();
            for (const row of (cancelData || [])) {
              if (!cMap.has(row.batch_id)) cMap.set(row.batch_id, new Set());
              cMap.get(row.batch_id)!.add(row.class_date);
            }
            setCancelledByBatch(cMap);
          }
        }
      } catch (err) {
        console.error('[PortalDashboard] fetch error:', err);
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
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
              : fetchError
              ? 'Something went wrong loading your dashboard. Please refresh.'
              : students.length > 0
              ? `Here's what's happening with ${students.length === 1 ? 'your dancer' : 'your dancers'}.`
              : "We couldn't find a dancer linked to your email yet."}
          </p>
        </header>

        {/* ── Cancellation alerts ── */}
        {!loading && upcomingCancellations.length > 0 && (
          <div className="mb-6 space-y-2">
            {upcomingCancellations.map((c) => (
              <div key={`${c.batch_id}-${c.class_date}`} className="flex items-start gap-3 rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/[0.07] px-4 py-3">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-[#ee2435]" />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-white">{c.batch?.name} class cancelled — </span>
                  <span className="text-white/75">
                    {new Date(c.class_date + 'T00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  {c.reason && <span className="text-white/50"> · {c.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Latest announcement ── */}
        {!loading && latestAnnouncement && (
          <Link href="/portal/notices" className="mb-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition block">
            <FaBullhorn className="mt-0.5 flex-shrink-0 text-[#ee2435]" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">Announcement</p>
              <p className="text-sm font-semibold text-white">{latestAnnouncement.title}</p>
              <p className="text-xs text-white/55 line-clamp-1">{latestAnnouncement.body}</p>
            </div>
            <FaArrowRight className="mt-1 flex-shrink-0 text-xs text-white/30" />
          </Link>
        )}

        {/* ── Upcoming events teaser ── */}
        {!loading && upcomingEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45 flex items-center gap-2">
                <FaStar className="text-[#ee2435]" /> Upcoming events
              </p>
              <Link href="/portal/notices" className="text-xs text-white/40 hover:text-white">See all →</Link>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <Link key={ev.id} href="/portal/notices" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition">
                  <div className="flex-shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-center min-w-[44px]">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                      {new Date(ev.starts_at).toLocaleDateString('en-CA', { month: 'short' })}
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-base font-bold text-white leading-none">
                      {new Date(ev.starts_at).getDate()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                    {ev.location && <p className="text-xs text-white/45 truncate">{ev.location}</p>}
                  </div>
                  <FaArrowRight className="ml-auto flex-shrink-0 text-xs text-white/30" />
                </Link>
              ))}
            </div>
          </div>
        )}

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
              <strong className="text-white">{registrations[0].student_name}</strong>. We&rsquo;ll confirm shortly. Once approved, your full dashboard will appear here.
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
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#d1060f] to-[#780f17]">
                          {s.avatar_url
                            ? <img src={s.avatar_url} alt={s.student_name} className="h-full w-full object-cover" />
                            : <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                {getInitials(s.student_name)}
                              </span>
                          }
                        </div>
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
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: s.status === 'active' ? '#ffffff' : 'rgba(209,6,15,0.18)',
                          color: s.status === 'active' ? '#0a0a0f' : '#ee2435',
                        }}
                      >
                        {s.status || 'pending'}
                      </span>
                    </div>

                    {/* Inline meta */}
                    <div className="mt-5 border-t border-white/8 pt-5">
                      {s.class_batch ? (
                        /* Enrolled in a real batch — show class name + schedule */
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">Enrolled class</p>
                          <p className="mt-1 font-[family-name:var(--font-display)] text-base font-bold text-white">
                            {s.class_batch.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/55">
                            {s.class_batch.weekdays?.length > 0 && (
                              <span className="flex items-center gap-1.5">
                                <FaCalendarAlt className="text-[9px] text-[#ee2435]" />
                                {(s.batch_days?.length ? s.batch_days : s.class_batch.weekdays).join(' & ')}
                              </span>
                            )}
                            {s.class_batch.start_time && (
                              <span className="flex items-center gap-1.5">
                                <FaClock className="text-[9px] text-[#ee2435]" />
                                {fmt24(s.class_batch.start_time)}
                                {s.class_batch.end_time && ` – ${fmt24(s.class_batch.end_time)}`}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* No batch yet — show registration preferences */
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <KV k="Preferred class" v={s.preferred_class} />
                          <KV k="Experience" v={s.experience_level} />
                        </dl>
                      )}
                    </div>

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
        {students.length > 0 && (() => {
          const totalOwed = pendingFees.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
          const fmtOwed = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: totalOwed % 1 === 0 ? 0 : 2 }).format(totalOwed);
          const now = new Date();
          const upcomingWorkshops = workshopBookings.filter((b) => b.workshop?.starts_at && new Date(b.workshop.starts_at) >= now);
          return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={FaDollarSign}
              label="Pending fees"
              value={pendingFees.length === 0 ? '$0' : fmtOwed}
              sub={pendingFees.length === 0 ? "You're all caught up." : `${pendingFees.length} payment${pendingFees.length === 1 ? '' : 's'} due`}
              href="/portal/fees"
              featured={pendingFees.length > 0}
            />
            <SummaryCard
              icon={FaHeart}
              label="Workshops"
              value={upcomingWorkshops.length}
              sub={
                upcomingWorkshops.length === 0
                  ? workshopBookings.length > 0 ? `${workshopBookings.length} past booking${workshopBookings.length === 1 ? '' : 's'}` : 'No workshops booked yet.'
                  : `${upcomingWorkshops.length} upcoming ticket${upcomingWorkshops.length === 1 ? '' : 's'}`
              }
              href="/portal/workshops"
            />
            <SummaryCard
              icon={FaMusic}
              label="Audio mixes"
              value={audioMixCount}
              sub={
                audioMixCount === 0
                  ? 'No mixes uploaded yet.'
                  : `${audioMixCount} track${audioMixCount === 1 ? '' : 's'} available`
              }
              href="/portal/audio"
            />
            <SummaryCard
              icon={FaCalendarAlt}
              label="Next class"
              value={(() => {
                const active = students.filter((s) => s.status === 'active');
                if (!active.length) return '—';
                // Find the soonest upcoming class across ALL active dancers
                let earliest = null;
                for (const s of active) {
                  const c = nextClassInfo(s, cancelledByBatch);
                  if (c && (!earliest || c.next < earliest.next)) earliest = c;
                }
                if (!earliest) return active[0].preferred_class || '—';
                const { daysAway, h, m, next } = earliest;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12  = h % 12 || 12;
                const time = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
                if (daysAway === 0) return `Today ${time}`;
                if (daysAway === 1) return `Tomorrow ${time}`;
                return `${next.toLocaleDateString('en-CA', { weekday: 'short' })} ${time}`;
              })()}
              sub={(() => {
                const active = students.filter((s) => s.status === 'active');
                if (!active.length) return 'No active dancer yet.';
                let earliest = null; let earliestStudent = null;
                for (const s of active) {
                  const c = nextClassInfo(s, cancelledByBatch);
                  if (c && (!earliest || c.next < earliest.next)) { earliest = c; earliestStudent = s; }
                }
                if (earliest) {
                  return active.length > 1
                    ? `${earliest.batchName} · ${earliestStudent.student_name}`
                    : earliest.batchName;
                }
                const day = active[0].preferred_weekday;
                return day ? `Preferred: ${day}` : 'See Classes for schedule';
              })()}
              href="/portal/classes"
            />
          </div>
          );
        })()}
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
