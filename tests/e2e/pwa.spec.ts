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

// The portrait deck is the screen the picture does not get, so its share of the glass is a
// contract, not an accident: it drifted to over half the phone once (see `game.css`, the portrait
// block) and the game was reduced to a strip above a field of buttons.
test('leaves the picture the larger half of a portrait phone', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only layout assertion');
  await page.goto('/?level=garden-first-dawn');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 20_000,
  });

  const layout = await page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`missing ${selector}`);
      const rect = element.getBoundingClientRect();
      return { bottom: rect.bottom, height: rect.height, top: rect.top };
    };
    const buttons = [...document.querySelectorAll('.touch-button')].map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        // Nothing may sit over a control: the HUD paints above the deck in portrait, and a stray
        // full-width overlay there would swallow every press.
        covered:
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) !== button,
        top: rect.top,
      };
    });
    return {
      abilities: box('.ability-cooldowns'),
      buttonsBottom: Math.max(...buttons.map((button) => button.bottom)),
      buttonsTop: Math.min(...buttons.map((button) => button.top)),
      covered: buttons.some((button) => button.covered),
      deck: box('.touch-controls'),
      hint: box('.orientation-hint'),
      picture: box('.game-canvas-shell'),
      scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
      viewport: window.innerHeight,
    };
  });

  expect(layout.picture.height / layout.viewport).toBeGreaterThanOrEqual(0.55);
  expect(layout.deck.height / layout.viewport).toBeLessThanOrEqual(0.45);
  // The rotate hint and the ability row live in the deck's own top band, in that order, and the
  // buttons start below them — the band is what the deck pads itself by.
  expect(layout.hint.top).toBeGreaterThanOrEqual(layout.deck.top);
  expect(layout.abilities.top).toBeGreaterThanOrEqual(layout.hint.bottom);
  expect(layout.buttonsTop).toBeGreaterThanOrEqual(layout.abilities.bottom);
  expect(layout.buttonsBottom).toBeLessThanOrEqual(layout.viewport);
  expect(layout.covered).toBe(false);
  // A scrollable page is a phone's licence to read a thumb on the deck as a pan and cancel the
  // press underneath it.
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.viewport);
});
