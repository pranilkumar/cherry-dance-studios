'use client';

import { useEffect, useState } from 'react';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTimes } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const AUDIENCE_LABELS = { all: 'All students', batch: 'Specific batch' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
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

const EMPTY_FORM = { title: '', body: '', audience: 'all', batch_id: '', expires_at: '', is_active: true };

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [{ data: ann }, { data: bat }] = await Promise.all([
      supabase.from('announcements').select('*, batch:class_batches(name)').order('created_at', { ascending: false }),
      supabase.from('class_batches').select('id, name').order('name'),
    ]);
    setAnnouncements(ann || []);
    setBatches(bat || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setModal('create');
  }

  function openEdit(a) {
    setForm({
      title: a.title,
      body: a.body,
      audience: a.audience || 'all',
      batch_id: a.batch_id || '',
      expires_at: a.expires_at || '',
      is_active: a.is_active,
    });
    setEditing(a);
    setError('');
    setModal('edit');
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) { setError('Title and message are required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      batch_id: form.audience === 'batch' && form.batch_id ? form.batch_id : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };
    const { error: err } = editing
      ? await supabase.from('announcements').update(payload).eq('id', editing.id)
      : await supabase.from('announcements').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setModal(null);
    load();
  }

  async function toggleActive(a) {
    await supabase.from('announcements').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  }

  async function del(a) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await supabase.from('announcements').delete().eq('id', a.id);
    load();
  }

  const isExpired = (a) => a.expires_at && new Date(a.expires_at + 'T23:59:59') < new Date();

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Admin · Announcements
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Announcements.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Post notices to all parents or a specific batch. Visible in the student portal.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310]"
        >
          <FaPlus className="text-xs" /> New announcement
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading…</div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-12 text-center">
          <FaBullhorn className="mx-auto mb-4 text-3xl text-white/15" />
          <p className="text-sm text-white/55">No announcements yet. Create one to notify parents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const expired = isExpired(a);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-4 rounded-2xl border p-5 transition ${
                  !a.is_active || expired
                    ? 'border-white/8 bg-white/[0.02] opacity-60'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-[#ee2435]">
                  <FaBullhorn className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{a.title}</p>
                    {expired && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                        Expired
                      </span>
                    )}
                    {!a.is_active && !expired && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                        Inactive
                      </span>
                    )}
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {a.audience === 'batch' && a.batch ? a.batch.name : 'All students'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/65 line-clamp-2">{a.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/35">
                    <span>Posted {new Date(a.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {a.expires_at && <span>· Expires {new Date(a.expires_at + 'T00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleActive(a)}
                    title={a.is_active ? 'Deactivate' : 'Activate'}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    {a.is_active ? <FaToggleOn className="text-lg text-emerald-400" /> : <FaToggleOff className="text-lg" />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                  <button
                    onClick={() => del(a)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-[#d1060f]/15 hover:text-[#ee2435]"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'New announcement' : 'Edit announcement'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Studio closed this Saturday"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Message</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="Write your announcement here…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Audience</label>
              <div className="flex gap-2">
                {(['all', 'batch'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, audience: v }))}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                      form.audience === v
                        ? 'border-[#d1060f] bg-[#d1060f]/15 text-[#ee2435]'
                        : 'border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    {AUDIENCE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            {form.audience === 'batch' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Batch</label>
                <select
                  value={form.batch_id}
                  onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#12121a] px-4 py-2.5 text-sm text-white focus:border-[#ee2435] focus:outline-none"
                >
                  <option value="">Select batch…</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
                Expires on <span className="text-white/30 normal-case">(optional)</span>
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[#ee2435] focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#d1060f]"
              />
              <span className="text-sm text-white/80">Active (visible in portal immediately)</span>
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
                {saving ? 'Saving…' : modal === 'create' ? 'Post announcement' : 'Save changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
