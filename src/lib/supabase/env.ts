/**
 * Supabase environment access. One place to read + validate the vars so a
 * missing key fails loudly with a fixable message instead of a cryptic 401.
 * Uses the new Supabase API key system (publishable / secret), not the legacy
 * anon / service_role names.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Set it in .env.local (local) and the Vercel dashboard (deploy).`,
    );
  }
  return value;
}

export const supabaseUrl = () => required('NEXT_PUBLIC_SUPABASE_URL');
export const supabasePublishableKey = () => required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
export const supabaseSecretKey = () => required('SUPABASE_SECRET_KEY');
