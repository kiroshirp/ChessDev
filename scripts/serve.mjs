import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = resolve(root, process.env.SERVE_DIST === '1' ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const publicFiles = new Set(['index.html','admin.html','styles.css','theme.css','app.js','catalog-static.mjs','rental.mjs','inventory.mjs','catalog-api.mjs','firebase-config.mjs','routing.mjs','admin.js','admin.css','admin-orders.mjs','orders.mjs','operations-api.mjs','order-pdf.mjs','admin/index.html','material/index.html','como-funciona/index.html','solicitud/index.html']);
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/ChessDev') { res.writeHead(302, { Location: '/ChessDev/' }); res.end(); return; }
    path = path.replace(/^\/ChessDev\//, '/');
    const knownPage = /^\/(material|como-funciona|solicitud)\/?$/.test(path);
    const adminPage = /^\/admin\/?$/.test(path);
    const target = resolve(base, process.env.SERVE_DIST !== '1' && (knownPage || adminPage) ? (adminPage ? 'admin.html' : 'index.html') : `.${path.endsWith('/') ? `${path}index.html` : path}`);
    const relative = target.slice(base.length + 1);
    if (!target.startsWith(base + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.')) || !mime[extname(target)]) throw new Error('Not found');
    const publicPath = relative.replaceAll('\\', '/');
    if (!publicFiles.has(publicPath) && !publicPath.startsWith('assets/')) throw new Error('Not found');
    if (!(await stat(target)).isFile()) throw new Error('Not found');
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(port, '127.0.0.1', () => console.log(`ChessDev: http://127.0.0.1:${port}/ChessDev/`));
