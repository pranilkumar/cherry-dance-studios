'use client';

import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaQrcode, FaCheckCircle, FaClock, FaUsers, FaCalendarDay,
  FaSave, FaTimes, FaDownload, FaChevronRight,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const MARKS = {
  present: { label: 'Present', short: 'P', activeBg: 'bg-white',     activeText: 'text-[#0a0a0f]' },
  late:    { label: 'Late',    short: 'L', activeBg: 'bg-amber-400',  activeText: 'text-[#0a0a0f]' },
  absent:  { label: 'Absent',  short: 'A', activeBg: 'bg-[#d1060f]',  activeText: 'text-white'     },
};

export default function AttendanceSystem() {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate]                   = useState(today);
  const [batches, setBatches]             = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents]           = useState([]);
  const [marks, setMarks]                 = useState<Record<string, string>>({}); // { student_id: 'present'|'late'|'absent' }
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [todayStats, setTodayStats]       = useState({ present: 0, late: 0, absent: 0 });
  const [qrBatch, setQrBatch]             = useState(null);
  const [alert, setAlert]                 = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  // Re-fetch stats whenever the selected date or batch changes
  useEffect(() => {
    fetchDateStats(date, selectedBatch?.id ?? null);
  }, [date, selectedBatch]);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('class_batches')
      .select('id, name, weekdays, start_time, end_time, instructor, tier')
      .eq('is_active', true)
      .order('name');
    setBatches(data || []);
  };

  const fetchDateStats = async (targetDate, batchId = null) => {
    let query = supabase
      .from('attendance')
      .select('status')
      .eq('class_date', targetDate);

    // When a batch is selected, scope stats to that batch's students only.
    if (batchId) {
      const { data: batchStudents } = await supabase
        .from('students')
        .select('id')
        .eq('class_batch_id', batchId);
      const ids = (batchStudents || []).map((s) => s.id);
      if (ids.length) query = query.in('student_id', ids);
      else {
        setTodayStats({ present: 0, late: 0, absent: 0 });
        return;
      }
    }

    const { data } = await query;
    const rows = data || [];
    setTodayStats({
      present: rows.filter((r) => r.status === 'present').length,
      late:    rows.filter((r) => r.status === 'late').length,
      absent:  rows.filter((r) => r.status === 'absent').length,
    });
  };

  // Reload the roster whenever the selected batch or date changes
  useEffect(() => {
    if (!selectedBatch) { setStudents([]); setMarks({}); return; }
    loadRoster(selectedBatch.id, date);
  }, [selectedBatch, date]);

  const loadRoster = async (batchId, targetDate) => {
    setLoadingRoster(true);

    // Determine the weekday for the selected date so we can filter by batch_days.
    const dayOfWeek = new Date(targetDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Students enrolled in this batch (active + on_break)
    const { data: studentData } = await supabase
      .from('students')
      .select('id, student_name, batch_days')
      .eq('class_batch_id', batchId)
      .in('status', ['active', 'on_break'])
      .order('student_name');

    // Filter to students who attend on this specific day of week.
    // null / empty batch_days = attends every day the batch runs.
    const studs = (studentData || []).filter(
      (s) => !s.batch_days?.length || s.batch_days.includes(dayOfWeek)
    );
    setStudents(studs);

    if (studs.length === 0) { setMarks({}); setLoadingRoster(false); return; }

    // 2. Existing attendance records for this date + these students
    const ids = studs.map((s) => s.id);
    const { data: attData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_date', targetDate)
      .in('student_id', ids);

    // Default everyone to 'present'; overwrite with any saved records
    const newMarks: Record<string, string> = {};
    for (const s of studs) newMarks[s.id] = 'present';
    for (const row of (attData || [])) newMarks[row.student_id] = row.status;
    setMarks(newMarks);
    setLoadingRoster(false);
  };

  const toggleMark = (studentId, status) =>
    setMarks((prev) => ({ ...prev, [studentId]: status }));

  const handleSave = async () => {
    if (!selectedBatch || students.length === 0) return;
    setSaving(true);

    const ids = students.map((s) => s.id);

    // Replace existing records for this date + roster
    const { error: deleteErr } = await supabase
      .from('attendance')
      .delete()
      .eq('class_date', date)
      .in('student_id', ids);

    if (deleteErr) {
      setSaving(false);
      showAlert('error', 'Failed to clear existing records — please try again.');
      return;
    }

    const rows = students.map((s) => ({
      student_id: s.id,
      class_date: date,
      class_type: selectedBatch.name,
      status:     marks[s.id] || 'present',
    }));

    const { error } = await supabase.from('attendance').insert(rows);
    setSaving(false);

    if (error) {
      showAlert('error', error.message || 'Failed to save attendance.');
    } else {
      showAlert('success', `Attendance saved for ${selectedBatch.name} — ${fmtDate(date)}.`);
      fetchDateStats(date, selectedBatch?.id ?? null);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const rosterStats = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0 };
    Object.values(marks).forEach((v) => { if (c[v] != null) c[v]++; });
    return c;
  }, [marks]);

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const fmtDate = (iso) =>
    new Date(iso + 'T00:00').toLocaleDateString('en-CA', {
      weekday: 'short', month: 'short', day: 'numeric',
    });

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Attendance
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Class check-in.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Mark attendance for any class, any date.
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#ee2435] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25"
        />
      </header>

      {/* Alert */}
      {alert && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.06] text-white'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-3 opacity-65 hover:opacity-100">
            <FaTimes className="text-xs" />
          </button>
        </div>
      )}

      {/* Date summary */}
      {(() => {
        const suffix = date === today ? 'today' : fmtDate(date);
        return (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard icon={FaCheckCircle} label={`Present ${suffix}`} value={todayStats.present} />
            <StatCard icon={FaClock}       label={`Late ${suffix}`}    value={todayStats.late}    featured />
            <StatCard icon={FaUsers}       label={`Absent ${suffix}`}  value={todayStats.absent}  featured />
            <StatCard icon={FaCalendarDay} label="Active classes"      value={batches.length} />
          </div>
        );
      })()}

      {/* Two-column layout: batch list + roster */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* Batch list */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Classes
          </p>
          {batches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/40">
              No active classes.{' '}
              <a href="/admin/classes" className="text-[#ee2435] hover:underline">Create one →</a>
            </div>
          ) : (
            <ul className="space-y-2">
              {batches.map((b) => {
                const active = selectedBatch?.id === b.id;
                const days   = (b.weekdays || []).map((d) => d.slice(0, 3)).join(' & ');
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBatch(b)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-[#d1060f]/50 bg-[#d1060f]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/85'}`}>
                          {b.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQrBatch(b); }}
                            title="Generate QR code"
                            className="grid h-6 w-6 place-items-center rounded-md border border-white/15 bg-white/[0.04] text-white/55 hover:border-white/30 hover:text-white"
                          >
                            <FaQrcode className="text-[10px]" />
                          </button>
                          {active && <FaChevronRight className="text-[10px] text-[#ee2435]" />}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {days}{b.start_time && ` · ${fmtTime(b.start_time)}`}
                        {b.instructor && ` · ${b.instructor}`}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Attendance roster */}
        <div>
          {!selectedBatch ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <p className="text-sm text-white/40">← Select a class to mark attendance</p>
            </div>
          ) : loadingRoster ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <p className="text-sm text-white/40">Loading roster…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <p className="text-sm text-white/40">
                No students enrolled in {selectedBatch.name} yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {/* Stats bar + Mark all present */}
              <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-4">
                <div className="grid flex-1 grid-cols-3 divide-x divide-white/8">
                  {['present', 'late', 'absent'].map((s) => (
                    <div key={s} className="py-3 text-center">
                      <p className={`font-[family-name:var(--font-display)] text-xl font-bold tabular-nums ${
                        s === 'absent' && rosterStats.absent > 0 ? 'text-[#ee2435]' : 'text-white'
                      }`}>
                        {rosterStats[s]}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">{s}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, 'present'])))}
                  className="ml-4 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
                  title="Set everyone to Present"
                >
                  All present
                </button>
              </div>

              {/* Student rows */}
              <ul className="divide-y divide-white/8">
                {students.map((s) => {
                  const current = marks[s.id] || 'present';
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="text-sm font-medium text-white">{s.student_name}</span>
                      <div className="flex items-center gap-1">
                        {Object.entries(MARKS).map(([status, cfg]) => {
                          const isActive = current === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => toggleMark(s.id, status)}
                              title={cfg.label}
                              className={`h-8 min-w-[2.25rem] rounded-lg px-2 text-xs font-bold transition ${
                                isActive
                                  ? `${cfg.activeBg} ${cfg.activeText}`
                                  : 'border border-white/10 bg-white/[0.03] text-white/40 hover:border-white/25 hover:text-white/75'
                              }`}
                            >
                              {cfg.short}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Save bar */}
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
                <p className="text-xs text-white/45">
                  {students.length} student{students.length !== 1 ? 's' : ''} · {fmtDate(date)}
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
                >
                  <FaSave className="text-xs" />
                  {saving ? 'Saving…' : 'Save session'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {qrBatch && <QRModal batch={qrBatch} onClose={() => setQrBatch(null)} />}
    </div>
  );
}

/* ── QR Modal ── */

function QRModal({ batch, onClose }) {
  const qrValue = JSON.stringify({
    classId:   batch.id,
    className: batch.name,
    timestamp: new Date().toISOString(),
  });

  const handleDownload = () => {
    const svg = document.getElementById('attendance-qr');
    if (!svg) return;
    const data   = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 240;
    const img = new Image();
    img.onload = () => {
      canvas.getContext('2d').drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `QR-${batch.name}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
            {batch.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="flex flex-col items-center gap-4 px-6 py-8">
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG
              id="attendance-qr"
              value={qrValue}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#0a0a0f"
            />
          </div>
          <p className="text-center text-sm text-white/55">
            Students scan this to check in for{' '}
            <strong className="text-white">{batch.name}</strong>.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
          >
            <FaDownload className="text-xs" /> Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function StatCard({ icon: Icon, label, value, featured = false }: { icon: any; label: any; value: any; featured?: any }) {
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
    </div>
  );
}
