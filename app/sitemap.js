import { getPublicWorkshops } from '../src/lib/workshops';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

/**
 * Sitemap — includes static public pages + every currently-published workshop.
 * Auto-rebuilds at request time because we mark each page dynamic.
 */
export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { url: SITE_URL,              priority: 1.0, changeFrequency: 'weekly'  },
    { url: `${SITE_URL}/workshops`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/gallery`,   priority: 0.7, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/register`,  priority: 0.8, changeFrequency: 'monthly' },
  ].map((r) => ({ ...r, lastModified: now }));

  let workshopRoutes = [];
  try {
    const workshops = await getPublicWorkshops();
    workshopRoutes = workshops.map((w) => ({
      url: `${SITE_URL}/workshops/${w.slug}`,
      lastModified: w.updated_at ? new Date(w.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (e) {
    // If Supabase isn't reachable during sitemap generation, fall back to static-only.
    console.warn('[sitemap] workshop fetch failed:', e?.message);
  }

  return [...staticRoutes, ...workshopRoutes];
}
