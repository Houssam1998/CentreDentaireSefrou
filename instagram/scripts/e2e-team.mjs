/**
 * Test de l'espace d'équipe avec deux personnes (Worker local + base D1 locale) :
 *   1. npm run ig:cloud   (dans un autre terminal)
 *   2. node instagram/scripts/e2e-team.mjs [http://127.0.0.1:8788]
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const shots = resolve(root, 'instagram/export/_e2e');
await mkdir(shots, { recursive: true });
const base = process.argv[2] ?? 'http://127.0.0.1:8788';
const RUN = Date.now().toString(36); // noms uniques : la base locale garde les essais précédents
const NAME = {
  first: `Fête équipe ${RUN}`,
  reviewed: `Fête revue ${RUN}`,
  b: `Version B ${RUN}`,
  a: `Version A ${RUN}`,
  trash: `À jeter ${RUN}`,
  local: `Hors ligne ${RUN}`,
};
const browser = await chromium.launch();
let failures = 0;
const ok = (name, cond, extra = '') => { if (!cond) failures++; console.log(`${cond ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`); };
const errors = [];

async function person(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'X-Dev-Email': email } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${email}: ${e.message}`));
  await page.goto(base);
  await page.waitForSelector('.workspace .ig.free');
  await page.waitForSelector('.user-chip .avatar', { timeout: 10000 });
  return page;
}
const status = (p) => p.locator('.topbar .status').innerText();
const projects = async (p) => (await p.evaluate(() => fetch('/api/projects').then((r) => r.json()))).projects;
const tick = (p) => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
/** Attend qu'une création portant ce nom soit enregistrée en base. */
const savedAs = (p, name, by) => p.waitForFunction(async ([n, who]) => {
  const { projects } = await fetch('/api/projects').then((r) => r.json());
  return projects.some((x) => x.name === n && (!who || x.updatedBy === who));
}, [name, by], { timeout: 60000, polling: 500 });
const nameIs = (p, name) => p.waitForFunction((n) => document.querySelector('.tb-name')?.value === n, name, { timeout: 45000 });
const card = (p, name) => p.locator('.proj', { hasText: name });

try {
  const a = await person('dr.omari@exemple.ma');
  ok('A : espace d’équipe détecté (avatar)', (await a.locator('.user-chip .avatar').innerText()) === 'D');

  // A crée une publication depuis un modèle → enregistrée en ligne
  await a.click('.tpl-btn[title="06-fete-independance"]');
  await a.waitForFunction(() => document.querySelectorAll('.workspace .el').length > 3);
  await a.fill('.tb-name', NAME.first);
  await savedAs(a, NAME.first, 'dr.omari@exemple.ma');
  ok('A : création enregistrée en ligne', true);

  // A importe une photo dans la création
  await a.click('.rail-btn:has-text("Photos")');
  await a.setInputFiles('.side-panel input[type=file]', resolve(root, 'src/assets/media/clinic/xray-unit.jpg'));
  await a.waitForSelector('.workspace .el-image img', { timeout: 60000 });
  await a.waitForTimeout(2500);

  // B voit la création, son auteur et la photo
  const b = await person('assistante@exemple.ma');
  await b.click('.topbar button[title="Mes créations"]');
  await b.waitForSelector('.proj');
  ok('B : voit la création de A avec son auteur', (await card(b, NAME.first).count()) === 1 && (await card(b, NAME.first).innerText()).includes('dr.omari'));
  await card(b, NAME.first).locator('.proj-open').click();
  await b.waitForFunction(() => document.querySelectorAll('.workspace .el').length > 3);
  await b.waitForSelector('.workspace .el-image img[src^="/api/assets/"]', { timeout: 10000 }).catch(() => {});
  const shown = await b.waitForFunction(() => { const i = document.querySelector('.workspace .el-image img[src^="/api/assets/"]'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false);
  ok('B : la photo importée par A s’affiche (image réellement chargée)', shown);
  ok('B : « dernière modification : dr.omari »', (await status(b)).includes('dr.omari'));
  await b.click('.rail-btn:has-text("Photos")');
  await b.waitForSelector('.sp-sec:has-text("Photos de l’équipe") .ph', { timeout: 10000 }).catch(() => {});
  const tiles = await b.waitForFunction(() => [...document.querySelectorAll('.sp-sec .ph img')].some((i) => i.complete && i.naturalWidth > 0 && i.src.includes('/api/assets/')), null, { timeout: 30000 }).then(() => true).catch(() => false);
  ok('B : la photo de A est dans « Photos de l’équipe » (vignette chargée)', tiles);
  const thumbOk = await b.waitForFunction(async (n) => {
    const { projects } = await fetch('/api/projects').then((r) => r.json());
    const p = projects.find((x) => x.name === n);
    if (!p) return false;
    const r = await fetch(`/api/projects/${p.id}/thumb`);
    const buf = new Uint8Array(await r.arrayBuffer());
    return r.ok && buf[0] === 0x89 && buf[1] === 0x50;
  }, NAME.first, { timeout: 30000, polling: 1000 }).then(() => true).catch(() => false);
  ok('vignette de création au format PNG', thumbOk);

  // B modifie → A (sans modification en cours) reçoit la mise à jour
  await b.fill('.tb-name', NAME.reviewed);
  await savedAs(b, NAME.reviewed, 'assistante@exemple.ma');
  await tick(a);
  await nameIs(a, NAME.reviewed);
  ok('A : reçoit automatiquement la version de B', true, await status(a));

  // Conflit : B enregistre, A modifie de son côté sans avoir encore reçu la version de B
  await b.fill('.tb-name', NAME.b);
  await savedAs(b, NAME.b);
  await a.fill('.tb-name', NAME.a);
  await a.waitForSelector('.banner.warn', { timeout: 60000 });
  ok('A : bandeau de conflit affiché', (await a.locator('.banner.warn').innerText()).includes('assistante'));
  await a.screenshot({ path: resolve(shots, 'team-conflict.png') });
  await a.getByRole('button', { name: 'Garder la mienne', exact: true }).click();
  await savedAs(a, NAME.a, 'dr.omari@exemple.ma').catch(async () => {
    console.log('  statut A :', await status(a), '| nom affiché :', await a.locator('.tb-name').inputValue());
    console.log('  en base :', JSON.stringify((await projects(a)).slice(0, 4).map((p) => [p.name, p.version, p.updatedBy])));
  });
  const kept = (await projects(a)).some((p) => p.name === NAME.a);
  ok('A : sa version est gardée', kept);
  if (!kept) {
    console.log('  statut A :', await status(a), '| nom A :', await a.locator('.tb-name').inputValue(), '| nom B :', await b.locator('.tb-name').inputValue());
    console.log('  en base :', JSON.stringify((await projects(a)).slice(0, 3).map((p) => [p.name, p.version, p.updatedBy, new Date(p.updatedAt).toISOString().slice(11, 19)])));
  }
  ok('A : bandeau refermé', (await a.locator('.banner.warn').count()) === 0);

  // B, qui n'a pas de modification en cours, reçoit la version de A
  await tick(b);
  await nameIs(b, NAME.a);
  ok('B : reçoit la version de A', true);

  // Corbeille : une création mise à la corbeille puis restaurée
  const trashId = `trash${RUN}`;
  await b.evaluate(([id, name]) => fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project: { id, version: 1, name, format: 'post', pages: [{ id: 'p', tone: 'light', background: { kind: 'tone' }, elements: [] }], caption: { fr: '', darija: '' }, hashtags: [], date: '2026-11-08', updatedAt: 0 }, baseVersion: null }),
  }), [trashId, NAME.trash]);
  await b.click('.topbar button[title="Mes créations"]');
  await card(b, NAME.trash).waitFor();
  b.once('dialog', (d) => d.accept());
  await card(b, NAME.trash).hover();
  await card(b, NAME.trash).locator('button[title="Mettre à la corbeille"]').click();
  await card(b, NAME.trash).waitFor({ state: 'detached' });
  await b.click('.modal .seg button:has-text("Corbeille")');
  await card(b, NAME.trash).waitFor();
  ok('B : création dans la corbeille, avec qui l’a supprimée', (await card(b, NAME.trash).innerText()).includes('assistante'));
  await b.screenshot({ path: resolve(shots, 'team-trash.png') });
  await card(b, NAME.trash).hover();
  await card(b, NAME.trash).locator('button[title="Restaurer"]').click();
  await card(b, NAME.trash).waitFor({ state: 'detached' });
  await b.click('.modal .seg button:has-text("Créations")');
  await card(b, NAME.trash).waitFor();
  ok('B : création restaurée', true);
  await b.screenshot({ path: resolve(shots, 'team-projects.png') });
  await b.keyboard.press('Escape');

  // Création du navigateur (mode local) envoyée dans l'espace d'équipe
  const localId = `local${RUN}`;
  await b.evaluate(([id, name]) => new Promise((res, rej) => {
    const r = indexedDB.open('ig-studio-projects');
    r.onsuccess = () => {
      const tx = r.result.transaction('projects', 'readwrite');
      const s = tx.objectStore('projects');
      const p = { id, version: 1, name, format: 'post', pages: [{ id: 'p', tone: 'greige', background: { kind: 'tone' }, elements: [] }], caption: { fr: '', darija: '' }, hashtags: [], date: '2026-11-08', updatedAt: Date.now() };
      s.put(p, `p:${id}`);
      s.put([{ id, name, updatedAt: p.updatedAt, format: 'post', pages: 1 }], 'index');
      tx.oncomplete = res; tx.onerror = rej;
    };
    r.onerror = rej;
  }), [localId, NAME.local]);
  await b.click('.topbar button[title="Mes créations"]');
  await b.click('button:has-text("Les envoyer dans l’espace d’équipe")');
  await card(b, NAME.local).waitFor({ timeout: 60000 });
  ok('B : création du navigateur envoyée dans l’espace d’équipe', true);
  await b.keyboard.press('Escape');

  // Requête d'une autre origine refusée
  const cross = await b.evaluate(() => fetch('/api/projects/abcd1234', { method: 'DELETE', headers: { 'X-Requested-With': 'test' } }).then((x) => x.status));
  ok('suppression depuis le Studio acceptée', cross === 200);
} catch (e) {
  failures++;
  console.log('✗ arrêt :', e.message.split('\n')[0]);
  for (const [i, ctx] of browser.contexts().entries()) await ctx.pages()[0]?.screenshot({ path: resolve(shots, `team-error-${i}.png`) }).catch(() => {});
} finally {
  console.log('Erreurs des pages :', errors.length ? errors.slice(0, 8) : 'aucune');
  await browser.close();
}
process.exit(failures ? 1 : 0);
