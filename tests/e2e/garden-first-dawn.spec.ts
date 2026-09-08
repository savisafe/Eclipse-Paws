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

// Walks the active cat to `targetX` the way a player would: hold the direction, hop the small
// rises the garden puts in the way, and watch where the cat actually is.
//
// It polls rather than walking for a computed number of milliseconds because the headless loop's
// speed swings by an order of magnitude between a cold level and a warm one — a burst long enough
// to cross the garden while the scene is still warming up overshoots the mark once it is warm, and
// the walk then oscillates around the target until it runs out of tries. Bounding it by the clock
// instead is what lets a cold scene take as long as it needs, and a warm one stop on the mark.
async function walkTo(page: Page, targetX: number, tolerance = 60): Promise<number> {
  const deadline = Date.now() + 90_000;
  let state = await gardenState(page);
  while (Date.now() < deadline) {
    // The garden speaks up on its own as the cats cross it, and its card is modal — a player reads
    // it and walks on, so the walk does too instead of pushing against a world that has stopped.
    if (state.dialogueBusy) {
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(120);
      state = await gardenState(page);
      continue;
    }
    const heading = Math.sign(targetX - state.activeX);
    if (Math.abs(targetX - state.activeX) <= tolerance) return state.activeX;

    const key = heading > 0 ? 'KeyD' : 'KeyA';
    let lastX = state.activeX;
    await page.keyboard.down(key);
    while (Date.now() < deadline) {
      await page.waitForTimeout(40);
      state = await gardenState(page);
      // Hop only what actually stops the cat. Jumping on a timer instead carries it clean over
      // the mark and the walk then paces back and forth across the target for ever.
      if (Math.abs(state.activeX - lastX) < 2) await page.keyboard.press('Space');
      lastX = state.activeX;
      const left = targetX - state.activeX;
      if (state.dialogueBusy || Math.abs(left) <= tolerance || Math.sign(left) !== heading) break;
    }
    await page.keyboard.up(key);
    state = await gardenState(page);
  }
  // Out of time. The walk is only how the cats get somewhere — the caller's own assertion is what
  // the test is about, and the last stretch of this level walks into the ambush that wakes the
  // hounds, where the world pushes back and an exact landing was never the point. So report where
  // they actually stopped and let that assertion speak, rather than failing here on the journey.
  console.warn(`walkTo(${targetX}) ran out of time at ${state.activeX}`);
  return state.activeX;
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
  test.setTimeout(300_000);
  await page.goto('/?level=garden-first-dawn&checkpoint=night-path');
  await waitForLevel(page);
  await dismissDialogue(page);

  // The debug checkpoint drops the cats onto the night path, just past the sundial square.
  expect((await gardenState(page)).activeX).toBeGreaterThan(5_280);

  // The sundial square comes before the Gardener's house. Both halves are in reach from its
  // middle: Люмус wakes the light,
  // Нокс frees the shadow, and only together do they move the dream's time (§12).
  for (let round = 0; round < 3; round += 1) {
    if ((await gardenState(page)).sundialReady) break;
    await walkTo(page, 4_104, 40);
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

// A phone has no keyboard, so the deck *is* the game's input. This walks the cat with a real,
// held touch — the gesture that once moved it for a frame and then stopped dead, because the
// browser handed the pointer capture straight back and the button read that as the finger
// lifting.
test('walks the cat with a held touch on the deck', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only touch assertion');
  test.setTimeout(120_000);
  await page.goto('/?level=garden-first-dawn');
  await waitForLevel(page);

  // Tap-to-continue on the picture is how a touch player gets past a card: there is no [E] key,
  // and on a phone the card covers most of the band.
  const picture = (await page.locator('.game-canvas-shell').boundingBox())!;
  await expect.poll(async () => (await gardenState(page)).dialogueBusy).toBe(true);
  for (let tap = 0; tap < 12 && (await gardenState(page)).dialogueBusy; tap += 1) {
    await page.touchscreen.tap(picture.x + picture.width / 2, picture.y + picture.height / 2);
    await page.waitForTimeout(150);
  }
  expect((await gardenState(page)).dialogueBusy).toBe(false);

  const right = (await page.locator('.touch-button--move-right').boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  const hold = async (type: 'touchStart' | 'touchEnd') =>
    touch.send('Input.dispatchTouchEvent', {
      type,
      touchPoints:
        type === 'touchEnd'
          ? []
          : [{ x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 }],
    });

  const start = (await gardenState(page)).activeX;
  await hold('touchStart');
  // The finger never lifts, so the cat has to keep walking: one frame of movement is exactly the
  // bug this guards.
  await expect
    .poll(async () => (await gardenState(page)).activeX, { timeout: 20_000 })
    .toBeGreaterThan(start + 60);
  await expect(page.locator('.touch-button--move-right')).toHaveAttribute('data-pressed', 'true');

  await hold('touchEnd');
  await expect(page.locator('.touch-button--move-right')).not.toHaveAttribute('data-pressed');
  await page.waitForTimeout(400);
  const stopped = (await gardenState(page)).activeX;
  await page.waitForTimeout(600);
  expect((await gardenState(page)).activeX).toBe(stopped);
});
