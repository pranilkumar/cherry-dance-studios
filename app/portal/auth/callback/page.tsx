'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../src/lib/supabaseClient';

/**
 * Magic link callback. Supabase auto-detects the access_token from the
 * URL hash on client init (detectSessionInUrl: true is the default).
 * We just wait a tick for the session to settle, then route.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Give the supabase client a moment to process the URL hash
      await new Promise((r) => setTimeout(r, 300));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        router.replace('/portal');
      } else {
        setError('Sign-in link expired or invalid. Please request a new one.');
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-6 text-white">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Hmm.
            </h1>
            <p className="mt-3 text-sm text-white/65">{error}</p>
            <Link
              href="/portal/login"
              className="mt-6 inline-block rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b00310]"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full w-1/3 animate-pulse rounded-full"
                style={{ background: 'linear-gradient(90deg, #d1060f, #ee2435)' }}
              />
            </div>
            <p className="mt-6 text-sm text-white/65">Signing you in…</p>
          </>
        )}
      </div>
    </main>
  );
}
