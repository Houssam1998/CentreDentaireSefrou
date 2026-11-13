/**
 * Identification par Cloudflare Access : le jeton signé (JWT) ajouté par Access à chaque requête est vérifié
 * (signature RS256 avec les clés publiques de l'équipe, audience, expiration). L'e-mail vient de ce jeton,
 * jamais d'un en-tête que le navigateur pourrait falsifier.
 */
export interface AuthEnv {
  ACCESS_TEAM?: string; // ex. « centredentairesefrou » → centredentairesefrou.cloudflareaccess.com
  ACCESS_AUD?: string; // « Application Audience (AUD) tag » de l'application Access
  ALLOWED_EMAILS?: string; // liste de secours, séparée par des virgules (facultatif)
  ENVIRONMENT?: string; // « production » (wrangler.jsonc) ; « development » seulement dans .dev.vars
  DEV_EMAIL?: string; // développement local uniquement (fichier .dev.vars, jamais publié)
}

interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string }
let certs: { at: number; keys: Jwk[] } | null = null;

const b64urlToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function keysFor(team: string, force = false): Promise<Jwk[]> {
  if (!force && certs && Date.now() - certs.at < 3600_000) return certs.keys;
  const r = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('certs');
  const body = (await r.json()) as { keys: Jwk[] };
  certs = { at: Date.now(), keys: body.keys };
  return body.keys;
}

function cookie(req: Request, name: string) {
  const m = (req.headers.get('Cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function verifyAccessJwt(token: string, env: AuthEnv): Promise<string | null> {
  const team = env.ACCESS_TEAM, aud = env.ACCESS_AUD;
  if (!team || !aud) return null;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const header = b64urlJson(h) as { kid: string; alg: string };
  const payload = b64urlJson(p) as { aud: string | string[]; exp: number; nbf?: number; iss: string; email?: string };
  if (header.alg !== 'RS256') return null;
  let jwk = (await keysFor(team)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await keysFor(team, true)).find((k) => k.kid === header.kid); // rotation des clés
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud) || payload.exp < now || (payload.nbf && payload.nbf > now + 60)) return null;
  if (payload.iss !== `https://${team}.cloudflareaccess.com`) return null;
  return payload.email?.toLowerCase() ?? null;
}

/** E-mail de la personne connectée, ou null. */
export async function identify(req: Request, env: AuthEnv): Promise<string | null> {
  // Identité simulée : uniquement en développement local (les deux réglages n'existent que dans .dev.vars)
  if (env.DEV_EMAIL && env.ENVIRONMENT === 'development') return (req.headers.get('X-Dev-Email') ?? env.DEV_EMAIL).toLowerCase();
  const token = req.headers.get('Cf-Access-Jwt-Assertion') ?? cookie(req, 'CF_Authorization');
  if (!token) return null;
  const email = await verifyAccessJwt(token, env).catch(() => null);
  if (!email) return null;
  const allow = (env.ALLOWED_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allow.length && !allow.includes(email)) return null;
  return email;
}
