import type { RequestHandler } from 'express';

const publicPaths = new Set([
  '/health',
  '/capabilities',
  '/auth/lichess',
  '/auth/lichess/start',
  '/auth/lichess/complete',
  '/auth/lichess/callback',
  '/auth/exchange',
  '/auth/me',
  '/auth/logout',
  '/auth/dev',
  '/world/ticket',
  '/games',
]);

// Fixed upstream and explicit public paths: never expose /internal or an open proxy.
export function createApiProxy(
  upstream: string,
  upstreamFetch: typeof fetch = fetch,
): RequestHandler {
  const base = new URL(upstream);
  if (base.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(base.hostname))
    throw new Error('API proxy requires HTTPS');
  return async (req, res) => {
    const local = new URL(req.originalUrl, 'http://proxy.local');
    const path = local.pathname.slice('/api'.length);
    if (!publicPaths.has(path) || !['GET', 'POST', 'OPTIONS'].includes(req.method)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const headers = new Headers();
    for (const name of ['origin', 'authorization', 'cookie', 'content-type']) {
      const value = req.headers[name];
      if (typeof value === 'string') headers.set(name, value);
    }
    try {
      let body: string | undefined;
      if (req.method === 'POST') {
        if (req.body !== undefined) body = JSON.stringify(req.body);
        else {
          const chunks: Buffer[] = [];
          let length = 0;
          for await (const chunk of req) {
            const buffer = Buffer.from(chunk);
            length += buffer.length;
            if (length > 65536) {
              res.status(413).end();
              return;
            }
            chunks.push(buffer);
          }
          body = Buffer.concat(chunks).toString('utf8');
        }
        if (Buffer.byteLength(body) > 65536) {
          res.status(413).end();
          return;
        }
      }
      const target = new URL(base);
      target.pathname = path;
      target.search = local.search;
      const response = await upstreamFetch(target, {
        method: req.method,
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        ...(body === undefined ? {} : { body }),
      });
      res.status(response.status);
      for (const name of [
        'content-type',
        'location',
        'cache-control',
        'referrer-policy',
        'x-content-type-options',
      ]) {
        const value = response.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      const cookies = response.headers
        .getSetCookie()
        .map((value) => value.replace(/Path=\/auth(?=;|$)/i, 'Path=/api/auth'));
      if (cookies.length) res.setHeader('Set-Cookie', cookies);
      res.setHeader('Cache-Control', 'no-store');
      const bytes = Buffer.from(await response.arrayBuffer());
      res.end(bytes);
    } catch {
      res.status(503).json({ error: 'Service unavailable. Please try again.' });
    }
  };
}
