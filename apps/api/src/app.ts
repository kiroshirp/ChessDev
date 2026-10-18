import Fastify from 'fastify';
import { apiFetch, type ApiEnv } from './worker.js';
export function buildApp(env: ApiEnv) {
  const app = Fastify({ logger: false, bodyLimit: 65536 });
  app.all('/*', async (request, reply) => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers))
      if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
    const init: RequestInit = { method: request.method, headers };
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined)
      init.body = JSON.stringify(request.body);
    const response = await apiFetch(
      new Request(`http://${request.headers.host ?? '127.0.0.1:3001'}${request.url}`, init),
      env,
    );
    reply.code(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    return reply.send(await response.text());
  });
  return app;
}
