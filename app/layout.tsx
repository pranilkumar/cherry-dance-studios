import { Space_Grotesk, Inter, Yatra_One } from 'next/font/google';
import '../src/index.css';
import RecaptchaProvider from '../src/components/RecaptchaProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

// Yatra One — Bollywood film-poster display font. Supports Latin + Devanagari.
// Used for hero / poster moments where the brand needs to feel specifically
// Bollywood-Indian rather than generic-modern.
const yatraOne = Yatra_One({
  subsets: ['latin', 'devanagari'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-poster',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cherry Dance Studios — Bollywood, Hip-hop, Freestyle & Indian dance in Ottawa',
    template: '%s | Cherry Dance Studios',
  },
  description:
    "Ottawa's home for dance — Bollywood, hip-hop, freestyle, and Indian. We turn first-timers into headliners, one routine at a time. Classes for ages 4 and up in Barrhaven, Ottawa.",
  keywords: [
    'Bollywood dance Ottawa',
    'kids dance classes Ottawa',
    'hip-hop dance Ottawa',
    'Indian dance Ottawa',
    'Barrhaven dance studio',
    'Cherry Dance Studios',
  ],
  authors: [{ name: 'Cherry Dance Studios' }],
  creator: 'Cherry Dance Studios',
  publisher: 'Cherry Dance Studios',
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: 'Cherry Dance Studios',
    title: 'Cherry Dance Studios — Dance in Ottawa',
    description:
      "Bollywood, hip-hop, freestyle, Indian. We teach whatever moves your kid. Ages 4+ in Barrhaven, Ottawa.",
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Cherry Dance Studios',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Cherry Dance Studios — Dance in Ottawa',
    description:
      "Bollywood, hip-hop, freestyle, Indian. Ages 4+ in Barrhaven, Ottawa.",
    images: ['/logo.png'],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  // Stop iOS auto-detecting phone/email/address in plain text and styling
  // them as blue tap-to-call links.
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport = {
  themeColor: '#0a0a0f',
};

/**
 * Inline cleanup script — unregisters any service worker left over from
 * the old PWABar setup, and clears its caches. The SW was caching HTML/CSS
 * aggressively and serving stale content to returning users even after we
 * deployed new code. Safe to keep running indefinitely (a no-op once no SW
 * is registered).
 */
const swCleanup = `
(function () {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) { r.unregister(); });
  }).catch(function () {});
  if (window.caches && caches.keys) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    }).catch(function () {});
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${yatraOne.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: swCleanup }} />
      </head>
      <body><RecaptchaProvider>{children}</RecaptchaProvider></body>
    </html>
  );
}
