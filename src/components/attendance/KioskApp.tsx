'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type Student = { id: string; name: string };

const RESET_MINUTES = 10; // auto-reset to class picker after this many minutes

export default function KioskApp() {
  const [screen, setScreen]         = useState<'classes' | 'attendance'>('classes');
  const [classes, setClasses]       = useState<AttendanceClass[]>([]);
  const [loadingClasses, setLC]     = useState(true);
  const [selected, setSelected]     = useState<AttendanceClass | null>(null);
  const [students, setStudents]     = useState<Student[]>([]);
  const [present, setPresent]       = useState<Set<string>>(new Set());
  const [loadingGrid, setLG]        = useState(false);
  const [justMarked, setJustMarked] = useState<string | null>(null); // for tap animation
  const resetTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load classes on mount
  useEffect(() => {
    fetch('/api/attendance/classes')
      .then(r => r.json())
      .then(d => { setClasses(d.classes || []); setLC(false); });
  }, []);

  // Auto-reset timer — restarts whenever a student taps their name
  const resetAutoTimer = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setScreen('classes');
      setSelected(null);
    }, RESET_MINUTES * 60 * 1000);
  }, []);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const openClass = async (cls: AttendanceClass) => {
    setSelected(cls);
    setLG(true);
    setPresent(new Set());

    const [studRes, todayRes] = await Promise.all([
      fetch(`/api/attendance/students?classId=${cls.id}`).then(r => r.json()),
      fetch(`/api/attendance/today?classId=${cls.id}`).then(r => r.json()),
    ]);

    setStudents(studRes.students || []);
    setPresent(new Set(todayRes.present || []));
    setLG(false);
    setScreen('attendance');
    resetAutoTimer();
  };

  const toggleStudent = async (student: Student) => {
    if (!selected) return;
    resetAutoTimer();

    const wasPresent = present.has(student.id);

    // Optimistic update
    setPresent(p => {
      const next = new Set(p);
      wasPresent ? next.delete(student.id) : next.add(student.id);
      return next;
    });
    setJustMarked(student.id);
    setTimeout(() => setJustMarked(null), 600);

    const method = wasPresent ? 'DELETE' : 'POST';
    await fetch('/api/attendance/mark', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, classId: selected.id }),
    });
  };

  const goBack = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setScreen('classes');
    setSelected(null);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  /* ── Class picker ─────────────────────────────────────────────── */
  if (screen === 'classes') {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-8 pt-16 pb-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <img src="/logo.png" alt="Cherry Dance Studios" className="mx-auto mb-5 h-16 w-16 rounded-full object-cover" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d1060f]">
            Cherry Dance Studios
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Attendance</h1>
          <p className="mt-1 text-sm text-white/40">{today}</p>
        </div>

        <p className="mb-6 text-center text-sm text-white/50">Tap your class to begin</p>

        {loadingClasses && (
          <p className="text-center text-white/30">Loading classes…</p>
        )}

        {!loadingClasses && classes.length === 0 && (
          <p className="text-center text-white/30">
            No classes set up yet. Add them at cherrydancestudios.com/admin/attendance
          </p>
        )}

        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => openClass(cls)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-7 text-left transition active:scale-[0.97]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="block text-lg font-semibold text-white">{cls.name}</span>
              {cls.schedule && (
                <span className="mt-1 block text-sm text-white/40">{cls.schedule}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Attendance grid ──────────────────────────────────────────── */
  const presentCount = present.size;
  const totalCount   = students.length;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0f]/95 px-6 py-4 backdrop-blur">
        <button
          onClick={goBack}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 hover:text-white transition"
        >
          ← Back
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{selected?.name}</p>
          <p className="text-xs text-white/40">{today}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#d1060f]">{presentCount}</p>
          <p className="text-[10px] text-white/40">of {totalCount}</p>
        </div>
      </div>

      {/* Instruction */}
      <p className="px-6 pt-5 pb-2 text-center text-sm text-white/40">
        Tap your name to mark attendance
      </p>

      {/* Student grid */}
      {loadingGrid ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-white/30">Loading…</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-white/30">
            No students in this class yet. Add them at cherrydancestudios.com/admin/attendance
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {students.map(s => {
              const isPresent = present.has(s.id);
              const isAnimating = justMarked === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`
                    relative overflow-hidden rounded-2xl px-4 py-6 text-center text-base font-semibold
                    transition-all duration-200 select-none
                    ${isPresent
                      ? 'bg-[#1a4a1a] border-2 border-[#2d8f2d] text-[#5fdf5f] shadow-[0_0_20px_rgba(45,143,45,0.3)]'
                      : 'border border-white/10 bg-white/[0.04] text-white/80 active:bg-white/10'
                    }
                    ${isAnimating ? 'scale-95' : 'scale-100'}
                  `}
                >
                  {isPresent && (
                    <span className="absolute right-2 top-2 text-xs text-[#5fdf5f]/70">✓</span>
                  )}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/20">
        Page resets automatically after {RESET_MINUTES} minutes
      </div>
    </div>
  );
}
