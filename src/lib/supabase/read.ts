import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabasePublishableKey } from './env';
import type { Database } from './database.types';

/**
 * The read client: authenticates with the publishable key, so every query runs
 * under RLS exactly as an anonymous visitor would. All public content loaders
 * go through this - it is the same path a future browser read would take, and
 * it proves the public-read policies actually work.
 */
let client: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseRead() {
  if (!client) {
    client = createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
