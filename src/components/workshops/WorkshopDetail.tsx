'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaCheck,
} from 'react-icons/fa';
import { GlowButton } from '../ui';
import {
  formatWorkshopDate,
  formatPackageRange,
  formatPrice,
} from '../../lib/workshops';

/**
 * /workshops/[slug] detail page. Hero with cover image + meta + packages +
 * registration CTA. Read-only — registration handled on the /register subroute.
 */
export default function WorkshopDetail({ workshop }) {
  const {
    slug,
    title,
    subtitle,
    description,
    cover_image_url,
    starts_at,
    ends_at,
    venue_name,
    venue_address,
    instructor_names,
    capacity,
    registered_count,
    status,
    packages = [],
    perks = [],
    payment_info,
  } = workshop;

  const isSoldOut = status === 'sold_out' || (capacity > 0 && registered_count >= capacity);
  const isCompleted = status === 'completed';
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - registered_count) : null;
  const fillPct = capacity > 0 ? Math.min(100, (registered_count / capacity) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-24 md:pt-28">
        {/* Cover or gradient background */}
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-[#780f17] via-[#d1060f] to-[#ee2435] md:aspect-[21/8]">
          {cover_image_url ? (
            <img
              src={cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/55 to-transparent"
          />
        </div>

        {/* Title block sitting over the bottom of the hero image */}
        <div className="relative -mt-32 px-6 md:-mt-44">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/workshops"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0a0a0f]/60 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-white/30 hover:text-white"
            >
              <FaArrowLeft className="text-[10px]" />
              All workshops
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 font-[family-name:var(--font-display)] font-bold leading-[0.95] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
            >
              {title}
            </motion.h1>

            {subtitle && (
              <p className="mt-4 max-w-2xl text-lg text-white/75 md:text-xl">
                {subtitle}
              </p>
            )}

            {/* Detail pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-7 flex flex-wrap gap-2.5"
            >
              <DetailPill icon={FaCalendarAlt} text={formatWorkshopDate(starts_at)} />
              {ends_at && (
                <DetailPill
                  icon={FaClock}
                  text={`Until ${new Intl.DateTimeFormat('en-CA', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }).format(new Date(ends_at))}`}
                />
              )}
              {venue_name && (
                <DetailPill icon={FaMapMarkerAlt} text={venue_address || venue_name} />
              )}
              {isSoldOut && !isCompleted && (
                <DetailPill icon={FaUsers} text="Sold out" highlight />
              )}
              {isCompleted && <DetailPill text="Past event" muted />}
            </motion.div>

            {/* Instructors */}
            {instructor_names?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6 font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.25em] text-white/55 md:text-sm"
              >
                With{' '}
                <span className="text-white">
                  {instructor_names.join(' · ')}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* BODY — description + packages */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Description + perks */}
          <div>
            {description && (
              <div className="prose prose-invert max-w-none">
                <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.25em] text-[#ee2435]">
                  About this workshop
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/80 md:text-lg">
                  {description}
                </div>
              </div>
            )}

            {perks.length > 0 && (
              <div className="mt-10">
                <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.25em] text-[#ee2435]">
                  What&rsquo;s included
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {perks.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-white/80">
                      <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[#d1060f]/15 text-[#ee2435]">
                        <FaCheck className="text-[10px]" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pricing + CTA */}
          <aside>
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md md:p-7">
              <div className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.25em] text-[#ee2435]">
                Pricing
              </div>

              {packages.length > 0 ? (
                <>
                  <div className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white md:text-4xl">
                    {formatPackageRange(packages)}
                  </div>

                  <ul className="mt-5 space-y-3 border-t border-white/10 pt-5">
                    {packages.map((pkg) => (
                      <li
                        key={pkg.id || pkg.label}
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-white">{pkg.label}</p>
                          {pkg.desc && (
                            <p className="mt-0.5 text-xs text-white/55">
                              {pkg.desc}
                            </p>
                          )}
                        </div>
                        <span className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                          {formatPrice(pkg.price_cents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-white/65">Contact us for pricing.</p>
              )}

              {/* Capacity bar — hidden from public; sold-out state shown in header pill */}
              {false && capacity > 0 && !isCompleted && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between text-xs text-white/65">
                    <span>{registered_count} booked</span>
                    <span>{capacity} total</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#d1060f] to-[#ee2435]"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-7">
                {isCompleted ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm text-white/65">
                    This workshop has already taken place.
                  </div>
                ) : isSoldOut ? (
                  <div>
                    <div className="rounded-xl border border-[#d1060f]/30 bg-[#d1060f]/[0.08] p-4 text-center text-sm font-semibold text-[#ee2435]">
                      Sold out
                    </div>
                    {workshop.waitlist_enabled && (
                      <div className="mt-3 text-center">
                        <Link
                          href={`/workshops/${slug}/waitlist`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white"
                        >
                          Join the waitlist
                          <FaArrowRight className="text-xs" />
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={`/workshops/${slug}/register`} passHref legacyBehavior>
                    <GlowButton
                      variant="primary"
                      size="lg"
                      icon={<FaArrowRight />}
                      className="w-full justify-center"
                    >
                      Register now
                    </GlowButton>
                  </Link>
                )}
              </div>

              {payment_info && !isCompleted && !isSoldOut && (
                <p className="mt-4 text-center text-xs text-white/45">
                  {payment_info}
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function DetailPill({ icon: Icon = undefined, text, highlight = false, muted = false }: { icon?: any; text: any; highlight?: any; muted?: any }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-md ${
        highlight
          ? 'border-[#d1060f]/40 bg-[#d1060f]/10 text-[#ee2435]'
          : muted
          ? 'border-white/10 bg-white/[0.03] text-white/55'
          : 'border-white/15 bg-white/5 text-white/85'
      }`}
    >
      {Icon && <Icon className="text-xs text-[#ee2435]" />}
      {text}
    </span>
  );
}
