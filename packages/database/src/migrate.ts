import { openLocalDatabase } from './local';
import { fileURLToPath } from 'node:url';
const db = openLocalDatabase(
  process.env.SQLITE_PATH ??
    fileURLToPath(new URL('../../../.local/pixelspace.sqlite', import.meta.url)),
);
db.close();
console.log('Local SQLite migrations applied. Remote D1: use Wrangler migrations apply --remote.');
