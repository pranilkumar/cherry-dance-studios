'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaBars, FaTimes, FaSignInAlt } from 'react-icons/fa';
import CP from '../assets/icons/logo.png';

// Section anchors on home plus dedicated routes for Workshops + Gallery.
const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'classes', label: 'Classes' },
  { id: 'workshops', label: 'Workshops', route: '/workshops' },
  { id: 'gallery', label: 'Gallery', route: '/gallery' },
  { id: 'instructors', label: 'Instructors' },
  { id: 'contact', label: 'Contact' },
];

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  // Sync active link with pathname for the routes that actually exist.
  useEffect(() => {
    const pathToId = {
      '/': 'home',
      '/gallery': 'gallery',
      '/register': 'register',
      '/workshops': 'workshops',
    };
    // Nested workshop pages (/workshops/[slug]) still highlight Workshops.
    if (pathname?.startsWith('/workshops')) {
      setActiveLink('workshops');
    } else if (pathToId[pathname]) {
      setActiveLink(pathToId[pathname]);
    }
  }, [pathname]);

  // Scrolled state — non-home pages stay in the solid-dark style by default
  // (the transparent pill disappears on white backgrounds).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40 || pathname !== '/');
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);


  // Section scrollspy on home page
  useEffect(() => {
    if (pathname !== '/') return;
    const ids = ['home', 'about', 'classes', 'gallery', 'instructors', 'contact', 'register'];
    const onScroll = () => {
      const navHeight = navRef.current?.offsetHeight ?? 0;
      const pos = window.scrollY + navHeight + 4;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (!el) continue;
        if (pos >= el.offsetTop) { setActiveLink(ids[i]); break; }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNav = (item) => {
    setMobileOpen(false);

    // On home: smooth-scroll to the section.
    if (pathname === '/') {
      const el = document.getElementById(item.id);
      if (el) {
        setActiveLink(item.id);
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // From other pages: home nav goes to /, items with explicit routes
    // (e.g. Gallery → /gallery) go there, everything else goes to /#id.
    if (item.id === 'home') {
      router.push('/');
    } else if (item.route) {
      router.push(item.route);
    } else {
      router.push(`/#${item.id}`);
    }
  };

  const goRegister = () => {
    setMobileOpen(false);
    router.push('/register');
  };

  const goSignIn = () => {
    setMobileOpen(false);
    router.push('/portal');
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-1/2 top-4 z-50 w-[min(1200px,calc(100%-1.5rem))] -translate-x-1/2"
      >
        <div
          className={`flex items-center justify-between rounded-full border px-3 py-2 transition-all duration-500 md:px-5 ${
            scrolled
              ? 'border-white/10 bg-[#0a0a0f]/80 shadow-[0_8px_40px_rgba(10,10,15,0.4)] backdrop-blur-2xl'
              : 'border-white/10 bg-white/5 backdrop-blur-xl'
          }`}
        >
          {/* Brand — always visible in the navbar. */}
          <button
            onClick={() => handleNav({ id: 'home', route: '/' })}
            className="flex items-center gap-2.5 pl-2 transition hover:opacity-80"
          >
            <img src={CP.src} alt="Cherry Dance Studios" className="h-9 w-9 rounded-full" />
            <span className="hidden font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-white sm:inline">
              Cherry <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">Dance Studios</span>
            </span>
          </button>

          {/* Desktop nav with animated active pill */}
          <div className="relative hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const isActive = activeLink === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item)}
                  className="relative px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Quiet "Sign in" link — for returning parents. */}
            <button
              onClick={goSignIn}
              className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white sm:inline-flex"
            >
              <FaSignInAlt className="text-xs" />
              Sign in
            </button>

            <motion.button
              onClick={goRegister}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(209,6,15,0.5)] sm:inline-flex"
              style={{ background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)' }}
            >
              <FaUserPlus />
              Register
            </motion.button>

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/10 lg:hidden"
            >
              <FaBars className="text-sm" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-[#0a0a0f]/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-2.5">
                  <img src={CP.src} alt="" className="h-9 w-9 rounded-full" />
                  <span className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                    Cherry <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">Dance Studios</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
                {navItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => handleNav(item)}
                    className={`font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight transition ${
                      activeLink === item.id
                        ? 'text-[#ee2435]'
                        : 'text-white/85 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              <div className="space-y-3 p-6">
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  onClick={goRegister}
                  className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(209,6,15,0.55)]"
                  style={{ background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)' }}
                >
                  <FaUserPlus />
                  Register now
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                  onClick={goSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-base font-medium text-white/85 backdrop-blur-md transition hover:bg-white/[0.08] hover:text-white"
                >
                  <FaSignInAlt />
                  Sign in
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
