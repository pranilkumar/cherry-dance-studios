'use client';

import { motion } from 'framer-motion';

/**
 * Scattered, slowly drifting dance terms used as a background layer.
 * Sits absolutely over a dark surface — the hero, mainly. Words use
 * very low opacity and a deterministic pseudo-random layout (so the
 * positions look organic but render the same on SSR + client, avoiding
 * hydration mismatch).
 *
 * Props:
 *   terms: string[] override
 *   density: 'low' | 'medium' (default) | 'high'
 *   className: extra classes on the wrapper
 */
const DEFAULT_TERMS = [
  'Thumka', 'Bhangra', 'Jhatka', 'Kathak', 'Latka',
  'Garba', 'Mudra', 'Chakkar', 'Slay', 'Groove',
  'Spin', 'Drop', 'Flow', 'Wave', 'Crew',
];

// Cheap deterministic pseudo-random so words don't shift between
// SSR and client (avoids React hydration warnings).
const seeded = (i) => {
  const x = Math.sin(i * 9301 + 49297) * 0.5 + 0.5;
  return x - Math.floor(x);
};

const densityCount = { low: 8, medium: 14, high: 20 };

export default function DanceWordsBackdrop({
  terms = DEFAULT_TERMS,
  density = 'medium',
  className = '',
}) {
  const count = densityCount[density] ?? densityCount.medium;
  const items = Array.from({ length: count }, (_, i) => {
    const term = terms[i % terms.length];
    return {
      term,
      top: `${4 + seeded(i * 1.3) * 88}%`,
      left: `${3 + seeded(i * 2.7) * 90}%`,
      size: 0.8 + seeded(i * 3.1) * 1.4, // rem
      rot: -8 + seeded(i * 4.7) * 16,    // deg
      delay: seeded(i * 5.2) * 6,
      dur: 8 + seeded(i * 6.5) * 6,
      drift: 8 + seeded(i * 7.1) * 14,   // px of drift
    };
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute select-none font-[family-name:var(--font-display)] font-bold uppercase tracking-tight text-white"
          style={{
            top: it.top,
            left: it.left,
            fontSize: `${it.size}rem`,
            transform: `rotate(${it.rot}deg)`,
            opacity: 0.06 + seeded(i * 8.3) * 0.06, // 0.06–0.12
            textShadow: '0 0 24px rgba(209, 6, 15, 0.25)',
          }}
          animate={{
            y: [-it.drift, it.drift, -it.drift],
            opacity: [0.05, 0.14, 0.05],
          }}
          transition={{
            duration: it.dur,
            delay: it.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {it.term}
        </motion.span>
      ))}
    </div>
  );
}
