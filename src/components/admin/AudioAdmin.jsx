'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FaPlus, FaTrash, FaTimes, FaMusic, FaCloudUploadAlt, FaUsers,
  FaLock, FaPlay, FaPause, FaCalendarAlt,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTime(s) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Tiny inline audio player used in the mix list. */
function MiniPlayer({ url }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd  = () => { setPlaying(false); setCurrent(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    // Pause all other audios
    document.querySelectorAll('audio').forEach((el) => { if (el !== a) { el.pause(); } });
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const a = ref.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5">
      <audio ref={ref} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/20 text-[#ee2435] transition hover:bg-[#d1060f]/40"
      >
        {playing ? <FaPause className="text-[9px]" /> : <FaPlay className="text-[9px] ml-px" />}
      </button>
      <div
        onClick={seek}
        className="h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full rounded-full bg-[#ee2435] transition-[width] duration-75" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-white/35 tabular-nums">
        {fmtTime(current)} / {fmtTime(duration)}
      </span>
    </div>
  );
}

export default function AudioAdmin() {
  const [mixes, setMixes]               = useState([]);
  const [batches, setBatches]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ title: '', description: '', batch_id: '', is_public: true });
  const [file, setFile]                 = useState(null);
  const [fileSize, setFileSize]         = useState(0);
  const [uploading, setUploading]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [alert, setAlert]               = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: m }, { data: b }] = await Promise.all([
      supabase
        .from('audio_mixes')
        .select('*, batch:class_batches(id, name, tier)')
        .order('created_at', { ascending: false }),
      supabase
        .from('class_batches')
        .select('id, name, tier')
        .eq('is_active', true)
        .order('name'),
    ]);
    setMixes(m || []);
    setBatches(b || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', batch_id: '', is_public: true });
    setFile(null);
    setFileSize(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileSize(f?.size ?? 0);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file)            return showMsg('error', 'Please select an audio file.');
    if (!form.title.trim()) return showMsg('error', 'Title is required.');

    setUploading(true);
    try {
      // Sanitise filename and build a unique storage path
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const storagePath = `${Date.now()}-${safe}`;

      const { error: storageErr } = await supabase.storage
        .from('audio-mixes')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (storageErr) throw new Error(`Storage error: ${storageErr.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('audio-mixes')
        .getPublicUrl(storagePath);

      const { error: dbErr } = await supabase.from('audio_mixes').insert([{
        title:       form.title.trim(),
        description: form.description.trim() || null,
        file_url:    publicUrl,
        file_name:   file.name,
        batch_id:    form.batch_id || null,
        // batch-specific mixes are still "public" within the portal — the portal
        // filters them by batch_id. is_public=false means hidden from everyone.
        is_public:   form.is_public,
      }]);

      if (dbErr) throw new Error(`DB error: ${dbErr.message}`);

      showMsg('success', 'Mix uploaded successfully.');
      resetForm();
      setShowForm(false);
      fetchAll();
    } catch (err) {
      showMsg('error', err.message || 'Upload failed. Check the bucket exists in Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      // Remove from Storage (extract path after bucket name in URL)
      const urlParts = confirmDelete.file_url.split('/audio-mixes/');
      if (urlParts.length > 1) {
        const storagePath = decodeURIComponent(urlParts[1].split('?')[0]);
        // storage.remove returns {data, error} and never throws — check explicitly.
        const { error: storErr } = await supabase.storage.from('audio-mixes').remove([storagePath]);
        if (storErr) console.warn('Storage remove failed (orphaned file):', storErr.message);
      }
      const { error } = await supabase.from('audio_mixes').delete().eq('id', confirmDelete.id);
      if (error) throw new Error(error.message);
      showMsg('success', 'Mix deleted.');
      fetchAll();
    } catch (err) {
      showMsg('error', err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const showMsg = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const publicCount = mixes.filter((m) => !m.batch_id).length;
  const batchCount  = mixes.filter((m) =>  m.batch_id).length;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Audio
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            Audio mixes.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Share practice tracks, routines, or recordings with students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
        >
          <FaCloudUploadAlt className="text-sm" /> Upload mix
        </button>
      </header>

      {/* Alert */}
      {alert && (
        <div className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
          alert.type === 'success'
            ? 'border-white/15 bg-white/[0.06] text-white'
            : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
        }`}>
          <span>{alert.message}</span>
          <button type="button" onClick={() => setAlert(null)}>
            <FaTimes className="text-xs opacity-65 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Total mixes',       value: mixes.length },
          { label: 'All-student mixes', value: publicCount },
          { label: 'Batch-specific',    value: batchCount, featured: batchCount > 0 },
        ].map(({ label, value, featured }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 backdrop-blur-md ${
              featured
                ? 'border-[#d1060f]/30 bg-[#d1060f]/[0.06]'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/55">{label}</p>
            <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums ${
              featured ? 'text-[#ee2435]' : 'text-white'
            }`}>
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Mix list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-white/40">Loading mixes…</div>
      ) : mixes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <FaMusic className="mx-auto mb-3 text-2xl text-white/20" />
          <p className="text-sm font-semibold text-white/55">No audio mixes yet.</p>
          <p className="mt-1.5 text-xs text-white/35">
            Click <strong className="text-white/55">Upload mix</strong> above to add your first track.
            <br />
            Make sure the <code className="text-white/45">audio-mixes</code> bucket exists in Supabase Storage first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mixes.map((mix) => (
            <div
              key={mix.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white/8 text-white/55">
                    <FaMusic className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
                      {mix.title}
                    </p>
                    {mix.description && (
                      <p className="mt-0.5 truncate text-xs text-white/50">{mix.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {mix.batch ? (
                        <span className="flex items-center gap-1 rounded-full border border-[#d1060f]/25 bg-[#d1060f]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ee2435]">
                          <FaLock className="text-[8px]" />
                          {mix.batch.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                          <FaUsers className="text-[8px]" />
                          All students
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <FaCalendarAlt className="text-[8px]" />
                        {fmtDate(mix.created_at)}
                      </span>
                      {mix.file_name && (
                        <span className="text-[10px] text-white/30 truncate max-w-[160px]">
                          {mix.file_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(mix)}
                  className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435] hover:bg-[#d1060f]/20"
                >
                  <FaTrash className="text-[10px]" />
                </button>
              </div>

              {/* Mini player */}
              <div className="mt-4 border-t border-white/8 pt-4">
                <MiniPlayer url={mix.file_url} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showForm && (
        <Modal title="Upload audio mix" onClose={() => setShowForm(false)}>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* File picker */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Audio file <span className="text-[#ee2435]">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/75 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#d1060f] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#b00310] focus:outline-none"
              />
              {fileSize > 0 && (
                <p className="mt-1 text-[10px] text-white/40">
                  {fmtFileSize(fileSize)} · max 50 MB
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Title <span className="text-[#ee2435]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Bollywood Cardio Mix — May 2026"
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional note for students…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                Assign to batch
              </label>
              <select
                value={form.batch_id}
                onChange={(e) => setForm((p) => ({ ...p, batch_id: e.target.value }))}
                className={`${inputCls} ${selectChevron}`}
              >
                <option value="">All students (no specific batch)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{b.tier ? ` — ${b.tier}` : ''}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-white/35">
                {form.batch_id
                  ? 'Only students in the selected batch will see this.'
                  : 'All logged-in parents will see this mix.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt /> Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Delete mix?" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-sm text-white/85">
            Permanently delete{' '}
            <strong className="text-white">{confirmDelete.title}</strong>?
            The audio file will also be removed from storage.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, size = 'md' }) {
  const w = size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className={`w-full ${w} overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]`}>
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
