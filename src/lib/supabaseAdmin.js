import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * SERVER-ONLY Supabase client. Uses the service / secret key, which
 * bypasses Row Level Security. NEVER import this from a 'use client'
 * component — the `server-only` package will hard-fail the build if
 * you do, which is the point.
 *
 * Reads SUPABASE_SECRET_KEY (current Supabase naming) and falls back to
 * SUPABASE_SERVICE_ROLE_KEY (legacy naming) for compatibility.
 */
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey  =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (process.env.NODE_ENV !== 'production' && !supabaseKey) {
  console.warn(
    '[supabaseAdmin] No SUPABASE_SECRET_KEY found in env. ' +
      'Server-side workshop ticket fetches will fail.'
  );
}

export const supabaseAdmin =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

/** Fetch a workshop booking by qr_token. Used by the ticket page. */
export async function getBookingByToken(token) {
  if (!supabaseAdmin || !token) return null;

  const { data, error } = await supabaseAdmin
    .from('workshop_bookings')
    .select(
      `
      *,
      workshop:workshops (
        id, slug, title, subtitle, starts_at, ends_at,
        venue_name, venue_address, payment_info, instructor_names
      )
    `
    )
    .eq('qr_token', token)
    .maybeSingle();

  if (error) {
    console.error('[supabaseAdmin] getBookingByToken failed:', error);
    return null;
  }
  return data;
}
