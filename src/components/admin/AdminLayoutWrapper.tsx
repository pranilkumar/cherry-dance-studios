'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FaHome,
  FaChartLine,
  FaQrcode,
  FaClipboardList,
  FaHeart,
  FaUsers,
  FaDollarSign,
  FaLayerGroup,
  FaMusic,
  FaSignOutAlt,
  FaBars,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import logo from '../../assets/icons/logo.png';

/**
 * Admin shell — sidebar + main. Dark sidebar with brand-red accent on
 * active item, light content area. Mobile drawer with overlay.
 *
 * Auth: localStorage-based, same gate as before (not real Supabase Auth).
 * The /admin login page renders bare (no shell) via the early return.
 */

const NAV = [
  { href: '/admin/dashboard',     icon: FaHome,          label: 'Dashboard' },
  { href: '/admin/analytics',     icon: FaChartLine,     label: 'Analytics' },
  { href: '/admin/attendance',    icon: FaQrcode,        label: 'Attendance' },
  { href: '/admin/registrations', icon: FaClipboardList, label: 'Registrations' },
  { href: '/admin/workshop',      icon: FaHeart,         label: 'Workshops' },
  { href: '/admin/students',      icon: FaUsers,         label: 'Students' },
  { href: '/admin/classes',       icon: FaLayerGroup,    label: 'Classes' },
  { href: '/admin/fees',          icon: FaDollarSign,    label: 'Fees' },
  { href: '/admin/audio',         icon: FaMusic,         label: 'Audio' },
];

export default function AdminLayoutWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth gate — verify the httpOnly session cookie server-side.
  // This cannot be bypassed via DevTools because the cookie is httpOnly
  // and the actual token is verified by the API, not the client.
  useEffect(() => {
    if (pathname === '/admin') return; // login page renders bare
    fetch('/api/admin/verify')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAuthed(true);
          setEmail(data.email || '');
        } else {
          router.replace('/admin');
        }
      })
      .catch(() => router.replace('/admin'));
  }, [router]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  // Login page itself renders bare (no shell)
  if (pathname === '/admin') return <>{children}</>;
  if (!authed) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#ee2435]" />
    </div>
  );

  const currentLabel =
    NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[#0a0a0f]/55 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col
          bg-[#0a0a0f] text-white
          transition-transform duration-300 ease-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand — real logo + wordmark, matches public navbar */}
        <Link
          href="/admin/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 border-b border-white/8 px-5 py-5 transition hover:opacity-85"
        >
          <img
            src={logo.src}
            alt="Cherry Dance Studios"
            className="h-10 w-10 flex-shrink-0 rounded-full"
          />
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-display)] text-base font-bold leading-tight tracking-tight text-white">
              Cherry{' '}
              <span className="bg-gradient-to-r from-[#d1060f] to-[#ee2435] bg-clip-text text-transparent">
                Dance Studios
              </span>
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
              Admin Portal
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Manage
          </p>
          <ul className="space-y-0.5">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                      transition-all duration-150
                      ${active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/65 hover:bg-white/[0.04] hover:text-white'}
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ee2435]" />
                    )}
                    <Icon
                      className={`text-[15px] flex-shrink-0 transition ${
                        active ? 'text-[#ee2435]' : 'text-white/55 group-hover:text-white/85'
                      }`}
                    />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Quick links
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/[0.04] hover:text-white"
              >
                <FaExternalLinkAlt className="text-xs flex-shrink-0 text-white/45 group-hover:text-white/75" />
                <span>View public site</span>
              </Link>
            </li>
            <li>
              <Link
                href="/workshops"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/[0.04] hover:text-white"
              >
                <FaExternalLinkAlt className="text-xs flex-shrink-0 text-white/45 group-hover:text-white/75" />
                <span>Public workshops</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User block */}
        <div className="border-t border-white/8 p-3">
          {email && (
            <div className="mb-2 rounded-lg bg-white/[0.04] px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Signed in
              </div>
              <div className="mt-1 truncate text-xs font-medium text-white/90">
                {email}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-[#d1060f]/15 hover:text-[#ee2435]"
          >
            <FaSignOutAlt className="text-[14px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main column ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-[#0a0a0f]/90 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-md text-white/85 hover:bg-white/5"
          >
            <FaBars />
          </button>
          <div className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
            {currentLabel}
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
