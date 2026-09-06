'use client';

import { useEffect, useState } from 'react';
import {
  FaBullhorn,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimes,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function fmtDT(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function RsvpModal({ event, students, onClose, onDone }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!selectedStudentId) return;
    setSaving(true);
    await supabase.from('event_rsvps').insert({
      event_id: event.id,
      student_id: selectedStudentId,
      notes: notes.trim() || null,
    });
    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
            RSVP — {event.title}
          </h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:text-white">
            <FaTimes />
          </button>
        </div>
        <p className="mb-4 text-sm text-white/60">
          Let us know your dancer is interested in attending this event.
        </p>
        {students.length > 1 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
              Which dancer?
            </label>
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selectedStudentId === s.id
                      ? 'border-[#d1060f] bg-[#d1060f]/15 text-white'
                      : 'border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  {s.student_name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
            Note <span className="text-white/30 normal-case">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Dheer will be performing, family of 4 attending as audience…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !selectedStudentId}
            className="rounded-full bg-[#d1060f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-50"
          >
            {saving ? 'Submitting…' : "Yes, we're interested!"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalNotices() {
  const [loading, setLoading] = useState(true);
  const [cancellations, setCancellations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [myRsvps, setMyRsvps] = useState<Set<string>>(new Set());
  const [studentIds, setStudentIds] = useState([]);
  const [batchIds, setBatchIds] = useState([]);
  const [rsvpStudents, setRsvpStudents] = useState([]);
  const [rsvpModal, setRsvpModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data: students } = await supabase
        .from('students')
        .select('id, class_batch_id, status')
        .eq('email', user.email);

      if (!students?.length || cancelled) { setLoading(false); return; }

      const sIds = students.map((s) => s.id);
      const bIds = students.map((s) => s.class_batch_id).filter(Boolean);
      setStudentIds(sIds);
      setBatchIds(bIds);
      setRsvpStudents(students.map((s) => ({ id: s.id, student_name: s.student_name })));

      const todayStr = new Date().toISOString().split('T')[0];
      const aheadStr = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();
      const nowIso = new Date().toISOString();

      const [
        { data: cancels, error: cancelErr },
        { data: activeAnns, error: annErr },
        { data: upcomingEvents, error: evErr },
        { data: rsvpRows, error: rsvpErr },
      ] = await Promise.all([
        // Upcoming cancellations for this student's batch(es)
        bIds.length > 0
          ? supabase
              .from('class_cancellations')
              .select('*, batch:class_batches(name)')
              .in('batch_id', bIds)
              .gte('class_date', todayStr)
              .lte('class_date', aheadStr)
              .order('class_date', { ascending: true })
          : { data: [] },

        // Active announcements for this batch or all students
        bIds.length > 0
          ? supabase
              .from('announcements')
              .select('*, batch:class_batches(name)')
              .eq('is_active', true)
              .or(`audience.eq.all,batch_id.in.(${bIds.join(',')})`)
              .or(`expires_at.is.null,expires_at.gte.${todayStr}`)
              .order('created_at', { ascending: false })
          : supabase
              .from('announcements')
              .select('*')
              .eq('is_active', true)
              .eq('audience', 'all')
              .or(`expires_at.is.null,expires_at.gte.${todayStr}`)
              .order('created_at', { ascending: false }),

        // Upcoming public events
        supabase
          .from('events')
          .select('*')
          .eq('is_public', true)
          .gte('starts_at', nowIso)
          .order('starts_at', { ascending: true }),

        // Which events has this parent already RSVP'd for?
        supabase
          .from('event_rsvps')
          .select('event_id')
          .in('student_id', sIds),
      ]);

      if (!cancelled) {
        if (cancelErr) console.error('[portal-notices] cancellations:', cancelErr);
        if (annErr)    console.error('[portal-notices] announcements:', annErr);
        if (evErr)     console.error('[portal-notices] events:', evErr);
        if (rsvpErr)   console.error('[portal-notices] rsvps:', rsvpErr);
        setCancellations(cancels || []);
        setAnnouncements(activeAnns || []);
        setEvents(upcomingEvents || []);
        setMyRsvps(new Set((rsvpRows || []).map((r) => r.event_id)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleRsvpDone(eventId) {
    setMyRsvps((prev) => new Set([...prev, eventId]));
  }

  const isEmpty = cancellations.length === 0 && announcements.length === 0 && events.length === 0;

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Notices
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Notices &amp; events.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Announcements, class cancellations, and upcoming events from Cherry Dance Studios.
        </p>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading…</div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-12 text-center">
          <FaBullhorn className="mx-auto mb-4 text-3xl text-white/15" />
          <p className="text-sm text-white/55">All clear — no notices right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Class cancellations ── */}
          {cancellations.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ee2435]">
                <FaExclamationTriangle className="text-[10px]" />
                Class cancellations
              </h2>
              <div className="space-y-3">
                {cancellations.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-4 rounded-2xl border border-[#d1060f]/25 bg-[#d1060f]/[0.06] p-5"
                  >
                    <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/20 text-[#ee2435]">
                      <FaExclamationTriangle className="text-sm" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {c.batch?.name} — class cancelled
                      </p>
                      <p className="mt-0.5 text-sm text-white/70">{fmtDate(c.class_date)}</p>
                      {c.reason && <p className="mt-1.5 text-xs text-white/50 italic">{c.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Announcements ── */}
          {announcements.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <FaBullhorn className="text-[10px]" />
                Announcements
              </h2>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{a.title}</p>
                      {a.audience === 'batch' && a.batch && (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          {a.batch.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 whitespace-pre-line">{a.body}</p>
                    <p className="mt-3 text-[11px] text-white/30">
                      {new Date(a.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Upcoming events ── */}
          {events.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <FaCalendarAlt className="text-[10px]" />
                Upcoming events
              </h2>
              <div className="space-y-3">
                {events.map((ev) => {
                  const rsvpd = myRsvps.has(ev.id);
                  return (
                    <div key={ev.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center min-w-[52px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                            {new Date(ev.starts_at).toLocaleDateString('en-CA', { month: 'short' })}
                          </p>
                          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white leading-none">
                            {new Date(ev.starts_at).getDate()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">{ev.title}</p>
                          {ev.description && <p className="mt-1 text-sm text-white/60">{ev.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1.5">
                              <FaCalendarAlt className="text-[9px]" />{fmtDT(ev.starts_at)}
                              {ev.ends_at && ` – ${fmtDT(ev.ends_at)}`}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-[9px]" />{ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/8 pt-4">
                        {rsvpd ? (
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                            <FaCheckCircle />
                            You&rsquo;ve expressed interest — we&rsquo;ll be in touch!
                          </div>
                        ) : (
                          <button
                            onClick={() => setRsvpModal(ev)}
                            className="rounded-full bg-[#d1060f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
                          >
                            We&rsquo;re interested →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {rsvpModal && rsvpStudents.length > 0 && (
        <RsvpModal
          event={rsvpModal}
          students={rsvpStudents}
          onClose={() => setRsvpModal(null)}
          onDone={() => handleRsvpDone(rsvpModal.id)}
        />
      )}
    </div>
  );
}
