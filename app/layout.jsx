import { Space_Grotesk, Inter, Yatra_One } from 'next/font/google';
import '../src/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
};

export const viewport = {
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${yatraOne.variable}`}>
      <body>{children}</body>
    </html>
  );
}
