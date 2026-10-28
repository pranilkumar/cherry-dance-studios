'use client';

import { useEffect, useState, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type Student = { id: string; name: string };
type Record = {
  id: string; date: string; marked_at: string;
  student: { id: string; name: string };
  class: { id: string; name: string };
};

type View = 'records' | 'classes';

export default function AttendanceAdmin() {
  const [view, setView] = useState<View>('records');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('records')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === 'records' ? 'bg-[#d1060f] text-white' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Attendance Records
        </button>
        <button
          onClick={() => setView('classes')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === 'classes' ? 'bg-[#d1060f] text-white' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          Manage Classes & Students
        </button>
      </div>

      {view === 'records' && <RecordsView />}
      {view === 'classes' && <ClassesView />}
    </div>
  );
}

/* ─── Records View ─────────────────────────────────────────────────── */

function RecordsView() {
  const [classes, setClasses]   = useState<AttendanceClass[]>([]);
  const [classId, setClassId]   = useState('');
  const [date, setDate]         = useState(new Date().toLocaleDateString('en-CA'));
  const [records, setRecords]   = useState<Record[]>([]);
  const [loading, setLoading]   = useState(false);

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

  // group by date
  const byDate: Record<string, Record[]> = {};
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
        <button onClick={() => setDate('')}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white">
          All dates
        </button>
      </div>

      {loading && <p className="text-sm text-white/40">Loading…</p>}

      {!loading && records.length === 0 && (
        <p className="text-sm text-white/40">No attendance records found.</p>
      )}

      {Object.entries(byDate).map(([d, recs]) => (
        <div key={d} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/70">
            {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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

/* ─── Classes & Students View ──────────────────────────────────────── */

function ClassesView() {
  const [classes, setClasses]     = useState<AttendanceClass[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [students, setStudents]   = useState<Record<string, Student[]>>({});
  const [newClass, setNewClass]   = useState('');
  const [newSched, setNewSched]   = useState('');
  const [newStudentName, setNSN]  = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const loadClasses = async () => {
    const res = await fetch('/api/attendance/classes', { credentials: 'include' });
    const d   = await res.json();
    setClasses(d.classes || []);
  };

  useEffect(() => { loadClasses(); }, []);

  const loadStudents = async (classId: string) => {
    if (students[classId]) return;
    const res = await fetch(`/api/attendance/students?classId=${classId}`, { credentials: 'include' });
    const d   = await res.json();
    setStudents(s => ({ ...s, [classId]: d.students || [] }));
  };

  const toggleClass = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadStudents(id);
  };

  const addClass = async () => {
    if (!newClass.trim()) return;
    setLoading(true);
    await fetch('/api/attendance/classes', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClass.trim(), schedule: newSched.trim() }),
    });
    setNewClass(''); setNewSched('');
    await loadClasses();
    setLoading(false);
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Remove this class?')) return;
    await fetch('/api/attendance/classes', {
      method: 'DELETE', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadClasses();
    if (expanded === id) setExpanded(null);
  };

  const addStudent = async (classId: string) => {
    const name = newStudentName[classId]?.trim();
    if (!name) return;
    await fetch('/api/attendance/students', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, name }),
    });
    setNSN(s => ({ ...s, [classId]: '' }));
    const res = await fetch(`/api/attendance/students?classId=${classId}`, { credentials: 'include' });
    const d   = await res.json();
    setStudents(s => ({ ...s, [classId]: d.students || [] }));
  };

  const deleteStudent = async (classId: string, id: string) => {
    await fetch('/api/attendance/students', {
      method: 'DELETE', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setStudents(s => ({ ...s, [classId]: (s[classId] || []).filter(st => st.id !== id) }));
  };

  return (
    <div className="space-y-4">
      {/* Add new class */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          placeholder="Class name, e.g. Beginner Bharatanatyam"
          value={newClass}
          onChange={e => setNewClass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addClass()}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 min-w-[200px]"
        />
        <input
          placeholder="Schedule, e.g. Saturday 10am"
          value={newSched}
          onChange={e => setNewSched(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addClass()}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 min-w-[160px]"
        />
        <button
          onClick={addClass}
          disabled={loading || !newClass.trim()}
          className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Class
        </button>
      </div>

      {classes.length === 0 && <p className="text-sm text-white/40">No classes yet. Add one above.</p>}

      {classes.map(c => (
        <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={() => toggleClass(c.id)} className="flex-1 text-left">
              <span className="font-medium text-white">{c.name}</span>
              {c.schedule && <span className="ml-2 text-xs text-white/40">{c.schedule}</span>}
            </button>
            <button onClick={() => deleteClass(c.id)} className="ml-4 text-xs text-white/30 hover:text-[#ee2435]">
              Remove
            </button>
            <button onClick={() => toggleClass(c.id)} className="ml-3 text-white/40">
              {expanded === c.id ? '▲' : '▼'}
            </button>
          </div>

          {expanded === c.id && (
            <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-3">
              {/* Students list */}
              <div className="flex flex-wrap gap-2">
                {(students[c.id] || []).map(s => (
                  <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-white/[0.07] pl-3 pr-2 py-1 text-sm text-white">
                    {s.name}
                    <button onClick={() => deleteStudent(c.id, s.id)} className="text-white/30 hover:text-[#ee2435] text-xs">✕</button>
                  </span>
                ))}
                {(students[c.id] || []).length === 0 && (
                  <p className="text-xs text-white/30">No students yet.</p>
                )}
              </div>
              {/* Add student */}
              <div className="flex gap-2">
                <input
                  placeholder="Student name"
                  value={newStudentName[c.id] || ''}
                  onChange={e => setNSN(s => ({ ...s, [c.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addStudent(c.id)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30"
                />
                <button
                  onClick={() => addStudent(c.id)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
