'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server-auth';
import { getUser } from '@/lib/auth';

/**
 * Add or remove a follow for the signed-in user. Returns the resulting state
 * (false when signed out - the client redirects to /auth). RLS guarantees a user
 * can only write their own rows.
 */
export async function setFollow(handle: string, follow: boolean): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await supabaseServer();

  if (follow) {
    await supabase
      .from('follows')
      .upsert({ user_id: user.id, account_handle: handle }, { onConflict: 'user_id,account_handle' });
  } else {
    await supabase.from('follows').delete().eq('user_id', user.id).eq('account_handle', handle);
  }

  revalidatePath('/feed');
  revalidatePath(`/u/${handle.replace(/^@/, '')}`);
  return follow;
}

/** Seed a set of follows in one write (onboarding "continue"). Idempotent. */
export async function seedFollows(handles: string[]): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = await supabaseServer();
  if (handles.length) {
    await supabase
      .from('follows')
      .upsert(
        handles.map((h) => ({ user_id: user.id, account_handle: h })),
        { onConflict: 'user_id,account_handle' },
      );
  }
  revalidatePath('/feed');
  return true;
}
