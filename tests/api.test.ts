import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { openLocalDatabase } from '@pixelspace/database/local';
import { apiFetch, type ApiEnv } from '../apps/api/src/worker';
import { digest, randomToken } from '@pixelspace/auth';
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
  it('completes browser-bound Lichess PKCE without cookies, rejects manipulation and replay', async () => {
    Object.assign(env, {
      ENVIRONMENT: 'production',
      LICHESS_CLIENT_ID: 'chessdev-test',
      LICHESS_REDIRECT_URI: `${origin}/`,
    });
    const state = randomToken(),
      verifier = randomToken(),
      challenge = await digest(verifier);
    const authorization = await apiFetch(request('/auth/lichess/start', { state, challenge }), env);
    expect(authorization.status).toBe(200);
    expect(authorization.headers.has('set-cookie')).toBe(false);
    const target = new URL(((await authorization.json()) as { url: string }).url);
    expect(target.origin + target.pathname).toBe('https://lichess.org/oauth');
    expect(target.searchParams.get('scope')).toBe('');
    expect(target.searchParams.get('redirect_uri')).toBe(`${origin}/`);
    expect(target.searchParams.get('code_challenge')).toBe(challenge);
    expect(target.searchParams.get('code_challenge_method')).toBe('S256');
    const provider = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: 'lichess-token-not-persisted' }))
      .mockResolvedValueOnce(Response.json({ id: 'alice', username: 'Alice' }));
    for (const changed of [
      { state: randomToken(), verifier },
      { state, verifier: randomToken() },
    ])
      expect(
        (
          await apiFetch(
            request('/auth/lichess/complete', { code: 'fixture', ...changed }),
            env,
            provider,
          )
        ).status,
      ).toBe(400);
    expect(provider).not.toHaveBeenCalled();
    const response = await apiFetch(
      request('/auth/lichess/complete', { code: 'fixture', state, verifier }),
      env,
      provider,
    );
    expect(response.status).toBe(200);
    const session = (await response.json()) as { token: string; user: { name: string } };
    expect(session.user.name).toBe('Alice');
    expect(
      (
        await apiFetch(
          request('/auth/me', undefined, { Authorization: `Bearer ${session.token}` }),
          env,
        )
      ).status,
    ).toBe(200);
    const [tokenUrl, tokenRequest] = provider.mock.calls[0]!;
    expect(tokenUrl).toBe('https://lichess.org/api/token');
    const params = tokenRequest!.body as URLSearchParams;
    expect(await digest(params.get('code_verifier')!)).toBe(challenge);
    expect(params.has('client_secret')).toBe(false);
    expect(provider.mock.calls[1]![0]).toBe('https://lichess.org/api/account');
    expect(
      (
        await apiFetch(
          request('/auth/lichess/complete', { code: 'fixture', state, verifier }),
          env,
          provider,
        )
      ).status,
    ).toBe(400);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(JSON.stringify((await db.prepare('SELECT * FROM users').all()).results)).not.toContain(
      'lichess-token',
    );
  });
  it('expires OAuth challenges and keeps concurrent logins independent', async () => {
    Object.assign(env, { LICHESS_CLIENT_ID: 'chessdev-test', LICHESS_REDIRECT_URI: `${origin}/` });
    const first = { state: randomToken(), verifier: randomToken() },
      second = { state: randomToken(), verifier: randomToken() };
    for (const flow of [first, second])
      expect(
        (
          await apiFetch(
            request('/auth/lichess/start', {
              state: flow.state,
              challenge: await digest(flow.verifier),
            }),
            env,
          )
        ).status,
      ).toBe(200);
    await db
      .prepare('UPDATE login_states SET expires_at=0 WHERE hash=?')
      .bind(await digest(`${first.state}.${await digest(first.verifier)}`))
      .run();
    const provider = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: 'fixture' }))
      .mockResolvedValueOnce(Response.json({ id: 'bob', username: 'Bob' }));
    expect(
      (
        await apiFetch(
          request('/auth/lichess/complete', { code: 'fixture', ...first }),
          env,
          provider,
        )
      ).status,
    ).toBe(400);
    expect(provider).not.toHaveBeenCalled();
    expect(
      (
        await apiFetch(
          request('/auth/lichess/complete', { code: 'fixture', ...second }),
          env,
          provider,
        )
      ).status,
    ).toBe(200);
  });
});
