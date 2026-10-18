import type { RequestHandler } from 'express';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { AcademyRoom } from './AcademyRoom.js';
const production = process.env.NODE_ENV === 'production';
const origins = new Set(
  (
    process.env.ALLOWED_ORIGINS ??
    'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174'
  ).split(','),
);
const worldSecret =
  process.env.WORLD_SECRET ??
  (production ? '' : 'pixelspace-local-world-secret-change-in-production');
const internalSecret =
  process.env.INTERNAL_SECRET ??
  (production ? '' : 'pixelspace-local-internal-secret-change-in-production');
if (worldSecret.length < 32 || internalSecret.length < 32)
  throw new Error('Configure WORLD_SECRET and INTERNAL_SECRET');
AcademyRoom.config = {
  worldSecret,
  internalSecret,
  apiUrl: process.env.API_URL ?? 'http://127.0.0.1:3001',
  production,
};
const server = new Server({
  transport: new WebSocketTransport({
    maxPayload: 4096,
    beforeUpgrade: (_request, context) => {
      const origin = context.headers.get('origin');
      if (origin && !origins.has(origin))
        return new Response('Origin not allowed', { status: 403 });
    },
  }),
  greet: false,
  express: (app) => {
    const guard: RequestHandler = (req, res, next) => {
      const origin = req.headers.origin;
      if (origin && !origins.has(origin)) {
        res.status(403).end();
        return;
      }
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      }
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
    };
    app.use(guard);
    app.get('/health', (_req, res) =>
      res.json({ service: 'pixelspace-world', status: 'ok', multiplayer: true }),
    );
  },
});
server.define('academy', AcademyRoom);
// Cloud Run injects PORT. Local development retains WORLD_PORT and loopback.
const port = Number(process.env.PORT ?? process.env.WORLD_PORT ?? 2567);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT/WORLD_PORT must be a valid TCP port');
await server.listen(port, process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'));
console.log(`PixelSpace Colyseus: ${port}`);
