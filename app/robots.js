const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

/**
 * robots.txt — allow public pages, disallow admin + portal + workshop
 * registration tickets (anything that includes private/per-user content).
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/portal/',
          '/portal',
          '/api/',
          '/workshops/*/ticket/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
