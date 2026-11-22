/**
 * Tests du traitement des avis Google (site-worker/reviews.ts) et du Worker (route /api/reviews, tâche de nuit).
 *   node site-worker/reviews.test.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const load = async (file) => {
  const out = await build({ entryPoints: [resolve(here, file)], bundle: true, format: 'esm', write: false, platform: 'neutral' });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
};
const { buildPayload } = await load('reviews.ts');
const worker = (await load('index.ts')).default;

let fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  (obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(want)})`}`);
};

// --- Réponse Google d'exemple ---
const rev = (id, rating, time, original, lang, fr, en, author = 'Karim Alaoui') => ({
  fr: { name: `places/X/reviews/${id}`, rating, publishTime: time, authorAttribution: { displayName: author }, googleMapsUri: `https://maps.google.com/?r=${id}`, originalText: { text: original, languageCode: lang }, text: { text: fr, languageCode: 'fr' } },
  en: { name: `places/X/reviews/${id}`, rating, publishTime: time, authorAttribution: { displayName: author }, originalText: { text: original, languageCode: lang }, text: { text: en, languageCode: 'en' } },
});
const items = [
  rev('a', 4, '2026-11-01T10:00:00Z', 'Très bien', 'fr', 'Très bien', 'Very good'),
  rev('b', 5, '2026-10-01T10:00:00Z', 'Parfait', 'fr', 'Parfait', 'Perfect'),
  rev('c', 2, '2026-11-10T10:00:00Z', 'Attente longue', 'fr', 'Attente longue', 'Long wait'),
  rev('d', 5, '2026-11-15T10:00:00Z', 'طبيب ممتاز', 'ar', 'Excellent médecin', 'Excellent doctor'),
  rev('e', 5, '2026-11-20T10:00:00Z', '', 'fr', '', ''),
];
const place = (lang) => ({ rating: 4.86, userRatingCount: 23, googleMapsUri: 'https://maps.google.com/?cid=1', reviews: items.map((i) => i[lang]) });
const p = buildPayload(place('fr'), place('en'), new Date('2026-11-22T04:00:00Z'));

check('note arrondie à 1 décimale (toutes notes confondues)', p.rating, 4.9);
check('nombre total réel', p.count, 23);
check('avis < 4★ et avis sans texte écartés, 5★ d’abord puis plus récents', p.reviews.map((r) => r.id.split('/').pop()), ['d', 'b', 'a']);
check('avis arabe : traduit en FR et EN', [p.reviews[0].text, p.reviews[0].translated], [{ fr: 'Excellent médecin', en: 'Excellent doctor' }, { fr: true, en: true }]);
check('avis français : pas « traduit » en FR, traduit en EN', p.reviews[1].translated, { fr: false, en: true });
check('nom de l’auteur tel que donné par Google (attribution)', p.reviews[0].name, 'Karim Alaoui');
check('date conservée', p.fetchedAt, '2026-11-22T04:00:00.000Z');

const noEn = buildPayload(place('fr'), null, new Date());
check('sans réponse anglaise → texte original, pas la traduction FR', noEn.reviews.find((r) => r.id.endsWith('/d')).text.en, 'طبيب ممتاز');

let threw = false;
try { buildPayload({ reviews: [] }, null, new Date()); } catch { threw = true; }
check('réponse incomplète → erreur (on ne remplace pas les données)', threw, true);

// --- Worker : route /api/reviews et tâche de nuit (KV et Google simulés) ---
const store = new Map();
const kv = { get: async (k) => store.get(k) ?? null, put: async (k, v, o) => { store.set(k, v); store.lastOptions = o; } };
const assets = { fetch: async () => new Response('page statique') };
const env = { REVIEWS: kv, ASSETS: assets, GOOGLE_PLACES_KEY: 'cle-test' };
const get = (path, method = 'GET') => worker.fetch(new Request(`https://www.centredentairesefrou.com${path}`, { method }), env);

check('sans espace KV : /api/reviews → 404 (pas d’erreur)', (await worker.fetch(new Request('https://www.centredentairesefrou.com/api/reviews'), { ASSETS: assets })).status, 404);
check('/api/reviews vide → 404', (await get('/api/reviews')).status, 404);
check('autre /api → 404', (await get('/api/autre')).status, 404);
check('POST refusé', (await get('/api/reviews', 'POST')).status, 405);
check('pages → fichiers statiques', await (await get('/soins/')).text(), 'page statique');

// --- Tâche de nuit (Google simulé) ---
const nightly = async (e) => {
  const waits = [];
  await worker.scheduled({}, e, { waitUntil: (pr) => waits.push(pr) });
  return Promise.allSettled(waits);
};
let googleCalls = [];
globalThis.fetch = async (url, init) => {
  googleCalls.push({ url: String(url), key: init?.headers?.['X-Goog-Api-Key'], mask: init?.headers?.['X-Goog-FieldMask'] });
  const lang = new URL(String(url)).searchParams.get('languageCode');
  return new Response(JSON.stringify(place(lang)));
};
await nightly({ ...env, GOOGLE_PLACES_KEY: undefined });
check('sans clé Google : aucun appel', googleCalls.length, 0);

await nightly(env);
check('nuit : 2 appels (FR + EN) à la fiche du cabinet, avec la clé', [googleCalls.length, googleCalls.every((c) => c.url.includes('/v1/places/ChIJ') && c.key === 'cle-test')], [2, true]);
check('nuit : seuls les champs utiles sont demandés', googleCalls[0].mask, 'rating,userRatingCount,reviews,googleMapsUri');
const saved = JSON.parse(store.get('reviews:v1'));
check('nuit : avis enregistrés, avec expiration (25 jours)', [saved.count, saved.reviews.length, store.lastOptions?.expirationTtl], [23, 3, 25 * 24 * 3600]);

globalThis.fetch = async () => new Response(JSON.stringify({ reviews: [] }));
const failed = await nightly(env);
check('nuit : réponse Google incomplète → échec signalé, données gardées', [failed[0].status, JSON.parse(store.get('reviews:v1')).count], ['rejected', 23]);

store.set('reviews:v1', JSON.stringify(p));
const res = await get('/api/reviews');
check('/api/reviews rempli → 200 + cache 1 h', [res.status, res.headers.get('cache-control')], [200, 'public, max-age=3600']);
check('/api/reviews renvoie les avis', (await res.json()).reviews.length, 3);

console.log(fail ? `\n${fail} échec(s)` : '\nTous les tests des avis passent.');
process.exit(fail ? 1 : 0);
