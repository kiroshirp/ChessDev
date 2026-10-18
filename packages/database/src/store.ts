import type { DatabaseBinding } from './binding';
import type { Identity } from '@pixelspace/auth';
export class UserStore {
  async allowRequest(key: string) {
    const row = await this.db
      .prepare(
        'INSERT INTO request_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
      )
      .bind(key, Date.now() + 120000)
      .first<{ count: number }>();
    return !!row && row.count <= 30;
  }
  constructor(private db: DatabaseBinding) {}
  async upsertDiscord(discordId: string, displayName: string, development = false) {
    const row = await this.db
      .prepare(
        'INSERT INTO users (id,discord_id,display_name,development,created_at) VALUES (?,?,?,?,?) ON CONFLICT(discord_id) DO UPDATE SET display_name=excluded.display_name RETURNING id',
      )
      .bind(crypto.randomUUID(), discordId, displayName, Number(development), Date.now())
      .first<{ id: string }>();
    if (!row) throw new Error('Unable to persist user');
    return row.id;
  }
  async putState(hash: string, expires: number) {
    await this.db
      .prepare('INSERT INTO login_states (hash,expires_at) VALUES (?,?)')
      .bind(hash, expires)
      .run();
  }
  async consumeState(hash: string) {
    return this.db
      .prepare('DELETE FROM login_states WHERE hash=? AND expires_at>? RETURNING hash')
      .bind(hash, Date.now())
      .first();
  }
  async putExchange(hash: string, userId: string) {
    await this.db
      .prepare('INSERT INTO login_exchanges (hash,user_id,expires_at) VALUES (?,?,?)')
      .bind(hash, userId, Date.now() + 60000)
      .run();
  }
  async consumeExchange(hash: string) {
    return this.db
      .prepare('DELETE FROM login_exchanges WHERE hash=? AND expires_at>? RETURNING user_id')
      .bind(hash, Date.now())
      .first<{ user_id: string }>();
  }
  async createSession(hash: string, userId: string) {
    const id = crypto.randomUUID();
    const expires = Date.now() + 8 * 60 * 60 * 1000;
    await this.db
      .prepare('INSERT INTO user_sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)')
      .bind(id, userId, hash, expires)
      .run();
    return { id, expires };
  }
  async identity(tokenHash: string): Promise<Identity | null> {
    const row = await this.db
      .prepare(
        'SELECT u.id as userId,u.display_name as name,s.id as sessionId,u.development FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',
      )
      .bind(tokenHash, Date.now())
      .first<Omit<Identity, 'development'> & { development: number }>();
    return row ? { ...row, development: Boolean(row.development) } : null;
  }
  async sessionActive(id: string) {
    return !!(await this.db
      .prepare('SELECT id FROM user_sessions WHERE id=? AND expires_at>?')
      .bind(id, Date.now())
      .first());
  }
  async revoke(hash: string) {
    await this.db.prepare('DELETE FROM user_sessions WHERE token_hash=?').bind(hash).run();
  }
  async cleanup() {
    await this.db.batch(
      ['login_states', 'login_exchanges', 'user_sessions', 'request_limits'].map((table) =>
        this.db.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(Date.now()),
      ),
    );
  }
  async saveGame(g: {
    id: string;
    whiteId: string | null;
    blackId: string | null;
    pgn: string;
    result: string;
    reason: string;
  }) {
    await this.db
      .prepare(
        'INSERT INTO chess_results (id,white_id,black_id,pgn,result,reason,finished_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
      )
      .bind(g.id, g.whiteId, g.blackId, g.pgn, g.result, g.reason, Date.now())
      .run();
  }
  async history(id: string) {
    return (
      await this.db
        .prepare(
          'SELECT id,pgn,result,reason,finished_at FROM chess_results WHERE white_id=? OR black_id=? ORDER BY finished_at DESC LIMIT 20',
        )
        .bind(id, id)
        .all()
    ).results;
  }
}
