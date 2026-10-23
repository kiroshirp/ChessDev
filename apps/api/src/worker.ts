import { UserStore } from '@pixelspace/database';
import type { DatabaseBinding } from '@pixelspace/database/binding';
import { digest, randomToken, signTicket } from '@pixelspace/auth';
import { z } from 'zod';
export interface ApiEnv {
  DB: DatabaseBinding;
  FRONTEND_URL: string;
  WORLD_SECRET: string;
  INTERNAL_SECRET: string;
  ENVIRONMENT: 'local' | 'production';
  LICHESS_CLIENT_ID?: string;
  LICHESS_REDIRECT_URI?: string;
  ALLOWED_ORIGINS?: string;
}
const localHost = (r: Request) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(r.url).hostname);
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
function cookie(r: Request, name: string) {
  return r.headers
    .get('Cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
export async function apiFetch(
  request: Request,
  env: ApiEnv,
  providerFetch: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url),
    store = new UserStore(env.DB),
    origin = request.headers.get('Origin');
  const allowed = new Set([
    new URL(env.FRONTEND_URL).origin,
    ...(env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
  ]);
  if (origin && !allowed.has(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (request.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin ?? new URL(env.FRONTEND_URL).origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        Vary: 'Origin',
      },
    });
  let response: Response;
  try {
    response = await route();
  } catch (error) {
    console.error('API request failed', error instanceof Error ? error.name : 'UnknownError');
    response = json({ error: 'Service unavailable. Please try again.' }, 503);
  }
  const headers = new Headers(response.headers);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
  }
  headers.set('Cache-Control', 'no-store');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, headers });
  async function route(): Promise<Response> {
    if (url.pathname.startsWith('/auth/') || url.pathname === '/world/ticket') {
      const key = await digest(
        `${request.headers.get('CF-Connecting-IP') ?? 'local'}:${url.pathname}:${Math.floor(Date.now() / 60000)}`,
      );
      if (!(await store.allowRequest(key)))
        return json({ error: 'Too many requests. Try again in a minute.' }, 429);
    }
    if (url.pathname === '/health')
      return json({ service: 'pixelspace-api', status: 'ok', database: 'D1-compatible SQLite' });
    const lichess = Boolean(env.LICHESS_CLIENT_ID && env.LICHESS_REDIRECT_URI),
      dev = env.ENVIRONMENT === 'local' && localHost(request);
    if (url.pathname === '/capabilities')
      return json({
        accounts: true,
        lichess,
        developmentAuth: dev,
        multiplayer: true,
        chess: true,
        media: false,
      });
    const internal =
      request.headers.get('Authorization') === `Bearer ${env.INTERNAL_SECRET}` &&
      env.INTERNAL_SECRET.length >= 32;
    if (url.pathname === '/internal/session' && request.method === 'POST') {
      if (!internal) return json({ error: 'Unauthorized' }, 401);
      const body = z.object({ sessionId: z.string().uuid() }).safeParse(await request.json());
      return body.success
        ? json({ active: await store.sessionActive(body.data.sessionId) })
        : json({ error: 'Invalid session' }, 400);
    }
    if (url.pathname === '/internal/results' && request.method === 'POST') {
      if (!internal) return json({ error: 'Unauthorized' }, 401);
      const body = z
        .object({
          id: z.string().uuid(),
          whiteId: z.string().uuid().nullable(),
          blackId: z.string().uuid().nullable(),
          pgn: z.string().max(100000),
          result: z.enum(['1-0', '0-1', '1/2-1/2', '*']),
          reason: z.string().max(80),
        })
        .strict()
        .safeParse(await request.json());
      if (!body.success) return json({ error: 'Invalid result' }, 400);
      await store.saveGame(body.data);
      return json({ saved: true });
    }
    if (request.method === 'POST' && !origin) return json({ error: 'Origin required' }, 403);
    if (url.pathname === '/auth/lichess' && request.method === 'GET') {
      return Response.redirect(`${env.FRONTEND_URL}?signin=lichess`, 302);
    }
    if (url.pathname === '/auth/lichess/callback' && request.method === 'GET') {
      return Response.redirect(`${env.FRONTEND_URL}#autherror=restart`, 302);
    }
    if (url.pathname === '/auth/lichess/start' && request.method === 'POST') {
      if (!lichess) return json({ error: 'Lichess has not been configured' }, 503);
      const body = z
        .object({
          state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        })
        .strict()
        .safeParse(await request.json());
      if (!body.success) return json({ error: 'Invalid OAuth challenge' }, 400);
      const { state, challenge } = body.data;
      await store.putState(await digest(`${state}.${challenge}`), Date.now() + 900000);
      const target = new URL('https://lichess.org/oauth');
      target.search = new URLSearchParams({
        client_id: env.LICHESS_CLIENT_ID!,
        redirect_uri: env.LICHESS_REDIRECT_URI!,
        response_type: 'code',
        scope: '',
        state,
        code_challenge_method: 'S256',
        code_challenge: challenge,
      }).toString();
      return json({ url: target.toString() });
    }
    if (url.pathname === '/auth/lichess/complete' && request.method === 'POST') {
      const body = z
        .object({
          code: z.string().min(1).max(2048),
          state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          verifier: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        })
        .strict()
        .safeParse(await request.json());
      if (!body.success) return json({ error: 'Invalid OAuth response' }, 400);
      const { code, state, verifier } = body.data;
      if (!(await store.consumeState(await digest(`${state}.${await digest(verifier)}`))))
        return json({ error: 'Invalid or expired OAuth state' }, 400);
      if (!lichess) return json({ error: 'Lichess has not been configured' }, 503);
      const exchange = await providerFetch('https://lichess.org/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.LICHESS_CLIENT_ID!,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          code,
          redirect_uri: env.LICHESS_REDIRECT_URI!,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!exchange.ok) return json({ error: 'Lichess authorization failed' }, 502);
      const token = z.object({ access_token: z.string() }).parse(await exchange.json());
      const account = await providerFetch('https://lichess.org/api/account', {
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!account.ok) return json({ error: 'Lichess profile unavailable' }, 502);
      const profile = z
        .object({
          id: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[a-z0-9_-]+$/i),
          username: z.string().min(1).max(100),
        })
        .parse(await account.json());
      const userId = await store.upsertIdentity(
        `lichess:${profile.id.toLowerCase()}`,
        profile.username.slice(0, 32),
      );
      return session(userId);
    }
    if (url.pathname === '/auth/exchange' && request.method === 'POST') {
      const body = z
        .object({ code: z.string().min(30).max(100) })
        .strict()
        .safeParse(await request.json());
      const login = body.success ? await store.consumeExchange(await digest(body.data.code)) : null;
      if (!login) return json({ error: 'Login code expired or already used' }, 401);
      return session(login.user_id);
    }
    if (url.pathname === '/auth/dev' && request.method === 'POST') {
      if (!dev) return json({ error: 'Not found' }, 404);
      const body = z
        .object({ name: z.string().trim().min(2).max(24) })
        .strict()
        .safeParse(await request.json());
      if (!body.success) return json({ error: 'Invalid display name' }, 400);
      return session(
        await store.upsertIdentity(`dev:${crypto.randomUUID()}`, body.data.name, true),
      );
    }
    const token =
      request.headers.get('Authorization')?.replace(/^Bearer /, '') ??
      cookie(request, 'ps_session');
    const identity = token ? await store.identity(await digest(token)) : null;
    if (url.pathname === '/auth/me')
      return identity ? json({ user: identity }) : json({ error: 'Unauthorized' }, 401);
    if (!identity) return json({ error: 'Sign in with Lichess' }, 401);
    if (env.ENVIRONMENT === 'production' && identity.development)
      return json({ error: 'Development identity is not allowed' }, 403);
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      await store.revoke(await digest(token!));
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `ps_session=; HttpOnly; Path=/; SameSite=${url.protocol === 'https:' ? 'None; Secure' : 'Lax'}; Max-Age=0`,
        },
      });
    }
    if (url.pathname === '/world/ticket' && request.method === 'POST')
      return json({ ticket: await signTicket(identity, env.WORLD_SECRET) });
    if (url.pathname === '/games' && request.method === 'GET')
      return json({ games: await store.history(identity.userId) });
    return json({ error: 'Not found' }, 404);
  }
  async function session(userId: string) {
    const token = randomToken();
    await store.createSession(await digest(token), userId);
    return new Response(
      JSON.stringify({ token, user: await store.identity(await digest(token)) }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `ps_session=${token}; HttpOnly; Path=/; SameSite=${url.protocol === 'https:' ? 'None; Secure' : 'Lax'}; Max-Age=28800`,
        },
      },
    );
  }
}
export default {
  fetch(request: Request, env: ApiEnv) {
    return apiFetch(request, env);
  },
  async scheduled(_event: unknown, env: ApiEnv) {
    await new UserStore(env.DB).cleanup();
  },
};
