import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
// This script owns only the generated dist directory inside this project.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'rental.mjs', 'assets']) {
  await cp(resolve(root, name), resolve(dist, name), { recursive: true });
}
await cp(resolve(root, '.nojekyll'), resolve(dist, '.nojekyll'));
console.log('ChessDev preparado en dist/.');
