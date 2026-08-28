'use client';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import NavigationBar from './NavigationBar';
import Home from './Home';
import About from './About';
import Classes from './Classes';
import Gallery from './Gallery';
import Instructors from './Instructors';
import FAQ from './FAQ';
import Contact from './Contact';
import Register from './Register';
import Footer from './Footer';

export default function HomeClient() {
  // Scroll to a #section anchor when arriving from another page (e.g. /#contact)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    // Wait one frame so target sections are mounted
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1d1d1f',
            padding: '14px 18px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#d1060f', secondary: '#fff' } },
        }}
      />
      <NavigationBar />
      <main>
        <Home />
        <About />
        <Classes />

        {/* ── Adult Bollywood Batch Banner ── */}
        <section className="bg-[#0a0a0f] px-6 pb-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#d1060f]/25 bg-[#d1060f]/[0.06] px-8 py-10 text-center md:flex-row md:text-left">
              <span className="shrink-0 inline-block rounded-full border border-[#d1060f]/40 bg-[#d1060f]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ee2435]">
                New · Sept 2026
              </span>
              <div className="flex-1 text-white">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
                  Adult Bollywood Dance Classes
                </p>
                <p className="mt-1.5 text-sm text-white/55">
                  Wednesdays 7–8 PM &nbsp;·&nbsp; 8 weeks &nbsp;·&nbsp; $200 CAD &nbsp;·&nbsp; Barrhaven, Ottawa &nbsp;·&nbsp; Beginner friendly
                </p>
              </div>
              <Link
                href="/adult-bollywood"
                className="shrink-0 flex items-center gap-2 rounded-full bg-[#d1060f] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(209,6,15,0.4)] transition hover:bg-[#b00310]"
              >
                Learn more <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </section>

        <Gallery />
        <Instructors />
        <FAQ />
        <Contact />
        <Register />
      </main>
      <Footer />

      {/* ── Floating WhatsApp button ── */}
      <a
        href="https://wa.me/16138903789"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(37,211,102,0.4)] transition hover:bg-[#20bd5a] hover:shadow-[0_12px_40px_rgba(37,211,102,0.5)] active:scale-95"
      >
        <FaWhatsapp className="text-xl" />
        <span className="hidden sm:inline">Questions?</span>
      </a>
    </>
  );
}
