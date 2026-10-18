import assert from 'node:assert/strict';
import { URL } from 'node:url';

const origin = 'https://kiroshirp.github.io';
const api = process.env.VITE_API_URL;
const world = process.env.VITE_WORLD_URL;
assert(api && world, 'Set VITE_API_URL and VITE_WORLD_URL to deployed services');
for (const address of [api, world]) assert.equal(new URL(address).protocol, 'https:');
async function request(base, path, expected, body) {
  const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    signal: AbortSignal.timeout(75000), // Render Free can need ~1 minute to wake.
    headers: {
      Origin: origin,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
  });
  assert.equal(response.status, expected, `${path}: unexpected HTTP status`);
  console.log(`${new URL(base).hostname}${path}: ${response.status}`);
  return response;
}
assert.equal((await (await request(api, '/health', 200)).json()).status, 'ok');
const caps = await (await request(api, '/capabilities', 200)).json();
assert.equal(caps.developmentAuth, false);
assert.equal(caps.accounts, true);
assert.equal(caps.discord, true, 'Configure Discord before publishing connected Pages');
console.log(`Discord configured: ${caps.discord === true}`);
await request(api, '/auth/me', 401);
await request(api, '/auth/dev', 404, { name: 'Must not authenticate' });
await request(api, '/world/ticket', 401, {});
assert.equal((await (await request(world, '/health', 200)).json()).multiplayer, true);
console.log(
  'Public infrastructure checks passed. Real Discord/two-user gameplay requires separate verification.',
);
