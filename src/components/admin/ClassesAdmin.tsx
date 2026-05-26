'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaUsers, FaClock, FaCalendarAlt,
} from 'react-icons/fa';

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIERS = ['Little Stars', 'The Crew', 'Slay Squad'];
const STYLES = ['Bollywood', 'Hip-Hop', 'Freestyle', 'Indian', 'Contemporary', 'Mixed'];
const INSTRUCTORS = ['Cherry', 'Pranil', 'Cherry & Pranil'];

const emptyBatch = () => ({
  name: '',
  tier: '',
  style: '',
  instructor: '',
  weekdays: [],
  start_time: '',
  end_time: '',
  is_active: true,
  notes: '',
});

/** Format "18:00" → "6:00 PM" */
function fmt24(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ClassesAdmin() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | batch object
  const [form, setForm] = useState(emptyBatch());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from('class_batches').select('*').order('name'),
      supabase.from('students').select('id, student_name, class_batch_id, status, batch_days'),
    ]);
    setBatches(b || []);
    setStudents(s || []);
    setLoading(false);
  };

  // Count all assigned students per batch (active + on_break) so the delete
  // confirmation shows the correct number of batch assignments that will be cleared.
  const countByBatch = useMemo(() => {
    const map: Record<string, number> = {};
    (students || []).forEach((s) => {
      if (s.class_batch_id) {
        map[s.class_batch_id] = (map[s.class_batch_id] || 0) + 1;
      }
    });
    return map;
  }, [students]);

  // Grouped list of active students per batch (for expandable roster)
  const studentsByBatch = useMemo(() => {
    const map = {};
    (students || []).forEach((s) => {
      if (s.class_batch_id && s.status === 'active') {
        if (!map[s.class_batch_id]) map[s.class_batch_id] = [];
        map[s.class_batch_id].push(s);
      }
    });
    return map;
  }, [students]);

  const openCreate = () => { setForm(emptyBatch()); setEditing('new'); };
  const openEdit   = (b) => { setForm({ ...emptyBatch(), ...b, weekdays: b.weekdays || [] }); setEditing(b); };
  const closeModal = () => { setEditing(null); };
  const setField   = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleDay = (day) => setForm((p) => ({
    ...p,
    weekdays: p.weekdays.includes(day)
      ? p.weekdays.filter((d) => d !== day)
      : [...p.weekdays, day],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showAlert('error', 'Batch name is required.');
    if (!form.weekdays.length) return showAlert('error', 'Pick at least one day.');
    if (!form.start_time) return showAlert('error', 'Start time is required.');

    setSaving(true);

    // Only include updatable columns — never send id / created_at / updated_at
    const payload = {
      name:       form.name.trim(),
      tier:       form.tier || null,
      style:      form.style || null,
      instructor: form.instructor?.trim() || null,
      weekdays:   form.weekdays,
      start_time: form.start_time,
      end_time:   form.end_time || null,
      is_active:  form.is_active,
      notes:      form.notes?.trim() || null,
    };

    try {
      let error;
      if (editing === 'new') {
        ({ error } = await supabase.from('class_batches').insert([payload]));
      } else {
        ({ error } = await supabase.from('class_batches').update(payload).eq('id', editing.id));
      }
      if (error) { showAlert('error', error.message || 'Failed to save.'); return; }
      showAlert('success', editing === 'new' ? 'Batch created.' : 'Batch updated.');
      closeModal();
      fetchAll();
    } catch (err) {
      showAlert('error', err?.message || 'Unexpected error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('class_batches').delete().eq('id', confirmDelete.id);
    if (error) showAlert('error', error.message || 'Failed to delete.');
    else { showAlert('success', 'Batch deleted.'); fetchAll(); }
    setConfirmDelete(null);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const active = batches.filter((b) => b.is_active);
  const inactive = batches.filter((b) => !b.is_active);
  const totalEnrolled = Object.values(countByBatch).reduce((s, n) => s + n, 0);

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Classes
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Class batches.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Define your recurring class groups, then assign students to them.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
        >
          <FaPlus className="text-xs" /> New batch
        </button>
      </header>

      {alert && (
        <div className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
          alert.type === 'success' ? 'border-white/15 bg-white/[0.06] text-white' : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)}><FaTimes className="text-xs opacity-65 hover:opacity-100" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active batches',   value: active.length },
          { label: 'Total enrolled',   value: totalEnrolled, featured: true },
          { label: 'Students total',   value: students.filter(s => s.status === 'active').length },
          { label: 'Inactive batches', value: inactive.length },
        ].map(({ label, value, featured }) => (
          <div key={label} className={`rounded-2xl border p-4 backdrop-blur-md ${featured ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
            <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${featured ? 'text-[#ee2435]' : 'text-white'}`}>
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Active batches */}
      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading batches…</div>
      ) : active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-white/55">No batches yet. Create your first class group above.</p>
        </div>
      ) : (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Active batches
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                studentCount={countByBatch[b.id] || 0}
                batchStudents={studentsByBatch[b.id] || []}
                onEdit={() => openEdit(b)}
                onDelete={() => setConfirmDelete(b)}
              />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Inactive batches
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactive.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                studentCount={countByBatch[b.id] || 0}
                batchStudents={studentsByBatch[b.id] || []}
                onEdit={() => openEdit(b)}
                onDelete={() => setConfirmDelete(b)}
                dimmed
              />
            ))}
          </div>
        </section>
      )}

      {/* Create / Edit modal */}
      {editing && (
        <Modal title={editing === 'new' ? 'New class batch' : 'Edit batch'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Batch name <span className="text-[#ee2435]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Mon & Wed 6–7 PM"
                required
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">Tier</label>
                <select value={form.tier} onChange={(e) => setField('tier', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  {TIERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">Style</label>
                <select value={form.style} onChange={(e) => setField('style', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  {STYLES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">Instructor</label>
                <select value={form.instructor} onChange={(e) => setField('instructor', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  {INSTRUCTORS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>

            {/* Weekdays */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Days <span className="text-[#ee2435]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const active = form.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'border-[#d1060f] bg-[#d1060f]/20 text-white'
                          : 'border-white/15 bg-white/[0.04] text-white/65 hover:border-white/30'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                  Start time <span className="text-[#ee2435]">*</span>
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setField('start_time', e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">End time</label>
                <input
                  type="time"
                  value={form.end_time || ''}
                  onChange={(e) => setField('end_time', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
                className="h-4 w-4 accent-[#d1060f]"
              />
              <span className="text-sm text-white/75">Active batch (visible in student assignment)</span>
            </label>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Any notes about this batch…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
              <button type="button" onClick={closeModal}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60">
                {saving ? 'Saving…' : editing === 'new' ? 'Create batch' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete batch?" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-sm text-white/85">
            Delete <strong className="text-white">{confirmDelete.name}</strong>?
            {(countByBatch[confirmDelete.id] || 0) > 0 ? (
              <> <strong className="text-[#ee2435]">{countByBatch[confirmDelete.id]} student{countByBatch[confirmDelete.id] !== 1 ? 's' : ''}</strong> will have their batch assignment cleared.</>
            ) : (
              <> Students assigned to it won&rsquo;t be deleted — their batch assignment will be cleared.</>
            )}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Batch card ── */

function BatchCard({ batch, studentCount, batchStudents, onEdit, onDelete, dimmed = false }) {
  const [showStudents, setShowStudents] = useState(false);
  const timeLabel = batch.end_time
    ? `${fmt24(batch.start_time)} – ${fmt24(batch.end_time)}`
    : fmt24(batch.start_time);

  return (
    <div className={`overflow-hidden rounded-2xl border backdrop-blur-md ${dimmed ? 'border-white/8 bg-white/[0.02]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-[family-name:var(--font-display)] text-lg font-bold tracking-tight ${dimmed ? 'text-white/55' : 'text-white'}`}>
            {batch.name}
          </h3>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit}
              className="grid h-7 w-7 place-items-center rounded-md border border-white/15 bg-white/[0.04] text-white/65 hover:border-white/30 hover:text-white">
              <FaEdit className="text-[10px]" />
            </button>
            <button onClick={onDelete}
              className="grid h-7 w-7 place-items-center rounded-md border border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435] hover:bg-[#d1060f]/20">
              <FaTrash className="text-[10px]" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {batch.tier && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/65">
              {batch.tier}
            </span>
          )}
          {batch.style && (
            <span className="rounded-full border border-[#d1060f]/25 bg-[#d1060f]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
              {batch.style}
            </span>
          )}
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-white/8 pt-4 text-xs text-white/65">
          {batch.weekdays?.length > 0 && (
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-[10px] text-white/35" />
              {batch.weekdays.join(' · ')}
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaClock className="text-[10px] text-white/35" />
            {timeLabel}
          </div>
          {batch.instructor && (
            <div className="text-white/50">with {batch.instructor}</div>
          )}
          <button
            type="button"
            onClick={() => setShowStudents((v) => !v)}
            className="flex w-full items-center gap-2 pt-1 text-left transition hover:text-white/85"
          >
            <FaUsers className="text-[10px] text-white/35 shrink-0" />
            <span className="font-semibold text-white/80">{studentCount}</span>&nbsp;active student{studentCount !== 1 ? 's' : ''}
            {studentCount > 0 && (
              <span className="ml-auto text-[9px] text-white/30">{showStudents ? '▲' : '▼'}</span>
            )}
          </button>
        </dl>
      </div>

      {showStudents && batchStudents.length > 0 && (
        <div className="border-t border-white/8 px-5 py-3 space-y-2">
          {batchStudents
            .slice()
            .sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
            .map((s) => {
              const days = s.batch_days?.length
                ? s.batch_days.map((d) => d.slice(0, 3)).join(', ')
                : null;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-white/80">{s.student_name}</span>
                  {days && (
                    <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/45">
                      {days} only
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

/* ── Shared primitives ── */

function Modal({ title, children, onClose, size = 'md' }) {
  const w = size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className={`w-full ${w} overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]`}>
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">{title}</h2>
          <button type="button" onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white">
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
