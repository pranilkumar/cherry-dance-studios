import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface misconfiguration clearly instead of silently failing with a
  // placeholder client where every query returns a network error.
  console.error(
    '[supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
    'Add them to .env.local (dev) or your hosting environment (prod).'
  );
}

export const supabase = createClient(
  supabaseUrl     || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);
