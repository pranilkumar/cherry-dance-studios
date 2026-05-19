'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaLock } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal login — 6-digit code flow.
 *
 * Why not magic links?
 *   - Clicking the link opens a new tab / different browser, losing session.
 *   - Site URL mis-config sends people to localhost in prod (which is what
 *     was happening before).
 *   - Code-entry works on any device, no redirect dance.
 *
 * Supabase sends BOTH the link and a 6-digit code in the same email by
 * default. We only use the code here; the link still works if anyone clicks
 * it (the /portal/auth/callback route handles that case).
 */
export default function PortalLogin() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | verifying | error
  const [error, setError] = useState('');
  const codeInputRef = useRef(null);

  // Auto-focus the code input when it appears
  useEffect(() => {
    if (step === 'code' && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  const sendCode = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Keep this for parents who click the link — but the code path is primary.
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
            Parent portal.
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {step === 'email'
              ? 'Sign in to see your dancer’s classes, attendance, and fees.'
              : 'Almost there — enter the code we just emailed you.'}
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-9"
        >
          <AnimatePresence mode="wait">
            {step === 'email' && (
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
                    We&rsquo;ll email you a 6-digit code. No password needed.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
                    {error}
                  </div>
                )}

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

            {step === 'code' && (
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
                    6-digit code
                  </label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(v);
                      if (v.length === 6) {
                        // Auto-submit when 6 digits are entered
                        setTimeout(() => {
                          const form = e.target.form;
                          if (form) form.requestSubmit();
                        }, 50);
                      }
                    }}
                    placeholder="123456"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center font-mono text-3xl tracking-[0.4em] text-white placeholder:text-white/20 transition focus:border-[#ee2435] focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#d1060f]/20"
                  />
                  <p className="mt-2 text-xs text-white/45">
                    Sent to <strong className="text-white/75">{email}</strong>. It expires in 60 minutes.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/10 px-4 py-3 text-sm text-[#ee2435]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'verifying' || code.length !== 6}
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
