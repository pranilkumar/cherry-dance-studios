'use client';

import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaTimes, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:text-white">
            <FaTimes />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  location: '',
  is_public: true,
};

function fmtDT(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'rsvps' | null>(null);
  const [editing, setEditing] = useState(null);
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setModal('create');
  }

  function openEdit(ev) {
    setForm({
      title: ev.title,
      description: ev.description || '',
      starts_at: ev.starts_at ? ev.starts_at.slice(0, 16) : '',
      ends_at: ev.ends_at ? ev.ends_at.slice(0, 16) : '',
      location: ev.location || '',
      is_public: ev.is_public,
    });
    setEditing(ev);
    setError('');
    setModal('edit');
  }

  async function openRsvps(ev) {
    setRsvpEvent(ev);
    setRsvpLoading(true);
    setModal('rsvps');
    const { data } = await supabase
      .from('event_rsvps')
      .select('*, student:students(student_name, parent_name, email, phone)')
      .eq('event_id', ev.id)
      .order('created_at', { ascending: true });
    setRsvps(data || []);
    setRsvpLoading(false);
  }

  async function save() {
    if (!form.title.trim() || !form.starts_at) { setError('Title and start date are required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      location: form.location.trim() || null,
      is_public: form.is_public,
    };
    const { error: err } = editing
      ? await supabase.from('events').update(payload).eq('id', editing.id)
      : await supabase.from('events').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setModal(null);
    load();
  }

  async function del(ev) {
    if (!confirm(`Delete "${ev.title}"? All RSVPs will be removed.`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    load();
  }

  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date());
  const past = events.filter((e) => new Date(e.starts_at) < new Date());

  function EventRow({ ev }) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mt-0.5 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center min-w-[52px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
            {new Date(ev.starts_at).toLocaleDateString('en-CA', { month: 'short' })}
          </p>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white leading-none">
            {new Date(ev.starts_at).getDate()}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{ev.title}</p>
            {!ev.is_public && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Draft
              </span>
            )}
          </div>
          {ev.description && <p className="mt-1 text-sm text-white/55 line-clamp-2">{ev.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/40">
            <span className="flex items-center gap-1"><FaCalendarAlt className="text-[9px]" />{fmtDT(ev.starts_at)}</span>
            {ev.location && <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[9px]" />{ev.location}</span>}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={() => openRsvps(ev)}
            title="View RSVPs"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:border-white/20 hover:text-white"
          >
            <FaUsers className="text-[10px]" /> RSVPs
          </button>
          <button onClick={() => openEdit(ev)} className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white">
            <FaEdit className="text-sm" />
          </button>
          <button onClick={() => del(ev)} className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-[#d1060f]/15 hover:text-[#ee2435]">
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Admin · Events
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Events.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Post performances and festivals. Parents RSVP from the student portal.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310]"
        >
          <FaPlus className="text-xs" /> New event
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading…</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-12 text-center">
          <FaCalendarAlt className="mx-auto mb-4 text-3xl text-white/15" />
          <p className="text-sm text-white/55">No events yet. Create your first one to let parents RSVP.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Upcoming</h2>
              <div className="space-y-3">{upcoming.map((ev) => <EventRow key={ev.id} ev={ev} />)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Past</h2>
              <div className="space-y-3 opacity-60">{past.map((ev) => <EventRow key={ev.id} ev={ev} />)}</div>
            </section>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'New event' : 'Edit event'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Event title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Ottawa Indian Food Festival"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Details about the event, what to expect, costume info…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Starts at</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-[#ee2435] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  Ends at <span className="text-white/30 normal-case">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-[#ee2435] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Lansdowne Park, Ottawa"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#d1060f]"
              />
              <span className="text-sm text-white/80">Visible to parents in portal</span>
            </label>
            {error && <p className="text-sm text-[#ee2435]">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-[#d1060f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-50"
              >
                {saving ? 'Saving…' : modal === 'create' ? 'Create event' : 'Save changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RSVP list modal */}
      {modal === 'rsvps' && rsvpEvent && (
        <Modal title={`RSVPs — ${rsvpEvent.title}`} onClose={() => setModal(null)}>
          {rsvpLoading ? (
            <div className="py-8 text-center text-sm text-white/40">Loading RSVPs…</div>
          ) : rsvps.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/40">No RSVPs yet.</div>
          ) : (
            <div className="space-y-1">
              <p className="mb-4 text-sm text-white/55">{rsvps.length} student{rsvps.length !== 1 ? 's' : ''} interested</p>
              {rsvps.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="font-semibold text-white text-sm">{r.student?.student_name}</p>
                  <p className="text-xs text-white/50">{r.student?.parent_name} · {r.student?.email}</p>
                  {r.notes && <p className="mt-1.5 text-xs italic text-white/40">{r.notes}</p>}
                  <p className="mt-1 text-[10px] text-white/30">
                    RSVP'd {new Date(r.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
