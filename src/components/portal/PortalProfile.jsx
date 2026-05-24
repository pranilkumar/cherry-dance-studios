'use client';

import { useEffect, useState } from 'react';
import {
  FaCheckCircle, FaLock, FaKey, FaExclamationCircle,
  FaEdit, FaTimes, FaUser, FaPhone, FaShieldAlt,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal — Profile page.
 * - Signed-in email (read-only)
 * - Per-student contact info editor (phone, allergies, emergency contact, photo consent)
 * - Password management panel
 */
export default function PortalProfile() {
  const [email, setEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      setEmail(user.email || '');
      const providers = user.app_metadata?.providers || [];
      const identities = user.identities || [];
      setHasPassword(
        providers.includes('email') || identities.some((i) => i.provider === 'email'),
      );
      setLoadingUser(false);

      const { data } = await supabase
        .from('students')
        .select('id, student_name, parent_name, phone, allergies, emergency_contact, photo_consent, preferred_class, experience_level, status')
        .eq('email', user.email);
      if (!cancelled) {
        setStudents(data || []);
        setLoadingStudents(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleStudentSave = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)),
    );
    showAlert('success', 'Contact info updated.');
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Portal · Profile
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          Your account.
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Contact info, medical notes, and sign-in settings.
        </p>
      </header>

      {/* Alert toast */}
      {alert && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'border-white/15 bg-white/[0.05] text-white/85'
              : 'border-[#d1060f]/30 bg-[#d1060f]/10 text-[#ee2435]'
          }`}
        >
          {alert.type === 'success'
            ? <FaCheckCircle className="shrink-0 text-[#ee2435]" />
            : <FaExclamationCircle className="shrink-0" />}
          {alert.msg}
        </div>
      )}

      {/* Sign-in identity */}
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          <FaUser className="text-[10px]" /> Signed in as
        </p>
        <p className="mt-1.5 text-base font-medium text-white">
          {loadingUser ? 'Loading…' : email || '—'}
        </p>
      </section>

      {/* Per-dancer contact info */}
      {loadingStudents ? (
        <div className="mb-5 py-8 text-center text-sm text-white/40">Loading your dancers…</div>
      ) : students.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {students.length === 1 ? 'Your dancer' : 'Your dancers'}
          </h2>
          <div className="space-y-4">
            {students.map((s) => (
              <StudentContactCard
                key={s.id}
                student={s}
                onSave={handleStudentSave}
                onError={(msg) => showAlert('error', msg)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/55">
            No dancers linked to this email yet. Contact Cherry or Pranil to get set up.
          </p>
        </section>
      )}

      {/* Password panel */}
      {!loadingUser && (
        <PasswordPanel hasPassword={hasPassword} onChange={setHasPassword} />
      )}
    </div>
  );
}

/* ── Student contact card with inline editing ── */

function StudentContactCard({ student, onSave, onError }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: student.phone || '',
    allergies: student.allergies || '',
    emergency_contact: student.emergency_contact || '',
    photo_consent: student.photo_consent ?? true,
  });

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const cancel = () => {
    setForm({
      phone: student.phone || '',
      allergies: student.allergies || '',
      emergency_contact: student.emergency_contact || '',
      photo_consent: student.photo_consent ?? true,
    });
    setEditing(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({
        phone:             form.phone.trim() || null,
        allergies:         form.allergies.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        photo_consent:     form.photo_consent,
      })
      .eq('id', student.id);

    setSaving(false);
    if (error) {
      onError('Couldn\'t save — please try again.');
      return;
    }
    onSave({ ...student, ...form });
    setEditing(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white">
            {student.student_name}
          </p>
          <p className="mt-0.5 text-xs text-white/45">
            {student.preferred_class || 'No style assigned'}
            {student.experience_level && ` · ${student.experience_level}`}
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
          >
            <FaEdit className="text-[10px]" /> Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={cancel}
            className="grid h-7 w-7 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* View mode */}
      {!editing && (
        <dl className="grid grid-cols-1 gap-0 border-t border-white/8">
          <InfoRow icon={FaPhone} label="Phone / WhatsApp" value={student.phone} />
          <InfoRow icon={FaShieldAlt} label="Allergies / medical notes" value={student.allergies} />
          <InfoRow label="Emergency contact" value={student.emergency_contact} />
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
                Photo &amp; video consent
              </dt>
            </div>
            <dd>
              {student.photo_consent
                ? <span className="text-xs font-semibold text-white/70">Consented ✓</span>
                : <span className="text-xs font-semibold text-white/40">Opted out</span>}
            </dd>
          </div>
        </dl>
      )}

      {/* Edit mode */}
      {editing && (
        <form onSubmit={save} className="border-t border-white/8 px-5 py-5 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
              <FaPhone className="text-[9px]" /> Phone / WhatsApp
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="e.g. 613-555-0123"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
              <FaShieldAlt className="text-[9px]" /> Allergies / medical notes
            </label>
            <textarea
              value={form.allergies}
              onChange={(e) => set('allergies', e.target.value)}
              rows={2}
              placeholder="e.g. peanut allergy, asthma, knee issue — anything we should know"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
              Emergency contact
            </label>
            <input
              type="text"
              value={form.emergency_contact}
              onChange={(e) => set('emergency_contact', e.target.value)}
              placeholder="Name + phone (e.g. Dad — 613-555-0123)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
            <input
              type="checkbox"
              checked={form.photo_consent}
              onChange={(e) => set('photo_consent', e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#d1060f]"
            />
            <span className="text-sm text-white/75">
              <strong className="text-white">Photo &amp; video consent.</strong>{' '}
              I&rsquo;m OK with my dancer appearing in studio photos and videos —
              recitals, social posts, performance clips.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/75 hover:border-white/30 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-3 last:border-0">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
        {Icon && <Icon className="text-[9px]" />}
        {label}
      </dt>
      <dd className="text-right text-sm text-white/75">
        {value || <span className="text-white/25">—</span>}
      </dd>
    </div>
  );
}

/* ── Password panel (unchanged) ── */

function PasswordPanel({ hasPassword, onChange }) {
  const [phase, setPhase] = useState('idle');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const startEdit = () => { setPhase('editing'); setPassword(''); setConfirm(''); setError(''); };
  const cancel    = () => { setPhase('idle');    setPassword(''); setConfirm(''); setError(''); };

  const save = async (e) => {
    e.preventDefault();
    if (password.length < 8)     { setError('Use at least 8 characters.'); return; }
    if (password !== confirm)    { setError('Passwords don\'t match.'); return; }
    setPhase('saving'); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message || 'Couldn\'t save password.'); setPhase('editing'); return; }
    setPhase('saved'); onChange(true); setPassword(''); setConfirm('');
    setTimeout(() => setPhase('idle'), 2200);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            <FaKey className="text-[10px]" /> Sign-in password
          </p>
          <p className="mt-1.5 text-base font-medium text-white">
            {hasPassword ? 'Password is set' : 'Not set — email-code sign-in only'}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {hasPassword
              ? 'You can sign in with email + password, or keep using a code — both work.'
              : 'Add a password if you'd rather not check email for a code each time.'}
          </p>
        </div>
        {phase === 'idle' && (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/85 hover:border-white/30 hover:text-white"
          >
            {hasPassword ? 'Change' : 'Add'}
          </button>
        )}
      </div>

      {phase === 'saved' && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white/85">
          <FaCheckCircle className="text-[#ee2435]" /> Password saved.
        </div>
      )}

      {(phase === 'editing' || phase === 'saving') && (
        <form onSubmit={save} className="mt-5 space-y-4 border-t border-white/8 pt-5" noValidate>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
              <FaLock className="text-[10px]" /> New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
              <FaLock className="text-[10px]" /> Confirm
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
              <FaExclamationCircle className="text-xs" /> {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={cancel} disabled={phase === 'saving'}
              className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/75 hover:border-white/30 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={phase === 'saving' || !password || !confirm}
              className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)' }}>
              {phase === 'saving' ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
