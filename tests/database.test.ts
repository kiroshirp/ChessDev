import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { openLocalDatabase } from '@pixelspace/database/local';
import { UserStore } from '@pixelspace/database';
import { digest, randomToken } from '@pixelspace/auth';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
let db: ReturnType<typeof openLocalDatabase>;
let store: UserStore;
beforeEach(() => {
  db = openLocalDatabase(':memory:');
  store = new UserStore(db);
});
afterEach(() => db.close());
describe('D1-compatible account persistence', () => {
  it('migrates existing identities without losing accounts or results and retires legacy sessions', () => {
    const legacy = new DatabaseSync(':memory:');
    try {
      legacy.exec('PRAGMA foreign_keys=ON');
      for (const file of ['0000_tearful_the_phantom.sql', '0001_natural_lockjaw.sql'])
        legacy.exec(
          readFileSync(
            new URL(`../packages/database/d1-migrations/${file}`, import.meta.url),
            'utf8',
          ),
        );
      legacy.exec(
        "INSERT INTO users(id,discord_id,display_name,created_at) VALUES ('old','123','Old player',1); INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES ('session','old','hash',9999999999999); INSERT INTO chess_results(id,white_id,pgn,result,reason,finished_at) VALUES ('game','old','1. e4 *','*','test',1)",
      );
      legacy.exec(
        readFileSync(
          new URL('../packages/database/d1-migrations/0002_lichess_identity.sql', import.meta.url),
          'utf8',
        ),
      );
      expect(
        legacy.prepare('SELECT provider_id FROM users WHERE id=?').get('old')?.provider_id,
      ).toBe('legacy:123');
      expect(
        legacy.prepare('SELECT white_id FROM chess_results WHERE id=?').get('game')?.white_id,
      ).toBe('old');
      expect(legacy.prepare('SELECT * FROM user_sessions').all()).toHaveLength(0);
      expect(legacy.prepare('PRAGMA foreign_key_check').all()).toHaveLength(0);
    } finally {
      legacy.close();
    }
  });
  it('atomically limits a request bucket without sharing another bucket', async () => {
    const results = await Promise.all(
      Array.from({ length: 31 }, () => store.allowRequest('one-window')),
    );
    expect(results.filter(Boolean)).toHaveLength(30);
    expect(await store.allowRequest('different-window')).toBe(true);
  });
  it('upserts by Lichess identity, keeping private profiles and never requiring email', async () => {
    const id = await store.upsertIdentity('123', 'Alice');
    expect(await store.upsertIdentity('123', 'Alice renamed')).toBe(id);
    const user = await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
    expect(user?.privacy).toBe('private');
    expect(user?.display_name).toBe('Alice renamed');
    expect(user).not.toHaveProperty('email');
  });
  it('stores only session hashes, revokes sessions and rejects expired tokens', async () => {
    const id = await store.upsertIdentity('123', 'Alice');
    const token = randomToken(),
      hash = await digest(token);
    const session = await store.createSession(hash, id);
    expect((await store.identity(hash))?.name).toBe('Alice');
    expect(await store.sessionActive(session.id)).toBe(true);
    expect(await store.identity(token)).toBeNull();
    await store.revoke(hash);
    expect(await store.identity(hash)).toBeNull();
  });
  it('consumes OAuth state and login codes once', async () => {
    const id = await store.upsertIdentity('123', 'Alice');
    await store.putState('hash', Date.now() + 10000);
    expect(await store.consumeState('hash')).not.toBeNull();
    expect(await store.consumeState('hash')).toBeNull();
    await store.putExchange('code', id);
    expect((await store.consumeExchange('code'))?.user_id).toBe(id);
    expect(await store.consumeExchange('code')).toBeNull();
  });
  it('enforces foreign keys, cascades sessions and saves results idempotently', async () => {
    const id = await store.upsertIdentity('123', 'Alice');
    await expect(store.createSession('invalid', 'missing')).rejects.toThrow();
    await store.createSession('hash', id);
    const game = {
      id: crypto.randomUUID(),
      whiteId: id,
      blackId: null,
      pgn: '1. e4 *',
      result: '*',
      reason: 'test',
    };
    await store.saveGame(game);
    await store.saveGame(game);
    expect(await store.history(id)).toHaveLength(1);
    await db.prepare('DELETE FROM users WHERE id=?').bind(id).run();
    expect(await store.identity('hash')).toBeNull();
    expect((await db.prepare('SELECT white_id FROM chess_results').first())?.white_id).toBeNull();
  });
});
