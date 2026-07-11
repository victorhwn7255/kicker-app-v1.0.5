import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabasePublishableKey } from '@/lib/supabase/env';

/**
 * Magic-link landing. Supabase redirects here with a PKCE `code`; we exchange it
 * for a session and set the cookie ON the redirect response, then send the user
 * into onboarding (or wherever `next` points).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (!code) return NextResponse.redirect(`${origin}/auth?error=missing`);

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/auth?error=exchange`);
  return response;
}
