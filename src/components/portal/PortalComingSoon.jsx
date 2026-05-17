'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * Coming-soon placeholder for portal pages we haven't built yet.
 * Used by /portal/attendance, /portal/fees, /portal/workshops, /portal/profile.
 */
export default function PortalComingSoon({ title, eyebrow, sub }) {
  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          {eyebrow}
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white">
          {title}
        </h1>
      </header>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-white">
          Coming soon.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
          {sub}
        </p>
        <Link
          href="/portal"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 hover:border-white/30"
        >
          <FaArrowLeft className="text-xs" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
