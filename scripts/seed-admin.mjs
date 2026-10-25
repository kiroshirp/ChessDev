// Utilidad local: nunca se publica ni imprime contraseñas o hashes.
import { loadEnvFile } from 'node:process';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
loadEnvFile(new URL('../.env', import.meta.url));
if (process.env.ADMIN_USERNAME !== 'ChessDev' || !process.env.ADMIN_PASSWORD || process.env.FIREBASE_PROJECT_ID !== 'chessdev-topchess') throw new Error('Configura las credenciales privadas y el proyecto de ChessDev en .env.');
const salt = randomBytes(32);
const hash = pbkdf2Sync(process.env.ADMIN_PASSWORD, salt, 100000, 32, 'sha256');
const temporary = new URL('../tmp/private-admin-import.json', import.meta.url);
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
try {
  await writeFile(temporary, JSON.stringify({ users: [{ localId: 'chessdev-admin', email: 'chessdev@admin.invalid', displayName: 'ChessDev', passwordHash: hash.toString('base64'), salt: salt.toString('base64'), emailVerified: false, disabled: false }] }), { mode: 0o600 });
  const cli = process.env.FIREBASE_CLI_PATH || (process.platform === 'win32' ? join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/bin/firebase.js') : '');
  if (!cli || !existsSync(cli)) throw new Error('Indica la ruta de la herramienta Firebase en FIREBASE_CLI_PATH.');
  const command = [cli, 'auth:import', fileURLToPath(temporary), '--hash-algo=PBKDF2_SHA256', '--rounds=100000', '--project', 'chessdev-topchess'];
  const result = spawnSync(process.execPath, command, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  if (result.status !== 0) {
    const output = String(result.stdout || '') + String(result.stderr || '');
    const code = ['CONFIGURATION_NOT_FOUND','PROJECT_NOT_FOUND','INSUFFICIENT_PERMISSION','INVALID_HASH_ALGORITHM','INVALID_PASSWORD_HASH'].find(value => output.includes(value));
    throw new Error(`No se pudo importar la cuenta de administrador${code ? ` (${code})` : ''}. Comprueba la configuración de Firebase.`);
  }
  console.log('Cuenta de administrador configurada. No se han publicado las credenciales.');
} finally { await rm(temporary, { force: true }); }
