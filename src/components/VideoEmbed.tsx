'use client';

import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';

/**
 * Lazy-loaded YouTube embed — pure Tailwind, no external CSS.
 *
 * Shows a clickable thumbnail with a brand-red play button;
 * on click the iframe swaps in with autoplay.
 *
 * YouTube offers two thumbnail resolutions:
 *   maxresdefault (1280 × 720) — not always available for older videos.
 *   hqdefault     (480 × 360)  — always available, used as fallback.
 */
export default function VideoEmbed({ videoId, title, featured = false }) {
  const [loaded, setLoaded] = useState(false);

  const thumbMax = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const thumbFb  = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0a0f]">
      {!loaded ? (
        <button
          type="button"
          className="absolute inset-0 w-full cursor-pointer"
          onClick={() => setLoaded(true)}
          aria-label={`Play: ${title}`}
        >
          {/* Thumbnail — scales slightly on hover */}
          <img
            src={thumbMax}
            alt={title}
            loading="lazy"
            width={480}
            height={360}
            onError={(e) => { e.currentTarget.src = thumbFb; }}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />

          {/* Gradient overlay — top edge subtle, bottom edge strong */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20"
          />

          {/* Brand-red play button */}
          <div
            aria-hidden
            className={[
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'flex items-center justify-center rounded-full bg-[#d1060f] text-white',
              'shadow-[0_0_28px_rgba(209,6,15,0.5)]',
              'transition duration-300 ease-out',
              'group-hover:scale-110 group-hover:bg-[#ee2435]',
              'group-hover:shadow-[0_0_52px_rgba(238,36,53,0.65)]',
              featured ? 'h-16 w-16' : 'h-12 w-12',
            ].join(' ')}
          >
            <FaPlay className={`ml-1 ${featured ? 'text-xl' : 'text-sm'}`} />
          </div>

          {/* Title label — glides up from the bottom on hover */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 translate-y-1 px-4 pb-4 opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
          >
            <p className="line-clamp-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              {title}
            </p>
          </div>
        </button>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
