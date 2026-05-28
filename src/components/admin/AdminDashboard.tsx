'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import {
  FaUsers,
  FaDollarSign,
  FaClock,
  FaChartLine,
  FaUserPlus,
  FaMoneyBillWave,
  FaClipboardList,
  FaHeart,
  FaArrowRight,
  FaBirthdayCake,
} from 'react-icons/fa';

/**
 * Admin dashboard — overview KPIs + recent activity.
 * Dark theme matching the public homepage aesthetic.
 */

/** Returns students whose birthday falls within the next `daysAhead` days (inclusive of today). */
function getUpcomingBirthdays(students: any[], daysAhead = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();

  return students
    .filter((s) => s.date_of_birth && (s.status === 'active' || s.status === 'on_break'))
    .map((s) => {
      const dob = new Date(s.date_of_birth + 'T00:00:00');
      // Try this year's birthday; if it already passed, use next year's.
      let bday = new Date(thisYear, dob.getMonth(), dob.getDate());
      if (bday < today) bday = new Date(thisYear + 1, dob.getMonth(), dob.getDate());
      const daysUntil = Math.round((bday.getTime() - today.getTime()) / 86_400_000);
      return { ...s, daysUntil, bdayDate: bday };
    })
    .filter((s) => s.daysUntil <= daysAhead)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  // Append T00:00:00 so the date is parsed as local time, not UTC midnight
  // (avoids the "day before" shift in EDT/other negative-offset timezones)
  const local = dateString.split('T')[0] + 'T00:00:00';
  return new Date(local).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    recentStudents: [],
    upcomingDues: [],
    upcomingBirthdays: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        if (sErr) throw sErr;

        // "Pending payments" = fees that are actually due (not future-scheduled fees)
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: pendingFees, error: pfErr } = await supabase
          .from('fees')
          .select('*')
          .eq('payment_status', 'pending')
          .or(`due_date.is.null,due_date.lte.${todayStr}`);
        if (pfErr) throw pfErr;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: paidFees, error: pErr } = await supabase
          .from('fees')
          .select('amount')
          .eq('payment_status', 'paid')
          .gte('payment_date', `${currentMonth}-01`);
        if (pErr) throw pErr;

        const monthlyRevenue =
          paidFees?.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0) || 0;
        const activeStudents = students?.filter((s) => s.status === 'active').length || 0;

        // Overdue = pending fees whose due date has already passed
        const { data: upcomingDues, error: dErr } = await supabase
          .from('fees')
          .select('*, students(student_name, parent_name)')
          .eq('payment_status', 'pending')
          .lt('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(10);
        if (dErr) throw dErr;

        setStats({
          totalStudents: students?.length || 0,
          activeStudents,
          pendingPayments: pendingFees?.length || 0,
          monthlyRevenue,
          recentStudents: (students || []).slice(0, 5),
          upcomingDues: upcomingDues || [],
          upcomingBirthdays: getUpcomingBirthdays(students || []),
        });
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative p-6 md:p-8">
      {/* Atmospheric red glow — matches homepage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(209,6,15,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative">
        {/* Header */}
        <header className="mb-10">
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Dashboard
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white md:text-5xl">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-white/55 md:text-base">
            Here&rsquo;s what&rsquo;s happening at the studio today.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
            {error}
          </div>
        )}

        {/* 🎂 Today's birthdays — banner */}
        {!loading && stats.upcomingBirthdays.filter((s) => s.daysUntil === 0).length > 0 && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎂</span>
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-bold text-amber-300">
                  Birthday{stats.upcomingBirthdays.filter((s) => s.daysUntil === 0).length > 1 ? 's' : ''} today!
                </p>
                <p className="mt-0.5 text-sm text-amber-200/80">
                  {stats.upcomingBirthdays
                    .filter((s) => s.daysUntil === 0)
                    .map((s) => s.student_name)
                    .join(' · ')}
                  {' — '}don&rsquo;t forget the cake! 🎉
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={FaUsers}
            label="Total students"
            value={loading ? null : stats.totalStudents}
            sub={`${stats.activeStudents} active`}
          />
          <KpiCard
            icon={FaDollarSign}
            label="Monthly revenue"
            value={loading ? null : formatCurrency(stats.monthlyRevenue)}
            sub="this month"
            featured
          />
          <KpiCard
            icon={FaClock}
            label="Pending payments"
            value={loading ? null : stats.pendingPayments}
            sub="awaiting payment"
            featured
          />
          <KpiCard
            icon={FaChartLine}
            label="Overdue fees"
            value={loading ? null : stats.upcomingDues.length}
            sub="past due, unpaid"
            featured={stats.upcomingDues.length > 0}
          />
        </div>

        {/* Quick actions */}
        <section className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2.5">
            <QuickLink href="/admin/registrations" icon={FaClipboardList}>
              View registrations
            </QuickLink>
            <QuickLink href="/admin/students" icon={FaUserPlus}>
              Manage students
            </QuickLink>
            <QuickLink href="/admin/fees" icon={FaMoneyBillWave}>
              Manage fees
            </QuickLink>
            <QuickLink href="/admin/workshop" icon={FaHeart}>
              Workshops
            </QuickLink>
          </div>
        </section>

        {/* Two-column data */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DataPanel
            title="Recent students"
            actionHref="/admin/students"
            actionLabel="See all"
            loading={loading}
            empty={!loading && stats.recentStudents.length === 0}
            emptyIcon={FaUsers}
            emptyTitle="No students yet"
            emptyText="Students will appear here once they're added."
          >
            {stats.recentStudents.length > 0 && (
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Student</th>
                    <th className="px-4 py-2.5 text-left font-medium">Class</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {stats.recentStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{s.student_name}</div>
                        <div className="text-xs text-white/55">{s.parent_name}</div>
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {s.preferred_class || (
                          <span className="text-white/35">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataPanel>

          <DataPanel
            title="Overdue payments"
            actionHref="/admin/fees"
            actionLabel="See all"
            loading={loading}
            empty={!loading && stats.upcomingDues.length === 0}
            emptyIcon={FaClock}
            emptyTitle="No overdue payments"
            emptyText="All caught up — no fees are past due."
          >
            {stats.upcomingDues.length > 0 && (
              <table className="w-full text-sm">
                <thead className="border-b border-white/8 text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Student</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-4 py-2.5 text-left font-medium">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {stats.upcomingDues.map((fee) => (
                    <tr key={fee.id} className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-medium text-white">
                        {fee.students?.student_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-[#d1060f]/15 px-2.5 py-0.5 text-xs font-medium text-[#ee2435]">
                          {formatDate(fee.due_date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DataPanel>

          {/* Upcoming birthdays panel */}
          <DataPanel
            title="Upcoming birthdays"
            actionHref="/admin/students"
            actionLabel="See students"
            loading={loading}
            empty={!loading && stats.upcomingBirthdays.length === 0}
            emptyIcon={FaBirthdayCake}
            emptyTitle="No birthdays in the next 14 days"
            emptyText="Birthdays within 14 days will appear here."
          >
            {stats.upcomingBirthdays.length > 0 && (
              <ul className="divide-y divide-white/8">
                {stats.upcomingBirthdays.map((s) => {
                  const isToday    = s.daysUntil === 0;
                  const isTomorrow = s.daysUntil === 1;
                  const label      = isToday
                    ? 'Today 🎂'
                    : isTomorrow
                    ? 'Tomorrow'
                    : `In ${s.daysUntil} days`;
                  const dateStr = s.bdayDate.toLocaleDateString('en-CA', {
                    month: 'short', day: 'numeric',
                  });
                  return (
                    <li key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04]">
                      <div>
                        <p className={`font-medium ${isToday ? 'text-amber-300' : 'text-white'}`}>
                          {s.student_name}
                        </p>
                        <p className="text-xs text-white/50">{s.parent_name} · {dateStr}</p>
                      </div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isToday
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-white/8 text-white/65'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </DataPanel>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({ icon: Icon, label, value, sub, featured = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition ${
        featured
          ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06] hover:bg-[#d1060f]/[0.09]'
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
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${
          featured ? 'text-[#ee2435]' : 'text-white'
        }`}
      >
        {value == null ? <span className="text-white/20">—</span> : value}
      </p>
      <p className="mt-1 text-xs text-white/45">{sub}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md transition hover:border-[#d1060f] hover:text-white"
    >
      <Icon className="text-xs" />
      {children}
      <FaArrowRight className="text-[10px] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function DataPanel({
  title,
  actionHref,
  actionLabel,
  loading,
  empty,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyText,
  children,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
          {title}
        </h3>
        {actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 hover:text-[#ee2435]"
          >
            {actionLabel}
            <FaArrowRight className="text-[9px]" />
          </Link>
        )}
      </header>
      <div className="p-2">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-white/35">Loading…</div>
        ) : empty ? (
          <div className="px-4 py-10 text-center">
            {EmptyIcon && (
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white/5 text-white/35">
                <EmptyIcon className="text-lg" />
              </div>
            )}
            <p className="font-semibold text-white/85">{emptyTitle}</p>
            <p className="mt-1 text-xs text-white/50">{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:   { bg: '#ffffff', fg: '#0a0a0f' },                // white pill — confirmed
    pending:  { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435' },    // red glow — action needed
    inactive: { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.65)' },
  };
  const v = map[status] || map.pending;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: v.bg, color: v.fg }}
    >
      {status || 'pending'}
    </span>
  );
}
