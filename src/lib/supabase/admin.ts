import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseSecretKey } from './env';
import type { Database } from './database.types';

/**
 * The admin client: authenticates with the secret key, which bypasses RLS. It
 * is the only writer (seed + import scripts now, engine + webhook later) and the
 * only reader of the private reservoir tables (sources, post_history).
 *
 * Server-only. The secret key is never a NEXT_PUBLIC_ var, so it is not exposed
 * to the browser bundle; this guard turns any accidental client import into a
 * loud error rather than a silent undefined key.
 */
let client: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin() must never run in the browser - it holds the secret key.');
  }
  if (!client) {
    client = createClient<Database>(supabaseUrl(), supabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
