import { expect, test, type Page } from '@playwright/test';

// End-to-end coverage for the authored level 1 «Сад первой зари»
// (docs/ECLIPSE_PAWS_SCENARIO.md §12). The level's beats live inside the Phaser scene, so the test
// reads them through the dev-only, read-only `__eclipsePawsGarden()` hook and drives everything
// else the way a player would: with the keyboard.

interface GardenState {
  activeCat: string;
  activeX: number;
  beats: string[];
  sundialHalves: number;
  canFinish: boolean;
  dialogueBusy: boolean;
  houndsAwake: boolean;
  houndsDown: number;
  sundialReady: boolean;
  zone: string;
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

async function dismissDialogue(page: Page): Promise<void> {
  await expect.poll(async () => (await gardenState(page)).dialogueBusy).toBe(true);
  for (let press = 0; press < 10 && (await gardenState(page)).dialogueBusy; press += 1) {
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(80);
  }
  await expect.poll(async () => (await gardenState(page)).dialogueBusy).toBe(false);
}

// The garden changes height from zone to zone, so walking a long way means hopping the small
// rises on the way — exactly what a player does.
async function hopAlong(page: Page, key: string, durationMs: number): Promise<void> {
  await page.keyboard.down(key);
  await page.keyboard.press('Space');
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
}

// The headless game loop runs well below real time, so walking is done in short bursts until the
// cat actually arrives instead of guessing a duration.
// [E] finishes the line being typed, then closes the card, and only then interacts — so reaching
// a prop can legitimately take several presses when lines are still queued. That is exactly what a
// player experiences, so the test presses until the prop answers.
async function interactUntil(
  page: Page,
  done: (state: GardenState) => boolean,
  presses = 40,
): Promise<void> {
  for (let index = 0; index < presses; index += 1) {
    if (done(await gardenState(page))) return;
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(150);
  }
}

async function walkTo(page: Page, targetX: number, tolerance = 60): Promise<number> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const { activeX } = await gardenState(page);
    const delta = targetX - activeX;
    if (Math.abs(delta) <= tolerance) return activeX;
    await hopAlong(page, delta > 0 ? 'KeyD' : 'KeyA', Math.min(700, Math.abs(delta) * 4 + 120));
  }
  return (await gardenState(page)).activeX;
}

test('opens with a safe, enemy-free garden and its own scripted dialogue', async ({ page }) => {
  // The headless game loop runs slower than real time and this level is long, so walking to a
  // beat legitimately takes a while.
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/?level=garden-first-dawn');
  await waitForLevel(page);

  // §12: the garden opens with no enemies and no immediate danger — the hounds are still off-stage.
  const opening = await gardenState(page);
  expect(opening.houndsAwake).toBe(false);
  expect(opening.canFinish).toBe(false);
  await expect
    .poll(async () => (await gardenState(page)).beats, { timeout: 20_000 })
    .toContain('landing');

  // Dialogue is modal: holding movement cannot move the active cat while the card is open.
  const dialogueX = (await gardenState(page)).activeX;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');
  expect((await gardenState(page)).activeX).toBe(dialogueX);

  // The level owns its dialogue, so the generic level-intro card must not double it.
  await expect(page.locator('.dialogue-overlay')).toHaveCount(0);
  // Day never turns into night on its own here.
  await expect(page.locator('.phase-clock')).toContainText('Фаза: День');
  expect(errors).toEqual([]);
});

test('turns the sundial with both cats, which brings the night and the hounds', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/?level=garden-first-dawn&checkpoint=night-path');
  await waitForLevel(page);
  await dismissDialogue(page);

  // The debug checkpoint drops the cats onto the night path, just past the sundial square.
  expect((await gardenState(page)).activeX).toBeGreaterThan(5_280);

  // Both halves of the sundial are in reach from the middle of the square: Люмус wakes the light,
  // Нокс frees the shadow, and only together do they move the dream's time (§12).
  for (let round = 0; round < 3; round += 1) {
    if ((await gardenState(page)).sundialReady) break;
    await walkTo(page, 4_944, 40);
    await interactUntil(page, (state) => state.sundialHalves > round);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
  }

  await expect
    .poll(async () => (await gardenState(page)).sundialReady, { timeout: 15_000 })
    .toBe(true);
  await expect(page.locator('.phase-clock')).toContainText('Фаза: Ночь', { timeout: 10_000 });

  // The turning point: the sleep notices the cats and only then sends the hounds of Silence.
  await walkTo(page, 5_640, 30);
  await expect
    .poll(async () => (await gardenState(page)).houndsAwake, { timeout: 20_000 })
    .toBe(true);
  const fight = await gardenState(page);
  expect(fight.beats).toEqual(expect.arrayContaining(['nightfall', 'warning', 'quake']));
  // The gate stays shut while the hounds are up.
  expect(fight.canFinish).toBe(false);
});
