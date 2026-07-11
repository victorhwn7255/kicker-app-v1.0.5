'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * Magic-link sign-in: two tiny states, no passwords. Enter email -> we email a
 * link -> tap it and you're in. Copy is the design's reassurance, adjusted for
 * free-first (no upgrade).
 */
export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <section className="mx-auto flex max-w-[460px] flex-col py-[48px] md:py-[72px]">
      <div className="border bg-card p-[24px] shadow md:p-[32px]">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Ticker</div>

        {!sent ? (
          <>
            <h1 className="mt-[10px] text-[26px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[30px]">
              Sign in, or create your account.
            </h1>
            <p className="post-body mt-[10px] text-[15px] leading-[1.55]">
              No passwords. We email you a link - tap it and you&rsquo;re in.
            </p>
            <form onSubmit={send} className="mt-[20px] flex flex-col gap-[12px]">
              <label className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" variant="subscribe" size="lg" disabled={pending} className="w-full">
                {pending ? 'Sending…' : 'Send magic link'}
              </Button>
              {error && <p className="font-mono text-[12px] text-tier-disputed">{error}</p>}
            </form>
            <p className="mt-[18px] border-t pt-[14px] font-mono text-[11px] leading-[1.6] text-muted">
              Free forever · no card required. We never post as you - you only read.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-[10px] text-[26px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[30px]">
              Check your inbox.
            </h1>
            <p className="post-body mt-[10px] text-[15px] leading-[1.55]">
              We sent a magic link to <b>{email}</b>. Tap it on this device and you&rsquo;re in - no password to
              remember.
            </p>
            <div className="mt-[20px] flex flex-col gap-[10px]">
              <Button variant="secondary" size="md" onClick={() => setSent(false)} className="w-full">
                Use a different email
              </Button>
            </div>
            <p className="mt-[18px] border-t pt-[14px] font-mono text-[11px] leading-[1.6] text-muted">
              Didn&rsquo;t get it? Check spam. The link expires in 15 minutes.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
