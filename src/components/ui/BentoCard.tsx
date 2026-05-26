'use client';

import { motion } from 'framer-motion';

/**
 * Bento-grid card with gradient backdrop, glow on hover, and tilt.
 * Designed to be composed in a CSS grid.
 *
 * Props:
 *   gradient: 'cherry' | 'cosmic' | 'sunset' | 'fire' | 'ink' (default)
 *   span: { col?: 1|2|3, row?: 1|2 } — grid span shorthand
 *   glow: boolean — add pulsing glow shadow
 *   onClick / href: optional interactivity
 *   children
 */
// Red + black gradient presets — brand stays red/black/white.
const gradients = {
  cherry: 'linear-gradient(135deg, #d1060f 0%, #ee2435 100%)',
  fire:   'linear-gradient(135deg, #b00310 0%, #ee2435 60%, #ff6b76 100%)',
  blood:  'linear-gradient(135deg, #780f17 0%, #d1060f 100%)',
  noir:   'linear-gradient(135deg, #0a0a0f 0%, #780f17 80%, #d1060f 100%)',
  ink:    'linear-gradient(135deg, #12121a 0%, #1c1c27 100%)',
};

const spanCol = { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3' };
const spanRow = { 1: 'md:row-span-1', 2: 'md:row-span-2' };

export default function BentoCard({
  gradient = 'ink',
  span = {},
  glow = false,
  className = '',
  href = undefined,
  onClick = undefined,
  children,
}: {
  gradient?: string;
  span?: any;
  glow?: boolean;
  className?: string;
  href?: string;
  onClick?: (...args: any[]) => any;
  children?: any;
}) {
  const Wrapper = href ? motion.a : motion.div;
  const interactive = !!(href || onClick);

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      whileHover={interactive ? { y: -6, scale: 1.01 } : undefined}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative overflow-hidden rounded-3xl p-8
        ${spanCol[span.col] ?? ''} ${spanRow[span.row] ?? ''}
        ${interactive ? 'cursor-pointer' : ''}
        ${glow ? 'shadow-[0_8px_40px_rgba(255,27,107,0.35)]' : 'shadow-[0_8px_32px_rgba(10,10,15,0.18)]'}
        ${className}
      `}
      style={{ background: gradients[gradient] }}
    >
      {/* Inner light ring for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            'radial-gradient(circle at 30% 0%, rgba(255,255,255,0.18), transparent 50%)',
        }}
      />
      <div className="relative z-10 text-white">{children}</div>
    </Wrapper>
  );
}
