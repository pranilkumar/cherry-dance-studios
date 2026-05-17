'use client';

import { useEffect, useState } from 'react';
import { FaClock, FaPalette, FaTheaterMasks, FaBolt } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal — classes view.
 * Shows the studio's weekly schedule with the dancer's assigned tier highlighted.
 *
 * Schedule data mirrors the public Classes section. Once we wire up real
 * class sessions in Supabase, this'll switch to live data per student.
 */

const TIERS = {
  'Little Stars': {
    icon: FaPalette,
    description: 'Ages 4–7 · A nurturing intro to dance.',
    slots: [{ days: 'Tue & Thu', time: '5:45 – 6:30 PM' }],
    duration: '45 min',
  },
  'The Crew': {
    icon: FaTheaterMasks,
    description: 'Ages 7–10 · Structured choreography + rhythm.',
    slots: [
      { days: 'Mon & Wed', time: '6:00 – 7:00 PM' },
      { days: 'Tue & Thu', time: '6:30 – 7:30 PM' },
    ],
    duration: '60 min',
  },
  'Slay Squad': {
    icon: FaBolt,
    description: 'Ages 10+ · Intensive Bollywood, hip-hop & freestyle.',
    slots: [{ days: 'Mon & Wed', time: '7:00 – 8:00 PM' }],
    duration: '2 hrs',
  },
};

function calcAge(dobIso) {
  if (!dobIso) return null;
  const d = new Date(dobIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function suggestTier(age) {
  if (age == null) return null;
  if (age <= 7) return 'Little Stars';
  if (age <= 10) return 'The Crew';
  return 'Slay Squad';
}

export default function PortalClasses() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase.from('students').select('*').eq('email', user.email);
      if (!cancelled) {
        setStudents(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Determine which tier(s) the parent's dancers belong to
  const myTiers = new Set();
  students.forEach((s) => {
    const tier = suggestTier(calcAge(s.date_of_birth));
    if (tier) myTiers.add(tier);
  });

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Classes
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Weekly schedule.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {loading
            ? 'Loading…'
            : myTiers.size > 0
            ? `Your dancer's tier is highlighted below.`
            : 'Browse the schedule. Once your dancer is enrolled, their class will be highlighted.'}
        </p>
      </header>

      {/* My dancers + tier */}
      {students.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2.5">
          {students.map((s) => {
            const age = calcAge(s.date_of_birth);
            const tier = suggestTier(age);
            return (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/85 backdrop-blur-md"
              >
                <span className="font-medium text-white">{s.student_name}</span>
                {tier && (
                  <>
                    <span className="text-[#ee2435]">·</span>
                    <span className="text-[#ee2435]">{tier}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {Object.entries(TIERS).map(([name, tier]) => {
          const Icon = tier.icon;
          const isMine = myTiers.has(name);
          return (
            <div
              key={name}
              className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-md transition ${
                isMine
                  ? 'border-[#d1060f]/40 bg-[#d1060f]/[0.08]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {isMine && (
                <span className="absolute right-4 top-4 rounded-full bg-[#d1060f] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Your class
                </span>
              )}

              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  isMine ? 'bg-white/20 text-white' : 'bg-white/10 text-white'
                }`}
              >
                <Icon className="text-xl" />
              </div>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
                {name}
              </h3>
              <p className="mt-2 text-sm text-white/70">{tier.description}</p>

              <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
                {tier.slots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{slot.days}</span>
                    <span className="font-mono text-xs text-white/70">{slot.time}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
                  <FaClock className="text-[10px]" />
                  <span>{tier.duration} per class</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <p className="mt-8 text-xs text-white/40">
        Schedule changes? Cherry or Pranil will email you. You can also reach us at{' '}
        <a href="https://wa.me/16138903789" className="text-white/65 hover:text-white">
          WhatsApp 613-890-3789
        </a>.
      </p>
    </div>
  );
}
