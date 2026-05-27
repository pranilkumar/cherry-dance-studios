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
    let resolved = false;

    // Listen for the SIGNED_IN event that Supabase fires after it exchanges
    // the URL hash token — fires as soon as the exchange completes regardless
    // of network speed, so much more reliable than a fixed setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return;
      if (event === 'SIGNED_IN' && session) {
        resolved = true;
        router.replace('/portal');
      }
    });

    // Fast path: token may have been processed before our listener registered.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved && session) {
        resolved = true;
        router.replace('/portal');
      }
    });

    // Hard timeout: if no SIGNED_IN fires in 10 s the link is genuinely invalid.
    const fallback = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setError('Sign-in link expired or invalid. Please request a new one.');
      }
    }, 10_000);

    return () => {
      resolved = true;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
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
