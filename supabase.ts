import { createClient } from '@supabase/supabase-js';

// This is the dedicated YaarJam project. The URL and publishable key are public client config,
// not secrets; all writes still require the secured database RPCs and RLS policies.
const DEFAULT_SUPABASE_URL = 'https://gvwmisqnepdlejhvacbm.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_nQjn2zxIl7J4deFztx3u-A_fyRvAEfo';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * The Supabase publishable/anon key is designed to be used by browser clients.
 * Never put a service-role/secret key in VITE_* variables or browser code.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Live rooms are not configured yet. Add the Supabase project URL and publishable/anon key, then rebuild the site. The preview can still be explored in demo mode.',
    );
  }
  return supabase;
}
