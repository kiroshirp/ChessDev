import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseBinding, Statement } from './binding';
export function openLocalDatabase(path: string): DatabaseBinding & { close(): void } {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(
    'PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)',
  );
  const folder = fileURLToPath(
    new URL('../../../packages/database/d1-migrations', import.meta.url),
  );
  for (const name of readdirSync(folder)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    if (db.prepare('SELECT name FROM _migrations WHERE name=?').get(name)) continue;
    db.exec('BEGIN');
    try {
      db.exec(readFileSync(`${folder}/${name}`, 'utf8'));
      db.prepare('INSERT INTO _migrations(name) VALUES (?)').run(name);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  class LocalStatement implements Statement {
    constructor(
      private sql: string,
      private values: SQLInputValue[] = [],
    ) {}
    bind(...values: unknown[]) {
      return new LocalStatement(this.sql, values as SQLInputValue[]);
    }
    async first<T>() {
      return (db.prepare(this.sql).get(...this.values) as T) ?? null;
    }
    async all<T>() {
      return { results: db.prepare(this.sql).all(...this.values) as T[] };
    }
    async run() {
      return db.prepare(this.sql).run(...this.values);
    }
  }
  return {
    prepare: (sql) => new LocalStatement(sql),
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const result = [];
        for (const s of statements) result.push(await s.run());
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => db.close(),
  };
}
