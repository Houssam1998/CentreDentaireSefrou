/**
 * Export en lot : toutes les publications de posts/posts.js → instagram/export/*.png
 *   npm run ig:render                 tout exporter
 *   npm run ig:render -- 07 08        seulement les publications dont l'id commence par 07 ou 08
 * Produit aussi export/captions.md (calendrier + légendes) et export/_grid.png (aperçu du profil).
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outDir = resolve(root, 'export');
const filters = process.argv.slice(2).filter((a) => !a.startsWith('-'));

await mkdir(outDir, { recursive: true });
const server = await createServer({ configFile: resolve(root, 'vite.config.js'), logLevel: 'error', server: { port: 5198 } });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('  ⚠ erreur page :', e.message));

try {
  // Récupère la liste des publications depuis la page elle-même (une seule source : posts.js)
  await page.goto(`${base}render.html?post=__list`);
  await page.waitForFunction(() => window.__posts);
  const list = await page.evaluate(() => window.__posts);
  const todo = list.filter((p) => !filters.length || filters.some((f) => p.id.startsWith(f)));

  const files = [];
  for (const p of todo) {
    for (let s = 0; s < p.slides; s++) {
      await page.goto(`${base}render.html?post=${encodeURIComponent(p.id)}&slide=${s}`);
      await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
      const name = p.slides > 1 ? `${p.id}-${s + 1}.png` : `${p.id}.png`;
      const el = await page.$('.ig');
      // Contrôle automatique : texte qui dépasse de son cadre
      const overflow = await page.evaluate(() => {
        const frame = document.querySelector('.ig').getBoundingClientRect();
        const foot = document.querySelector('.ig-foot')?.getBoundingClientRect();
        const bad = [];
        for (const n of document.querySelectorAll('.ig h1, .ig p, .ig li, .ig .card, .ig blockquote')) {
          const r = n.getBoundingClientRect();
          if (r.right > frame.right + 1 || r.bottom > frame.bottom + 1 || (foot && r.bottom > foot.top + 1 && !n.closest('.ig-foot'))) bad.push(n.textContent.trim().slice(0, 40));
          if (n.scrollWidth > n.clientWidth + 2 && getComputedStyle(n).overflow !== 'visible') bad.push('(coupé) ' + n.textContent.trim().slice(0, 40));
        }
        return bad;
      });
      await el.screenshot({ path: resolve(outDir, name) });
      files.push(name);
      console.log(`✓ ${name}${overflow.length ? `   ⚠ déborde : ${overflow.join(' / ')}` : ''}`);
    }
  }

  if (!filters.length) {
    await writeCaptions();
    await writeGrid(list);
  }
} finally {
  await browser.close();
  await server.close();
}

async function writeCaptions() {
  // Import direct du fichier de données (modules ES purs, sans dépendance au navigateur)
  const { posts } = await import(`${resolve(root, 'posts/posts.js').replace(/\\/g, '/').replace(/^/, 'file:///')}`);
  const lines = ['# Calendrier et légendes Instagram — Centre Dentaire Sefrou', '', '> Généré par `npm run ig:render`. Chaque texte médical doit être validé par le Dr Omari avant publication.', ''];
  for (const p of posts) {
    const n = p.slides?.length ?? 1;
    const imgs = n > 1 ? Array.from({ length: n }, (_, i) => `${p.id}-${i + 1}.png`).join(', ') : `${p.id}.png`;
    lines.push(`## ${p.date} — ${p.id}`, '', `Images : ${imgs}${p.dateNote ? `  \n_${p.dateNote}_` : ''}`, '', '**Légende (FR)**', '', p.caption.fr, '', '**الدارجة**', '', p.caption.darija, '', p.hashtags.join(' '), '', '---', '');
  }
  await writeFile(resolve(outDir, 'captions.md'), lines.join('\n'), 'utf8');
  console.log('✓ captions.md');
}

async function writeGrid(list) {
  // Aperçu du profil : 3 colonnes, recadrage 3:4 comme sur Instagram, la plus récente en haut à gauche
  const ordered = [...list].reverse();
  const cells = await Promise.all(
    ordered.map(async (p) => {
      const file = p.slides > 1 ? `${p.id}-1.png` : `${p.id}.png`;
      const b64 = (await readFile(resolve(outDir, file))).toString('base64');
      return `<div class="c"><img src="data:image/png;base64,${b64}"></div>`;
    }),
  );
  const html = `<html><body style="margin:0;background:#fff;width:1080px"><style>
    .g{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.c{aspect-ratio:3/4;overflow:hidden}
    .c img{width:100%;height:100%;object-fit:cover}</style><div class="g">${cells.join('')}</div></body></html>`;
  await page.setViewportSize({ width: 1080, height: 800 });
  await page.setContent(html);
  await page.screenshot({ path: resolve(outDir, '_grid.png'), fullPage: true });
  console.log('✓ _grid.png');
}
