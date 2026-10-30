'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AttendanceClass = { id: string; name: string; schedule: string | null };
type Student        = { id: string; name: string; photoUrl: string | null };

const RESET_MINUTES = 10;
const ALL_STUDENTS: AttendanceClass = { id: 'all', name: 'All Students', schedule: 'Special practice · Event' };

// Warm palette that pops on the CDS dark background
const LETTER_COLORS = [
  '#ee2435','#e8634a','#f4a523','#B8872A','#c084fc',
  '#60a5fa','#34d399','#fb7185','#a78bfa','#38bdf8',
  '#4ade80','#facc15','#f472b6','#818cf8','#2dd4bf',
];
const colorFor = (l: string) => LETTER_COLORS[(l.charCodeAt(0) - 65) % LETTER_COLORS.length];

/* ═══════════════════════════════════════════════════════════════════ */
export default function KioskApp() {
  const [screen, setScreen]         = useState<'classes' | 'attendance'>('classes');
  const [classes, setClasses]       = useState<AttendanceClass[]>([]);
  const [loadingClasses, setLC]     = useState(true);
  const [selected, setSelected]     = useState<AttendanceClass | null>(null);
  const [students, setStudents]     = useState<Student[]>([]);
  const [present, setPresent]       = useState<Set<string>>(new Set());
  const [markedAt, setMarkedAt]     = useState<Record<string, string>>({});
  const [photoMap, setPhotoMap]     = useState<Record<string, string>>({});
  const [loadingGrid, setLG]        = useState(false);
  const [activeLetter, setAL]       = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Student | null>(null);
  const [cameraStudent, setCam]     = useState<Student | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/attendance/classes').then(r => r.json())
      .then(d => { setClasses(d.classes || []); setLC(false); });
  }, []);

  const scheduleReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setScreen('classes'); setSelected(null); setAL(null);
    }, RESET_MINUTES * 60 * 1000);
  }, []);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const openClass = async (cls: AttendanceClass) => {
    setSelected(cls); setLG(true);
    setPresent(new Set()); setMarkedAt({}); setAL(null);
    const [sR, tR] = await Promise.all([
      fetch(`/api/attendance/students?classId=${cls.id}`).then(r => r.json()),
      cls.id !== 'all'
        ? fetch(`/api/attendance/today?classId=${cls.id}`).then(r => r.json())
        : Promise.resolve({ present: [] }),
    ]);
    const studs: Student[] = sR.students || [];
    setStudents(studs);
    const pm: Record<string, string> = {};
    studs.forEach(s => { if (s.photoUrl) pm[s.id] = s.photoUrl; });
    setPhotoMap(pm);
    setPresent(new Set(tR.present || []));
    setLG(false); setScreen('attendance'); scheduleReset();
  };

  const handleNameTap = (s: Student) => {
    scheduleReset(); setAL(null);
    if (present.has(s.id)) return;
    const hasPhoto = !!(photoMap[s.id] || s.photoUrl);
    if (!hasPhoto) { setCam(s); return; }
    doMark(s);
  };

  const doMark = (s: Student) => {
    if (!selected) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setPresent(p => new Set([...p, s.id]));
    setMarkedAt(m => ({ ...m, [s.id]: now }));
    setCelebration(s);
    setTimeout(() => setCelebration(null), 2400);
    fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: s.id, classId: selected.id === 'all' ? null : selected.id }),
    });
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ── Class picker ─────────────────────────────────────────────── */
  if (screen === 'classes') return <ClassPicker classes={classes} loading={loadingClasses} today={today} onSelect={openClass} />;

  /* ── Attendance screen ────────────────────────────────────────── */
  const letterMap: Record<string, Student[]> = {};
  students.forEach(s => {
    const l = s.name.charAt(0).toUpperCase();
    (letterMap[l] = letterMap[l] || []).push(s);
  });
  const activeLetters = Object.keys(letterMap).sort();

  const allDoneSet     = new Set(activeLetters.filter(l => letterMap[l].every(s => present.has(s.id))));
  const partialDoneSet = new Set(activeLetters.filter(l => letterMap[l].some(s => present.has(s.id)) && !allDoneSet.has(l)));

  return (
    <>
      {/* Film grain */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")" }} />
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed left-1/2 top-0 z-0 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #d1060f44 0%, transparent 70%)' }} />

      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0f]"
        onClick={() => activeLetter && setAL(null)}>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
          <button onClick={() => { if (resetTimer.current) clearTimeout(resetTimer.current); setScreen('classes'); setSelected(null); setAL(null); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/30 hover:text-white/60 transition">
            ← Back
          </button>
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">{selected?.name}</p>
            <p className="text-[11px] text-white/35">{today}</p>
          </div>
          <div className="text-right min-w-[48px]">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: '#d1060f' }}>{present.size}</p>
            <p className="text-[10px] text-white/30">present</p>
          </div>
        </div>

        {/* Instruction */}
        <p className="relative z-10 text-center text-xs text-white/30 tracking-widest uppercase pb-1">
          Tap the first letter of your name
        </p>

        {/* Bubbles */}
        <div className="relative z-10 flex-1">
          {loadingGrid
            ? <div className="flex h-full items-center justify-center"><p className="text-white/30 text-sm">Loading…</p></div>
            : <FloatingBubbles letters={activeLetters} allDone={allDoneSet} partial={partialDoneSet}
                onTap={l => { setAL(l); scheduleReset(); }} />
          }
        </div>

        {/* Present strip */}
        {present.size > 0 && (
          <div className="relative z-10 border-t border-white/[0.06] bg-white/[0.02] px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {students.filter(s => present.has(s.id)).map(s => {
                const photo = photoMap[s.id] || s.photoUrl;
                return (
                  <span key={s.id} className="flex items-center gap-1.5 rounded-full border border-[#2d8f2d]/40 bg-[#1a4a1a]/60 px-3 py-1 text-xs text-[#5fdf5f]">
                    {photo
                      ? <img src={photo} className="h-4 w-4 rounded-full object-cover" alt="" />
                      : <span className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: colorFor(s.name[0].toUpperCase()) }}>{s.name[0]}</span>}
                    {s.name.split(' ')[0]}
                    {markedAt[s.id] && <span className="text-[#5fdf5f]/40 text-[9px]">{markedAt[s.id]}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Letter expanded view */}
      {activeLetter && (
        <NamePicker
          letter={activeLetter}
          students={letterMap[activeLetter] || []}
          present={present}
          markedAt={markedAt}
          photoMap={photoMap}
          onSelect={handleNameTap}
          onClose={() => setAL(null)}
        />
      )}

      {celebration && <CelebrationOverlay student={celebration} photoUrl={photoMap[celebration.id] || celebration.photoUrl} />}

      {cameraStudent && (
        <CameraModal student={cameraStudent}
          onSave={url => { setPhotoMap(p => ({ ...p, [cameraStudent.id]: url })); doMark(cameraStudent); setCam(null); }}
          onSkip={() => { doMark(cameraStudent); setCam(null); }}
          onClose={() => setCam(null)} />
      )}
    </>
  );
}

/* ── Class Picker ─────────────────────────────────────────────────── */
function ClassPicker({ classes, loading, today, onSelect }: {
  classes: AttendanceClass[]; loading: boolean; today: string;
  onSelect: (c: AttendanceClass) => void;
}) {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")" }} />
      <div aria-hidden className="pointer-events-none fixed left-1/2 top-0 h-[45vh] w-[60vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle,rgba(209,6,15,0.18) 0%,transparent 70%)' }} />

      <div className="relative flex min-h-screen flex-col items-center bg-[#0a0a0f] px-8 pt-14 pb-10">
        <img src="/logo.png" alt="Cherry Dance Studios" className="mb-5 h-16 w-16 rounded-full object-cover ring-1 ring-white/10" />
        <p className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d1060f]">Cherry Dance Studios</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-white">Attendance</h1>
        <div className="mt-3 flex items-center gap-3 text-[#B8872A]/50">
          <span className="h-px w-16 bg-[#B8872A]/25" /><span className="text-[7px]">◆</span><span className="h-px w-16 bg-[#B8872A]/25" />
        </div>
        <p className="mt-2 text-sm text-white/35">{today}</p>

        <p className="mt-8 mb-5 text-xs uppercase tracking-[0.2em] text-white/30">Select your class</p>

        {loading && <p className="text-white/25 text-sm">Loading…</p>}

        <div className="w-full max-w-lg space-y-3">
          {/* All Students */}
          <button onClick={() => onSelect(ALL_STUDENTS)}
            className="group w-full rounded-2xl border border-[#d1060f]/25 bg-[#d1060f]/[0.07] px-6 py-5 text-left transition hover:border-[#d1060f]/50 hover:bg-[#d1060f]/[0.12] active:scale-[0.98]"
            style={{ WebkitTapHighlightColor: 'transparent' }}>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d1060f]/20 text-lg">🎭</div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">All Students</p>
                <p className="text-xs text-white/35">Special practice · Event</p>
              </div>
            </div>
          </button>

          {classes.map((cls, i) => (
            <button key={cls.id} onClick={() => onSelect(cls)}
              className="group w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-5 text-left transition hover:border-white/[0.15] hover:bg-white/[0.06] active:scale-[0.98]"
              style={{ WebkitTapHighlightColor: 'transparent', animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm"
                  style={{ background: `${LETTER_COLORS[i % LETTER_COLORS.length]}22`, color: LETTER_COLORS[i % LETTER_COLORS.length] }}>
                  {cls.name.charAt(0)}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">{cls.name}</p>
                  {cls.schedule && <p className="text-xs text-white/35">{cls.schedule}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Floating Bubbles ─────────────────────────────────────────────── */
interface Bubble { letter: string; x: number; y: number; vx: number; vy: number; size: number; phase: number; }

function FloatingBubbles({ letters, allDone, partial, onTap }: {
  letters: string[]; allDone: Set<string>; partial: Set<string>; onTap: (l: string) => void;
}) {
  const ref     = useRef<HTMLDivElement>(null);
  const bubbles = useRef<Bubble[]>([]);
  const raf     = useRef<number>(0);
  const [, tick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !letters.length) return;
    const W = el.clientWidth, H = el.clientHeight;
    const sz = Math.min(Math.max(Math.floor(Math.min(W, H) / Math.ceil(Math.sqrt(letters.length)) * 0.85), 68), 110);
    bubbles.current = letters.map(letter => ({
      letter,
      x: sz + Math.random() * (W - sz * 2),
      y: sz + Math.random() * (H - sz * 2),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: sz,
      phase: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(now - last, 32); last = now;
      const W2 = el.clientWidth, H2 = el.clientHeight;
      bubbles.current = bubbles.current.map(b => {
        let { x, y, vx, vy, size, phase } = b;
        phase += dt * 0.0008;
        x += vx * dt * 0.45 + Math.cos(phase * 0.7) * 0.12;
        y += vy * dt * 0.45 + Math.sin(phase) * 0.18;
        if (x - size / 2 < 4)    { x = size / 2 + 4;    vx =  Math.abs(vx) + 0.05; }
        if (x + size / 2 > W2-4) { x = W2 - size/2 - 4; vx = -Math.abs(vx) - 0.05; }
        if (y - size / 2 < 4)    { y = size / 2 + 4;    vy =  Math.abs(vy) + 0.05; }
        if (y + size / 2 > H2-4) { y = H2 - size/2 - 4; vy = -Math.abs(vy) - 0.05; }
        vx *= 0.999; vy *= 0.999;
        return { ...b, x, y, vx, vy, phase };
      });
      tick(n => n + 1);
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [letters]);

  return (
    <div ref={ref} className="relative h-full w-full">
      {bubbles.current.map(b => {
        const col   = colorFor(b.letter);
        const done  = allDone.has(b.letter);
        const part  = partial.has(b.letter);
        return (
          <button key={b.letter}
            onClick={e => { e.stopPropagation(); onTap(b.letter); }}
            style={{
              position: 'absolute',
              left: b.x - b.size / 2, top: b.y - b.size / 2,
              width: b.size, height: b.size,
              background: done
                ? 'radial-gradient(circle at 40% 35%, #2d8f2d55, #1a4a1a88)'
                : `radial-gradient(circle at 40% 35%, ${col}28, ${col}08)`,
              border: `1.5px solid ${done ? '#2d8f2daa' : part ? col + '88' : col + '44'}`,
              boxShadow: done
                ? `0 0 18px #2d8f2d44, inset 0 0 12px #2d8f2d22`
                : `0 0 ${b.size * 0.35}px ${col}28, inset 0 0 ${b.size * 0.2}px ${col}12`,
              WebkitTapHighlightColor: 'transparent',
            }}
            className="rounded-full flex items-center justify-center select-none active:scale-90 transition-transform duration-150">
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: b.size * 0.44,
              fontWeight: 700,
              color: done ? '#5fdf5f' : col,
              textShadow: `0 0 ${b.size * 0.25}px ${done ? '#5fdf5f' : col}66`,
              letterSpacing: '-0.01em',
            }}>
              {b.letter}
            </span>
            {done && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#5fdf5f]/40 bg-[#1a4a1a] text-[9px] text-[#5fdf5f]">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Name Picker ──────────────────────────────────────────────────── */
function NamePicker({ letter, students, present, markedAt, photoMap, onSelect, onClose }: {
  letter: string; students: Student[]; present: Set<string>;
  markedAt: Record<string, string>; photoMap: Record<string, string>;
  onSelect: (s: Student) => void; onClose: () => void;
}) {
  const col = colorFor(letter);
  return (
    <div className="fixed inset-0 z-40 flex flex-col" onClick={onClose}
      style={{ background: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(12px)' }}>

      {/* Giant letter watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        style={{ fontFamily: 'var(--font-poster)', fontSize: '55vw', fontWeight: 400, color: col, opacity: 0.04, lineHeight: 1 }}>
        {letter}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10"
        onClick={e => e.stopPropagation()}>

        {/* Letter badge */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: `radial-gradient(circle at 38% 32%, ${col}55, ${col}22)`, border: `2px solid ${col}66`, boxShadow: `0 0 32px ${col}44` }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: col, textShadow: `0 0 16px ${col}` }}>
            {letter}
          </span>
        </div>

        <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">Who are you?</p>

        {/* Name cards */}
        <div className="w-full max-w-sm space-y-2.5">
          {students.map((s, i) => {
            const isPresent = present.has(s.id);
            const photo     = photoMap[s.id] || s.photoUrl;
            return (
              <div key={s.id}
                className="name-card"
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'both' }}>
                <button
                  onClick={() => onSelect(s)}
                  disabled={isPresent}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150
                    ${isPresent
                      ? 'border border-[#2d8f2d]/40 bg-[#1a4a1a]/70 cursor-default'
                      : 'border border-white/[0.08] bg-white/[0.04] active:scale-[0.97] hover:bg-white/[0.08] hover:border-white/20'
                    }`}>
                  {/* Avatar */}
                  {photo ? (
                    <img src={photo} className={`h-12 w-12 flex-shrink-0 rounded-full object-cover ring-2 ${isPresent ? 'ring-[#2d8f2d]/60' : 'ring-white/10'}`} alt="" />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ring-2 text-base font-bold"
                      style={{ background: `${col}22`, color: col, outline: `2px solid ${col}44` }}>
                      {s.name.charAt(0)}
                    </div>
                  )}
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-[family-name:var(--font-display)] text-base font-semibold truncate ${isPresent ? 'text-[#5fdf5f]' : 'text-white'}`}>
                      {s.name}
                    </p>
                    {isPresent && markedAt[s.id] && (
                      <p className="text-[11px] text-[#5fdf5f]/50">Marked at {markedAt[s.id]}</p>
                    )}
                  </div>
                  {isPresent
                    ? <span className="flex-shrink-0 text-[#5fdf5f] text-lg">✓</span>
                    : <span className="flex-shrink-0 text-white/20 text-sm">→</span>
                  }
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-6 text-xs text-white/25 hover:text-white/50 transition">
          ✕ Close
        </button>
      </div>

      <style>{`
        @keyframes slideUpBounce {
          0%   { opacity: 0; transform: translateY(40px) scale(0.92); }
          60%  { opacity: 1; transform: translateY(-6px) scale(1.02); }
          80%  { transform: translateY(3px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .name-card { animation: slideUpBounce 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
    </div>
  );
}

/* ── Celebration ──────────────────────────────────────────────────── */
function CelebrationOverlay({ student, photoUrl }: { student: Student; photoUrl?: string | null }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    emoji: ['🎉','✨','⭐','💃','🌟','🎊','💫','❤️','🔥'][i % 9],
    x: 5 + Math.random() * 90,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 0.8,
    rotate: Math.random() * 720 - 360,
    size: 1.2 + Math.random() * 1.2,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Radial flash */}
      <div className="absolute inset-0 animate-[flash_0.3s_ease-out_forwards]"
        style={{ background: 'radial-gradient(circle, #d1060f22 0%, transparent 70%)' }} />

      {/* Particles */}
      {particles.map((p, i) => (
        <span key={i} className="absolute bottom-1/3"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}rem`,
            animation: `burst ${p.dur}s ${p.delay}s ease-out forwards`,
          }}>
          {p.emoji}
        </span>
      ))}

      {/* Card */}
      <div className="relative flex flex-col items-center gap-4 rounded-3xl px-12 py-8 text-center"
        style={{
          background: 'linear-gradient(145deg, rgba(10,10,18,0.96), rgba(26,26,40,0.96))',
          border: '1px solid rgba(209,6,15,0.3)',
          boxShadow: '0 0 60px rgba(209,6,15,0.25), 0 24px 60px rgba(0,0,0,0.6)',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
        {/* Gold divider top */}
        <div className="flex items-center gap-2 text-[#B8872A]/60 text-[7px]">
          <span className="h-px w-8 bg-[#B8872A]/40" />◆<span className="h-px w-8 bg-[#B8872A]/40" />
        </div>

        {photoUrl ? (
          <img src={photoUrl} className="h-28 w-28 rounded-full object-cover"
            style={{ border: '3px solid #d1060f66', boxShadow: '0 0 30px #d1060f44' }} alt="" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-bold text-[#d1060f]"
            style={{ background: '#d1060f18', border: '3px solid #d1060f44', boxShadow: '0 0 30px #d1060f33', fontFamily: 'var(--font-display)' }}>
            {student.name.charAt(0)}
          </div>
        )}

        <div>
          <p className="font-[family-name:var(--font-poster)] text-3xl text-white">{student.name.split(' ')[0]}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-sm font-medium text-[#d1060f]">You're in! 🎉</p>
        </div>

        <div className="flex items-center gap-2 text-[#B8872A]/60 text-[7px]">
          <span className="h-px w-8 bg-[#B8872A]/40" />◆<span className="h-px w-8 bg-[#B8872A]/40" />
        </div>
      </div>

      <style>{`
        @keyframes burst {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(-280px) rotate(var(--r, 180deg)) scale(0.3); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.4) rotate(-4deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes flash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Camera Modal ─────────────────────────────────────────────────── */
function CameraModal({ student, onSave, onSkip, onClose }: {
  student: Student; onSave: (url: string) => void; onSkip: () => void; onClose: () => void;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [camError, setCamError]   = useState('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setCamError('Camera access denied. Tap Skip to continue.'));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCaptured(c.toDataURL('image/jpeg', 0.85));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCaptured(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; });
  };

  const save = async () => {
    if (!captured) return; setUploading(true);
    const res  = await fetch('/api/attendance/photo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, photoData: captured }),
    });
    const data = await res.json(); setUploading(false);
    if (data.photoUrl) onSave(data.photoUrl); else onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d14] p-7 text-center"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
        <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-[#d1060f]">First visit</p>
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Hi {student.name.split(' ')[0]}! 👋
        </h2>
        <p className="mb-5 text-sm text-white/40">Take a quick selfie so we remember you.</p>

        {camError ? (
          <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/40">{camError}</p>
        ) : captured ? (
          <img src={captured} alt="Preview"
            className="mx-auto mb-5 h-48 w-48 rounded-full object-cover"
            style={{ border: '2px solid rgba(209,6,15,0.4)', boxShadow: '0 0 24px rgba(209,6,15,0.2)' }} />
        ) : (
          <div className="relative mx-auto mb-5 h-48 w-48 overflow-hidden rounded-full bg-white/5"
            style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!camError && !captured && (
            <button onClick={capture}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#b00310,#d1060f,#ee2435)', boxShadow: '0 8px 24px rgba(209,6,15,0.35)' }}>
              Take Photo
            </button>
          )}
          {captured && <>
            <button onClick={save} disabled={uploading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#b00310,#d1060f,#ee2435)' }}>
              {uploading ? 'Saving…' : 'Use This Photo'}
            </button>
            <button onClick={retake} className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/50 hover:text-white transition">
              Retake
            </button>
          </>}
          <button onClick={onSkip} className="w-full rounded-xl border border-white/[0.06] py-3 text-sm text-white/25 hover:text-white/50 transition">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
