import { expect, test, type Page } from '@playwright/test';

// A phone takes the WebGL context away when it needs the memory back. Phaser stops rendering but
// keeps stepping the scene, so before this was handled the picture froze while the phase clock ran
// and the hounds kept biting — the player saw the game hang and had no way back.

interface GardenState {
  activeX: number;
  dialogueBusy: boolean;
}

async function gardenState(page: Page): Promise<GardenState> {
  return page.evaluate(() =>
    (window as unknown as { __eclipsePawsGarden: () => GardenState }).__eclipsePawsGarden(),
  );
}

async function waitForLevel(page: Page): Promise<void> {
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 20_000,
  });
  await page.waitForFunction(() => '__eclipsePawsGarden' in window, undefined, { timeout: 20_000 });
}

// The garden speaks up on its own and its card is modal, so a walk only means something once the
// card is gone.
async function clearDialogue(page: Page): Promise<void> {
  for (let press = 0; press < 14 && (await gardenState(page)).dialogueBusy; press += 1) {
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(150);
  }
}

async function loseContext(page: Page): Promise<void> {
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    (window as unknown as { __loseContext: WEBGL_lose_context }).__loseContext = extension;
    extension.loseContext();
  });
}

test('holds the level and explains itself when the browser takes the canvas away', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/?level=garden-first-dawn');
  await waitForLevel(page);
  await clearDialogue(page);

  // Driven from the keyboard rather than the touch deck: the deck is hidden on a desktop-width
  // window, and losing the canvas is not a phone-only event.
  const hold = async (durationMs: number) => {
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(durationMs);
    await page.keyboard.up('KeyD');
  };

  // The control: the cats walk, and nothing is in the way.
  const start = (await gardenState(page)).activeX;
  await hold(2_000);
  expect((await gardenState(page)).activeX).toBeGreaterThan(start);
  await expect(page.locator('.renderer-lost')).toHaveCount(0);

  await loseContext(page);

  // The player is told, rather than left looking at a frozen picture.
  await expect(page.locator('.renderer-lost')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.renderer-lost')).toContainText('освобождает память');
  await expect(page.locator('.renderer-lost button')).toHaveCount(0);

  // And the level is genuinely on hold: nothing may happen out of sight.
  const frozen = (await gardenState(page)).activeX;
  await hold(2_000);
  expect((await gardenState(page)).activeX).toBe(frozen);

  // When it does not come back, the only way out is a reload — so the card says so.
  await expect(page.locator('.renderer-lost button')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('.renderer-lost')).toContainText('Обновите страницу');

  await page.evaluate(() =>
    (window as unknown as { __loseContext: WEBGL_lose_context }).__loseContext.restoreContext(),
  );

  // Back to the game, on the same level, at the same place.
  await expect(page.locator('.renderer-lost')).toHaveCount(0, { timeout: 15_000 });
  await clearDialogue(page);
  const resumed = (await gardenState(page)).activeX;
  await hold(2_000);
  expect((await gardenState(page)).activeX).toBeGreaterThan(resumed);
});

// Level 1 held 103 MB of texture memory, half of it in art kept more than ten times larger than
// the game ever draws it (see `adapters/phaser/capped-texture.ts`). That budget is what decides
// how soon a phone asks for the memory back, so it is a contract rather than an accident.
test('keeps the first level inside its texture budget', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?level=garden-first-dawn');
  await waitForLevel(page);
  await page.waitForFunction(() => '__eclipsePawsTextureBytes' in window, undefined, {
    timeout: 20_000,
  });

  const megabytes = await page.evaluate(
    () =>
      (
        window as unknown as { __eclipsePawsTextureBytes: () => number }
      ).__eclipsePawsTextureBytes() / 1048576,
  );

  expect(megabytes).toBeGreaterThan(0);
  expect(megabytes).toBeLessThan(60);
});
