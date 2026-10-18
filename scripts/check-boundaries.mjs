import { readdir, readFile } from 'node:fs/promises';
const roots = ['packages/shared', 'packages/map-engine', 'packages/world-engine'];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist'].includes(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await scan(path);
    else if (/\.(ts|tsx|json)$/.test(path)) {
      const source = await readFile(path, 'utf8');
      if (/['"](?:@pixelspace\/chess[^'"]*|chess\.js|chessground)['"]/.test(source)) {
        throw new Error(`Core must not depend on chess: ${path}`);
      }
    }
  }
}
for (const root of roots) await scan(root);
console.log('Core/chess dependency boundary: OK');
