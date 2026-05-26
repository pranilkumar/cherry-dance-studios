'use client';

export default function PortalError({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0f] text-white">
      <p className="text-sm text-white/50">Something went wrong in the portal.</p>
      <p className="max-w-sm text-center text-xs text-red-400">{error?.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#d1060f] px-4 py-2 text-sm font-medium hover:bg-[#ee2435]"
      >
        Try again
      </button>
    </div>
  );
}
