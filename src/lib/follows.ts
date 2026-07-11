import 'server-only';
import { supabaseServer } from './supabase/server-auth';
import { getUser } from './auth';

/** The set of account handles the current user follows (empty when signed out). */
export async function getFollowedHandles(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('follows').select('account_handle');
  if (error) return new Set();
  return new Set((data ?? []).map((r) => (r as { account_handle: string }).account_handle));
}
