import 'server-only';
import type { User } from '@supabase/supabase-js';
import { supabaseServer } from './supabase/server-auth';

/** The current signed-in user, or null. The one place the app asks "who is this". */
export async function getUser(): Promise<User | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Entitlements. Free-first: any logged-in account reads the full research pages;
 * signed-out visitors get the honest gate. This is the single seam where a paid
 * tier would later slot in (Phase 7), so callers never branch on auth directly.
 */
export function canReadFullResearch(user: User | null): boolean {
  return user !== null;
}
