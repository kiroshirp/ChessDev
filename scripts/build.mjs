import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
// This script owns only the generated dist directory inside this project.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'styles.css', 'theme.css', 'app.js', 'rental.mjs', 'inventory.mjs', 'catalog-api.mjs', 'firebase-config.mjs', 'routing.mjs', 'admin.js', 'admin.css', 'assets']) {
  await cp(resolve(root, name), resolve(dist, name), { recursive: true });
}
await cp(resolve(root, '.nojekyll'), resolve(dist, '.nojekyll'));
const page = await readFile(resolve(root, 'index.html'), 'utf8');
for (const route of ['material', 'como-funciona', 'solicitud']) {
  await mkdir(resolve(dist, route), { recursive: true });
  await writeFile(resolve(dist, route, 'index.html'), page);
}
await mkdir(resolve(dist, 'admin'), { recursive: true });
await cp(resolve(root, 'admin.html'), resolve(dist, 'admin/index.html'));
await import('./check-public.mjs');
console.log('ChessDev preparado en dist/.');
