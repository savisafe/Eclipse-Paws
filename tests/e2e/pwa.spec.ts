import { expect, test } from '@playwright/test';

test('serves a valid PWA manifest and offline worker', async ({ request }) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    display: string;
    icons: Array<{ sizes: string }>;
    orientation: string;
  };
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation).toBe('landscape');
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);

  const workerResponse = await request.get('/sw.js');
  expect(workerResponse.ok()).toBe(true);
  expect(await workerResponse.text()).toContain("const CACHE_NAME = 'eclipse-paws-v1'");
});

test('keeps every visible touch control at least 44 pixels', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only touch assertion');
  await page.goto('/');
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  const sizes = await page.locator('.touch-button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    }),
  );
  expect(sizes.length).toBeGreaterThan(0);
  expect(sizes.every((size) => size.width >= 44 && size.height >= 44)).toBe(true);
  await expect(page.locator('.orientation-hint')).toBeVisible();
});
