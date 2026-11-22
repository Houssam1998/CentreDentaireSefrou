/**
 * Test du relais de l'assistant IA (worker/ai.ts), sans appel réel à l'API Claude :
 * l'API (flux SSE) et la base D1 sont simulées.
 *   node instagram/worker/ai.test.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = await build({ entryPoints: [resolve(here, 'ai.ts')], bundle: true, format: 'esm', write: false, platform: 'browser', logLevel: 'error' });
const ai = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
const prompt = await build({ entryPoints: [resolve(here, 'aiPrompt.ts')], bundle: true, format: 'esm', write: false, platform: 'browser', logLevel: 'error' });
const { SYSTEM_PROMPT } = await import(`data:text/javascript;base64,${Buffer.from(prompt.outputFiles[0].text).toString('base64')}`);

let fail = 0;
const check = (name, cond, extra = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${!cond && extra ? `  (${extra})` : ''}`); };

/* ---------- D1 simulée ---------- */
function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind: (...a) => { args = a; return stmt; },
        first: async () => (sql.startsWith('SELECT requests') ? rows.get(`${args[0]}|${args[1]}`) ?? null : null),
        run: async () => {
          if (sql.startsWith('INSERT INTO ai_usage')) {
            const k = `${args[0]}|${args[1]}`;
            const r = rows.get(k) ?? { requests: 0, input_tokens: 0, output_tokens: 0 };
            r.requests++;
            rows.set(k, r);
          } else if (sql.startsWith('UPDATE ai_usage')) {
            const r = rows.get(`${args[4]}|${args[5]}`);
            if (r) { r.input_tokens += args[0]; r.output_tokens += args[1]; }
          }
          return { success: true };
        },
      };
      return stmt;
    },
  };
}

/* ---------- API Claude simulée (SSE) ---------- */
const sse = (events) => events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
const streamOk = sse([
  { type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1200, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 4000 } } },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Je prépare ' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'la page.' } },
  { type: 'content_block_stop', index: 0 },
  { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'create_post', input: {} } },
  { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"template":"fete",' } },
  { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"occasion":"aidadha","mode":"new_page"}' } },
  { type: 'content_block_stop', index: 1 },
  { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 85 } },
  { type: 'message_stop' },
]);

let lastRequest = null;
console.error = () => {}; // erreurs volontaires (clé refusée) : pas d'affichage
let apiMode = 'ok';
globalThis.fetch = async (url, init) => {
  const u = String(url instanceof Request ? url.url : url);
  if (!u.startsWith('https://api.anthropic.com/v1/messages')) return new Response('inconnu', { status: 404 });
  const req = url instanceof Request ? url : new Request(u, init);
  lastRequest = { url: u, headers: Object.fromEntries(req.headers), body: JSON.parse(await req.text()) };
  if (apiMode === 'auth') return new Response(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }), { status: 401, headers: { 'content-type': 'application/json' } });
  return new Response(streamOk, { headers: { 'content-type': 'text/event-stream' } });
};

const post = (body) => new Request('https://studio.centredentairesefrou.com/api/ai', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const readNdjson = async (res) => (await res.text()).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const userMsg = { role: 'user', content: [{ type: 'text', text: 'Prépare l’Aïd' }, { type: 'text', text: '<etat_du_studio>…</etat_du_studio>' }] };

/* ---------- Consignes ---------- */
check('consignes : nouveaux horaires', SYSTEM_PROMPT.includes('09:00 – 18:00'));
check('consignes : déontologie et validation médicale', SYSTEM_PROMPT.includes('interdit la publicité') && SYSTEM_PROMPT.includes('validé par le Dr Amine El Omari'));
check('consignes : occasions et modèles listés', SYSTEM_PROMPT.includes('aidadha') && SYSTEM_PROMPT.includes('« conseil »'));
check('consignes : aucune date du jour (cache stable)', !new RegExp(new Date().getFullYear() + '-\\d\\d-\\d\\d').test(SYSTEM_PROMPT));

/* ---------- Vérification des conversations ---------- */
check('conversation vide refusée', typeof ai.checkMessages({ messages: [] }) === 'string');
check('rôle inconnu refusé', typeof ai.checkMessages({ messages: [{ role: 'system', content: 'x' }] }) === 'string');
check('doit commencer par l’utilisateur', typeof ai.checkMessages({ messages: [{ role: 'assistant', content: 'x' }] }) === 'string');
check('conversation valide acceptée', Array.isArray(ai.checkMessages({ messages: [userMsg] })));

/* ---------- Route ---------- */
const email = 'dr@cabinet.ma';
let env = { DB: fakeDb(), AI_DAILY_LIMIT: '3' };
let res = await ai.aiTurn(post({ messages: [userMsg] }), env, email);
check('sans clé API → 503', res.status === 503);
const st0 = await (await ai.aiStatus(env, email)).json();
check('statut : désactivé sans clé', st0.enabled === false && st0.model === 'claude-opus-5-5' && st0.limit === 3);

env = { ...env, ANTHROPIC_API_KEY: 'sk-ant-test' };
res = await ai.aiTurn(post('{pas du json'), env, email);
check('corps illisible → 400', res.status === 400);
res = await ai.aiTurn(post({ messages: [{ role: 'assistant', content: 'x' }] }), env, email);
check('conversation invalide → 400', res.status === 400);

res = await ai.aiTurn(post({ messages: [userMsg] }), env, email);
check('tour réussi → flux NDJSON', res.status === 200 && res.headers.get('content-type').includes('ndjson'));
const events = await readNdjson(res);
const text = events.filter((e) => e.t === 'text').map((e) => e.v).join('');
const done = events.find((e) => e.t === 'done');
check('texte transmis au fil de l’eau', text === 'Je prépare la page.', text);
check('message final avec l’appel d’outil', done?.message.stop_reason === 'tool_use' && done.message.content[1]?.input?.occasion === 'aidadha');
const b = lastRequest.body;
check('requête : modèle, effort, cache', b.model === 'claude-opus-5-5' && b.output_config?.effort === 'medium' && b.cache_control?.type === 'ephemeral');
check('requête : consignes et 11 outils du serveur', b.system?.[0]?.text === SYSTEM_PROMPT && b.tools?.length === 11 && b.tools.every((t) => t.eager_input_streaming === true));
check('requête : repli automatique en cas de refus', b.fallbacks === 'default' && (lastRequest.headers['anthropic-beta'] ?? '').includes('server-side-fallback-2026-07-01'));
check('requête : clé du Worker envoyée (Authorization: Bearer)', lastRequest.headers.authorization === 'Bearer sk-ant-test');
const usage = env.DB.rows.get(`${email}|${new Date().toISOString().slice(0, 10)}`);
check('consommation enregistrée', usage?.requests === 1 && usage.input_tokens === 1200 && usage.output_tokens === 85, JSON.stringify(usage));

await ai.aiTurn(post({ messages: [userMsg] }), env, email).then(readNdjson);
await ai.aiTurn(post({ messages: [userMsg] }), env, email).then(readNdjson);
res = await ai.aiTurn(post({ messages: [userMsg] }), env, email);
check('quota quotidien atteint → 429', res.status === 429);

const haiku = { ...env, DB: fakeDb(), AI_MODEL: 'claude-haiku-5-5' };
await ai.aiTurn(post({ messages: [userMsg] }), haiku, email).then(readNdjson);
check('Haiku : pas de paramètre de repli', lastRequest.body.model === 'claude-haiku-5-5' && lastRequest.body.fallbacks === undefined);

apiMode = 'auth';
const errEvents = await ai.aiTurn(post({ messages: [userMsg] }), { ...env, DB: fakeDb() }, email).then(readNdjson);
const err = errEvents.find((e) => e.t === 'error');
check('clé refusée → message clair, sans relance', err?.error.includes('ANTHROPIC_API_KEY') && err.retry === false, JSON.stringify(errEvents));

console.log(fail ? `\n${fail} échec(s)` : '\nTous les tests de l’assistant IA (Worker) passent.');
process.exit(fail ? 1 : 0);
