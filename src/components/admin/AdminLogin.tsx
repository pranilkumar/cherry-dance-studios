'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaLock, FaUser, FaArrowRight } from 'react-icons/fa';

/**
 * Admin login. Same localStorage-based gate as before, modernized UI.
 * Dark background with brand-red accent — feels like an extension of the
 * public site instead of a stock Bootstrap card.
 */

export default function AdminLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Session is now stored in an httpOnly cookie set by the API route —
        // no localStorage needed. Just navigate to the dashboard.
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
      setLoading(false);
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
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d1060f] text-white shadow-[0_12px_40px_rgba(209,6,15,0.45)]">
            <FaLock className="text-2xl" />
          </div>
          <p className="mt-6 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.35em] text-white/65">
            Cherry{' '}
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Dance Studios
            </span>
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Sign in to manage workshops, students, and fees.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-9">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
                <FaUser className="text-[10px]" />
                Email
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
                placeholder="admin@cherrydance.com"
                autoComplete="email"
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
                value={credentials.password}
                onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
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
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.45)] transition hover:shadow-[0_12px_32px_rgba(209,6,15,0.6)] disabled:opacity-60 disabled:shadow-none"
              style={{
                background:
                  'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
              {!loading && (
                <FaArrowRight className="text-sm transition group-hover:translate-x-0.5" />
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Studio staff only. Lost access? Email{' '}
          <a
            href="mailto:cherrydancestudio.cds@gmail.com"
            className="text-white/65 underline-offset-4 hover:text-white hover:underline"
          >
            cherrydancestudio.cds@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
