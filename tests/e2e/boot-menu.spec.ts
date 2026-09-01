import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Новая игра' }).click();
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
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await page.bringToFront();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  await expect(page.locator('.phase-clock')).toContainText('Фаза: День');
  await expect(page.locator('.phase-clock')).toContainText('Фаза: Ночь', { timeout: 10_000 });
});

test('plays the platformer through combat, pause and checkpoint restart', async ({ page }) => {
  test.setTimeout(45_000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-game-state', 'playing', {
    timeout: 15_000,
  });
  await expect(page.locator('.phase-clock')).toContainText('Фаза: День');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1_000);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyJ');
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyQ');
  await expect(page.locator('.enemy-counter')).toContainText('Монстры: 5');

  await page.keyboard.press('Tab');
  await expect(page.locator('.hud-cat--nox')).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('KeyQ');

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
