import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const requestLimits = sqliteTable('request_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  privacy: text('privacy').notNull().default('private'),
  development: integer('development', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});
export const sessions = sqliteTable(
  'user_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expiry_idx').on(t.expiresAt)],
);
export const loginStates = sqliteTable('login_states', {
  hash: text('hash').primaryKey(),
  expiresAt: integer('expires_at').notNull(),
});
export const exchanges = sqliteTable('login_exchanges', {
  hash: text('hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});
export const games = sqliteTable('chess_results', {
  id: text('id').primaryKey(),
  whiteId: text('white_id').references(() => users.id, { onDelete: 'set null' }),
  blackId: text('black_id').references(() => users.id, { onDelete: 'set null' }),
  pgn: text('pgn').notNull(),
  result: text('result').notNull(),
  reason: text('reason').notNull(),
  finishedAt: integer('finished_at').notNull(),
});
