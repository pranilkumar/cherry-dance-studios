'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type Student = { id: string; name: string; photoUrl: string | null };

const RESET_MINUTES = 10;
const ALL_STUDENTS: AttendanceClass = { id: 'all', name: 'All Students', schedule: 'Special practice / event' };

const BUBBLE_COLORS = [
  '#e85d75','#f4845f','#f6c90e','#4ecdc4','#45aaf2',
  '#a29bfe','#fd79a8','#55efc4','#fdcb6e','#e17055',
  '#74b9ff','#00b894','#d63031','#6c5ce7','#00cec9',
];

function colorFor(letter: string) {
  return BUBBLE_COLORS[(letter.charCodeAt(0) - 65) % BUBBLE_COLORS.length];
}

export default function KioskApp() {
  const [screen, setScreen]     = useState<'classes' | 'attendance'>('classes');
  const [classes, setClasses]   = useState<AttendanceClass[]>([]);
  const [loadingClasses, setLC] = useState(true);
  const [selected, setSelected] = useState<AttendanceClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [present, setPresent]   = useState<Set<string>>(new Set());
  const [markedAt, setMarkedAt] = useState<Record<string, string>>({});
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [loadingGrid, setLG]    = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [celebration, setCelebration]   = useState<Student | null>(null);
  const [cameraStudent, setCamStudent]  = useState<Student | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/attendance/classes')
      .then(r => r.json())
      .then(d => { setClasses(d.classes || []); setLC(false); });
  }, []);

  const resetAutoTimer = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setScreen('classes'); setSelected(null); setActiveLetter(null);
    }, RESET_MINUTES * 60 * 1000);
  }, []);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const openClass = async (cls: AttendanceClass) => {
    setSelected(cls); setLG(true);
    setPresent(new Set()); setMarkedAt({}); setActiveLetter(null);

    const [studRes, todayRes] = await Promise.all([
      fetch(`/api/attendance/students?classId=${cls.id}`).then(r => r.json()),
      cls.id !== 'all'
        ? fetch(`/api/attendance/today?classId=${cls.id}`).then(r => r.json())
        : Promise.resolve({ present: [] }),
    ]);

    const studs: Student[] = studRes.students || [];
    setStudents(studs);
    const pm: Record<string, string> = {};
    studs.forEach(s => { if (s.photoUrl) pm[s.id] = s.photoUrl; });
    setPhotoMap(pm);
    setPresent(new Set(todayRes.present || []));
    setLG(false);
    setScreen('attendance');
    resetAutoTimer();
  };

  const handleSelectName = (student: Student) => {
    resetAutoTimer();
    setActiveLetter(null);
    const hasPhoto = !!(photoMap[student.id] || student.photoUrl);
    if (!hasPhoto) { setCamStudent(student); return; }
    doMark(student);
  };

  const doMark = (student: Student) => {
    if (!selected) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setPresent(p => new Set([...p, student.id]));
    setMarkedAt(m => ({ ...m, [student.id]: now }));
    setCelebration(student);
    setTimeout(() => setCelebration(null), 2200);
    fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        classId: selected.id === 'all' ? null : selected.id,
      }),
    });
  };

  const goBack = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setScreen('classes'); setSelected(null); setActiveLetter(null); setCamStudent(null);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
          <button onClick={() => openClass(ALL_STUDENTS)}
            className="rounded-2xl border border-[#d1060f]/40 bg-[#d1060f]/10 px-6 py-7 text-left transition active:scale-[0.97] sm:col-span-2"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <span className="block text-lg font-semibold text-white">All Students</span>
            <span className="mt-1 block text-sm text-white/40">Special practice / event</span>
          </button>
          {classes.map(cls => (
            <button key={cls.id} onClick={() => openClass(cls)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-7 text-left transition active:scale-[0.97]"
              style={{ WebkitTapHighlightColor: 'transparent' }}>
              <span className="block text-lg font-semibold text-white">{cls.name}</span>
              {cls.schedule && <span className="mt-1 block text-sm text-white/40">{cls.schedule}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Attendance screen ────────────────────────────────────────── */
  const letterMap: Record<string, Student[]> = {};
  students.forEach(s => {
    const l = s.name.charAt(0).toUpperCase();
    (letterMap[l] = letterMap[l] || []).push(s);
  });
  const activeLetters = Object.keys(letterMap).sort();

  return (
    <>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0f]"
        onClick={() => activeLetter && setActiveLetter(null)}>

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4">
          <button onClick={goBack} className="rounded-lg px-3 py-2 text-sm text-white/40 hover:text-white transition">
            ← Back
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{selected?.name}</p>
            <p className="text-xs text-white/40">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[#d1060f]">{present.size}</p>
            <p className="text-[10px] text-white/40">present</p>
          </div>
        </div>

        <p className="relative z-20 text-center text-sm text-white/40 pb-2">
          Tap the first letter of your name
        </p>

        {/* Floating bubbles */}
        {loadingGrid ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/30">Loading…</p>
          </div>
        ) : (
          <FloatingBubbles
            letters={activeLetters}
            presentLetters={new Set(
              activeLetters.filter(l => letterMap[l]?.every(s => present.has(s.id)))
            )}
            partialLetters={new Set(
              activeLetters.filter(l => letterMap[l]?.some(s => present.has(s.id)) && !letterMap[l]?.every(s => present.has(s.id)))
            )}
            onTap={(letter) => { setActiveLetter(letter); resetAutoTimer(); }}
          />
        )}

        {/* Bottom: who's marked */}
        {present.size > 0 && (
          <div className="relative z-20 border-t border-white/10 px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {students.filter(s => present.has(s.id)).map(s => (
                <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-[#1a4a1a] px-3 py-1 text-xs text-[#5fdf5f]">
                  {photoMap[s.id] || s.photoUrl
                    ? <img src={photoMap[s.id] || s.photoUrl!} className="h-4 w-4 rounded-full object-cover" alt="" />
                    : null
                  }
                  {s.name.split(' ')[0]}
                  {markedAt[s.id] && <span className="text-[#5fdf5f]/50">{markedAt[s.id]}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Name picker popup */}
      {activeLetter && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-10 px-4"
          onClick={() => setActiveLetter(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111118] p-5"
            onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: colorFor(activeLetter) }}>
                {activeLetter}
              </div>
              <p className="text-sm text-white/60">Who are you?</p>
            </div>
            <div className="flex flex-col gap-2">
              {(letterMap[activeLetter] || []).map(s => {
                const isPresent = present.has(s.id);
                return (
                  <button key={s.id}
                    onClick={() => !isPresent && handleSelectName(s)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition
                      ${isPresent
                        ? 'bg-[#1a4a1a] border border-[#2d8f2d]/50 cursor-default'
                        : 'bg-white/5 border border-white/10 active:scale-[0.97]'
                      }`}>
                    {(photoMap[s.id] || s.photoUrl) ? (
                      <img src={photoMap[s.id] || s.photoUrl!} className="h-10 w-10 rounded-full object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: colorFor(s.name.charAt(0).toUpperCase()) }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isPresent ? 'text-[#5fdf5f]' : 'text-white'}`}>{s.name}</p>
                      {isPresent && markedAt[s.id] && (
                        <p className="text-[10px] text-[#5fdf5f]/60">Marked at {markedAt[s.id]}</p>
                      )}
                    </div>
                    {isPresent && <span className="text-[#5fdf5f]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay student={celebration} photoUrl={photoMap[celebration.id] || celebration.photoUrl} />
      )}

      {/* Camera modal */}
      {cameraStudent && (
        <CameraModal
          student={cameraStudent}
          onSave={(url) => {
            setPhotoMap(p => ({ ...p, [cameraStudent.id]: url }));
            doMark(cameraStudent);
            setCamStudent(null);
          }}
          onSkip={() => { doMark(cameraStudent); setCamStudent(null); }}
          onClose={() => setCamStudent(null)}
        />
      )}
    </>
  );
}

/* ── Floating Bubbles ─────────────────────────────────────────────── */

interface BubbleState {
  letter: string;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  phase: number;
}

function FloatingBubbles({ letters, presentLetters, partialLetters, onTap }: {
  letters: string[];
  presentLetters: Set<string>;
  partialLetters: Set<string>;
  onTap: (letter: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblesRef   = useRef<BubbleState[]>([]);
  const rafRef       = useRef<number>(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || letters.length === 0) return;

    const W = el.clientWidth;
    const H = el.clientHeight;
    const size = Math.min(Math.max(Math.floor(W / (letters.length + 1) * 1.4), 60), 96);

    bubblesRef.current = letters.map((letter, i) => ({
      letter,
      x: size + Math.random() * (W - size * 2),
      y: size + Math.random() * (H - size * 2),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size,
      phase: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 32);
      last = now;
      const W2 = el.clientWidth;
      const H2 = el.clientHeight;

      bubblesRef.current = bubblesRef.current.map(b => {
        let { x, y, vx, vy, size, phase } = b;
        phase += dt * 0.001;
        x += vx * dt * 0.5;
        y += vy * dt * 0.5;
        // Gentle bob
        y += Math.sin(phase) * 0.15;

        if (x - size / 2 < 0)      { x = size / 2;      vx = Math.abs(vx); }
        if (x + size / 2 > W2)     { x = W2 - size / 2; vx = -Math.abs(vx); }
        if (y - size / 2 < 0)      { y = size / 2;       vy = Math.abs(vy); }
        if (y + size / 2 > H2)     { y = H2 - size / 2;  vy = -Math.abs(vy); }

        return { ...b, x, y, vx, vy, phase };
      });

      forceRender(n => n + 1);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [letters]);

  return (
    <div ref={containerRef} className="relative flex-1 w-full overflow-hidden">
      {bubblesRef.current.map(b => {
        const color   = colorFor(b.letter);
        const allDone = presentLetters.has(b.letter);
        const partial = partialLetters.has(b.letter);
        return (
          <button
            key={b.letter}
            onClick={(e) => { e.stopPropagation(); onTap(b.letter); }}
            style={{
              position: 'absolute',
              left: b.x - b.size / 2,
              top:  b.y - b.size / 2,
              width:  b.size,
              height: b.size,
              background: allDone ? '#1a4a1a' : `${color}22`,
              border: `2px solid ${allDone ? '#2d8f2d' : partial ? color + 'aa' : color + '66'}`,
              boxShadow: `0 0 ${allDone ? 20 : 12}px ${allDone ? '#2d8f2d44' : color + '33'}`,
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.3s, border-color 0.3s',
            }}
            className="rounded-full flex items-center justify-center font-bold select-none active:scale-90 transition-transform"
          >
            <span style={{
              fontSize: b.size * 0.42,
              color: allDone ? '#5fdf5f' : color,
              textShadow: `0 0 12px ${color}88`,
            }}>
              {b.letter}
            </span>
            {allDone && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d8f2d] text-[10px] text-white">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Celebration Overlay ──────────────────────────────────────────── */

function CelebrationOverlay({ student, photoUrl }: { student: Student; photoUrl?: string | null }) {
  const emojis = ['🎉','✨','🌟','💃','🎊','⭐','🌈','💫'];
  const particles = Array.from({ length: 16 }, (_, i) => ({
    emoji: emojis[i % emojis.length],
    x: 20 + Math.random() * 60,
    delay: Math.random() * 0.4,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Particles */}
      {particles.map((p, i) => (
        <div key={i} className="absolute text-2xl animate-[float-up_1.8s_ease-out_forwards]"
          style={{
            left: `${p.x}%`, bottom: '20%',
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}>
          {p.emoji}
        </div>
      ))}
      {/* Card */}
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#0a0a0f]/90 px-10 py-8 backdrop-blur-xl animate-[pop-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        {photoUrl ? (
          <img src={photoUrl} className="h-24 w-24 rounded-full object-cover border-4 border-[#2d8f2d]" alt="" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#2d8f2d] bg-[#1a4a1a] text-4xl font-bold text-[#5fdf5f]">
            {student.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{student.name.split(' ')[0]}</p>
          <p className="text-sm text-[#5fdf5f] mt-1">You're in! 🎉</p>
        </div>
      </div>
      <style>{`
        @keyframes float-up {
          0%   { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) rotate(calc(var(--r, 0deg) + 180deg)) scale(0.5); }
        }
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── Camera Modal ─────────────────────────────────────────────────── */

function CameraModal({ student, onSave, onSkip, onClose }: {
  student: Student;
  onSave: (url: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      .then(stream => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; });
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
    if (data.photoUrl) onSave(data.photoUrl); else onSkip();
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
            <button onClick={capture} className="w-full rounded-xl bg-[#d1060f] py-3 text-sm font-semibold text-white">
              Take Photo
            </button>
          )}
          {captured && (
            <>
              <button onClick={save} disabled={uploading}
                className="w-full rounded-xl bg-[#d1060f] py-3 text-sm font-semibold text-white disabled:opacity-50">
                {uploading ? 'Saving…' : 'Use This Photo'}
              </button>
              <button onClick={retake} className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/60">Retake</button>
            </>
          )}
          <button onClick={onSkip} className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/40">Skip for now</button>
        </div>
      </div>
    </div>
  );
}
