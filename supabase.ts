import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

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
