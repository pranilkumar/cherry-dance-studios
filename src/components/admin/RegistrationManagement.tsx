'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUserPlus,
  FaEye,
  FaSearch,
  FaTimes,
  FaPaperPlane,
  FaExclamationCircle,
} from 'react-icons/fa';

/**
 * Registration Management — dark theme matching homepage.
 */

const STATUS_META = {
  pending:   { bg: 'rgba(209,6,15,0.18)', fg: '#ee2435', label: 'Pending' },
  approved:  { bg: 'rgba(255,255,255,0.06)', fg: '#ffffff', label: 'Approved', border: 'rgba(209,6,15,0.6)' },
  converted: { bg: '#ffffff', fg: '#0a0a0f', label: 'Converted' },
  rejected:  { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)', label: 'Rejected' },
};

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#d1060f]/25';

export default function RegistrationManagement() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [convertConfirm, setConvertConfirm] = useState(null);
  const [converting, setConverting] = useState(false);
  const [resendingId, setResendingId] = useState(null); // tracks which row's Resend is in-flight
  const [alert, setAlert] = useState(null);
  const [batches, setBatches] = useState([]);

  const PAGE_SIZE = 50;

  useEffect(() => { fetchRegistrations(); fetchBatches(); }, []);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('class_batches')
      .select('id, name, tier, weekdays, start_time, end_time')
      .eq('is_active', true)
      .order('name');
    setBatches(data || []);
  };

  const fetchRegistrations = async (append = false) => {
    setLoading(true);
    const from = append ? registrations.length : 0;
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(error);
      showAlert('error', 'Failed to load registrations');
    } else {
      setRegistrations((prev) => append ? [...prev, ...(data || [])] : (data || []));
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
    }
    setLoading(false);
  };

  // Opens the fee modal instead of converting immediately.
  const handleConvertClick = (reg) => {
    setSelected(null);
    setConvertConfirm(reg);
  };

  const convertToStudent = async (registrationId, feeData) => {
    setConverting(true);

    const reg = registrations.find((r) => r.id === registrationId);

    const { data: newStudentId, error } = await supabase.rpc('convert_registration_to_student', {
      registration_id: registrationId,
    });
    if (error) {
      showAlert('error', error.message || 'Failed to convert');
      setConverting(false);
      return;
    }

    // Assign batch if selected.
    if (feeData?.batchId && newStudentId) {
      const { error: batchErr } = await supabase
        .from('students')
        .update({ class_batch_id: feeData.batchId })
        .eq('id', newStudentId);
      if (batchErr) console.warn('[batch-assign] failed:', batchErr);
    }

    // Insert the initial fee record if one was provided.
    if (feeData && newStudentId) {
      const { error: feeErr } = await supabase.from('fees').insert({
        student_id: newStudentId,
        fee_type: feeData.feeType,
        amount: feeData.amount,
        due_date: feeData.dueDate,
        payment_status: 'pending',
        notes: feeData.notes || null,
      });
      if (feeErr) console.warn('[fee-insert] failed:', feeErr);
    }

    let emailNote = '';
    if (reg?.email) {
      const ok = await sendWelcomeEmail(reg.email, registrationId);
      emailNote = ok
        ? ` Welcome email sent to ${reg.email}.`
        : ' (welcome email failed — Resend from the table when ready.)';
    }

    showAlert('success', `Registration converted to student.${emailNote}`);
    fetchRegistrations();
    setSelected(null);
    setConvertConfirm(null);
    setConverting(false);
  };

  // Shared portal-invite path used by both initial convert and "Resend".
  // Sends a magic-link login email via Supabase OTP — this creates a
  // Supabase Auth user if one doesn't exist yet, or just sends a fresh
  // login link if they already have an account.
  // Returns true on success, false on failure. Writes the success timestamp
  // back to the registrations row so the table can show status.
  const sendWelcomeEmail = async (email, registrationId, { force = false } = {}) => {
    // Rate-limit guard: don't resend if a link was sent in the last 60 minutes,
    // unless force=true (used by the explicit "Resend" button).
    if (!force) {
      const row = registrations.find((r) => r.id === registrationId);
      if (row?.welcome_email_sent_at) {
        const sentAt = new Date(row.welcome_email_sent_at).getTime();
        if (Date.now() - sentAt < 60 * 60 * 1000) {
          console.info('[portal-invite] skipped — sent less than 1 hour ago');
          return true; // treat as success — no need to re-send
        }
      }
    }

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error: mailErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: siteUrl ? `${siteUrl}/portal/auth/callback` : undefined,
      },
    });
    if (mailErr) {
      console.warn('[portal-invite] failed:', mailErr);
      return false;
    }
    // Best-effort stamp — if this update fails it's not catastrophic.
    await supabase
      .from('registrations')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', registrationId);
    return true;
  };

  // Manual retry from the table row — bypasses the 1-hour cooldown.
  const resendWelcomeEmail = async (reg) => {
    if (!reg?.email) return;
    setResendingId(reg.id);
    const ok = await sendWelcomeEmail(reg.email, reg.id, { force: true });
    setResendingId(null);
    showAlert(
      ok ? 'success' : 'error',
      ok
        ? `Portal access link sent to ${reg.email}.`
        : 'Send failed — likely a Supabase rate limit. Try again in an hour.'
    );
    if (ok) fetchRegistrations();
  };

  const updateStatus = async (registrationId, newStatus) => {
    const { error } = await supabase
      .from('registrations')
      .update({ status: newStatus })
      .eq('id', registrationId);
    if (error) showAlert('error', 'Failed to update status');
    else {
      showAlert('success', `Marked as ${newStatus}.`);
      fetchRegistrations();
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const filtered = registrations.filter((reg) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (reg.student_name || '').toLowerCase().includes(term) ||
      (reg.parent_name || '').toLowerCase().includes(term) ||
      (reg.email || '').toLowerCase().includes(term) ||
      (reg.phone || '').includes(term);
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = registrations.reduce(
    (acc, r) => { acc.total++; acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    { total: 0, pending: 0, approved: 0, converted: 0, rejected: 0 }
  );

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Registrations
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Enquiries.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Review submissions from the public form and convert them to students.
        </p>
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
            { v: 'all',       label: `All (${counts.total})` },
            { v: 'pending',   label: `Pending (${counts.pending || 0})` },
            { v: 'approved',  label: `Approved (${counts.approved || 0})` },
            { v: 'converted', label: `Converted (${counts.converted || 0})` },
            { v: 'rejected',  label: `Rejected (${counts.rejected || 0})` },
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
          <div className="px-6 py-16 text-center text-sm text-white/40">Loading registrations…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-white/55">
            {registrations.length === 0 ? 'No registrations yet.' : 'No registrations match this filter.'}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8 bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Submitted</th>
                  <th className="px-5 py-3 text-left font-medium">Student</th>
                  <th className="px-5 py-3 text-left font-medium">Contact</th>
                  <th className="px-5 py-3 text-left font-medium">Preferred class</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.04]">
                    <td className="px-5 py-3 text-xs text-white/55 tabular-nums">
                      {new Date(reg.created_at).toLocaleDateString('en-CA', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{reg.student_name}</div>
                      <div className="text-xs text-white/55">{reg.parent_name}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <div className="text-white/85">{reg.email}</div>
                      <div className="text-white/55">{reg.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-white/80">
                      {reg.preferred_class || <span className="text-white/35">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={reg.status} />
                      {reg.status === 'converted' && (
                        <EmailStatus sentAt={reg.welcome_email_sent_at} />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn icon={FaEye} label="View" onClick={() => setSelected(reg)} />
                        {reg.status === 'pending' && (
                          <>
                            <ActionBtn icon={FaCheckCircle} label="Approve" onClick={() => updateStatus(reg.id, 'approved')} color="success" />
                            <ActionBtn icon={FaTimesCircle} label="Reject" onClick={() => updateStatus(reg.id, 'rejected')} color="danger" />
                          </>
                        )}
                        {(reg.status === 'approved' || reg.status === 'pending') && (
                          <ActionBtn icon={FaUserPlus} label="Convert" onClick={() => handleConvertClick(reg)} color="primary" />
                        )}
                        {reg.status === 'converted' && !reg.welcome_email_sent_at && (
                          <ActionBtn
                            icon={FaPaperPlane}
                            label={resendingId === reg.id ? 'Sending…' : 'Resend'}
                            disabled={resendingId === reg.id}
                            onClick={() => resendWelcomeEmail(reg)}
                            color="primary"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="flex justify-center p-4">
              <button
                onClick={() => fetchRegistrations(true)}
                disabled={loading}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/[0.08] disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {selected && (
        <DetailModal
          registration={selected}
          converting={converting}
          onClose={() => setSelected(null)}
          onConvert={() => handleConvertClick(selected)}
        />
      )}

      {convertConfirm && (
        <FeeModal
          registration={convertConfirm}
          converting={converting}
          batches={batches}
          onConfirm={(feeData) => convertToStudent(convertConfirm.id, feeData)}
          onCancel={() => setConvertConfirm(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const v = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: v.bg,
        color: v.fg,
        ...(v.border ? { boxShadow: `inset 0 0 0 1px ${v.border}` } : {}),
      }}
    >
      {v.label}
    </span>
  );
}

/** Tiny indicator under the StatusBadge for converted rows — tells the admin
 *  whether the welcome email actually went out. */
function EmailStatus({ sentAt }) {
  if (sentAt) {
    const when = new Date(sentAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-white/55">
        <FaCheckCircle className="text-[9px] text-white/65" />
        <span>Email sent · {when}</span>
      </div>
    );
  }
  return (
    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[#ee2435]">
      <FaExclamationCircle className="text-[9px]" />
      <span>Email pending</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, color = 'default', disabled = false }) {
  const colorCls = {
    default: 'border-white/15 bg-white/[0.04] text-white/85 hover:border-white/30',
    success: 'border-white/20 bg-white text-[#0a0a0f] hover:bg-white/90',
    danger:  'border-[#d1060f]/40 bg-[#d1060f]/15 text-[#ee2435] hover:bg-[#d1060f]/25',
    primary: 'border-[#d1060f] bg-[#d1060f] text-white hover:bg-[#b00310]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${colorCls[color]}`}
    >
      <Icon className="text-[10px]" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function DetailModal({ registration, converting, onClose, onConvert }) {
  const canConvert = registration.status === 'approved' || registration.status === 'pending';
  const formatList = (val) => (Array.isArray(val) ? val.join(', ') : val || '—');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
              {registration.student_name}
            </h2>
            <p className="mt-0.5 text-xs text-white/45">
              Submitted{' '}
              {new Date(registration.created_at).toLocaleString('en-CA', {
                dateStyle: 'medium', timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={registration.status} />
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm md:grid-cols-2">
            <KV k="Parent / guardian" v={registration.parent_name} />
            <KV k="Email" v={registration.email} />
            <KV k="Second email" v={registration.email_secondary} />
            <KV k="Phone" v={registration.phone} />
            <KV k="Date of birth" v={registration.date_of_birth} />
            <KV k="Preferred class" v={registration.preferred_class} />
            <KV k="Preferred days" v={formatList(registration.preferred_weekdays || registration.preferred_weekday)} />
            <KV k="Preferred times" v={formatList(registration.preferred_time_slots || registration.preferred_time_slot)} />
            <KV k="Experience" v={registration.experience_level} />
            <KV k="Allergies / medical" v={registration.allergies} />
            <KV k="Emergency contact" v={registration.emergency_contact} />
            <KV k="Photo consent" v={registration.photo_consent != null ? (registration.photo_consent ? 'Yes' : 'No') : '—'} />
            <KV k="Heard from" v={registration.heard_from} />
          </div>

          {registration.notes && (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Notes</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-white/85">{registration.notes}</p>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-white/8 bg-white/[0.02] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/30"
          >
            Close
          </button>
          {canConvert && (
            <button
              type="button"
              onClick={onConvert}
              disabled={converting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
            >
              <FaUserPlus className="text-xs" />
              {converting ? 'Converting…' : 'Convert to student'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-white/45">{k}</dt>
      <dd className="mt-0.5 text-sm text-white">{v || <span className="text-white/35">—</span>}</dd>
    </div>
  );
}

function FeeModal({ registration, converting, batches = [], onConfirm, onCancel }) {
  const fifteenthOfNextMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 15)
      .toISOString()
      .split('T')[0];
  };

  const [amount, setAmount] = useState('100');
  const [feeType, setFeeType] = useState('Monthly fee');
  const [dueDate, setDueDate] = useState(fifteenthOfNextMonth());
  const [notes, setNotes] = useState('');
  const [batchId, setBatchId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ amount: parseFloat(amount), feeType, dueDate, notes, batchId: batchId || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a0a0f]/80 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
              Set initial fee
            </h2>
            <p className="mt-0.5 text-xs text-white/45">For {registration.student_name}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                Amount (CAD)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/45">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${inputCls} pl-7`}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
              Fee type
            </label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              className={inputCls}
            >
              <option value="Monthly fee">Monthly fee</option>
              <option value="Registration fee">Registration fee</option>
              <option value="Annual fee">Annual fee</option>
              <option value="Costume deposit">Costume deposit</option>
              <option value="Workshop fee">Workshop fee</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {batches.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                Assign to class{' '}
                <span className="font-normal normal-case text-white/30">(optional)</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Assign later —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
              Notes{' '}
              <span className="font-normal normal-case text-white/30">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. First month pro-rated"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={converting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d1060f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310] disabled:opacity-60"
            >
              <FaUserPlus className="text-xs" />
              {converting ? 'Converting…' : 'Convert & set fee'}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(null)}
              disabled={converting}
              className="py-1 text-center text-sm text-white/40 hover:text-white/70 disabled:opacity-50"
            >
              Convert without setting a fee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
