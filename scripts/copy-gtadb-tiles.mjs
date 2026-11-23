#!/usr/bin/env node
/**
 * Copia os tiles do GTADB (git clone local, CC BY 4.0) para public/tiles e gera o manifesto.
 * Uso: node scripts/copy-gtadb-tiles.mjs <pasta maps/tiles/6 do clone do gtadb>
 * Nome de origem: <z>/<z>,<y>,<x>.jpg  ->  destino: <set>/<z>/<x>_<y>.jpg
 */
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Informe a pasta maps/tiles/6 do clone do gtadb.');

const SETS = [
  { id: 'oficial', from: 'day' },
  { id: 'yanis18', from: 'yanis,18' },
];

const manifest = { source: 'https://github.com/rolux/gtadb.org', license: 'CC BY 4.0', sets: {} };
for (const set of SETS) {
  const zooms = {};
  let bytes = 0;
  let count = 0;
  const zDirs = (await readdir(join(source, set.from))).map(Number).sort((a, b) => a - b);
  for (const z of zDirs) {
    const files = await readdir(join(source, set.from, String(z)));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const present = new Set();
    await mkdir(join(root, 'public/tiles', set.id, String(z)), { recursive: true });
    for (const file of files) {
      const match = /^(\d+),(\d+),(\d+)\.jpg$/.exec(file);
      if (!match || Number(match[1]) !== z) throw new Error(`Nome inesperado: ${set.from}/${z}/${file}`);
      const y = Number(match[2]);
      const x = Number(match[3]);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      present.add(`${x}_${y}`);
      const target = join(root, 'public/tiles', set.id, String(z), `${x}_${y}.jpg`);
      await copyFile(join(source, set.from, String(z), file), target);
      bytes += (await stat(target)).size;
      count++;
    }
    const missing = [];
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (!present.has(`${x}_${y}`)) missing.push(`${x}_${y}`);
    zooms[z] = { x0, y0, x1, y1, missing };
  }
  manifest.sets[set.id] = { zooms, count, bytes };
  console.log(`${set.id}: ${count} tiles, ${(bytes / 1048576).toFixed(1)} MB`);
}
await writeFile(join(root, 'public/tiles/manifest.json'), JSON.stringify(manifest));
