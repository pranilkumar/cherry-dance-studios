'use client';

import { motion } from 'framer-motion';
import { FaGoogle, FaInstagram, FaStar } from 'react-icons/fa';

// Update GOOGLE_REVIEW_URL to your Google Business "write a review" link
// Get it from: Google Business Profile → "Get more reviews" → "Share review form"
const GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/search/Cherry+Dance+Studios+Barrhaven+Ottawa';

export default function LeaveReview() {
  return (
    <section className="overflow-hidden bg-[#0d0d15] py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-[#ee2435]">
            Reviews
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-bold leading-[1] tracking-[-0.04em] text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Love dancing with us?
            <br />
            <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
              Tell the world.
            </span>
          </h2>
        </motion.div>

        {/* Two cards side by side */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Google review card */}
          <motion.a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition hover:border-[#d1060f]/40 hover:bg-[#d1060f]/[0.06]"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <FaGoogle className="text-lg text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Google</p>
                  <div className="flex gap-0.5 text-[#ee2435]">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[10px]" />)}
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/55">
                Share your experience on Google — it helps other Ottawa families discover
                Cherry Dance Studios.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#ee2435] transition group-hover:gap-3">
              Leave a Google review <span>→</span>
            </div>
          </motion.a>

          {/* Instagram card */}
          <motion.a
            href="https://www.instagram.com/cherrydancestudios/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition hover:border-[#d1060f]/40 hover:bg-[#d1060f]/[0.06]"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <FaInstagram className="text-lg text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Instagram</p>
                  <p className="text-xs text-white/40">@cherrydancestudios</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/55">
                Tag us in your videos and photos — we love seeing our students shine
                outside the studio.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#ee2435] transition group-hover:gap-3">
              Follow & tag us <span>→</span>
            </div>
          </motion.a>

        </div>
      </div>
    </section>
  );
}
