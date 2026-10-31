import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, extname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
let privatePassword = '';
try { privatePassword = (await readFile(resolve(root, '.env'), 'utf8')).match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim() || ''; } catch {}
const forbidden = new Set(['.env','.env.example','firebase.json','database.rules.json','.firebaserc','seed-admin.mjs','SECURITY.md','catalog-api.mjs','operations-api.mjs','firebase-config.mjs','admin.js','admin-orders.mjs','orders.mjs','order-pdf.mjs','database.disabled.rules.json']);
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.nojekyll' || forbidden.has(entry.name)) throw new Error('Se ha incluido un archivo privado o de configuración en la web.');
    const target = resolve(dir, entry.name);
    if (entry.isDirectory()) await inspect(target);
    else {
      const bytes = await readFile(target);
      if (privatePassword && bytes.includes(Buffer.from(privatePassword))) throw new Error('Se ha detectado una credencial privada en el contenido público.');
      if (['.js','.mjs','.html'].includes(extname(target)) && /ADMIN_PASSWORD|passwordHash|PBKDF2_SHA256/.test(bytes.toString('utf8'))) throw new Error('La web contiene configuración privada del administrador.');
      if (entry.name === 'index.html') {
        const html = bytes.toString('utf8');
        if (/<a[^>]+href="#/.test(html)) throw new Error(`Navegación con fragmentos en ${relative(dist,target)}.`);
        if (!html.includes('<base href="/ChessDev/">')) throw new Error('Base de rutas de GitHub Pages incorrecta.');
      }
    }
  }
}
await inspect(dist);
for (const route of ['admin','material','como-funciona','solicitud']) await readFile(resolve(dist,route,'index.html'));
console.log('Publicación revisada: rutas completas, sin credenciales ni archivos privados.');
