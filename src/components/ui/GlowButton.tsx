'use client';

import { motion } from 'framer-motion';

/**
 * Bold pill button with gradient fill, glow, and shimmer-on-hover.
 *
 * Props:
 *   variant: 'primary' (cherry gradient) | 'ghost' (transparent + border) | 'dark'
 *   size: 'sm' | 'md' | 'lg'
 *   href / onClick / type
 *   icon: optional leading or trailing react node (set iconPosition)
 */
export default function GlowButton({
  variant = 'primary',
  size = 'md',
  href = undefined,
  onClick = undefined,
  type = 'button',
  disabled = false,
  icon = null,
  iconPosition = 'right',
  className = '',
  children,
}: {
  variant?: string;
  size?: string;
  href?: string;
  onClick?: (...args: any[]) => any;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: any;
  iconPosition?: string;
  className?: string;
  children?: any;
}) {
  const sizes = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-9 py-4.5 text-lg',
  };

  const variants = {
    primary: {
      base:
        'text-white shadow-[0_8px_32px_rgba(209,6,15,0.5)] hover:shadow-[0_12px_48px_rgba(209,6,15,0.7)]',
      style: {
        background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
        backgroundSize: '200% 200%',
      },
    },
    ghost: {
      base:
        'text-[var(--color-ink-900,#0a0a0f)] border border-[var(--color-ink-200,#d2d2dc)] hover:border-[var(--color-cherry-500,#ee2435)] hover:text-[var(--color-cherry-600,#d1060f)]',
      style: { background: 'transparent' },
    },
    dark: {
      base:
        'text-white shadow-[0_8px_32px_rgba(10,10,15,0.4)]',
      style: { background: '#0a0a0f' },
    },
  };

  const v = variants[variant] ?? variants.primary;
  const Tag = href ? motion.a : motion.button;

  return (
    <Tag
      href={href}
      onClick={onClick}
      type={href ? undefined : type}
      whileHover={{ scale: 1.03, backgroundPosition: '100% 50%' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`
        inline-flex items-center justify-center gap-2.5
        rounded-full font-semibold tracking-tight no-underline
        font-[family-name:var(--font-sans)]
        transition-shadow
        ${sizes[size]} ${v.base} ${className}
      `}
      style={{ ...v.style, textDecoration: 'none' }}
    >
      {icon && iconPosition === 'left' && <span className="flex">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex">{icon}</span>}
    </Tag>
  );
}
