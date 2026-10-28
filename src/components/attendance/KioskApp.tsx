'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type Student = { id: string; name: string; photoUrl: string | null };

const RESET_MINUTES = 10;
const ALL_STUDENTS: AttendanceClass = { id: 'all', name: 'All Students', schedule: 'Special practice / event' };

export default function KioskApp() {
  const [screen, setScreen]           = useState<'classes' | 'attendance'>('classes');
  const [classes, setClasses]         = useState<AttendanceClass[]>([]);
  const [loadingClasses, setLC]       = useState(true);
  const [selected, setSelected]       = useState<AttendanceClass | null>(null);
  const [students, setStudents]       = useState<Student[]>([]);
  const [present, setPresent]         = useState<Set<string>>(new Set());
  const [markedAt, setMarkedAt]       = useState<Record<string, string>>({});
  const [loadingGrid, setLG]          = useState(false);
  const [search, setSearch]           = useState('');
  const [cameraStudent, setCamStudent] = useState<Student | null>(null);
  const [photoStudents, setPS]        = useState<Record<string, string>>({}); // id → url (live updates)
  const resetTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/attendance/classes')
      .then(r => r.json())
      .then(d => { setClasses(d.classes || []); setLC(false); });
  }, []);

  const resetAutoTimer = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setScreen('classes');
      setSelected(null);
      setSearch('');
    }, RESET_MINUTES * 60 * 1000);
  }, []);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const openClass = async (cls: AttendanceClass) => {
    setSelected(cls);
    setLG(true);
    setPresent(new Set());
    setMarkedAt({});
    setSearch('');

    const [studRes, todayRes] = await Promise.all([
      fetch(`/api/attendance/students?classId=${cls.id}`).then(r => r.json()),
      cls.id !== 'all'
        ? fetch(`/api/attendance/today?classId=${cls.id}`).then(r => r.json())
        : Promise.resolve({ present: [] }),
    ]);

    const studs: Student[] = studRes.students || [];
    setStudents(studs);

    // Build photo map from existing data
    const pm: Record<string, string> = {};
    studs.forEach(s => { if (s.photoUrl) pm[s.id] = s.photoUrl; });
    setPS(pm);

    setPresent(new Set(todayRes.present || []));
    setLG(false);
    setScreen('attendance');
    resetAutoTimer();
  };

  const handleTap = (student: Student) => {
    resetAutoTimer();
    const alreadyPresent = present.has(student.id);

    if (alreadyPresent) {
      // Toggle off
      setPresent(p => { const n = new Set(p); n.delete(student.id); return n; });
      setMarkedAt(m => { const n = { ...m }; delete n[student.id]; return n; });
      fetch('/api/attendance/mark', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      });
      return;
    }

    // First time tapping — show camera if no photo yet
    const hasPhoto = !!(photoStudents[student.id] || student.photoUrl);
    if (!hasPhoto) {
      setCamStudent(student);
    } else {
      markPresent(student);
    }
  };

  const markPresent = (student: Student) => {
    if (!selected) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setPresent(p => new Set([...p, student.id]));
    setMarkedAt(m => ({ ...m, [student.id]: now }));
    fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, classId: selected.id === 'all' ? null : selected.id }),
    });
  };

  const goBack = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setScreen('classes');
    setSelected(null);
    setSearch('');
    setCamStudent(null);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Class picker ─────────────────────────────────────────────── */
  if (screen === 'classes') {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-8 pt-16 pb-10">
        <div className="mb-10 text-center">
          <img src="/logo.png" alt="Cherry Dance Studios" className="mx-auto mb-5 h-16 w-16 rounded-full object-cover" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d1060f]">Cherry Dance Studios</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Attendance</h1>
          <p className="mt-1 text-sm text-white/40">{today}</p>
        </div>

        <p className="mb-6 text-center text-sm text-white/50">Tap your class to begin</p>

        {loadingClasses && <p className="text-center text-white/30">Loading…</p>}

        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => openClass(ALL_STUDENTS)}
            className="rounded-2xl border border-[#d1060f]/40 bg-[#d1060f]/10 px-6 py-7 text-left transition active:scale-[0.97] sm:col-span-2"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span className="block text-lg font-semibold text-white">All Students</span>
            <span className="mt-1 block text-sm text-white/40">Special practice / event</span>
          </button>

          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => openClass(cls)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-7 text-left transition active:scale-[0.97]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="block text-lg font-semibold text-white">{cls.name}</span>
              {cls.schedule && <span className="mt-1 block text-sm text-white/40">{cls.schedule}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Attendance grid ──────────────────────────────────────────── */
  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0f]/95 px-6 py-4 backdrop-blur">
          <button onClick={goBack} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 hover:text-white transition">
            ← Back
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{selected?.name}</p>
            <p className="text-xs text-white/40">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#d1060f]">{present.size}</p>
            <p className="text-[10px] text-white/40">of {students.length}</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 pt-4 pb-2">
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetAutoTimer(); }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
        </div>

        <p className="px-6 pb-2 text-center text-xs text-white/40">
          Tap your name to mark attendance
        </p>

        {loadingGrid ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/30">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-8 text-center">
            <p className="text-white/30">{search ? 'No students match your search.' : 'No students in this class yet.'}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-10 pt-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map(s => {
                const isPresent = present.has(s.id);
                const time      = markedAt[s.id];
                const photo     = photoStudents[s.id] || s.photoUrl;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleTap(s)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`
                      relative overflow-hidden rounded-2xl px-3 py-5 text-center
                      transition-all duration-200 select-none active:scale-95
                      ${isPresent
                        ? 'border-2 border-[#2d8f2d] bg-[#1a4a1a] shadow-[0_0_20px_rgba(45,143,45,0.3)]'
                        : 'border border-white/10 bg-white/[0.04]'
                      }
                    `}
                  >
                    {/* Photo */}
                    {photo ? (
                      <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-white/10">
                        <img src={photo} alt={s.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 text-2xl font-semibold text-white/30">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <p className={`text-sm font-semibold leading-tight ${isPresent ? 'text-[#5fdf5f]' : 'text-white/80'}`}>
                      {s.name}
                    </p>
                    {isPresent && time && (
                      <p className="mt-1 text-[10px] text-[#5fdf5f]/60">{time}</p>
                    )}
                    {isPresent && (
                      <span className="absolute right-2 top-2 text-xs text-[#5fdf5f]/70">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/20">
          Resets automatically after {RESET_MINUTES} minutes
        </div>
      </div>

      {/* Camera modal */}
      {cameraStudent && (
        <CameraModal
          student={cameraStudent}
          onSave={(url) => {
            setPS(p => ({ ...p, [cameraStudent.id]: url }));
            markPresent(cameraStudent);
            setCamStudent(null);
          }}
          onSkip={() => {
            markPresent(cameraStudent);
            setCamStudent(null);
          }}
          onClose={() => setCamStudent(null)}
        />
      )}
    </>
  );
}

/* ── Camera Modal ─────────────────────────────────────────────────── */

function CameraModal({ student, onSave, onSkip, onClose }: {
  student: Student;
  onSave: (url: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [captured, setCaptured]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [camError, setCamError]   = useState('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCamError('Camera access denied. Tap Skip to continue.'));

    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.85));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCaptured(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
  };

  const save = async () => {
    if (!captured) return;
    setUploading(true);
    const res  = await fetch('/api/attendance/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, photoData: captured }),
    });
    const data = await res.json();
    setUploading(false);
    if (data.photoUrl) onSave(data.photoUrl);
    else onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 text-center">
        <p className="mb-1 text-xs uppercase tracking-widest text-[#d1060f]">First visit</p>
        <h2 className="mb-4 text-lg font-semibold text-white">Hi {student.name.split(' ')[0]}! 👋</h2>
        <p className="mb-5 text-sm text-white/50">Take a quick photo so we can recognise you.</p>

        {camError ? (
          <p className="mb-5 text-sm text-white/40">{camError}</p>
        ) : captured ? (
          <img src={captured} alt="Preview" className="mx-auto mb-5 h-48 w-48 rounded-full object-cover border-2 border-white/20" />
        ) : (
          <div className="relative mx-auto mb-5 h-48 w-48 overflow-hidden rounded-full border-2 border-white/20 bg-white/5">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!camError && !captured && (
            <button onClick={capture}
              className="w-full rounded-xl bg-[#d1060f] py-3 text-sm font-semibold text-white">
              Take Photo
            </button>
          )}
          {captured && (
            <>
              <button onClick={save} disabled={uploading}
                className="w-full rounded-xl bg-[#d1060f] py-3 text-sm font-semibold text-white disabled:opacity-50">
                {uploading ? 'Saving…' : 'Use This Photo'}
              </button>
              <button onClick={retake}
                className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/60">
                Retake
              </button>
            </>
          )}
          <button onClick={onSkip}
            className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/40">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
