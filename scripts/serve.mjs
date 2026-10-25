import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = resolve(root, process.env.SERVE_DIST === '1' ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/ChessDev') { res.writeHead(302, { Location: '/ChessDev/' }); res.end(); return; }
    path = path.replace(/^\/ChessDev\//, '/');
    const target = resolve(base, `.${path.endsWith('/') ? `${path}index.html` : path}`);
    const relative = target.slice(base.length + 1);
    if (!target.startsWith(base + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.')) || !mime[extname(target)]) throw new Error('Not found');
    if (!(await stat(target)).isFile()) throw new Error('Not found');
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(port, '127.0.0.1', () => console.log(`ChessDev: http://127.0.0.1:${port}/ChessDev/`));
