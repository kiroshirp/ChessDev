import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { chromium, expect } from '@playwright/test';

// Run after building with VITE_BASE_PATH=/PixelSpace/.
const root = fileURLToPath(new URL('../', import.meta.url));
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    'apps/web',
    '--base',
    '/PixelSpace/',
    '--host',
    '127.0.0.1',
    '--port',
    '4175',
    '--strictPort',
  ],
  { cwd: root, windowsHide: true, stdio: 'pipe' },
);
let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk;
});
server.stderr.on('data', (chunk) => {
  output += chunk;
});
let browser;
try {
  const url = 'http://127.0.0.1:4175/PixelSpace/';
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      ready = (await fetch(url, { signal: AbortSignal.timeout(500) })).ok;
    } catch {
      /* startup */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, `Preview failed to start: ${output}`);
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    // A fresh browser has no account session; this is the expected API response.
    const anonymous = response.status() === 401 && new URL(response.url()).pathname === '/auth/me';
    if (response.status() >= 400 && !anonymous)
      errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => errors.push(`Failed request: ${request.url()}`));
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Tu próxima buena jugada.' })).toBeVisible();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.development-login')).toHaveCount(0);
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  await expect(page.locator('.account-layout')).toBeVisible();
  await expect(page.locator('.development-login')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir mesa compartida' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tablero de análisis', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Tablero de ajedrez' })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    'ChessDev production smoke: /PixelSpace/, assets, Lichess required for online play, local analysis, no development bypass and no browser errors: OK',
  );
} finally {
  await browser?.close();
  server.kill();
}
