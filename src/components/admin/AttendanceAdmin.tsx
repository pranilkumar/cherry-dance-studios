'use client';

import { useEffect, useState, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type AttendanceRecord = {
  id: string; date: string; marked_at: string;
  student: { id: string; name: string };
  class: { id: string; name: string };
};

export default function AttendanceAdmin() {
  return <RecordsView />;
}

function RecordsView() {
  const [classes, setClasses] = useState<AttendanceClass[]>([]);
  const [classId, setClassId] = useState('');
  const [date, setDate]       = useState(new Date().toLocaleDateString('en-CA'));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/attendance/classes', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setClasses(d.classes || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (classId) params.set('classId', classId);
    if (date)    params.set('date', date);
    const res = await fetch(`/api/attendance/records?${params}`, { credentials: 'include' });
    const d   = await res.json();
    setRecords(d.records || []);
    setLoading(false);
  }, [classId, date]);

  useEffect(() => { load(); }, [load]);

  const byDate: { [date: string]: AttendanceRecord[] } = {};
  records.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <select
          value={classId}
          onChange={e => setClassId(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          onClick={() => setDate('')}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white"
        >
          All dates
        </button>
      </div>

      {loading && <p className="text-sm text-white/40">Loading…</p>}

      {!loading && records.length === 0 && (
        <p className="text-sm text-white/40">No attendance records found.</p>
      )}

      {(Object.entries(byDate) as [string, AttendanceRecord[]][]).map(([d, recs]) => (
        <div key={d} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/70">
            {new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
            <span className="ml-2 text-white/40">— {recs.length} present</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {recs.map(r => (
              <span key={r.id} className="rounded-full bg-white/[0.07] px-3 py-1 text-sm text-white">
                {r.student.name}
                <span className="ml-1.5 text-[10px] text-white/35">{r.class.name}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
