'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import {
  formatWorkshopDate,
  formatPackageRange,
} from '../../lib/workshops';

/**
 * Workshop card used on /workshops list. Image + meta + price + status pill.
 */
export default function WorkshopCard({ workshop, index = 0 }) {
  const {
    slug,
    title,
    subtitle,
    cover_image_url,
    starts_at,
    instructor_names,
    capacity,
    registered_count,
    status,
    featured,
    packages,
  } = workshop;

  const isSoldOut = status === 'sold_out';
  const isCompleted = status === 'completed';
  const isFull = capacity > 0 && registered_count >= capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: '-50px' }}
    >
      <Link
        href={`/workshops/${slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:border-white/25"
      >
        {/* Cover */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#780f17] via-[#d1060f] to-[#ee2435]">
          {cover_image_url ? (
            <img
              src={cover_image_url}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            // Gradient fallback when no image is set yet
            <div className="absolute inset-0 grid place-items-center">
              <div className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white/85 md:text-5xl">
                {title?.charAt(0) ?? 'W'}
              </div>
            </div>
          )}

          {/* Status overlays */}
          {(isSoldOut || isFull) && !isCompleted && (
            <span className="absolute right-3 top-3 rounded-full bg-[#0a0a0f]/85 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              Sold out
            </span>
          )}
          {isCompleted && (
            <span className="absolute right-3 top-3 rounded-full bg-[#0a0a0f]/85 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
              Past
            </span>
          )}
          {featured && !isSoldOut && !isCompleted && !isFull && (
            <span className="absolute left-3 top-3 rounded-full bg-[#d1060f] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white">
              Featured
            </span>
          )}

          {/* Dark gradient bottom for text legibility */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-transparent"
          />
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#ee2435]">
            <FaCalendarAlt className="text-[10px]" />
            {formatWorkshopDate(starts_at)}
          </div>

          <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1.5 text-sm text-white/65 md:text-base">{subtitle}</p>
          )}

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              {instructor_names?.length > 0 && (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  with {instructor_names.join(' · ')}
                </p>
              )}
              {packages?.length > 0 && (
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {formatPackageRange(packages)}
                </p>
              )}
            </div>
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/20 text-white transition group-hover:border-[#d1060f] group-hover:bg-[#d1060f]">
              <FaArrowRight className="text-xs" />
            </span>
          </div>

          {/* Sold-out indicator — spots count hidden from public */}
          {(isSoldOut || isFull) && !isCompleted && (
            <div className="mt-5">
              <span className="flex items-center gap-1.5 text-[0.7rem] text-[#ee2435]">
                <FaUsers className="text-[10px]" /> Sold out
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
