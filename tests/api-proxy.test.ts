import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiProxy } from '../apps/world-server/src/apiProxy';
let server: Server | undefined;
afterEach(async () => {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
});
async function serve(upstream: typeof fetch) {
  const app = express();
  app.use('/api', createApiProxy('https://api.example', upstream));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
describe('fixed public API proxy', () => {
  it('preserves OAuth redirects and binds the state cookie to the public callback path', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: 'https://lichess.org/oauth?state=test',
          'Set-Cookie': 'ps_oauth=test; Path=/auth; HttpOnly; Secure; SameSite=Lax',
        },
      }),
    );
    const base = await serve(upstream);
    const response = await fetch(`${base}/api/auth/lichess`, {
      redirect: 'manual',
      headers: { 'CF-Connecting-IP': 'spoofed', Origin: 'https://kiroshirp.github.io' },
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://lichess.org/oauth?state=test');
    expect(response.headers.get('set-cookie')).toContain('Path=/api/auth; HttpOnly; Secure');
    const [url, options] = upstream.mock.calls[0]!;
    expect(String(url)).toBe('https://api.example/auth/lichess');
    expect(new Headers(options!.headers).has('CF-Connecting-IP')).toBe(false);
  });
  it('forwards session credentials and POST bodies without following redirects', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
    const base = await serve(upstream);
    const response = await fetch(`${base}/api/auth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'ps_session=test',
        Authorization: 'Bearer test',
      },
      body: JSON.stringify({ code: 'one-use-test' }),
    });
    expect(response.status).toBe(200);
    const options = upstream.mock.calls[0]![1]!;
    expect(JSON.parse(String(options.body))).toEqual({ code: 'one-use-test' });
    expect(new Headers(options.headers).get('cookie')).toBe('ps_session=test');
    expect(options.redirect).toBe('manual');
  });
  it('blocks internal routes, arbitrary targets and oversized input', async () => {
    const upstream = vi.fn<typeof fetch>();
    const base = await serve(upstream);
    expect((await fetch(`${base}/api/internal/session`, { method: 'POST' })).status).toBe(404);
    expect((await fetch(`${base}/api/https://untrusted.example`)).status).toBe(404);
    expect(
      (await fetch(`${base}/api/auth/exchange`, { method: 'POST', body: 'x'.repeat(65537) }))
        .status,
    ).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('returns a bounded service error when Cloudflare is unavailable', async () => {
    const upstream = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('private implementation details'));
    const base = await serve(upstream);
    const response = await fetch(`${base}/api/capabilities`);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private implementation');
  });
});
