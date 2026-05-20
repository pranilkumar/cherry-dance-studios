'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaLock, FaKey, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal — Profile page.
 *
 * For now this is just the password-management panel (so parents who prefer
 * a password over the email-code flow can set one up). The rest of the
 * profile fields (contact info, allergies, photo consent, household
 * contacts) will land here once we wire them up to `students`.
 */
export default function PortalProfile() {
  const [email, setEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) {
        setEmail(user.email || '');
        // Supabase doesn't expose a direct "has password" flag, but the
        // user's app_metadata.providers array lists which auth methods are
        // active. "email" appears once email/password is set up.
        const providers = user.app_metadata?.providers || [];
        const identities = user.identities || [];
        setHasPassword(
          providers.includes('email') ||
          identities.some((i) => i.provider === 'email')
        );
      }
      setLoadingUser(false);
    })();
    return () => { cancelled = true; };
  }, []);

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
          Sign-in settings and contact info. More profile fields coming soon.
        </p>
      </header>

      {/* Identity card */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Signed in as
        </p>
        <p className="mt-1.5 text-base font-medium text-white">
          {loadingUser ? 'Loading…' : email || '—'}
        </p>
      </section>

      {/* Password panel */}
      <PasswordPanel hasPassword={hasPassword} onChange={setHasPassword} />

      {/* Placeholder for the rest */}
      <section className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/55">
          Contact info, allergies, photo consent, and household contacts will live here soon.
        </p>
      </section>
    </div>
  );
}

function PasswordPanel({ hasPassword, onChange }) {
  // 'idle' | 'editing' | 'saving' | 'saved' | 'error'
  const [phase, setPhase] = useState('idle');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const startEdit = () => {
    setPhase('editing');
    setPassword('');
    setConfirm('');
    setError('');
  };

  const cancel = () => {
    setPhase('idle');
    setPassword('');
    setConfirm('');
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setPhase('saving');
    setError('');

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message || 'Couldn’t save password.');
      setPhase('editing');
      return;
    }

    setPhase('saved');
    onChange(true); // mark as having a password
    setPassword('');
    setConfirm('');
    setTimeout(() => setPhase('idle'), 2200);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            <FaKey className="text-[10px]" />
            Sign-in password
          </p>
          <p className="mt-1.5 text-base font-medium text-white">
            {hasPassword ? 'Password is set' : 'Not set — email-code sign-in only'}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {hasPassword
              ? 'You can sign in with email + password, or keep using a code — both work.'
              : 'Add a password if you’d rather sign in without checking email each time.'}
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
          <FaCheckCircle className="text-[#ee2435]" />
          Password saved.
        </div>
      )}

      {(phase === 'editing' || phase === 'saving') && (
        <form onSubmit={save} className="mt-5 space-y-4 border-t border-white/8 pt-5" noValidate>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
              <FaLock className="text-[10px]" />
              New password
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
              <FaLock className="text-[10px]" />
              Confirm
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
              <FaExclamationCircle className="text-xs" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancel}
              disabled={phase === 'saving'}
              className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/75 hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={phase === 'saving' || !password || !confirm}
              className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
              }}
            >
              {phase === 'saving' ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
