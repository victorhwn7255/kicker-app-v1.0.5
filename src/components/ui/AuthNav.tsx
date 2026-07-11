'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from './Button';

/**
 * The auth-aware corner of the chrome. Read client-side so the layout stays
 * static/ISR: signed-out shows "Sign up", signed-in shows a monogram avatar
 * (links to the profile) and Sign out.
 */
export function AuthNav() {
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = loading
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (email === undefined) return <div className="h-[32px] w-[92px]" aria-hidden />;

  if (!email) {
    return (
      <Button variant="subscribe" size="sm" href="/auth">
        Sign up
      </Button>
    );
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-[8px]">
      <Link
        href="/profile"
        aria-label="Your profile"
        title={email}
        className="flex h-[32px] w-[32px] items-center justify-center border bg-card font-mono text-[13px] font-bold uppercase text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2"
      >
        {email[0]}
      </Link>
      <Button variant="secondary" size="sm" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
