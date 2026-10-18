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
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url);
  await expect(
    page.getByRole('heading', { name: 'Tu próxima jugada empieza aquí.' }),
  ).toBeVisible();
  await expect(page.locator('.login-card')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.development-login')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mi cuenta', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cómo jugar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Muévete. Encuentra una mesa. Juega.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Volver a la academia' }).click();
  await expect(page.locator('.login-card')).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    'Pages production smoke: /PixelSpace/, assets, mandatory sign-in, no development bypass and no browser errors: OK',
  );
} finally {
  await browser?.close();
  server.kill();
}
