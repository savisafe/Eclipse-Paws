import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page): Promise<void> {
  // "Новая игра" now shows the prologue slideshow first (COM-010A) before seamlessly entering
  // garden-first-dawn (COM-019) — no more intermediate "Начать уровень" click for a brand new
  // game specifically (that card is still used for level-to-level transitions, see
  // `finishAndAdvance` below).
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await page.getByRole('button', { name: 'Пропустить' }).click();
}

test('boots into a keyboard-accessible menu without layout overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Eclipse Paws' })).toBeVisible();

  const newGame = page.getByRole('button', { name: 'Новая игра' });
  await newGame.focus();
  await expect(newGame).toBeFocused();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('crosses the first platform with a forgiving buffered jump', async ({ page }) => {
  await page.goto('/');
  await startGame(page);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(750);
  await page.keyboard.press('Space');
  await page.waitForTimeout(2_050);
  await page.keyboard.up('KeyD');

  await expect(page.locator('.restart-notice')).toHaveCount(0);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
});

test('reflects the automatic phase change in the HUD', async ({ page }) => {
  await page.goto('/?phaseDurationMs=200');
  await startGame(page);
  await page.bringToFront();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  await expect(page.locator('.phase-clock')).toContainText('Фаза: День');
  await expect(page.locator('.phase-clock')).toContainText('Фаза: Ночь', { timeout: 10_000 });
});

test('reaches the finish and shows a level result', async ({ page }) => {
  await page.goto('/?startNearFinish=1');
  await startGame(page);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(3_000);
  await page.keyboard.up('KeyD');
  await expect(page.getByRole('heading', { name: 'Уровень пройден!' })).toBeVisible({
    timeout: 10_000,
  });
});

test('completes all seven campaign levels and reaches the credits', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  async function finishAndAdvance(nextTitleFragment: string): Promise<void> {
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(2_000);
    await page.keyboard.up('KeyD');
    await page.getByRole('button', { name: new RegExp(`Далее: ${nextTitleFragment}`) }).click();
  }

  await page.goto('/?startNearFinish=1');
  await startGame(page);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });

  // 1. Сад первой зари -> 2. Лес шепчущих фонарей
  await finishAndAdvance('Лес шепчущих фонарей');
  await expect(page.getByRole('heading', { name: 'Лес шепчущих фонарей' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });

  // 2. Лес шепчущих фонарей -> 3. Город тысячи полуденных часов
  await finishAndAdvance('Город тысячи полуденных часов');
  await expect(page.getByRole('heading', { name: 'Город тысячи полуденных часов' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 8', { timeout: 15_000 });

  // 3. Город тысячи полуденных часов -> 4. Море непрочитанных писем
  await finishAndAdvance('Море непрочитанных писем');
  await expect(page.getByRole('heading', { name: 'Море непрочитанных писем' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 7', { timeout: 15_000 });

  // 4. Море непрочитанных писем -> 5. Карнавал забытых улыбок
  await finishAndAdvance('Карнавал забытых улыбок');
  await expect(page.getByRole('heading', { name: 'Карнавал забытых улыбок' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 4', { timeout: 15_000 });

  // 5. Карнавал забытых улыбок -> 6. Поле последней звезды
  await finishAndAdvance('Поле последней звезды');
  await expect(page.getByRole('heading', { name: 'Поле последней звезды' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 5', { timeout: 15_000 });

  // 6. Поле последней звезды -> 7. Сердце вечного сна
  await finishAndAdvance('Сердце вечного сна');
  await expect(page.getByRole('heading', { name: 'Сердце вечного сна' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать уровень' }).click();
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 9', { timeout: 15_000 });

  // 7. Сердце вечного сна -> эпилог -> титры
  await finishAndAdvance('Финал');
  await expect(page.getByRole('main', { name: 'Эпилог: Те, кто остаются рядом' })).toBeVisible();
  await page.getByRole('button', { name: 'Пропустить' }).click();
  await expect(page.getByRole('heading', { name: 'Eclipse Paws' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('plays the platformer through combat, pause and checkpoint restart', async ({ page }) => {
  test.setTimeout(45_000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/?startNearCombat=1&heroLevel=2');
  await startGame(page);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  await expect(page.locator('.phase-clock')).toContainText('Фаза: День');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1_300);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('Space');
  await page.keyboard.press('Digit1');
  await page.keyboard.press('Digit2');
  await expect(page.locator('[aria-label^="luma-sky-lightning"]')).toHaveAttribute(
    'aria-label',
    /[1-3] сек\./,
  );

  await page.keyboard.press('Tab');
  await expect(page.locator('.hud-cat--nox')).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('Digit1');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Пауза' })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing');

  await page.keyboard.press('KeyT');
  await expect(page.locator('.restart-notice')).toBeVisible({ timeout: 20_000 });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});
