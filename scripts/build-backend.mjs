import { build } from 'esbuild';
import { fileURLToPath, URL } from 'node:url';
const app = process.argv[2];
if (!['api', 'world-server'].includes(app)) throw new Error('Unknown backend');
const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  entryPoints: [`${root}/apps/${app}/src/index.ts`],
  outfile: `${root}/apps/${app}/dist/index.js`,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  sourcemap: true,
  external: [
    'fastify',
    '@colyseus/core',
    '@colyseus/schema',
    '@colyseus/ws-transport',
    'zod',
    'chess.js',
  ],
});
