'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FaChartLine, FaUsers, FaDollarSign, FaCalendarCheck, FaDownload,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const BRAND_PALETTE = ['#d1060f', '#ee2435', '#910813', '#b00310', '#ff6b76'];

const tooltipStyle = {
  background: 'rgba(18, 18, 26, 0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  fontSize: '12px',
  color: 'white',
};
const legendStyle = { fontSize: '12px', paddingTop: '8px', color: 'rgba(255,255,255,0.7)' };

const fmt$ = (n) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export default function AnalyticsDashboard() {
  const [loading, setLoading]     = useState(true);
  const [students, setStudents]   = useState([]);
  const [fees, setFees]           = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [batches, setBatches]     = useState([]);

  useEffect(() => {
    Promise.all([
      supabase.from('students').select('id, status, preferred_class, enrollment_date, class_batch_id'),
      supabase.from('fees').select('amount, payment_status, payment_date'),
      supabase.from('attendance').select('status, class_date'),
      supabase.from('class_batches').select('id, name').eq('is_active', true),
    ]).then(([stu, fee, att, bat]) => {
      if (stu.error) console.error('Analytics: students fetch failed', stu.error.message);
      if (fee.error) console.error('Analytics: fees fetch failed', fee.error.message);
      if (att.error) console.error('Analytics: attendance fetch failed', att.error.message);
      if (bat.error) console.error('Analytics: batches fetch failed', bat.error.message);
      setStudents(stu.data || []);
      setFees(fee.data || []);
      setAttendance(att.data || []);
      setBatches(bat.data || []);
      setLoading(false);
    });
  }, []);

  /* ── KPI derivations ── */

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'active').length,
    [students],
  );

  const totalRevenue = useMemo(
    () => fees
      .filter((f) => f.payment_status === 'paid')
      .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    [fees],
  );

  const pendingRevenue = useMemo(
    () => fees
      .filter((f) => f.payment_status === 'pending') // exclude waived — that money was forgiven
      .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    [fees],
  );

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return null;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  /* ── Chart data derivations ── */

  // Monthly paid revenue — last 12 months
  const revenueData = useMemo(() => {
    const paidFees = fees.filter((f) => f.payment_status === 'paid' && f.payment_date);
    const byMonth: Record<string, number> = {};
    for (const f of paidFees) {
      const key = f.payment_date.split('T')[0].slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + parseFloat(f.amount || 0);
    }
    return Object.entries(byMonth)
      .sort()
      .slice(-12)
      .map(([k, v]) => ({
        month:   new Date(k + '-01').toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }),
        revenue: Math.round(v),
      }));
  }, [fees]);

  // Class preference distribution
  const classPopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of students) {
      const key = s.preferred_class || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [students]);

  // Monthly new enrollments — last 12 months
  const enrollmentData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const s of students) {
      if (!s.enrollment_date) continue;
      const key = s.enrollment_date.slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + 1;
    }
    return Object.entries(byMonth)
      .sort()
      .slice(-12)
      .map(([k, v]) => ({
        month:    new Date(k + '-01').toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }),
        students: v,
      }));
  }, [students]);

  // Active students per batch
  const batchData = useMemo(() => {
    const counts: Record<string, { name: string; students: number }> = {};
    for (const b of batches) counts[b.id] = { name: b.name, students: 0 };
    for (const s of students.filter((s) => s.status === 'active' && s.class_batch_id)) {
      if (counts[s.class_batch_id]) counts[s.class_batch_id].students++;
    }
    return Object.values(counts)
      .filter((b) => b.students > 0)
      .sort((a, b) => b.students - a.students);
  }, [students, batches]);

  /* ── Export ── */

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Active students', activeStudents],
      ['Total revenue collected', fmt$(totalRevenue)],
      ['Pending revenue', fmt$(pendingRevenue)],
      ['Attendance rate', attendanceRate != null ? `${attendanceRate}%` : '—'],
      ['Total attendance records', attendance.length],
      [],
      ['Month', 'Revenue'],
      ...revenueData.map((r) => [r.month, r.revenue]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <p className="text-sm text-white/40">Loading analytics…</p>
      </div>
    );
  }

  const noData = students.length === 0 && fees.length === 0;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Analytics
          </span>
          <h1 className="mt-5 flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            <FaChartLine className="text-[#ee2435]" /> Business intelligence.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Revenue, enrolments, and class trends — from live data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
        >
          <FaDownload className="text-xs" />
          Export CSV
        </button>
      </header>

      {noData && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/65 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          No data yet — charts will populate as students and fees are added.
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={FaUsers}
          label="Active students"
          value={activeStudents}
          sub={`${students.length} total enrolled`}
        />
        <KpiCard
          icon={FaDollarSign}
          label="Revenue collected"
          value={fmt$(totalRevenue)}
          sub={`${fmt$(pendingRevenue)} outstanding`}
          featured={pendingRevenue > 0}
        />
        <KpiCard
          icon={FaCalendarCheck}
          label="Attendance rate"
          value={attendanceRate != null ? `${attendanceRate}%` : '—'}
          sub={`${attendance.length} records total`}
          featured={attendanceRate != null && attendanceRate < 80}
        />
        <KpiCard
          icon={FaChartLine}
          label="Active classes"
          value={batches.length}
          sub={`${batchData.reduce((s, b) => s + b.students, 0)} students assigned`}
        />
      </div>

      {/* Revenue + class popularity */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly revenue" className="lg:col-span-2">
          {revenueData.length === 0 ? (
            <EmptyChart message="No paid fees recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d1060f" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#d1060f" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month"   stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [fmt$(v), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d1060f"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Class preference">
          {classPopularity.length === 0 ? (
            <EmptyChart message="No class preferences set." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={classPopularity}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={90}
                  dataKey="value"
                  stroke="#0a0a0f"
                  strokeWidth={2}
                >
                  {classPopularity.map((_, i) => (
                    <Cell key={i} fill={BRAND_PALETTE[i % BRAND_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Enrollments + batch sizes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly new enrolments">
          {enrollmentData.length === 0 ? (
            <EmptyChart message="No enrolment dates recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month"    stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="students" fill="#d1060f" radius={[6, 6, 0, 0]} name="New students" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Students per class">
          {batchData.length === 0 ? (
            <EmptyChart message="No students assigned to classes yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={batchData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(255,255,255,0.45)"
                  fontSize={11}
                  width={90}
                  tick={{ fill: 'rgba(255,255,255,0.65)' }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="students" fill="#ee2435" radius={[0, 6, 6, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function KpiCard({ icon: Icon, label, value, sub, featured = false }) {
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${
      featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'
    }`}>
      <div className={`grid h-10 w-10 place-items-center rounded-full ${
        featured ? 'bg-[#d1060f] text-white' : 'bg-white/10 text-white'
      }`}>
        <Icon className="text-base" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${
        featured ? 'text-[#ee2435]' : 'text-white'
      }`}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-white/45">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md ${className}`}>
      <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[260px] items-center justify-center">
      <p className="text-sm text-white/30">{message}</p>
    </div>
  );
}
