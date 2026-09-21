// lib/supabase.js
// Client Supabase untuk akses server-side dengan Service Role Key
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

let supabaseServerClient = null;

export function getSupabaseAdmin() {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();

  supabaseServerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseServerClient;
}
