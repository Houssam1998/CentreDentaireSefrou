/**
 * Test de bout en bout de l'assistant IA du Studio (Playwright), sans appel payant :
 * /api/ai est simulé et rejoue une conversation (création d'une fête, légende, aperçu, retouche, vérification).
 *   node instagram/scripts/e2e-ai.mjs [dossier-de-sortie]
 * Vérifie aussi : préréglages connus du Studio, entrée d'outil invalide, une seule étape « Annuler », erreurs du service.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const igRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(process.argv[2] ?? resolve(igRoot, 'export/_e2e'));
await mkdir(out, { recursive: true });

const server = await createServer({ configFile: resolve(igRoot, 'vite.config.js'), logLevel: 'error', server: { port: 5195 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
let failures = 0;
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
// (le 429 simulé exprès apparaît aussi dans la console du navigateur : ignoré)
page.on('console', (m) => m.type() === 'error' && !m.text().includes('status of 429') && errors.push('console: ' + m.text()));
const ok = (name, cond, extra = '') => { if (!cond) failures++; console.log(`${cond ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`); };

/* ---------- Faux service IA ---------- */
const requests = [];
let mode = 'script';
const nd = (...events) => events.map((e) => JSON.stringify(e)).join('\n') + '\n';
const done = (content, stop_reason = 'tool_use') => ({ t: 'done', message: { content, stop_reason, model: 'claude-opus-5-5' } });
const tool = (id, name, input) => ({ type: 'tool_use', id, name, input });
const lastResults = (body) => body.messages.at(-1).content.filter((b) => b.type === 'tool_result');

function reply(body) {
  const n = requests.length; // n-ième appel (1 = premier)
  if (n === 1) return nd({ t: 'text', v: 'Je prépare la publication de l’Aïd al-Adha.' }, done([
    { type: 'text', text: 'Je prépare la publication de l’Aïd al-Adha.' },
    tool('t1', 'create_post', { template: 'fete', occasion: 'aidadha', mode: 'new_page', fields: { inconnu: 'x' } }),
    tool('t2', 'set_caption', { fr: '🌙 Aïd al-Adha Moubarak à toutes les familles de Sefrou.', darija: '🌙 عيد مبارك سعيد', hashtags: ['Sefrou', '#AidAlAdha'], date: '2027-05-16' }),
  ]));
  if (n === 2) return nd(done([tool('t3', 'view_design', {}), tool('t4', 'edit_elements', { changes: 'oops' })]));
  if (n === 3) {
    // Retrouve l'identifiant du titre dans le résultat de create_post (premier tour d'outils)
    const createRes = requests[1].messages.at(-1).content.find((b) => b.tool_use_id === 't1');
    const page = JSON.parse(String(createRes.content).split('Page à jour : ')[1]);
    const title = page.elements.find((e) => e.type === 'text' && e.html.includes('Aïd al-Adha Moubarak'));
    return nd(done([tool('t5', 'edit_elements', { changes: [{ id: title.id, html: 'Aïd <em>Moubarak</em>', color: 'gold', size: 70 }] }), tool('t6', 'add_element', { preset: 'motif:stars', y: 1180 }), tool('t7', 'run_checks', {})]));
  }
  return nd({ t: 'text', v: 'C’est prêt : ' }, { t: 'text', v: 'relisez les textes arabes avant de publier.' }, done([{ type: 'text', text: 'C’est prêt : relisez les textes arabes avant de publier.' }], 'end_turn'));
}

await page.route('**/api/ai', async (route) => {
  const req = route.request();
  if (req.method() === 'GET') return route.fulfill({ json: { enabled: true, model: 'claude-opus-5-5', used: 3, limit: 200 } });
  const body = req.postDataJSON();
  requests.push(body);
  if (mode === 'quota') return route.fulfill({ status: 429, json: { error: 'Limite quotidienne atteinte (200 échanges). Réessayez demain.' } });
  return route.fulfill({ status: 200, headers: { 'Content-Type': 'application/x-ndjson' }, body: reply(body) });
});

const state = () => page.evaluate(async () => {
  const m = await import('/studio/store/editor.ts');
  const s = m.useEditor.getState();
  const p = s.project.pages.find((x) => x.id === s.pageId);
  return { pages: s.project.pages.length, els: p.elements, source: p.source ?? null, caption: s.project.caption, hashtags: s.project.hashtags, date: s.project.date };
});

try {
  await page.goto(base);
  await page.waitForSelector('.workspace .ig.free');

  // 0. Préréglages de l'IA = préréglages du Studio
  const unknown = await page.evaluate(async () => {
    const defs = await import('/studio/ai/toolDefs.ts');
    const dnd = await import('/studio/panels/dnd.ts');
    return Object.keys(defs.PRESETS).filter((id) => !dnd.presetById(id, 'light'));
  });
  ok('tous les préréglages de l’IA existent dans le Studio', unknown.length === 0, unknown.join(', '));

  // 1. Ouvrir le panneau
  await page.click('.rail-btn:has-text("Assistant IA")');
  await page.waitForSelector('.ai-sugg .chip');
  ok('panneau ouvert avec suggestions', (await page.locator('.ai-sugg .chip').count()) >= 4);

  // 2. Une demande complète
  await page.fill('.ai-form textarea', 'Prépare un visuel pour l’Aïd al-Adha');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.ai-msg.assistant:has-text("C’est prêt")', { timeout: 20000 });
  await page.waitForTimeout(300);
  const s = await state();
  const texts = s.els.filter((e) => e.type === 'text').map((e) => e.html);
  ok('4 échanges avec le service', requests.length === 4, `${requests.length}`);
  ok('page de fête créée (Aïd al-Adha)', s.source?.template === 'fete' && s.source.data.occasion === 'aidadha');
  ok('retouche appliquée par identifiant', texts.includes('Aïd <em>Moubarak</em>') && s.els.some((e) => e.type === 'text' && e.html === 'Aïd <em>Moubarak</em>' && e.size === 70 && e.color === 'gold'));
  ok('élément ajouté (étoiles)', s.els.some((e) => e.type === 'motif' && e.kind === 'stars'));
  ok('légende, hashtags et date', s.caption.fr.includes('Aïd al-Adha') && s.hashtags.includes('#Sefrou') && s.date === '2027-05-16');

  // 3. Ce qui a été envoyé au service
  const first = requests[0].messages[0];
  ok('l’état du Studio accompagne le message', first.role === 'user' && first.content[1].text.includes('<etat_du_studio>'));
  const r2 = lastResults(requests[1]);
  ok('résultats renvoyés pour chaque outil', r2.length === 2 && r2.every((r) => !r.is_error), JSON.stringify(r2.map((r) => r.is_error)));
  ok('champ inconnu signalé au modèle', String(r2[0].content).includes('Champs ignorés'));
  const r3 = lastResults(requests[2]);
  const img = r3[0].content.find?.((b) => b.type === 'image');
  ok('aperçu envoyé en image JPEG', img?.source.media_type === 'image/jpeg' && img.source.data.length > 5000, `${img?.source.data.length ?? 0} car.`);
  ok('entrée d’outil invalide → erreur renvoyée au modèle', r3[1].is_error === true);
  const r4 = lastResults(requests[3]);
  ok('vérification déontologie exécutée', r4.some((r) => String(r.content).includes('Aucun problème') || String(r.content).includes('Points à corriger')));
  const prefix = requests.every((r, i) => i === 0 || JSON.stringify(r.messages).startsWith(JSON.stringify(requests[i - 1].messages).slice(0, -1)));
  ok('conversation seulement complétée, jamais réécrite', prefix);
  await page.screenshot({ path: resolve(out, 'ai-1-done.png') });

  // 4. Une seule étape « Annuler »
  await page.click('button:has-text("Annuler ce que l’IA a fait")');
  await page.waitForTimeout(300);
  const after = await state();
  ok('« Annuler ce que l’IA a fait » revient à la page vide', after.els.length === 0 && !after.source && after.caption.fr === '', `${after.els.length} éléments`);

  // 5. Erreur du service (quota)
  mode = 'quota';
  await page.fill('.ai-form textarea', 'Encore une demande');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.ai-msg.error');
  ok('erreur du service affichée clairement', (await page.locator('.ai-msg.error').last().textContent())?.includes('Limite quotidienne'));

  // 6. Nouvelle conversation
  await page.click('button:has-text("Nouvelle conversation")');
  ok('nouvelle conversation', (await page.locator('.ai-msg').count()) === 0);
  await page.screenshot({ path: resolve(out, 'ai-2-panel.png') });
} catch (e) {
  failures++;
  console.log('✗ erreur :', e.message);
  await page.screenshot({ path: resolve(out, 'ai-error.png') }).catch(() => {});
} finally {
  ok('Erreurs de la page : aucune', errors.length === 0, errors.join(' | '));
  await browser.close();
  await server.close();
}
process.exit(failures ? 1 : 0);
