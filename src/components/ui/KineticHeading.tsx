'use client';

import { motion } from 'framer-motion';

/**
 * Kinetic display heading. Splits text into words/chars and animates
 * each one in with a stagger. Use for hero and section titles.
 *
 * Props:
 *   children: the text (string)
 *   as: heading tag, default 'h1'
 *   split: 'word' | 'char'  — granularity of animation
 *   gradient: 'cherry' | 'cosmic' | 'sunset' | 'fire' | null
 *   className: extra classes
 */
export default function KineticHeading({
  children,
  as: Tag = 'h1' as any,
  split = 'word',
  gradient = null,
  className = '',
}: {
  children?: any;
  as?: any;
  split?: string;
  gradient?: string | null;
  className?: string;
}) {
  const text = typeof children === 'string' ? children : '';
  const tokens =
    split === 'char' ? text.split('') : text.split(/(\s+)/);

  // Red-only gradient presets — brand stays red/black/white.
  const gradients = {
    cherry: 'linear-gradient(135deg, #d1060f 0%, #ee2435 100%)',
    fire:   'linear-gradient(135deg, #b00310 0%, #ee2435 50%, #ff6b76 100%)',
    blood:  'linear-gradient(135deg, #780f17 0%, #d1060f 100%)',
  };

  const gradientStyle = gradient
    ? {
        background: gradients[gradient],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : {};

  return (
    <Tag
      className={`font-[family-name:var(--font-display)] font-bold leading-[1.02] tracking-[-0.03em] ${className}`}
      style={gradientStyle}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-block">
        {tokens.map((tok, i) => {
          if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
          return (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: i * (split === 'char' ? 0.025 : 0.06),
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {tok}
            </motion.span>
          );
        })}
      </span>
    </Tag>
  );
}
