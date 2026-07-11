'use client';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client for client components (magic-link sign-in, follow
 * toggles). The NEXT_PUBLIC_* vars are read as LITERALS here on purpose: Next
 * only inlines them into the client bundle when accessed directly, not via the
 * dynamic env helper (which is server-only).
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
