/**
 * Test de la vérification des jetons Cloudflare Access (worker/auth.ts) avec de vraies signatures RS256.
 *   node instagram/worker/auth.test.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = await build({ entryPoints: [resolve(here, 'auth.ts')], bundle: true, format: 'esm', write: false, platform: 'neutral' });
const { identify } = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);

const team = 'equipe-test', aud = 'aud-123';
const env = { ACCESS_TEAM: team, ACCESS_AUD: aud, ENVIRONMENT: 'production' };
const gen = () => crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const good = await gen(), evil = await gen();
const jwk = { ...(await crypto.subtle.exportKey('jwk', good.publicKey)), kid: 'k1' };
globalThis.fetch = async (url) => (String(url) === `https://${team}.cloudflareaccess.com/cdn-cgi/access/certs` ? new Response(JSON.stringify({ keys: [jwk] })) : new Response('', { status: 404 }));

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token(payload, { key = good.privateKey, alg = 'RS256', kid = 'k1' } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64({ alg, kid, typ: 'JWT' });
  const p = b64({ aud: [aud], iss: `https://${team}.cloudflareaccess.com`, exp: now + 600, iat: now, email: 'Dr.Omari@Exemple.ma', ...payload });
  const sig = alg === 'none' ? '' : Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`))).toString('base64url');
  return `${h}.${p}.${sig}`;
}
const req = (t, extra = {}) => new Request('https://studio.centredentairesefrou.com/api/me', { headers: { ...(t ? { 'Cf-Access-Jwt-Assertion': t } : {}), ...extra } });

let fail = 0;
const check = (name, got, want) => { const ok = got === want; if (!ok) fail++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  (obtenu ${got}, attendu ${want})`}`); };

check('jeton valide → e-mail', await identify(req(await token({})), env), 'dr.omari@exemple.ma');
check('jeton dans le cookie CF_Authorization', await identify(new Request('https://x/api/me', { headers: { Cookie: `a=b; CF_Authorization=${await token({})}` } }), env), 'dr.omari@exemple.ma');
check('sans jeton → refusé', await identify(req(null), env), null);
check('mauvaise audience → refusé', await identify(req(await token({ aud: ['autre-app'] })), env), null);
check('jeton expiré → refusé', await identify(req(await token({ exp: Math.floor(Date.now() / 1000) - 10 })), env), null);
check('signature d’une autre clé → refusé', await identify(req(await token({}, { key: evil.privateKey })), env), null);
check('autre émetteur → refusé', await identify(req(await token({ iss: 'https://pirate.cloudflareaccess.com' })), env), null);
check('algorithme « none » → refusé', await identify(req(await token({}, { alg: 'none' })), env), null);
check('clé inconnue → refusé', await identify(req(await token({}, { kid: 'k9' })), env), null);
const forged = (await token({})).split('.');
forged[1] = b64({ aud: [aud], iss: `https://${team}.cloudflareaccess.com`, exp: 9999999999, email: 'pirate@x.com' });
check('contenu modifié après signature → refusé', await identify(req(forged.join('.')), env), null);
check('adresse hors liste de secours → refusé', await identify(req(await token({ email: 'inconnu@x.com' })), { ...env, ALLOWED_EMAILS: 'dr.omari@exemple.ma' }), null);
check('adresse dans la liste de secours → accepté', await identify(req(await token({})), { ...env, ALLOWED_EMAILS: 'dr.omari@exemple.ma, assistante@exemple.ma' }), 'dr.omari@exemple.ma');
check('identité simulée ignorée en production', await identify(req(null, { 'X-Dev-Email': 'pirate@x.com' }), { ...env, DEV_EMAIL: 'dev@x.com' }), null);
check('Access non configuré → tout est refusé', await identify(req(await token({})), { ENVIRONMENT: 'production' }), null);

process.exit(fail ? 1 : 0);
