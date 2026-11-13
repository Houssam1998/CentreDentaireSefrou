/**
 * Contrôle de l'importateur : chaque publication est importée dans l'éditeur, rendue, puis comparée
 * pixel par pixel à l'export des modèles (npm run ig:render doit avoir été lancé avant).
 *   node instagram/scripts/regress.mjs [préfixes…]
 * Les images de différence sont écrites dans export/_regress/.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const exp = resolve(root, 'export');
const outDir = resolve(exp, '_regress');
const filters = process.argv.slice(2);
const LIMIT = 1.5; // % de pixels différents toléré

await mkdir(outDir, { recursive: true });
const server = await createServer({ configFile: resolve(root, 'vite.config.js'), logLevel: 'error', server: { port: 5195 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('  ⚠', e.message));
let failed = 0;
try {
  await page.goto(`${base}render.html?post=__list`);
  await page.waitForFunction(() => window.__posts);
  const list = (await page.evaluate(() => window.__posts)).filter((p) => !filters.length || filters.some((f) => p.id.startsWith(f)));
  for (const p of list) {
    for (let s = 0; s < p.slides; s++) {
      const name = p.slides > 1 ? `${p.id}-${s + 1}.png` : `${p.id}.png`;
      await page.goto(`${base}regress.html?post=${p.id}&slide=${s}`);
      await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
      if ((await page.evaluate(() => window.__ready)) === 'error') { console.log(`✗ ${name} : erreur d'import`); failed++; continue; }
      const shot = PNG.sync.read(await (await page.$('.ig')).screenshot());
      const ref = PNG.sync.read(await readFile(resolve(exp, name)));
      const { width, height } = ref;
      const diff = new PNG({ width, height });
      const n = pixelmatch(ref.data, shot.data, diff.data, width, height, { threshold: 0.12 });
      const pct = (n / (width * height)) * 100;
      const ok = pct <= LIMIT;
      if (!ok) failed++;
      await writeFile(resolve(outDir, name.replace('.png', '-diff.png')), PNG.sync.write(diff));
      await writeFile(resolve(outDir, name.replace('.png', '-scene.png')), PNG.sync.write(shot));
      console.log(`${ok ? '✓' : '✗'} ${name.padEnd(36)} ${pct.toFixed(2)} %`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
