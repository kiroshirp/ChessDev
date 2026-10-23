import { expect, test, type Page } from '@playwright/test';
async function navigate(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}
async function move(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
async function enter(page: Page, name: string) {
  await page.goto('/');
  await navigate(page, 'Jugar');
  await page.getByLabel('Nombre para la prueba').fill(name);
  await page.getByRole('button', { name: 'Entrar en prueba local' }).click();
  await expect(page.getByRole('heading', { name: `Hola, ${name}.` })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir mesa compartida' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
test('dos clientes juegan una partida legal con mate y resultado persistido', async ({
  browser,
}) => {
  const aContext = await browser.newContext(),
    bContext = await browser.newContext();
  const a = await aContext.newPage(),
    b = await bContext.newPage();
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  await enter(a, 'Alice');
  await enter(b, 'Bob');
  await a.getByRole('button', { name: 'Sentarse con blancas' }).click();
  await b.getByRole('button', { name: 'Sentarse con negras' }).click();
  await expect(a.getByTestId('game-status')).toHaveText('Juegan blancas');
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
  await a.getByRole('button', { name: 'Cerrar y levantarse' }).click();
  await navigate(a, 'Mi perfil');
  await expect(a.getByText('Resultado: 0-1 · CHECKMATE').first()).toBeVisible();
  await b.getByRole('button', { name: 'Cerrar y levantarse' }).click();
  await a.getByRole('button', { name: 'Cerrar sesión' }).click();
  await navigate(b, 'Mi perfil');
  await b.getByRole('button', { name: 'Cerrar sesión' }).click();
  expect(errors).toEqual([]);
  await aContext.close();
  await bContext.close();
});
test('estudios PGN, reproducción, persistencia y errores de importación', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  if (!process.env.CI)
    await page.screenshot({ path: 'test-results/chessdev-desktop.png', fullPage: true });
  await navigate(page, 'Mis estudios');
  await page.getByLabel('Partida en PGN').fill('1. e4 e5 2. Nf3 Nc6');
  await navigate(page, 'Importar PGN');
  await page.getByLabel('Nombre del estudio').fill('Mi italiana');
  await navigate(page, 'Guardar estudio');
  await page.reload();
  await navigate(page, 'Mis estudios');
  await page.getByRole('button', { name: 'Mi italiana' }).click();
  await expect(page.getByLabel('Partida en PGN')).toHaveValue(/Nc6/);
  await page.getByRole('button', { name: 'Primera posición' }).click();
  await expect(page.locator('[data-square="e2"]')).toHaveAccessibleName('e2 peón blanco');
  await page.getByRole('button', { name: 'Continuar desde posición final' }).click();
  await expect(page.locator('[data-square="e4"]')).toHaveAccessibleName('e4 peón blanco');
  await page.getByLabel('Partida en PGN').fill('esto no es ajedrez');
  await navigate(page, 'Importar PGN');
  await expect(page.getByRole('status')).toContainText('PGN no válido');
});
test('problemas comprueban soluciones y aperturas comprueban cada movimiento', async ({ page }) => {
  await page.goto('/');
  await navigate(page, 'Problemas');
  await move(page, 'a7', 'a6');
  await expect(page.getByRole('status')).toContainText('no resuelve');
  await move(page, 'd8', 'h4');
  await expect(page.getByRole('status')).toContainText('¡Correcto!');
  await navigate(page, 'Siguiente problema ↗');
  await move(page, 'h5', 'f7');
  await expect(page.getByRole('status')).toContainText('¡Correcto!');
  await navigate(page, 'Siguiente problema ↗');
  await move(page, 'c3', 'd5');
  await expect(page.getByRole('status')).toContainText('¡Correcto!');
  await navigate(page, 'Entrenador de aperturas');
  for (const [from, to] of [
    ['e2', 'e4'],
    ['e7', 'e5'],
    ['g1', 'f3'],
    ['b8', 'c6'],
    ['f1', 'c4'],
    ['f8', 'c5'],
    ['c2', 'c3'],
    ['g8', 'f6'],
  ])
    await move(page, from!, to!);
  await expect(page.getByRole('status')).toContainText('Línea completada');
  await navigate(page, 'Estadísticas');
  await expect(page.locator('.stat').nth(0)).toContainText('3');
  await expect(page.locator('.stat').nth(1)).toContainText('1');
});
test('móvil: navegación y tablero sin desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  if (!process.env.CI)
    await page.screenshot({ path: 'test-results/chessdev-mobile.png', fullPage: true });
  await expect(page.getByRole('heading', { name: 'Tu próxima buena jugada.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await navigate(page, 'Problemas');
  await expect(page.getByRole('group', { name: 'Tablero de ajedrez' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
