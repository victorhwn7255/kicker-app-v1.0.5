import { test, expect, type BrowserContext } from '@playwright/test';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SECRET = process.env.SUPABASE_SECRET_KEY!;
const REF = new URL(SUPABASE_URL).hostname.split('.')[0];

/**
 * Establish a signed-in session without email: mint a magic link with the admin
 * API, verify it for a real session, and write the @supabase/ssr auth cookie the
 * app reads. This is the Supabase "test helper" the DoD calls for.
 */
async function signIn(context: BrowserContext, email: string) {
  const admin = createClient(SUPABASE_URL, SECRET, { auth: { persistSession: false } });
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;

  const anon = createClient(SUPABASE_URL, PUBLISHABLE, { auth: { persistSession: false } });
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: data.properties.verification_type as 'magiclink',
  });
  if (vErr || !verified.session) throw vErr ?? new Error('no session');

  const value = 'base64-' + Buffer.from(JSON.stringify(verified.session)).toString('base64');
  const name = `sb-${REF}-auth-token`;
  const chunkSize = 3180;
  const parts =
    value.length <= chunkSize
      ? [{ name, value }]
      : Array.from({ length: Math.ceil(value.length / chunkSize) }, (_, i) => ({
          name: `${name}.${i}`,
          value: value.slice(i * chunkSize, (i + 1) * chunkSize),
        }));
  await context.addCookies(
    parts.map((p) => ({ ...p, domain: 'localhost', path: '/', httpOnly: false, sameSite: 'Lax' as const })),
  );
}

/* ---------------- signed out ---------------- */

test('auth screen shows the magic-link form', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /sign in, or create/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();
});

test('research page shows the free-account gate when signed out', async ({ page }) => {
  await page.goto('/research/crwv');
  await expect(page.locator('main')).toContainText(/create a free account to read the rest/i);
});

test('profile redirects to auth when signed out', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/auth/);
});

test('settings redirects to auth when signed out', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/auth/);
});

/* ---------------- signed in ---------------- */

test('onboarding seeds follows and the Following feed shows only them', async ({ page, context }) => {
  await signIn(context, `e2e-follow-${Date.now()}@example.com`);

  await page.goto('/onboarding');
  // "Watching CoreWeave? Follow the risk." bundle = @CRWV, @CORZ, @who-holds-the-risk
  await page.getByRole('button', { name: /follow all 3/i }).nth(1).click();
  await page.getByRole('button', { name: /continue to your feed/i }).click();
  await expect(page).toHaveURL(/\/feed/);

  await page.goto('/feed?mode=following');
  await expect(page.locator('main')).toContainText('@CRWV');
  await expect(page.locator('main')).not.toContainText('@NVDA');
  await expect(page.locator('main')).toContainText(/caught up/i);
});

test('signed-in reader sees the full research page (no gate)', async ({ page, context }) => {
  await signIn(context, `e2e-read-${Date.now()}@example.com`);
  await page.goto('/research/crwv');
  await expect(page.locator('main')).not.toContainText(/create a free account to read the rest/i);
  await expect(page.locator('main')).toContainText(/single-tenant landlord/i);
});
