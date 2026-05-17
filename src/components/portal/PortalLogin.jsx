'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/**
 * Parent portal login — magic link via email.
 * No password to manage. Parents enter email → click link in inbox → in.
 */
export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/portal/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
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
            Sign in to see your dancer&rsquo;s classes, attendance, and fees.
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-9"
        >
          {status === 'sent' ? (
            <SentState email={email} onChangeEmail={() => setStatus('idle')} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  We&rsquo;ll send a one-click sign-in link to your inbox.
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
                {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
                {status !== 'sending' && (
                  <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
                )}
              </button>
            </form>
          )}
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

function SentState({ email, onChangeEmail }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_40px_rgba(209,6,15,0.45)]"
      >
        <FaCheckCircle className="text-2xl" />
      </motion.div>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
        Check your inbox.
      </h2>
      <p className="mt-3 text-sm text-white/65">
        We&rsquo;ve sent a sign-in link to{' '}
        <strong className="text-white">{email}</strong>. Click it and you&rsquo;ll
        be redirected back here.
      </p>
      <p className="mt-3 text-xs text-white/45">
        Didn&rsquo;t arrive? Check spam, or{' '}
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-white underline-offset-4 hover:underline"
        >
          try a different email
        </button>
        .
      </p>
    </div>
  );
}
