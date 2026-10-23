import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { openLocalDatabase } from '@pixelspace/database/local';
import { apiFetch, type ApiEnv } from '../apps/api/src/worker';
import { digest } from '@pixelspace/auth';
let db: ReturnType<typeof openLocalDatabase>;
let env: ApiEnv;
const origin = 'http://127.0.0.1:5174';
beforeEach(() => {
  db = openLocalDatabase(':memory:');
  env = {
    DB: db,
    ENVIRONMENT: 'local',
    FRONTEND_URL: `${origin}/`,
    WORLD_SECRET: 'unit-test-world-secret-with-at-least-32-characters',
    INTERNAL_SECRET: 'unit-test-internal-secret-with-32-characters',
  };
});
afterEach(() => db.close());
function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://127.0.0.1:3001${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Origin: origin,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
describe('authentication API', () => {
  it('denies unauthenticated world access and foreign origins', async () => {
    expect((await apiFetch(request('/world/ticket', {}), env)).status).toBe(401);
    expect(
      (
        await apiFetch(
          request('/auth/dev', { name: 'Alice' }, { Origin: 'https://evil.example' }),
          env,
        )
      ).status,
    ).toBe(403);
  });
  it('disables development authentication in production and on remote hosts', async () => {
    env.ENVIRONMENT = 'production';
    expect((await apiFetch(request('/auth/dev', { name: 'Alice' }), env)).status).toBe(404);
    env.ENVIRONMENT = 'local';
    expect(
      (
        await apiFetch(
          new Request('https://api.example/auth/dev', {
            method: 'POST',
            headers: { Origin: origin, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Alice' }),
          }),
          env,
        )
      ).status,
    ).toBe(404);
  });
  it('creates a local identity, issues a world ticket and invalidates it after logout', async () => {
    const auth = (await (await apiFetch(request('/auth/dev', { name: 'Alice' }), env)).json()) as {
      token: string;
      user: { name: string };
    };
    expect(auth.user.name).toBe('Alice');
    const headers = { Authorization: `Bearer ${auth.token}` };
    expect((await apiFetch(request('/world/ticket', {}, headers), env)).status).toBe(200);
    expect((await apiFetch(request('/auth/logout', {}, headers), env)).status).toBe(200);
    expect((await apiFetch(request('/auth/me', undefined, headers), env)).status).toBe(401);
  });
  it('verifies OAuth state and completes Lichess login with a mocked provider, one-time exchange and no stored Lichess token', async () => {
    Object.assign(env, {
      ENVIRONMENT: 'production',
      LICHESS_CLIENT_ID: 'chessdev-test',
      LICHESS_REDIRECT_URI: 'http://127.0.0.1:3001/auth/lichess/callback',
    });
    const authorization = await apiFetch(request('/auth/lichess'), env),
      target = new URL(authorization.headers.get('location')!);
    expect(target.origin + target.pathname).toBe('https://lichess.org/oauth');
    expect(target.searchParams.get('scope')).toBe('');
    expect(target.searchParams.get('code_challenge_method')).toBe('S256');
    const cookie = authorization.headers.get('set-cookie')!.split(';')[0]!;
    const provider = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: 'lichess-token-not-persisted' }))
      .mockResolvedValueOnce(Response.json({ id: 'alice', username: 'Alice' }));
    const state = target.searchParams.get('state')!;
    expect(
      (
        await apiFetch(
          request('/auth/lichess/callback?code=fixture&state=wrong', undefined, { Cookie: cookie }),
          env,
          provider,
        )
      ).status,
    ).toBe(400);
    expect(provider).not.toHaveBeenCalled();
    const changedCookie = `ps_oauth=${state}.${'x'.repeat(43)}`;
    expect(
      (
        await apiFetch(
          request(`/auth/lichess/callback?code=fixture&state=${state}`, undefined, {
            Cookie: changedCookie,
          }),
          env,
          provider,
        )
      ).status,
    ).toBe(400);
    expect(provider).not.toHaveBeenCalled();
    const callback = await apiFetch(
      request(`/auth/lichess/callback?code=fixture&state=${state}`, undefined, { Cookie: cookie }),
      env,
      provider,
    );
    expect(callback.status).toBe(302);
    expect(provider).toHaveBeenCalledTimes(2);
    const [tokenUrl, tokenRequest] = provider.mock.calls[0]!;
    expect(tokenUrl).toBe('https://lichess.org/api/token');
    const params = tokenRequest!.body as URLSearchParams;
    expect(await digest(params.get('code_verifier')!)).toBe(
      target.searchParams.get('code_challenge'),
    );
    expect(params.has('client_secret')).toBe(false);
    expect(provider.mock.calls[1]![0]).toBe('https://lichess.org/api/account');
    expect(
      (
        await apiFetch(
          request(`/auth/lichess/callback?code=fixture&state=${state}`, undefined, {
            Cookie: cookie,
          }),
          env,
          provider,
        )
      ).status,
    ).toBe(400);
    const code = new URL(callback.headers.get('location')!).hash.slice('#login='.length);
    const session = await apiFetch(request('/auth/exchange', { code }), env);
    expect(session.status).toBe(200);
    expect(((await session.json()) as { user: { name: string } }).user.name).toBe('Alice');
    expect((await apiFetch(request('/auth/exchange', { code }), env)).status).toBe(401);
    expect(JSON.stringify((await db.prepare('SELECT * FROM users').all()).results)).not.toContain(
      'lichess-token',
    );
  });
});
