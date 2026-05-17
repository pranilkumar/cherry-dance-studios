'use client';

import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FaChartLine, FaUsers, FaDollarSign, FaTrophy,
  FaArrowUp, FaArrowDown, FaBrain, FaCalendarCheck,
  FaRobot, FaBolt, FaDownload,
} from 'react-icons/fa';

const BRAND_PALETTE = ['#d1060f', '#ee2435', '#910813', '#b00310', '#ff6b76'];

const revenueData = [
  { month: 'Jan', revenue: 12400, predicted: 13000, students: 85 },
  { month: 'Feb', revenue: 14200, predicted: 14500, students: 92 },
  { month: 'Mar', revenue: 15800, predicted: 16200, students: 98 },
  { month: 'Apr', revenue: 17500, predicted: 17800, students: 105 },
  { month: 'May', revenue: 19200, predicted: 19500, students: 112 },
  { month: 'Jun', revenue: 21000, predicted: 21500, students: 120 },
];

const classPopularity = [
  { name: 'Bollywood', value: 38 },
  { name: 'Hip-Hop', value: 28 },
  { name: 'Freestyle', value: 18 },
  { name: 'Indian', value: 10 },
  { name: 'Contemporary', value: 6 },
];

const retentionData = [
  { month: 'Jan', retention: 88, target: 90 },
  { month: 'Feb', retention: 90, target: 90 },
  { month: 'Mar', retention: 92, target: 90 },
  { month: 'Apr', retention: 89, target: 90 },
  { month: 'May', retention: 93, target: 90 },
  { month: 'Jun', retention: 95, target: 90 },
];

const peakHours = [
  { hour: '4PM', students: 8 }, { hour: '5PM', students: 18 },
  { hour: '6PM', students: 38 }, { hour: '6:30PM', students: 45 },
  { hour: '7PM', students: 32 }, { hour: '8PM', students: 12 },
];

const KPIS = [
  { title: 'Total revenue',  value: '$21,000', change: '+18.5%', trend: 'up',   icon: FaDollarSign,    prediction: '$23,500 next month' },
  { title: 'Active students', value: '120',     change: '+12.3%', trend: 'up',   icon: FaUsers,         prediction: '135 by next month' },
  { title: 'Retention rate',  value: '95%',     change: '+3.2%',  trend: 'up',   icon: FaTrophy,        prediction: 'Industry-leading' },
  { title: 'Attendance rate', value: '89%',     change: '-2.1%',  trend: 'down', icon: FaCalendarCheck, prediction: 'Improve with reminders', featured: true },
];

const AI_INSIGHTS = [
  { icon: FaBolt,   title: 'Revenue opportunity',  message: 'Add evening Hip-Hop class to capture 15+ waitlisted dancers. Estimated +$1,800/month.', confidence: 92 },
  { icon: FaUsers,  title: 'Retention alert',      message: '5 students at risk of churning. Recommend personal outreach within 48 hours.',           confidence: 87 },
  { icon: FaTrophy, title: 'Performance highlight', message: 'Bollywood attendance up 45%. Consider adding an advanced level.',                       confidence: 95 },
  { icon: FaBrain,  title: 'Pricing optimization', message: 'Annual plan conversion at 34%. A/B test $50 discount vs 1 free month.',                 confidence: 89 },
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Analytics
          </span>
          <h1 className="mt-5 flex items-center gap-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            <FaChartLine className="text-[#ee2435]" /> Business intelligence.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Revenue, retention, and peak-hour trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white hover:border-white/30 focus:border-[#ee2435] focus:outline-none"
          >
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="quarter">Last quarter</option>
            <option value="year">Last year</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
          >
            <FaDownload className="text-xs" />
            Export report
          </button>
        </div>
      </header>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/65 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#d1060f]" />
        Demo data — not yet wired to real Supabase queries.
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          const TrendIcon = k.trend === 'up' ? FaArrowUp : FaArrowDown;
          return (
            <div
              key={k.title}
              className={`rounded-2xl border p-5 backdrop-blur-md ${k.featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-full ${k.featured ? 'bg-[#d1060f] text-white' : 'bg-white/10 text-white'}`}>
                  <Icon className="text-base" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    k.trend === 'up'
                      ? 'bg-white text-[#0a0a0f]'
                      : 'bg-[#d1060f]/15 text-[#ee2435]'
                  }`}
                >
                  <TrendIcon className="text-[8px]" /> {k.change}
                </span>
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-white/55">{k.title}</p>
              <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${k.featured ? 'text-[#ee2435]' : 'text-white'}`}>
                {k.value}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
                <FaRobot className="text-[10px]" /> {k.prediction}
              </p>
            </div>
          );
        })}
      </div>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
        <header className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
            <FaBrain className="text-[#ee2435]" /> AI-powered insights
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1060f]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d1060f] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d1060f]" />
            </span>
            Live
          </span>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {AI_INSIGHTS.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-[#ee2435]">
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{ins.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{ins.message}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/55">
                      <span>Confidence</span>
                      <span className="font-mono">{ins.confidence}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-[#d1060f]" style={{ width: `${ins.confidence}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue trends & AI predictions" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d1060f" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#d1060f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ee2435" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ee2435" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
              <Area type="monotone" dataKey="revenue"   stroke="#d1060f" strokeWidth={2.5} fill="url(#revGrad)"  name="Actual revenue" />
              <Area type="monotone" dataKey="predicted" stroke="#ee2435" strokeWidth={2}   strokeDasharray="6 4" fill="url(#predGrad)" name="AI prediction" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Class popularity">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={classPopularity}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={95}
                dataKey="value"
                stroke="#0a0a0f"
                strokeWidth={2}
              >
                {classPopularity.map((entry, i) => (
                  <Cell key={`c-${i}`} fill={BRAND_PALETTE[i % BRAND_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Student retention rate">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} domain={[80, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
              <Line type="monotone" dataKey="retention" stroke="#d1060f" strokeWidth={3} dot={{ fill: '#d1060f', r: 5 }} name="Actual" />
              <Line type="monotone" dataKey="target"    stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak hours analysis">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="students" fill="#d1060f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md ${className}`}>
      <h3 className="mb-4 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">{title}</h3>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: 'rgba(18, 18, 26, 0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  fontSize: '12px',
  color: 'white',
};
const legendStyle = { fontSize: '12px', paddingTop: '8px', color: 'rgba(255,255,255,0.7)' };
