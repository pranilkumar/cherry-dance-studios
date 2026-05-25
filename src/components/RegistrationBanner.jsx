'use client';

import { FaFire, FaArrowRight, FaTimes } from 'react-icons/fa';

/**
 * Registration-urgency modal — shown when showModalBanner is true in HomeClient.
 * Pure Tailwind, no react-bootstrap dependency.
 */
export default function RegistrationBanner({ show, onHide }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onHide}
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        style={{ background: 'linear-gradient(135deg, #d1060f 0%, #780f17 100%)' }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onHide}
          aria-label="Close banner"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white/75 transition hover:bg-white/25 hover:text-white"
        >
          <FaTimes className="text-xs" />
        </button>

        <div className="px-8 py-10">
          {/* Icon + headline */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <FaFire className="text-3xl text-yellow-300" />
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Few Slots Left!
            </h2>
          </div>

          {/* Body */}
          <p className="mx-auto max-w-xs text-base leading-relaxed text-white/90">
            Don&rsquo;t miss out on your chance to join our vibrant dance community.
            Secure your spot today!
          </p>

          {/* CTA */}
          <a
            href="#register"
            onClick={onHide}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#d1060f] transition hover:bg-white/90 active:scale-95"
          >
            Register Now <FaArrowRight className="text-xs" />
          </a>
        </div>
      </div>
    </div>
  );
}
