import { test, expect } from '@playwright/test';
import { Client } from '@colyseus/sdk';
import { WorldState } from '@pixelspace/realtime';
const origin = 'http://127.0.0.1:5174';
async function login(name: string) {
  const response = await fetch('http://127.0.0.1:3001/auth/dev', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const auth = (await response.json()) as { token: string };
  const ticket = await fetch('http://127.0.0.1:3001/world/ticket', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: '{}',
  });
  return { ticket: ((await ticket.json()) as { ticket: string }).ticket, token: auth.token };
}
test('protocol rejects missing identity, forged positions, duplicate input and remote interaction; reconnect preserves identity', async () => {
  const client = new Client('http://127.0.0.1:2567');
  await expect(client.joinOrCreate('academy', { name: 'Impostor' })).rejects.toThrow();
  const auth = await login('Protocol');
  const room = await client.joinOrCreate<WorldState>(
    'academy',
    { ticket: auth.ticket },
    WorldState,
  );
  let error = '';
  room.onMessage('activity:error', (value: string) => {
    error = value;
  });
  room.onMessage('chess:state', () => {});
  room.onMessage('activity:open', () => {});
  try {
    await expect.poll(() => room.state?.players?.get(room.sessionId)?.x).toBeGreaterThan(0);
    const start = room.state.players.get(room.sessionId)!.x;
    room.send('world:move', {
      sequence: 1,
      horizontal: 1,
      vertical: 0,
      x: 9000,
      playerId: 'someone-else',
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(room.state.players.get(room.sessionId)!.x).toBe(start);
    room.send('world:interact', 'table-1');
    await expect.poll(() => error).toBe('TOO_FAR');
    room.send('world:move', { sequence: 2, horizontal: 1, vertical: 0 });
    room.send('world:move', { sequence: 2, horizontal: -1, vertical: 0 });
    await expect.poll(() => room.state.players.get(room.sessionId)!.x).toBeGreaterThan(start);
    room.send('world:move', { sequence: 3, horizontal: 0, vertical: 0 });
    await expect(client.joinOrCreate('academy', { ticket: auth.ticket })).rejects.toThrow();
    room.reconnection.enabled = false;
    const reconnectToken = room.reconnectionToken,
      id = room.sessionId;
    room.connection.close(4000);
    const rejoined = await client.reconnect<WorldState>(reconnectToken, WorldState);
    expect(rejoined.sessionId).toBe(id);
    await expect.poll(() => rejoined.state?.players?.get(id)?.online).toBe(true);
    await rejoined.leave();
  } finally {
    if (room.connection.isOpen) await room.leave();
    await fetch('http://127.0.0.1:3001/auth/logout', {
      method: 'POST',
      headers: {
        Origin: origin,
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
  }
});
