'use client';

/**
 * Animated gradient-mesh background. Drop behind any hero section.
 * Uses three blurred radial blobs that drift on their own timers.
 *
 * Brand palette is red + black + white only — variants are different
 * red intensities/depths, never different hues.
 *
 * Props:
 *   variant: 'cherry' | 'fire' | 'blood' | 'noir'  — palette preset
 *   intensity: 0..1                                — opacity multiplier
 *   className: extra classes on the container
 */
export default function GradientMesh({
  variant = 'cherry',
  intensity = 1,
  className = '',
}) {
  const palettes = {
    cherry: ['#d1060f', '#ee2435', '#b00310'],   // bright reds
    fire:   ['#ee2435', '#d1060f', '#ff6b76'],   // hot, energetic
    blood:  ['#780f17', '#d1060f', '#910813'],   // deep, dramatic
    noir:   ['#d1060f', '#1c1c27', '#0a0a0f'],   // red over near-black
  };
  const [a, b, c] = palettes[variant] ?? palettes.cherry;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity: intensity }}
    >
      <div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${a} 0%, transparent 65%)`,
          animation: 'mesh-drift 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${b} 0%, transparent 65%)`,
          animation: 'mesh-drift 22s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute -bottom-1/4 left-1/3 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${c} 0%, transparent 65%)`,
          animation: 'mesh-drift 26s ease-in-out infinite',
        }}
      />
      {/* Subtle grain over the mesh */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />
    </div>
  );
}
