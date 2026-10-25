import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
// This script owns only the generated dist directory inside this project.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const publicSources=['index.html','styles.css','theme.css','app.js','rental.mjs','inventory.mjs','catalog-api.mjs','firebase-config.mjs','routing.mjs','admin.js','admin.css','admin.html','orders.mjs','operations-api.mjs','admin-orders.mjs','order-pdf.mjs'];
const sourceData=await Promise.all(publicSources.map(name=>readFile(resolve(root,name),'utf8')));
const version=createHash('sha256').update(sourceData.join('\n')).digest('hex').slice(0,12);
function versioned(text) {
  return text.replace(/(from\s*['"])(\.\.?\/[^'"?]+\.(?:mjs|js))(?:\?[^'"]*)?(['"])/g,`$1$2?v=${version}$3`)
    .replace(/((?:src|href)=["'])(\.\/[^"'?]+\.(?:js|mjs|css|pdf))(?:\?[^"']*)?(["'])/g,`$1$2?v=${version}$3`);
}
for(const name of publicSources)await writeFile(resolve(dist,name),versioned(await readFile(resolve(root,name),'utf8')));
for (const name of ['assets']) {
  await cp(resolve(root, name), resolve(dist, name), { recursive: true });
}
await cp(resolve(root, '.nojekyll'), resolve(dist, '.nojekyll'));
const page = versioned(await readFile(resolve(root, 'index.html'), 'utf8'));
for (const route of ['material', 'como-funciona', 'solicitud']) {
  await mkdir(resolve(dist, route), { recursive: true });
  await writeFile(resolve(dist, route, 'index.html'), page);
}
await mkdir(resolve(dist, 'admin'), { recursive: true });
await writeFile(resolve(dist, 'admin/index.html'),versioned(await readFile(resolve(root,'admin.html'),'utf8')));
await import('./check-public.mjs');
console.log('ChessDev preparado en dist/.');
