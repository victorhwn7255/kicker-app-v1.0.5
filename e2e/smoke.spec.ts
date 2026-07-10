import { test, expect } from '@playwright/test';

test('home page renders with chrome on both breakpoints and loads brand fonts', async ({ page }) => {
  await page.goto('/');

  // Desktop chrome: yellow top bar carrying the TICKER wordmark.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole('link', { name: 'TICKER' })).toBeVisible();

  // Mobile chrome: yellow bottom nav with all five tabs.
  await page.setViewportSize({ width: 375, height: 812 });
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav).toBeVisible();
  for (const label of ['FEED', 'EXPLORE', 'KILL', 'TRIP', 'PROFILE']) {
    await expect(nav.getByText(label, { exact: true })).toBeVisible();
  }

  // Both brand families actually finish downloading (not just declared, and not
  // the local fallback face) - proves next/font is wired for Grotesk and Mono.
  // Polls rather than reading once, so a dev cold-compile can't race the check.
  await page.waitForFunction(
    () => {
      const families = Array.from(document.fonts)
        .filter((f) => f.status === 'loaded' && !/Fallback/i.test(f.family))
        .map((f) => f.family);
      return (
        families.some((f) => /Space.?Grotesk/i.test(f)) && families.some((f) => /Space.?Mono/i.test(f))
      );
    },
    undefined,
    { timeout: 10_000 },
  );
});
