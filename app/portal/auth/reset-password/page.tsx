'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaLock, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '../../../../src/lib/supabaseClient';

/**
 * Reset-password landing page.
 *
 * Flow:
 *   1. Parent clicks "Reset password" link in their email.
 *   2. Supabase redirects them here with a recovery token in the URL.
 *   3. The Supabase client auto-detects the token (detectSessionInUrl: true)
 *      and creates a temporary recovery session.
 *   4. We show a "set new password" form, call updateUser({ password }), then
 *      route to /portal.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('checking'); // checking | ready | saving | done | error
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  // On mount, wait for Supabase to consume the recovery token from the URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 400));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setPhase('ready');
      } else {
        setPhase('error');
        setError('Reset link expired or invalid. Request a new one from the sign-in page.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async (e) => {
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
      setError(err.message || 'Couldn’t update password.');
      setPhase('ready');
      return;
    }

    setPhase('done');
    setTimeout(() => router.replace('/portal'), 1200);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] px-6 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(209,6,15,0.28) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.35em] text-white/65">
            Cherry{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Dance Studios
            </span>
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            {phase === 'done' ? 'All set.' : 'Set a new password.'}
          </h1>
          {phase !== 'done' && (
            <p className="mt-2 text-sm text-white/55">
              Pick something at least 8 characters. You&rsquo;ll use it the next time you sign in.
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-9"
        >
          {phase === 'checking' && (
            <p className="py-6 text-center text-sm text-white/55">Checking your reset link…</p>
          )}

          {phase === 'error' && (
            <>
              <p className="text-sm text-[#ee2435]">{error}</p>
              <Link
                href="/portal/login"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                }}
              >
                Back to sign in
              </Link>
            </>
          )}

          {phase === 'done' && (
            <div className="py-6 text-center">
              <FaCheckCircle className="mx-auto mb-3 text-3xl text-[#ee2435]" />
              <p className="text-sm text-white/80">Password updated. Signing you in…</p>
            </div>
          )}

          {(phase === 'ready' || phase === 'saving') && (
            <form onSubmit={submit} className="space-y-5" noValidate>
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
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                  <FaLock className="text-[10px]" />
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={phase === 'saving' || !password || !confirm}
                className="group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white transition disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                }}
              >
                {phase === 'saving' ? 'Saving…' : 'Save password'}
                {phase !== 'saving' && (
                  <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
                )}
              </button>
            </form>
          )}
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link href="/portal/login" className="text-white/55 underline-offset-4 hover:text-white hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
