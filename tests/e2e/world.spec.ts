import { expect, test, type Page } from '@playwright/test';
async function enter(page: Page, name: string) {
  await page.goto('/');
  await page.getByLabel('Nombre para la prueba').fill(name);
  await page.getByRole('button', { name: 'Entrar al mundo', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId(`player-${name}`)).toBeVisible();
}
async function table(page: Page) {
  await page.getByRole('button', { name: 'Sala de juego', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir mesa de ajedrez' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function move(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
test('two browser contexts share presence, authoritative movement, chess and persisted result', async ({
  browser,
}) => {
  const contextA = await browser.newContext(),
    contextB = await browser.newContext();
  const a = await contextA.newPage(),
    b = await contextB.newPage();
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  await enter(a, 'Alice');
  await enter(b, 'Bob');
  await expect(a.getByTestId('player-count')).toHaveText('2');
  await expect(b.getByTestId('player-Alice')).toBeVisible();
  const before = Number(await b.getByTestId('player-Alice').getAttribute('data-x'));
  await a.locator('canvas').focus();
  await a.keyboard.down('ArrowRight');
  await expect
    .poll(async () => Number(await b.getByTestId('player-Alice').getAttribute('data-x')))
    .toBeGreaterThan(before + 25);
  await a.keyboard.up('ArrowRight');
  await a.keyboard.press('Escape');
  await expect(a.getByRole('button', { name: 'Academia', exact: false }).first()).toBeFocused();
  await a.screenshot({ path: 'test-results/academy-desktop.png', fullPage: true });
  await table(a);
  await table(b);
  await a.getByRole('button', { name: 'Sentarse con blancas' }).click();
  await b.getByRole('button', { name: 'Sentarse con negras' }).click();
  await expect(a.getByTestId('game-status')).toHaveText('Juegan blancas');
  // Out-of-turn UI cannot change the board.
  await move(b, 'e7', 'e5');
  await expect(b.getByTestId('move-history')).not.toContainText('e5');
  await move(a, 'f2', 'f3');
  await expect(b.getByTestId('move-history')).toContainText('f3');
  await move(b, 'e7', 'e5');
  await expect(a.getByTestId('move-history')).toContainText('e5');
  await move(a, 'g2', 'g4');
  await expect(b.getByTestId('move-history')).toContainText('g4');
  await move(b, 'd8', 'h4');
  await expect(a.getByTestId('game-status')).toContainText('0-1');
  await expect(a.getByText('Resultado guardado', { exact: true })).toBeVisible();
  await a.screenshot({ path: 'test-results/chess-desktop.png', fullPage: true });
  await a.getByRole('button', { name: 'Cerrar y levantarse' }).click();
  await a.getByRole('button', { name: 'Mi cuenta', exact: false }).click();
  await expect(a.getByText('Resultado: 0-1 · CHECKMATE')).toBeVisible();
  await b.getByRole('button', { name: 'Cerrar y levantarse' }).click();
  await b.getByRole('button', { name: 'Cerrar sesión' }).click();
  await a.getByRole('button', { name: 'Academia', exact: true }).click();
  await expect(a.getByTestId('player-count')).toHaveText('1');
  expect(errors).toEqual([]);
  await a.getByRole('button', { name: 'Cerrar sesión' }).click();
  await contextA.close();
  await contextB.close();
});
test('mobile layout, rooms, collision, language and guide', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, 'Mobile');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sala de juego', exact: true }).click();
  await expect
    .poll(async () => Number((await page.getByTestId('position').innerText()).split(',')[1]))
    .toBe(960);
  await page.locator('canvas').focus();
  await page.keyboard.down('ArrowUp');
  await expect
    .poll(async () => Number((await page.getByTestId('position').innerText()).split(',')[1]))
    .toBeLessThan(912);
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowUp');
  const y = Number((await page.getByTestId('position').innerText()).split(',')[1]);
  expect(y).toBeGreaterThanOrEqual(907);
  expect(y).toBeLessThanOrEqual(911);
  await page.screenshot({ path: 'test-results/academy-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Cómo jugar', exact: false }).click();
  await expect(
    page.getByRole('heading', { name: 'Muévete. Encuentra una mesa. Juega.' }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Idioma / Language' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Walk. Find a table. Play.' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to academy' }).click();
  await expect(page.locator('canvas')).toBeVisible();
});
