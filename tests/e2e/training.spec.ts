import { expect, test } from '@playwright/test';
import daily from '../fixtures/lichess-daily.json' with { type: 'json' };
async function move(page: import('@playwright/test').Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}
test('problema real diario, solución legal y ciclos Woodpecker medidos', async ({ page }) => {
  await page.route('https://lichess.org/api/puzzle/daily', (r) => r.fulfill({ json: daily }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Problemas', exact: true }).click();
  await expect(page.getByText('Tu colección está vacía.', { exact: false })).toBeVisible();
  await page
    .getByRole('button', { name: 'Cargar problema diario de Lichess', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Ver problema original en Lichess' }),
  ).toHaveAttribute('href', 'https://lichess.org/training/wX7Ch');
  await move(page, 'd4', 'f2');
  await expect(page.locator('[data-square="f2"]')).toHaveAccessibleName('f2 rey blanco');
  await move(page, 'h3', 'g3');
  await expect(page.getByRole('status')).toContainText('Sesión completada');
  await page.getByRole('button', { name: 'Woodpecker', exact: true }).click();
  await page.getByLabel('Número de ciclos').selectOption('2');
  await page.getByRole('button', { name: 'Crear plan con 1 problemas', exact: true }).click();
  await move(page, 'd4', 'f2');
  await move(page, 'h3', 'g3');
  await expect(page.locator('.cycle-results')).toContainText('Ciclo 1:');
  await page.getByRole('button', { name: 'Continuar plan', exact: true }).click();
  await move(page, 'd4', 'f2');
  await move(page, 'h3', 'g3');
  await expect(page.getByText('Plan completado', { exact: true })).toBeVisible();
  const cycle = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chessdev.library.v1')!).cycle,
  );
  expect(cycle.results).toHaveLength(2);
  expect(cycle.results[0].milliseconds).toBeGreaterThan(0);
  expect(cycle.results[1].count).toBe(1);
});
test('Stockfish ejecuta WASM real y revisa una partida con mate', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Tablero de análisis', exact: true }).click();
  await page.getByLabel('Partida en PGN').fill('1.f3 e5 2.g4 Qh4# 0-1');
  await page.getByRole('button', { name: 'Importar PGN', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar desde posición final', exact: true }).click();
  await page.getByRole('button', { name: 'Jugada anterior', exact: true }).click();
  await page.getByRole('button', { name: 'Analizar posición', exact: true }).click();
  await expect(page.getByTestId('engine-evaluation')).toContainText('Qh4#', { timeout: 45000 });
  await expect(page.getByTestId('engine-evaluation')).toContainText('−M1');
  await page.getByRole('button', { name: 'Revisar partida completa', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar análisis', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar partida completa', exact: true }).click();
  await expect(page.locator('.review-result')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.review-result .stat').first()).toContainText('4');
  await page.getByRole('button', { name: 'Entrenar mis errores', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText(
    'posiciones de tus errores guardadas',
  );
  const reviews = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chessdev.library.v1')!).reviews,
  );
  expect(reviews[0].moves[0].before.depth).toBeGreaterThan(0);
  expect(reviews[0].moves[3].after.mate).toBe(0);
  expect(reviews[0].result).toBe('0-1');
  expect(errors).toEqual([]);
});
