/**
 * Test de bout en bout de l'éditeur (Playwright) :
 *   node instagram/scripts/e2e.mjs [dossier-de-sortie]
 * Ouvre un modèle, déplace / redimensionne / pivote, édite un texte arabe, annule, ajoute des éléments,
 * importe et recadre une photo, gère les pages, exporte (PNG, ZIP, projet), recharge, rouvre le projet.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const igRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(igRoot, '..');
const out = resolve(process.argv[2] ?? resolve(igRoot, 'export/_e2e'));
await mkdir(out, { recursive: true });

const server = await createServer({ configFile: resolve(igRoot, 'vite.config.js'), logLevel: 'error', server: { port: 5193 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
let failures = 0;
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
const ok = (name, cond, extra = '') => { if (!cond) failures++; console.log(`${cond ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`); };

const hook = () => page.evaluate(async () => {
  const m = await import('/studio/store/editor.ts');
  window.__st = () => {
    const s = m.useEditor.getState();
    const p = s.project.pages.find((x) => x.id === s.pageId);
    return { els: p.elements, sel: s.selection, pages: s.project.pages.length, tone: p.tone, editing: s.editingId, crop: s.cropId, name: s.project.name };
  };
});
const state = () => page.evaluate(() => window.__st());
const els = async () => (await state()).els;
/** Vrai si l'élément est réellement visible : dans l'écran et non recouvert. */
const visible = (sel) => page.locator(sel).evaluate((n) => {
  const r = n.getBoundingClientRect();
  if (r.width < 2 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && (n === hit || n.contains(hit));
});
const passCheck = async () => {
  await page.waitForTimeout(300);
  if (await page.locator('.modal:has-text("Avant de publier")').count()) await page.click('button:has-text("Télécharger quand même")');
};

try {
  await page.goto(base);
  await page.waitForSelector('.workspace .ig.free');
  await hook();
  await page.click('.tpl-btn[title="07-conseil-gencives"]');
  await page.waitForFunction(() => document.querySelectorAll('.workspace .ig.free .el').length > 5);
  await page.waitForTimeout(500);
  const title = (await els()).find((e) => e.type === 'text' && e.html.includes('Gencives'));
  const node = `.workspace .el[data-id="${title.id}"]`;

  // 1. Sélection par clic
  const box = await page.locator(node).boundingBox();
  await page.mouse.click(box.x + 40, box.y + 20);
  await page.waitForTimeout(200);
  ok('clic sélectionne', (await state()).sel.includes(title.id));
  ok('poignées visibles', (await page.locator('.mv .moveable-control.moveable-se').count()) > 0);

  // 2. Déplacer
  const zoom = await page.evaluate(() => window.__zoom);
  await page.mouse.move(box.x + 40, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 70, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  let t = (await els()).find((e) => e.id === title.id);
  ok('glisser déplace', Math.abs(t.x - (title.x + 50 / zoom)) < 10 && Math.abs(t.y - (title.y + 50 / zoom)) < 10, `x ${title.x}→${t.x}, y ${title.y}→${t.y}`);

  // 3. Annuler / rétablir
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(150);
  t = (await els()).find((e) => e.id === title.id);
  ok('Ctrl+Z annule', t.x === title.x && t.y === title.y);
  await page.keyboard.press('Control+y');
  await page.waitForTimeout(150);
  t = (await els()).find((e) => e.id === title.id);
  ok('Ctrl+Y rétablit', t.x !== title.x);

  // 4. Redimensionner par le coin : le texte grandit
  const se = await page.locator('.mv .moveable-control.moveable-se').boundingBox();
  await page.mouse.move(se.x + se.width / 2, se.y + se.height / 2);
  await page.mouse.down();
  await page.mouse.move(se.x + 66, se.y + 46, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const t2 = (await els()).find((e) => e.id === title.id);
  ok('coin agrandit le texte', t2.size > t.size && t2.w > t.w, `taille ${t.size}→${t2.size}`);

  // 5. Rotation
  const rot = await page.locator('.mv .moveable-rotation-control').boundingBox();
  await page.mouse.move(rot.x + rot.width / 2, rot.y + rot.height / 2);
  await page.mouse.down();
  await page.mouse.move(rot.x + 120, rot.y - 10, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const t3 = (await els()).find((e) => e.id === title.id);
  ok('rotation', Math.abs(t3.rotation) > 2, `rotation ${t3.rotation}°`);
  await page.screenshot({ path: resolve(out, '3-transformed.png') });

  // 6. Édition d'un texte arabe (double-clic)
  const ar = (await els()).find((e) => e.type === 'text' && e.dir === 'rtl' && e.html.includes('نزيف'));
  const arBox = await page.locator(`.workspace .el[data-id="${ar.id}"]`).boundingBox();
  await page.mouse.dblclick(arBox.x + arBox.width - 40, arBox.y + 15);
  await page.waitForSelector('.el-text.editing');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('اختبار التحرير');
  await page.screenshot({ path: resolve(out, '4-editing.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok('édition arabe', (await els()).find((e) => e.id === ar.id).html === 'اختبار التحرير');

  // 6 bis. Pipette de couleur de l'inspecteur : visible et appliquée
  await page.mouse.click(arBox.x + arBox.width - 40, arBox.y + 15);
  await page.waitForTimeout(150);
  await page.click('.inspector .field.small:has-text("Couleur") .swatch-btn');
  await page.waitForSelector('.color-pop');
  ok('pipette visible à l’écran', await visible('.color-pop .swatches >> nth=1'));
  await page.click('.color-pop button[title="Rouge drapeau"]');
  ok('couleur appliquée', (await els()).find((e) => e.id === ar.id).color === '#c1272d');
  await page.keyboard.press('Control+z');

  // 7. Ajouter une icône au clic, et une arche par glisser-déposer
  await page.click('.rail-btn:has-text("Éléments")');
  await page.click('.icon-tile[title^="dent"]');
  await page.waitForTimeout(200);
  ok('icône ajoutée et sélectionnée', (await state()).sel.length === 1 && (await els()).some((e) => e.type === 'icon' && e.name === 'tooth' && !e.disc));
  const n0 = (await els()).length;
  const ws = await page.locator('.workspace').boundingBox();
  await page.dragAndDrop('.tile[title^="Arche lumineuse"]', '.workspace', { targetPosition: { x: ws.width / 2 - 100, y: 200 } });
  await page.waitForTimeout(300);
  ok('glisser-déposer depuis le panneau', (await els()).length === n0 + 1 && (await els()).at(-1).shape === 'arch');

  // 8. Photo : import puis recadrage
  await page.click('.rail-btn:has-text("Photos")');
  await page.locator('.rail-btn:has-text("Photos")').waitFor();
  await page.keyboard.press('Escape');
  await page.setInputFiles('.side-panel input[type=file]', resolve(root, 'src/assets/media/clinic/waiting-room.jpg'));
  await page.waitForFunction(() => window.__st().els.some((e) => e.type === 'image' && e.src.startsWith('asset:')), null, { timeout: 10000 });
  ok('photo importée (IndexedDB)', true);
  const img = (await els()).find((e) => e.type === 'image' && e.src.startsWith('asset:'));
  const ib = await page.locator(`.workspace .el[data-id="${img.id}"]`).boundingBox();
  await page.mouse.dblclick(ib.x + ib.width / 2, ib.y + ib.height / 2);
  await page.waitForSelector('.crop-layer');
  await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
  await page.mouse.down();
  await page.mouse.move(ib.x + ib.width / 2 + 40, ib.y + ib.height / 2, { steps: 5 });
  await page.mouse.up();
  const img2 = (await els()).find((e) => e.id === img.id);
  ok('recadrage', img2.crop.x !== img.crop.x, `crop.x ${img.crop.x}→${img2.crop.x}`);
  await page.click('.ctx button:has-text("Terminé")');

  // 9. Pages, ambiance, variantes
  await page.click('.page-actions button[title="Dupliquer la page"]');
  await page.waitForTimeout(200);
  ok('page dupliquée', (await state()).pages === 2);
  await page.click('.topbar .seg button:has-text("Soirée")');
  await page.waitForTimeout(200);
  ok('ambiance Soirée', (await state()).tone === 'night');
  await page.click('.topbar .tb-variants button');
  await page.waitForSelector('.var');
  await page.waitForTimeout(150);
  ok('variantes visibles à l’écran', await visible('.var >> nth=3'));
  await page.screenshot({ path: resolve(out, '5-variants.png') });
  await page.click('.var >> nth=0');
  await page.waitForTimeout(200);

  // 10. Exports
  await page.click('.topbar button:has-text("Télécharger")');
  const [png] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('.menu button:has-text("Cette page")').then(passCheck)]);
  await png.saveAs(resolve(out, 'export-page.png'));
  ok('export PNG', true, png.suggestedFilename());
  await page.click('.topbar button:has-text("Télécharger")');
  const [zip] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.menu button:has-text("Toutes les pages")').then(passCheck)]);
  await zip.saveAs(resolve(out, 'export.zip'));
  ok('export ZIP', true, zip.suggestedFilename());
  await page.click('.topbar button:has-text("Télécharger")');
  const [json] = await Promise.all([page.waitForEvent('download'), page.click('.menu button:has-text("Fichier projet")')]);
  await json.saveAs(resolve(out, 'projet.studio.json'));
  ok('export fichier projet', true, json.suggestedFilename());

  // 11. Persistance
  await page.waitForTimeout(1200);
  const before = await state();
  await page.reload();
  await page.waitForSelector('.workspace .ig.free .el');
  await hook();
  const after = await state();
  ok('projet conservé après rechargement', after.pages === before.pages && after.name === before.name, `${after.pages} pages, « ${after.name} »`);
  await page.waitForTimeout(500);
  ok('photo importée réaffichée', (await page.locator('.workspace .el-image img[src^="blob:"]').count()) > 0);

  // 12. Rouvrir le fichier projet
  await page.click('.topbar button:has-text("Mes créations")');
  await page.setInputFiles('.modal input[type=file]', resolve(out, 'projet.studio.json'));
  await page.waitForTimeout(1500);
  await page.click('.topbar button:has-text("Mes créations")');
  await page.waitForTimeout(500);
  const nproj = await page.locator('.proj').count();
  ok('fichier projet rouvert (nouvelle création)', nproj >= 2, `${nproj} créations`);
  await page.screenshot({ path: resolve(out, '6-projects.png') });
  await page.keyboard.press('Escape');

  // 13. Tablette et téléphone
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(out, '7-tablet.png') });
  ok('tablette : bouton Télécharger visible', await visible('.topbar .btn.primary'));
  ok('tablette : zoom visible', await visible('.zoom-v'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(out, '8-phone.png') });
  ok('téléphone : bouton Télécharger visible', await visible('.topbar .btn.primary'));
  ok('téléphone sans défilement horizontal', !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
} catch (e) {
  failures++;
  console.log('✗ arrêt :', e.message.split('\n')[0]);
  await page.screenshot({ path: resolve(out, 'error.png') }).catch(() => {});
} finally {
  console.log('Erreurs de la page :', errors.length ? errors.slice(0, 10) : 'aucune');
  await browser.close();
  await server.close();
}
process.exit(failures ? 1 : 0);
