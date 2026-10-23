import { expect, test, devices } from '@playwright/test';
import { createHash } from 'node:crypto';

test('móvil: las doce piezas vectoriales son idénticas a escritorio', async ({ browser }) => {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1080 } }),
    mobile = await browser.newContext({ ...devices['iPhone 13'] });
  const a = await desktop.newPage(),
    b = await mobile.newPage();
  await a.goto('/');
  await b.goto('/');
  const assets = async (page: typeof a) =>
    page
      .locator('.mini-board svg[data-piece]')
      .evaluateAll((elements) =>
        Object.fromEntries(elements.map((e) => [e.getAttribute('data-piece'), e.innerHTML])),
      );
  expect(Object.keys(await assets(a))).toHaveLength(12);
  expect(await assets(b)).toEqual(await assets(a));
  await expect(b.locator('.mobile-brand')).toBeVisible();
  for (const width of [320, 390, 430]) {
    await b.setViewportSize({ width, height: 844 });
    const board = await b.locator('.mini-board .board').boundingBox();
    expect(board!.width).toBeGreaterThanOrEqual(Math.min(300, width - 74));
    expect(await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (!process.env.CI)
      await b.screenshot({ path: `test-results/chessdev-mobile-${width}.png`, fullPage: true });
  }
  if (!process.env.CI)
    await a.screenshot({ path: 'test-results/chessdev-vector-desktop.png', fullPage: true });
  await desktop.close();
  await mobile.close();
});

test('móvil: OAuth regresa sin cookies y termina antes de cargar capacidades lentas', async ({
  browser,
}) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] }),
    page = await context.newPage();
  let challenge = '',
    state = '',
    completed = false,
    releaseCaps: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseCaps = resolve;
  });
  await page.route('**/capabilities', async (route) => {
    if (completed) await gate;
    await route.fulfill({ json: { lichess: true, developmentAuth: false } });
  });
  await page.route('**/auth/lichess/start', async (route) => {
    const body = route.request().postDataJSON() as { state: string; challenge: string };
    state = body.state;
    challenge = body.challenge;
    const target = new URL('https://lichess.org/oauth');
    target.search = new URLSearchParams({
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      redirect_uri: 'http://127.0.0.1:5174/',
    }).toString();
    await route.fulfill({ json: { url: target.href } });
  });
  await page.route('https://lichess.org/oauth?**', async (route) => {
    await context.clearCookies();
    await route.fulfill({
      contentType: 'text/html',
      body: `<a href="http://127.0.0.1:5174/?code=fixture&state=${state}">Autorizar ChessDev</a>`,
    });
  });
  await page.route('**/auth/lichess/complete', async (route) => {
    const body = route.request().postDataJSON() as { state: string; verifier: string };
    expect(body.state).toBe(state);
    expect(createHash('sha256').update(body.verifier).digest('base64url')).toBe(challenge);
    expect(route.request().headers()['cookie']).toBeUndefined();
    completed = true;
    await route.fulfill({
      json: {
        token: 'test-only-own-session',
        user: {
          userId: 'fixture',
          name: 'MobileLichess',
          sessionId: 'fixture-session',
          development: false,
        },
      },
    });
  });
  await page.route('**/games', async (route) => {
    await route.fulfill({ json: { games: [] } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar con Lichess ↗' }).click();
  await page.getByRole('link', { name: 'Autorizar ChessDev' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, MobileLichess.' })).toBeVisible({
    timeout: 3000,
  });
  expect(completed).toBe(true);
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => sessionStorage.getItem('chessdev.oauth.pending'))).toBeNull();
  expect(await page.evaluate(() => Object.values(localStorage).join(' '))).not.toContain(
    'test-only-own-session',
  );
  releaseCaps();
  await context.close();
});

test('móvil: retorno en otra pestaña muestra cómo reiniciar sin aceptar la sesión', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let exchanged = false;
  await page.route('**/auth/lichess/complete', async (route) => {
    exchanged = true;
    await route.abort();
  });
  await page.goto('/?code=foreign-code&state=foreign-state');
  await expect(page.getByRole('status')).toContainText('misma pestaña');
  expect(exchanged).toBe(false);
  expect(new URL(page.url()).search).toBe('');
});
