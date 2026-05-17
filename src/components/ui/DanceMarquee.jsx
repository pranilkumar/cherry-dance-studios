'use client';

/**
 * Two-row scrolling marquee of dance vocabulary. Pure-CSS animation (no JS
 * frame work) — duplicated content, translateX from 0 to -50%, infinite.
 *
 * Brand-neutral by default: black band with white text and red star
 * separators. Pass tone="invert" for a red band with white text.
 *
 * Props:
 *   terms: optional override of the vocabulary list (string[])
 *   tone:  'dark' (default) | 'red' | 'light'
 *   rows:  1 | 2 (default)
 *   speed: seconds for one full cycle (default 32 — slower = subtler)
 */
const DEFAULT_TERMS = [
  'Thumka', 'Bhangra', 'Jhatka', 'Kathak', 'Latka', 'Garba', 'Mudra',
  'Lavni', 'Dandiya', 'Chakkar', 'Giddha', 'Mujra', 'Tatkar', 'Aasman',
  'Slay', 'Groove', 'Spin', 'Wave', 'Drop', 'Flow', 'Crew', 'Move', 'Vibe',
];

const tones = {
  dark: {
    band: 'bg-[#0a0a0f] text-white',
    sep:  'text-[#d1060f]',
  },
  red: {
    band: 'bg-[#d1060f] text-white',
    sep:  'text-white/80',
  },
  light: {
    band: 'bg-white text-[#0a0a0f] border-y border-[#0a0a0f]/10',
    sep:  'text-[#d1060f]',
  },
};

export default function DanceMarquee({
  terms = DEFAULT_TERMS,
  tone = 'dark',
  rows = 2,
  speed = 32,
  className = '',
}) {
  const t = tones[tone] ?? tones.dark;

  // Render one row's content twice so the loop is seamless.
  const Row = ({ reverse, durationMul = 1 }) => (
    <div className="overflow-hidden">
      <div
        className="flex w-max gap-8 whitespace-nowrap py-4"
        style={{
          animation: `${
            reverse ? 'marquee-scroll-x-reverse' : 'marquee-scroll-x'
          } ${speed * durationMul}s linear infinite`,
        }}
      >
        {[...terms, ...terms].map((term, i) => (
          <span
            key={i}
            className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight md:text-5xl"
          >
            {term}
            <span className={`mx-6 ${t.sep}`} aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${t.band} ${className}`}
    >
      <Row reverse={false} />
      {rows === 2 && <Row reverse durationMul={1.4} />}

      {/* Soft side fades */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24"
        style={{
          background:
            tone === 'light'
              ? 'linear-gradient(to right, white, transparent)'
              : tone === 'red'
              ? 'linear-gradient(to right, #d1060f, transparent)'
              : 'linear-gradient(to right, #0a0a0f, transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24"
        style={{
          background:
            tone === 'light'
              ? 'linear-gradient(to left, white, transparent)'
              : tone === 'red'
              ? 'linear-gradient(to left, #d1060f, transparent)'
              : 'linear-gradient(to left, #0a0a0f, transparent)',
        }}
      />
    </div>
  );
}
