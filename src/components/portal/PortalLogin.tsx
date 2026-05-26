'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaLock, FaKey } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal login — dual-mode.
 *
 * Two sign-in paths, parent picks via a tab toggle at the top:
 *
 *   1. "Email code" (default)  — email + 6-digit OTP, no password needed.
 *      Same flow as before; this is the first-time path for everyone since
 *      we don't ask for a password during admin-driven Convert.
 *
 *   2. "Password"              — email + password (supabase.auth.signInWithPassword).
 *      Parents opt into this from the Profile page after their first
 *      sign-in. Once set, they can pick either tab on future visits.
 *
 * The last-used mode is remembered in localStorage so the next visit
 * starts on the same tab.
 */

const MODE_KEY = 'cds_login_mode';

export default function PortalLogin() {
  const router = useRouter();

  const [mode, setMode] = useState('code'); // 'code' | 'password'
  const [step, setStep] = useState('email'); // 'email' | 'code'  (only used in code mode)
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | verifying | resetting | error
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); // non-error messages (e.g. "reset email sent")
  const codeInputRef = useRef(null);

  // Restore last-used mode on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(MODE_KEY);
    if (saved === 'password' || saved === 'code') setMode(saved);
  }, []);

  // Persist mode whenever it changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  // Auto-focus the OTP input when it appears.
  useEffect(() => {
    if (mode === 'code' && step === 'code' && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [mode, step]);

  // ── Code mode ────────────────────────────────────────────────────
  const sendCode = async (e?: any) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError('');
    setInfo('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/portal/auth/callback`
            : undefined,
      },
    });

    if (err) {
      setError(err.message);
      setStatus('error');
    } else {
      setStep('code');
      setStatus('idle');
    }
  };

  const verifyCode = async (e) => {
    if (e) e.preventDefault();
    const token = code.replace(/\s/g, '').trim();
    if (token.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setStatus('verifying');
    setError('');

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });

    if (err) {
      setError(err.message || 'That code didn’t match. Try again.');
      setStatus('error');
    } else {
      router.push('/portal');
    }
  };

  const resendCode = async () => {
    setCode('');
    setError('');
    await sendCode();
  };

  // ── Password mode ────────────────────────────────────────────────
  const signInWithPassword = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus('verifying');
    setError('');
    setInfo('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (err) {
      setError(
        err.message?.includes('Invalid')
          ? 'Email or password isn’t right. Try again, or use a code instead.'
          : err.message || 'Sign-in failed. Try again.'
      );
      setStatus('error');
    } else {
      router.push('/portal');
    }
  };

  const sendPasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email first, then click Forgot password?');
      return;
    }
    setStatus('resetting');
    setError('');
    setInfo('');

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/portal/auth/reset-password`
            : undefined,
      }
    );

    if (err) {
      setError(err.message || 'Couldn’t send reset email.');
      setStatus('error');
    } else {
      setInfo(`Sent a password-reset link to ${email}. Check your inbox.`);
      setStatus('idle');
    }
  };

  // ── Mode-switch helper — clear ephemeral form state on switch. ──
  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setStep('email');
    setCode('');
    setPassword('');
    setError('');
    setInfo('');
    setStatus('idle');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] px-6 py-16 text-white">
      {/* Red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(209,6,15,0.28) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.35em] text-white/65">
            Cherry{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Dance Studios
            </span>
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            Sign in.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {mode === 'code' && step === 'code'
              ? 'Almost there — enter the code we just emailed you.'
              : mode === 'password'
              ? 'Sign in with your email and password.'
              : 'Sign in to see your dancer’s classes, attendance, and workshops.'}
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-9"
        >
          {/* Mode tabs — hidden during the code-entry step so the layout
              stays focused on the OTP input. */}
          {!(mode === 'code' && step === 'code') && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => switchMode('code')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  mode === 'code'
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <FaEnvelope className="text-[10px]" />
                Email code
              </button>
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  mode === 'password'
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                <FaKey className="text-[10px]" />
                Password
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* CODE MODE — step 1: email */}
            {mode === 'code' && step === 'email' && (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                onSubmit={sendCode}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                    <FaEnvelope className="text-[10px]" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                  />
                  <p className="mt-2 text-xs text-white/45">
                    We&rsquo;ll email you a sign-in code. No password needed.
                  </p>
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <button
                  type="submit"
                  disabled={status === 'sending' || !email.trim()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] transition hover:shadow-[0_12px_32px_rgba(209,6,15,0.6)] disabled:opacity-60 disabled:shadow-none"
                  style={{
                    background:
                      'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                  }}
                >
                  {status === 'sending' ? 'Sending…' : 'Email me a code'}
                  {status !== 'sending' && (
                    <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
                  )}
                </button>
              </motion.form>
            )}

            {/* CODE MODE — step 2: enter code */}
            {mode === 'code' && step === 'code' && (
              <motion.form
                key="code-step"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={verifyCode}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                    <FaLock className="text-[10px]" />
                    Sign-in code
                  </label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setCode(v);
                      // Supabase OTPs are 6 OR 8 digits depending on project
                      // config — auto-submit when the input lands on either.
                      if (v.length === 6 || v.length === 8) {
                        setTimeout(() => {
                          const form = e.target.form;
                          if (form) form.requestSubmit();
                        }, 50);
                      }
                    }}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center font-mono text-3xl tracking-[0.35em] text-white placeholder:text-white/20 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                  />
                  <p className="mt-2 text-xs text-white/45">
                    Sent to <strong className="text-white/75">{email}</strong>. It expires in 24 hours.
                  </p>
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <button
                  type="submit"
                  disabled={status === 'verifying' || (code.length !== 6 && code.length !== 8)}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] transition hover:shadow-[0_12px_32px_rgba(209,6,15,0.6)] disabled:opacity-60 disabled:shadow-none"
                  style={{
                    background:
                      'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                  }}
                >
                  {status === 'verifying' ? 'Verifying…' : 'Sign in'}
                  {status !== 'verifying' && (
                    <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
                  )}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                    }}
                    className="flex items-center gap-1.5 text-white/55 hover:text-white"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={status === 'sending'}
                    className="text-white/55 hover:text-white disabled:opacity-50"
                  >
                    {status === 'sending' ? 'Sending…' : 'Resend code'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* PASSWORD MODE — single step */}
            {mode === 'password' && (
              <motion.form
                key="password-form"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={signInWithPassword}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                    <FaEnvelope className="text-[10px]" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                    <FaLock className="text-[10px]" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                  />
                  <p className="mt-2 text-xs text-white/45">
                    Haven&rsquo;t set a password yet? Use the <button type="button" onClick={() => switchMode('code')} className="text-white/75 underline-offset-4 hover:text-white hover:underline">Email code</button> tab — you can add a password from your profile after signing in.
                  </p>
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}
                {info && <InfoBanner>{info}</InfoBanner>}

                <button
                  type="submit"
                  disabled={status === 'verifying' || !email.trim() || !password}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] transition hover:shadow-[0_12px_32px_rgba(209,6,15,0.6)] disabled:opacity-60 disabled:shadow-none"
                  style={{
                    background:
                      'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                  }}
                >
                  {status === 'verifying' ? 'Signing in…' : 'Sign in'}
                  {status !== 'verifying' && (
                    <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
                  )}
                </button>

                <div className="text-center text-xs">
                  <button
                    type="button"
                    onClick={sendPasswordReset}
                    disabled={status === 'resetting'}
                    className="text-white/55 hover:text-white disabled:opacity-50"
                  >
                    {status === 'resetting' ? 'Sending…' : 'Forgot password?'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/40">
          Don&rsquo;t have an account?{' '}
          <Link href="/register" className="text-white/75 underline-offset-4 hover:text-white hover:underline">
            Enrol your dancer
          </Link>{' '}
          first.
        </p>
        <p className="mt-2 text-center text-xs text-white/40">
          <Link href="/" className="text-white/55 underline-offset-4 hover:text-white hover:underline">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}

function ErrorBanner({ children }) {
  return (
    <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
      {children}
    </div>
  );
}

function InfoBanner({ children }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white/85">
      {children}
    </div>
  );
}
