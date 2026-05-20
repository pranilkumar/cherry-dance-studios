'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaTimes,
} from 'react-icons/fa';

const STATUS_META = {
  active:   { bg: '#ffffff', fg: '#0a0a0f', label: 'Active' },
  on_break: { bg: 'rgba(238,36,53,0.12)', fg: '#ffb3ba', label: 'On break' },
  pending:  { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', label: 'Pending' },
  inactive: { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.55)', label: 'Inactive' },
  dropped:  { bg: '#d1060f', fg: '#ffffff', label: 'Dropped' },
};

// Order in dropdowns / filters — active/on_break grouped first.
const STATUS_OPTIONS = ['active', 'on_break', 'pending', 'inactive', 'dropped'];

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';
const selectChevron =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%221.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const emptyForm = () => ({
  parent_name: '',
  student_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  preferred_class: '',
  preferred_weekday: '',
  preferred_time_slot: '',
  experience_level: '',
  status: 'active',
  break_until: '',
  notes: '',
});

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('enrollment_date', { ascending: false });
    if (error) showAlert('error', 'Failed to load students');
    else setStudents(data || []);
    setLoading(false);
  };

  const openCreate = () => { setFormData(emptyForm()); setEditing('new'); };
  const openEdit = (s) => {
    setFormData({
      parent_name: s.parent_name || '',
      student_name: s.student_name || '',
      email: s.email || '',
      phone: s.phone || '',
      date_of_birth: s.date_of_birth || '',
      gender: s.gender || '',
      preferred_class: s.preferred_class || '',
      preferred_weekday: s.preferred_weekday || '',
      preferred_time_slot: s.preferred_time_slot || '',
      experience_level: s.experience_level || '',
      status: s.status || 'active',
      break_until: s.break_until || '',
      notes: s.notes || '',
    });
    setEditing(s);
  };
  const closeModal = () => { setEditing(null); setFormData(emptyForm()); };
  const setField = (name, value) => setFormData((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // break_until only meaningful when the student is on_break — clear it
    // otherwise so it doesn't linger and confuse the table cell.
    const payload = {
      ...formData,
      break_until: formData.status === 'on_break' ? (formData.break_until || null) : null,
    };
    if (editing === 'new') {
      const { error } = await supabase.from('students').insert([payload]);
      if (error) return showAlert('error', error.message || 'Failed to add');
      showAlert('success', 'Student added.');
    } else {
      const { error } = await supabase.from('students').update(payload).eq('id', editing.id);
      if (error) return showAlert('error', error.message || 'Failed to update');
      showAlert('success', 'Student updated.');
    }
    closeModal();
    fetchStudents();
  };

  // One-click status change from the table row — no modal needed.
  const updateStatus = async (id, newStatus) => {
    // Moving off on_break clears the return date so it doesn't stick around.
    const patch = newStatus === 'on_break'
      ? { status: newStatus }
      : { status: newStatus, break_until: null };

    // Optimistic update so the UI feels instant.
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await supabase.from('students').update(patch).eq('id', id);
    if (error) {
      showAlert('error', error.message || 'Failed to update status');
      fetchStudents(); // Roll back from server.
    } else {
      showAlert('success', `Marked as ${STATUS_META[newStatus]?.label || newStatus}.`);
    }
  };

  const handleDeleteConfirm = async () => {
    const { error } = await supabase.from('students').delete().eq('id', confirmDelete.id);
    if (error) showAlert('error', error.message || 'Failed to delete');
    else { showAlert('success', 'Student deleted.'); fetchStudents(); }
    setConfirmDelete(null);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const filtered = useMemo(() => students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (s.student_name || '').toLowerCase().includes(term) ||
      (s.parent_name || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.phone || '').includes(term);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, statusFilter]);

  const counts = useMemo(() => students.reduce(
    (acc, s) => { acc.total++; acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    { total: 0, active: 0, on_break: 0, inactive: 0, pending: 0, dropped: 0 }
  ), [students]);

  const exportToCSV = () => {
    const headers = ['Student name', 'Parent name', 'Email', 'Phone', 'Date of birth', 'Gender', 'Preferred class', 'Status', 'Enrollment date'];
    const rows = filtered.map((s) => [
      s.student_name, s.parent_name, s.email, s.phone, s.date_of_birth, s.gender,
      s.preferred_class, s.status, s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '',
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            Students
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
            The roster.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Active dancers, contact info, and class assignments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
          >
            <FaDownload className="text-xs" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
          >
            <FaPlus className="text-xs" />
            Add student
          </button>
        </div>
      </header>

      {alert && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.06] text-white'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-3 opacity-65 hover:opacity-100">
            <FaTimes className="text-xs" />
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'all',      label: `All (${counts.total})` },
            { v: 'active',   label: `Active (${counts.active || 0})` },
            { v: 'on_break', label: `On break (${counts.on_break || 0})` },
            { v: 'pending',  label: `Pending (${counts.pending || 0})` },
            { v: 'inactive', label: `Inactive (${counts.inactive || 0})` },
            { v: 'dropped',  label: `Dropped (${counts.dropped || 0})` },
          ].map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setStatusFilter(f.v)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                statusFilter === f.v
                  ? 'border-[#d1060f] bg-[#d1060f] text-white'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-white/40">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-white/55">
            {students.length === 0 ? 'No students yet.' : 'No students match this filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Student</th>
                  <th className="px-5 py-3 text-left font-medium">Contact</th>
                  <th className="px-5 py-3 text-left font-medium">Class</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Enrolled</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.04]">
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{s.student_name}</div>
                      <div className="text-xs text-white/55">{s.parent_name}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <div className="text-white/85">{s.email}</div>
                      <div className="text-white/55">{s.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-white/80">
                      {s.preferred_class || <span className="text-white/35">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <StatusSelect
                        status={s.status}
                        onChange={(v) => updateStatus(s.id, v)}
                      />
                      {s.status === 'on_break' && s.break_until && (
                        <div className="mt-1 text-[10px] text-white/55">
                          until {new Date(s.break_until + 'T00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/55 tabular-nums">
                      {s.enrollment_date
                        ? new Date(s.enrollment_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/85 hover:border-white/30"
                        >
                          <FaEdit className="text-[10px]" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(s)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#d1060f]/40 bg-[#d1060f]/15 px-2 py-1 text-xs font-medium text-[#ee2435] hover:bg-[#d1060f]/25"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add student' : 'Edit student'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Grid2>
              <Field label="Parent name" required>
                <input type="text" value={formData.parent_name} onChange={(e) => setField('parent_name', e.target.value)} required className={inputCls} />
              </Field>
              <Field label="Student name" required>
                <input type="text" value={formData.student_name} onChange={(e) => setField('student_name', e.target.value)} required className={inputCls} />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="Email" required>
                <input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} required className={inputCls} />
              </Field>
              <Field label="Phone" required>
                <input type="tel" value={formData.phone} onChange={(e) => setField('phone', e.target.value)} required className={inputCls} />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="Date of birth">
                <input type="date" value={formData.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Gender">
                <select value={formData.gender} onChange={(e) => setField('gender', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </Grid2>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Preferred class">
                <select value={formData.preferred_class} onChange={(e) => setField('preferred_class', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  <option value="Bollywood">Bollywood</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="Freestyle">Freestyle</option>
                  <option value="Indian">Indian</option>
                  <option value="Contemporary">Contemporary</option>
                </select>
              </Field>
              <Field label="Preferred weekday">
                <select value={formData.preferred_weekday} onChange={(e) => setField('preferred_weekday', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Time slot">
                <select value={formData.preferred_time_slot} onChange={(e) => setField('preferred_time_slot', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </Field>
            </div>

            <Grid2>
              <Field label="Experience level">
                <select value={formData.experience_level} onChange={(e) => setField('experience_level', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  <option value="">Select…</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={(e) => setField('status', e.target.value)} className={`${inputCls} ${selectChevron}`}>
                  {STATUS_OPTIONS.map((v) => (
                    <option key={v} value={v}>{STATUS_META[v].label}</option>
                  ))}
                </select>
              </Field>
            </Grid2>

            {formData.status === 'on_break' && (
              <Field label="Expected back (optional)">
                <input
                  type="date"
                  value={formData.break_until}
                  onChange={(e) => setField('break_until', e.target.value)}
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs text-white/45">
                  Leave blank if open-ended. We&rsquo;ll surface this in the roster so you remember when to follow up.
                </p>
              </Field>
            )}

            <Field label="Notes">
              <textarea rows={3} value={formData.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Anything else…" className={`${inputCls} resize-none`} />
            </Field>

            <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
              >
                {editing === 'new' ? 'Add student' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete student?" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-sm text-white/85">
            Are you sure you want to delete{' '}
            <strong className="text-white">{confirmDelete.student_name}</strong>?
            This action can&rsquo;t be undone.
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310]"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── tiny primitives ── */

function Modal({ title, children, onClose, size = 'lg' }) {
  const widthCls = size === 'sm' ? 'max-w-md' : 'max-w-2xl';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className={`w-full ${widthCls} overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]`}>
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">
        {label}{required && <span className="ml-1 text-[#ee2435]">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const v = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: v.bg, color: v.fg }}
    >
      {v.label}
    </span>
  );
}

/** Clickable status badge — opens a native select so admins can change status
 *  with one click, no Edit modal needed. */
function StatusSelect({ status, onChange }) {
  const v = STATUS_META[status] || STATUS_META.pending;
  return (
    <div className="relative inline-block">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: v.bg, color: v.fg }}
      >
        {v.label}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-70">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
      <select
        value={status || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Change status"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_META[s].label}</option>
        ))}
      </select>
    </div>
  );
}
