import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from '@colyseus/sdk';

// Exercise the production bundle with the Cloud Run port contract, without
// requiring cloud credentials, Docker, or a running API.
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const child = spawn(process.execPath, ['apps/world-server/dist/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    WORLD_PORT: 'invalid-unused-fallback',
    HOST: '',
    WORLD_SECRET: randomBytes(32).toString('hex'),
    INTERNAL_SECRET: randomBytes(32).toString('hex'),
    API_URL: 'https://api.invalid',
    ALLOWED_ORIGINS: 'https://kiroshirp.github.io',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', (chunk) => (output += chunk));
child.stderr.on('data', (chunk) => (output += chunk));
try {
  let response;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error(`World exited: ${output}`);
    try {
      response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) break;
    } catch {
      // Wait only while the child starts.
    }
    await delay(100);
  }
  assert.equal(response?.status, 200, output);
  assert.equal((await response.json()).multiplayer, true);
  const forbidden = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: 'https://untrusted.invalid' },
  });
  assert.equal(forbidden.status, 403);
  const client = new Client(`http://127.0.0.1:${port}`);
  await assert.rejects(client.joinOrCreate('academy', {}));
  console.log('Cloud Run contract passed: PORT, production start, health, origin and auth.');
} finally {
  child.kill();
  if (child.exitCode === null) await once(child, 'exit');
}
