/**
 * Test de bout en bout de la « Nouvelle publication guidée » (Playwright) :
 *   node instagram/scripts/e2e-wizard.mjs [dossier-de-sortie]
 * Type Fête → Aïd al-Adha → textes et légende pré-remplis → Créer → la page garde son modèle →
 * « Changer l'occasion » → Aïd al-Fitr → page régénérée → Annuler → retour à l'Aïd al-Adha.
 * Puis : prochaines occasions, nouvelle création (assistant ouvert), autre type (Conseil).
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const igRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(process.argv[2] ?? resolve(igRoot, 'export/_e2e'));
await mkdir(out, { recursive: true });

const server = await createServer({ configFile: resolve(igRoot, 'vite.config.js'), logLevel: 'error', server: { port: 5194 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
let failures = 0;
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
const ok = (name, cond, extra = '') => { if (!cond) failures++; console.log(`${cond ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`); };

const state = () => page.evaluate(async () => {
  const m = await import('/studio/store/editor.ts');
  const s = m.useEditor.getState();
  const p = s.project.pages.find((x) => x.id === s.pageId);
  return {
    pages: s.project.pages.length,
    source: p.source ?? null,
    texts: p.elements.filter((e) => e.type === 'text').map((e) => e.html),
    motifs: p.elements.filter((e) => e.type === 'motif').length,
    caption: s.project.caption,
    hashtags: s.project.hashtags,
    name: s.project.name,
    date: s.project.date,
    format: s.project.format,
  };
});
const has = (texts, s) => texts.some((t) => t.replace(/<[^>]+>/g, '').includes(s));

try {
  await page.goto(base);
  await page.waitForSelector('.workspace .ig.free');

  // 1. Panneau Modèles : bouton guidé + prochaines occasions
  ok('bouton « Nouvelle publication guidée »', await page.locator('[data-guided]').isVisible());
  const occ = await page.locator('.sp-occ li').count();
  ok('prochaines occasions dans le panneau', occ === 2, `${occ} affichées`);

  // 2. Étape 1 : types
  await page.click('[data-guided]');
  await page.waitForSelector('.modal:has-text("Nouvelle publication")');
  const nextCards = await page.locator('.wiz-occ').count();
  const types = await page.locator('.wiz-type').count();
  ok('prochaines occasions dans l’assistant', nextCards === 3, `${nextCards} cartes`);
  ok('les 13 types de publication', types === 13, `${types} types`);
  await page.screenshot({ path: resolve(out, 'wiz-1-types.png') });

  // 3. Étape 2 : Fête → Aïd al-Adha
  await page.click('.wiz-type[data-template="fete"]');
  await page.selectOption('select[name="occasion"]', 'aidadha');
  ok('titre FR pré-rempli', (await page.inputValue('input[name="titleFr"]')) === 'Aïd al-Adha Moubarak');
  ok('titre AR pré-rempli', (await page.inputValue('textarea[name="titleAr"]')) === 'عيد أضحى مبارك');
  ok('légende pré-remplie', (await page.locator('.wiz-caption textarea').first().inputValue()).includes('Aïd al-Adha'));
  ok('aperçu en direct', (await page.locator('.wiz-preview .ft-title').textContent())?.includes('Aïd al-Adha'));
  await page.fill('textarea[name="wishFr"]', 'Belle fête de l’Aïd à toutes les familles de Sefrou et de Bhalil.');
  ok('aperçu suit la saisie', (await page.locator('.wiz-preview .ft-wish').textContent())?.includes('Bhalil'));
  await page.screenshot({ path: resolve(out, 'wiz-2-details.png') });

  // 4. Créer
  await page.click('.wiz-preview button:has-text("Créer la publication")');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.waitForTimeout(400);
  let s = await state();
  ok('page créée avec ses textes', has(s.texts, 'Aïd al-Adha Moubarak') && has(s.texts, 'Bhalil'));
  ok('motif du croissant présent', s.motifs > 0, `${s.motifs} motif(s)`);
  ok('modèle mémorisé sur la page', s.source?.template === 'fete' && s.source?.data.occasion === 'aidadha');
  ok('légende et hashtags repris', s.caption.fr.includes('Aïd al-Adha') && s.hashtags.includes('#AidAlAdha') && s.hashtags.includes('#Sefrou'));
  ok('création nommée', /^Aïd al-Adha \d{4}$/.test(s.name), s.name);
  await page.screenshot({ path: resolve(out, 'wiz-3-created.png') });

  // 5. Changer l'occasion depuis l'inspecteur
  await page.click('.workspace', { position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-source]');
  ok('inspecteur : réglages de la publication', (await page.locator('[data-source]').textContent())?.includes('Aïd al-Adha'));
  await page.click('[data-source] button');
  await page.waitForSelector('.modal:has-text("Réglages de la publication")');
  ok('formulaire rouvert avec les textes saisis', (await page.inputValue('textarea[name="wishFr"]')).includes('Bhalil'));
  await page.selectOption('select[name="occasion"]', 'aidfitr');
  page.once('dialog', (d) => d.accept());
  await page.click('.wiz-preview button:has-text("Mettre à jour la page")');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.waitForTimeout(400);
  s = await state();
  ok('page régénérée (Aïd al-Fitr), sans page en plus', has(s.texts, 'Aïd Moubarak') && !has(s.texts, 'Aïd al-Adha') && s.pages === 1, `${s.pages} page(s)`);
  ok('légende mise à jour', s.caption.fr.includes('Aïd al-Fitr'));

  // 6. Annuler
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  s = await state();
  ok('Ctrl+Z revient à l’Aïd al-Adha', has(s.texts, 'Aïd al-Adha Moubarak'));

  // 7. « Préparer » depuis le panneau
  await page.locator('.sp-occ button').first().click();
  await page.waitForSelector('.modal:has-text("Nouvelle publication")');
  ok('« Préparer » ouvre le formulaire de la fête', await page.locator('select[name="occasion"]').isVisible());
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached' });

  // 8. Nouvelle création → assistant ouvert ; page vierge
  await page.click('.topbar button:has-text("Mes créations")');
  await page.click('.modal button:has-text("Publication")');
  await page.waitForSelector('.modal:has-text("Nouvelle publication")');
  ok('nouvelle création : l’assistant s’ouvre', await page.locator('.wiz-type').first().isVisible());
  await page.click('button:has-text("Commencer avec une page vierge")');
  await page.waitForSelector('.modal', { state: 'detached' });

  // 9. Autre type : Conseil
  await page.click('[data-guided]');
  await page.click('.wiz-type[data-template="conseil"]');
  await page.fill('textarea[name="titleFr"]', 'Le *fil dentaire*, tous les soirs');
  await page.click('.wiz-preview button:has-text("Créer la publication")');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.waitForTimeout(400);
  s = await state();
  ok('publication « Conseil » créée', has(s.texts, 'fil dentaire') && s.source?.template === 'conseil');

  // 10. Petit écran (tablette)
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.click('[data-guided]');
  await page.click('.wiz-type[data-template="fete"]');
  const noScroll = await page.evaluate(() => document.querySelector('.modal').scrollWidth <= document.querySelector('.modal').clientWidth + 1);
  ok('tablette : formulaire sans défilement horizontal', noScroll);
  await page.screenshot({ path: resolve(out, 'wiz-4-tablet.png') });
  await page.keyboard.press('Escape');
} catch (e) {
  failures++;
  console.log('✗ erreur :', e.message);
  await page.screenshot({ path: resolve(out, 'wiz-error.png') }).catch(() => {});
} finally {
  ok('Erreurs de la page : aucune', errors.length === 0, errors.join(' | '));
  await browser.close();
  await server.close();
}
process.exit(failures ? 1 : 0);
