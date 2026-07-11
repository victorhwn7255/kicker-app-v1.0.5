import { test, expect } from '@playwright/test';

/** Every Phase 3 screen renders (status ok, key content present, no JS crash). */
const SCREENS = [
  { path: '/', name: 'landing', text: /Sourced\. Confidence-labeled/i },
  { path: '/feed', name: 'feed', text: /caught up/i },
  { path: '/p/crwv-quote-corz', name: 'permalink', text: /The receipt/i },
  { path: '/u/CRWV', name: 'profile', text: /@CRWV/ },
  { path: '/research/crwv', name: 'research', text: /single-tenant landlord/i },
  { path: '/kill-list', name: 'kill-list', text: /Kill List/i },
  { path: '/tripwires', name: 'tripwires', text: /ARMED/ },
  { path: '/explore', name: 'explore', text: /Companies/ },
  { path: '/pricing', name: 'pricing', text: /Reader/ },
];

for (const s of SCREENS) {
  test(`${s.name} renders`, async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (e) => jsErrors.push(e.message));
    const resp = await page.goto(s.path, { waitUntil: 'networkidle' });
    expect(resp?.status(), `${s.path} status`).toBeLessThan(400);
    await expect(page.locator('main')).toContainText(s.text);
    expect(jsErrors, jsErrors.join('\n')).toHaveLength(0);
  });
}

test('daily loop: feed -> receipt -> research section -> back -> caught up', async ({ page }) => {
  await page.goto('/feed', { waitUntil: 'networkidle' });
  await page
    .getByRole('link', { name: /source: CRWV \/ customer concentration/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/research\/crwv/);
  await expect(page.locator('main')).toContainText(/Customer concentration/i);
  await page.goBack();
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.locator('main')).toContainText(/caught up/i);
});

test('explore search filters accounts by text', async ({ page }) => {
  await page.goto('/explore', { waitUntil: 'networkidle' });
  await page.getByRole('searchbox').first().fill('transformer');
  await expect(page.locator('main')).toContainText('@transformer-supply');
  await expect(page.locator('main')).not.toContainText('@NVDA');
});

test('kill-list filter narrows to a single verdict', async ({ page }) => {
  await page.goto('/kill-list', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Killed$/i }).click();
  await expect(page.locator('main')).toContainText('KILLED');
  await expect(page.locator('main')).not.toContainText('SURVIVED');
});
