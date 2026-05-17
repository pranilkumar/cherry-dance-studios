/**
 * Workshop data-access helpers. Wraps the Supabase client with typed-ish
 * functions for the workshops module. Used by Server Components + admin.
 */
import { supabase } from './supabaseClient';

/** Fetch all publicly-visible workshops, ordered by start time. */
export async function getPublicWorkshops() {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .in('status', ['published', 'sold_out', 'completed'])
    .order('featured', { ascending: false })
    .order('starts_at', { ascending: true });
  if (error) {
    console.error('[workshops] getPublicWorkshops failed:', error);
    return [];
  }
  return data ?? [];
}

/** Fetch a single workshop by slug, or null if not found / not public. */
export async function getWorkshopBySlug(slug) {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'sold_out', 'completed'])
    .maybeSingle();
  if (error) {
    console.error('[workshops] getWorkshopBySlug failed:', error);
    return null;
  }
  return data;
}

/** Split workshops into upcoming / past based on starts_at vs now. */
export function partitionByTime(workshops) {
  const now = Date.now();
  const upcoming = [];
  const past = [];
  for (const w of workshops) {
    const t = new Date(w.starts_at).getTime();
    if (t >= now && w.status !== 'completed') upcoming.push(w);
    else past.push(w);
  }
  return { upcoming, past };
}

/** Money formatter — accepts amount_cents, returns "$25" / "$25.50" style. */
export function formatPrice(cents, currency = 'CAD') {
  if (cents == null) return '';
  const v = cents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  }).format(v);
}

/** Returns "from $25" / "$25 – $35" / "$25" depending on package set. */
export function formatPackageRange(packages = []) {
  if (!packages.length) return '';
  const prices = packages
    .map((p) => p.price_cents)
    .filter((c) => typeof c === 'number');
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

/** Format date like "Sat, Jul 15 · 6:00 PM" */
export function formatWorkshopDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** Format date short like "Jul 15" */
export function formatWorkshopDateShort(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
