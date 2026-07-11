import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseUrl, supabasePublishableKey } from './env';

/**
 * Auth-aware server client: reads the session from cookies so RLS runs as the
 * signed-in user. Use this in server components, server actions, and route
 * handlers that need to know who the user is (follows, the research unlock).
 * Public, cached content still goes through the anonymous read client.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In a Server Component `set` throws; the middleware refreshes the
        // session cookie instead, so swallowing here is safe.
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component - ignore */
        }
      },
    },
  });
}
