/**
 * Mise en place de l'espace d'équipe sur Cloudflare (peut être relancé sans risque : rien n'est recréé).
 *
 *   node instagram/scripts/setup-cloud.mjs --emails dr@exemple.ma,assistante@exemple.ma,moi@exemple.ma [--deploy]
 *
 * Le jeton API est lu dans instagram/.cloudflare.env (CLOUDFLARE_API_TOKEN=…), fichier exclu de Git.
 * Étapes : vérifie le jeton → base D1 → connexion par code e-mail → application Access du Studio
 * (adresses autorisées, session de 30 jours) → configuration wrangler.jsonc → (option) publication.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ig = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(ig, '..');
const DOMAIN = 'studio.centredentairesefrou.com';
const ZONE = 'centredentairesefrou.com';
const DB_NAME = 'studio-centre-dentaire-sefrou';
const APP_NAME = 'Studio Instagram — Centre Dentaire Sefrou';

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const emails = (arg('--emails') ?? '').split(',').map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
const deploy = args.includes('--deploy');

const step = (t) => console.log(`\n▸ ${t}`);
const done = (t) => console.log(`  ✓ ${t}`);
const fail = (t) => { console.error(`  ✗ ${t}`); process.exit(1); };

/* ---------- Jeton ---------- */
let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  const env = await readFile(resolve(ig, '.cloudflare.env'), 'utf8').catch(() => '');
  token = env.match(/^\s*CLOUDFLARE_API_TOKEN\s*=\s*"?([^"\s]+)"?/m)?.[1];
}
if (!token) fail('Jeton introuvable : créez instagram/.cloudflare.env avec CLOUDFLARE_API_TOKEN=votre_jeton');
if (!emails.length) fail('Indiquez les adresses autorisées : --emails adresse1,adresse2');

async function cf(path, init = {}) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!body.success) {
    const msg = (body.errors ?? []).map((e) => `${e.code} ${e.message}`).join(' ; ') || `HTTP ${r.status}`;
    const err = new Error(msg);
    err.status = r.status;
    err.codes = (body.errors ?? []).map((e) => e.code);
    throw err;
  }
  return body.result;
}

/* ---------- 1. Compte et zone ---------- */
step('Vérification du jeton');
const accounts = await cf('/accounts').catch((e) => fail(`Jeton refusé (${e.message})`));
if (!accounts.length) fail('Le jeton n’a accès à aucun compte (droit « Account Settings : Lire » manquant ?)');
const account = accounts[0];
done(`Compte : ${account.name}`);
const zones = await cf(`/zones?name=${ZONE}`).catch((e) => fail(`Zone illisible (${e.message}) : droit « Zone : Lire » manquant ?`));
if (!zones.length) fail(`Zone ${ZONE} introuvable sur ce compte`);
done(`Zone : ${ZONE}`);
const A = `/accounts/${account.id}`;

/* ---------- 2. Base D1 ---------- */
step('Base de données D1');
let db = (await cf(`${A}/d1/database?name=${DB_NAME}`)).find((d) => d.name === DB_NAME);
if (!db) db = await cf(`${A}/d1/database`, { method: 'POST', body: JSON.stringify({ name: DB_NAME }) });
const dbId = db.uuid;
done(`Base « ${DB_NAME} » (${dbId})`);

/* ---------- 3. Zero Trust et connexion par code e-mail ---------- */
step('Cloudflare Zero Trust');
let org;
try {
  org = await cf(`${A}/access/organizations`);
} catch (e) {
  fail(`Zero Trust n’est pas encore activé sur ce compte. Ouvrez une fois https://one.dash.cloudflare.com/ , choisissez un nom d’équipe et l’offre « Free », puis relancez ce script. (${e.message})`);
}
const team = String(org.auth_domain ?? '').replace('.cloudflareaccess.com', '');
if (!team) fail('Nom d’équipe Zero Trust introuvable');
done(`Équipe : ${org.auth_domain}`);

const idps = await cf(`${A}/access/identity_providers`);
let otp = idps.find((i) => i.type === 'onetimepin');
if (!otp) otp = await cf(`${A}/access/identity_providers`, { method: 'POST', body: JSON.stringify({ name: 'Code par e-mail', type: 'onetimepin', config: {} }) });
done('Connexion par code envoyé par e-mail (One-time PIN)');

/* ---------- 4. Application Access du Studio ---------- */
step(`Protection de ${DOMAIN}`);
const appBody = {
  name: APP_NAME,
  domain: DOMAIN,
  type: 'self_hosted',
  session_duration: '720h', // 30 jours : pas de reconnexion tous les jours
  allowed_idps: [otp.id],
  auto_redirect_to_identity: true,
  app_launcher_visible: false,
};
let app = (await cf(`${A}/access/apps`)).find((x) => x.domain === DOMAIN);
if (app) app = await cf(`${A}/access/apps/${app.id}`, { method: 'PUT', body: JSON.stringify({ ...appBody }) });
else app = await cf(`${A}/access/apps`, { method: 'POST', body: JSON.stringify(appBody) });
done(`Application Access (AUD ${app.aud.slice(0, 12)}…)`);

const policyBody = { name: 'Équipe du cabinet', decision: 'allow', precedence: 1, include: emails.map((email) => ({ email: { email } })) };
const policies = await cf(`${A}/access/apps/${app.id}/policies`);
const existing = policies.find((p) => p.name === policyBody.name);
if (existing) await cf(`${A}/access/apps/${app.id}/policies/${existing.id}`, { method: 'PUT', body: JSON.stringify(policyBody) });
else await cf(`${A}/access/apps/${app.id}/policies`, { method: 'POST', body: JSON.stringify(policyBody) });
done(`Adresses autorisées : ${emails.join(', ')}`);

/* ---------- 5. Configuration du Worker ---------- */
step('Configuration instagram/wrangler.jsonc');
const cfgPath = resolve(ig, 'wrangler.jsonc');
let cfg = await readFile(cfgPath, 'utf8');
cfg = cfg
  .replace(/"database_id":\s*"[^"]*"/, `"database_id": "${dbId}"`)
  .replace(/"ACCESS_TEAM":\s*"[^"]*"/, `"ACCESS_TEAM": "${team}"`)
  .replace(/"ACCESS_AUD":\s*"[^"]*"/, `"ACCESS_AUD": "${app.aud}"`)
  .replace(/"ALLOWED_EMAILS":\s*"[^"]*"/, `"ALLOWED_EMAILS": "${emails.join(',')}"`);
await writeFile(cfgPath, cfg, 'utf8');
done('Base, équipe, AUD et adresses enregistrées');

/* ---------- 6. Publication ---------- */
if (deploy) {
  step('Publication du Studio');
  const env = { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account.id };
  const run = (cmd) => {
    console.log(`  $ ${cmd}`);
    const r = spawnSync(cmd, { cwd: root, env, stdio: 'inherit', shell: true });
    if (r.status !== 0) fail(`Échec : ${cmd}`);
  };
  run('npm run ig:build');
  run('npx wrangler d1 migrations apply DB --remote --config instagram/wrangler.jsonc');
  run('npx wrangler deploy --config instagram/wrangler.jsonc');
  done(`Studio publié : https://${DOMAIN}`);
} else {
  console.log('\nConfiguration terminée. Pour publier : relancez avec --deploy (ou npm run ig:deploy).');
}
