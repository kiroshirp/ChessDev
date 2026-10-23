import { buildApp } from './app.js';
import { openLocalDatabase } from '@pixelspace/database/local';
import { fileURLToPath } from 'node:url';
if (process.env.NODE_ENV === 'production')
  throw new Error(
    'Use the Cloudflare Worker in production; this is a loopback development adapter.',
  );
const db = openLocalDatabase(
  process.env.SQLITE_PATH ??
    fileURLToPath(new URL('../../../.local/pixelspace.sqlite', import.meta.url)),
);
const app = buildApp({
  DB: db,
  ENVIRONMENT: 'local',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5174',
  WORLD_SECRET: process.env.WORLD_SECRET ?? 'pixelspace-local-world-secret-change-in-production',
  INTERNAL_SECRET:
    process.env.INTERNAL_SECRET ?? 'pixelspace-local-internal-secret-change-in-production',
  LICHESS_CLIENT_ID: process.env.LICHESS_CLIENT_ID ?? 'chessdev',
  LICHESS_REDIRECT_URI:
    process.env.LICHESS_REDIRECT_URI ?? process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/',
});
app.addHook('onClose', async () => db.close());
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => void app.close());
await app.listen({
  port: Number(process.env.API_PORT ?? 3001),
  host: process.env.HOST ?? '127.0.0.1',
});
console.log(`PixelSpace local API: http://127.0.0.1:${process.env.API_PORT ?? 3001}`);
