import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'sqlite',
  schema: './packages/database/src/schema.ts',
  out: './packages/database/d1-migrations',
  strict: true,
});
