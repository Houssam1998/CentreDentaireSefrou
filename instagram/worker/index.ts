/**
 * Worker du Studio : sert l'éditeur (fichiers statiques) et l'API de l'espace d'équipe (/api/*).
 * Données : Cloudflare D1 (créations, photos, modèles). Accès : Cloudflare Access (voir auth.ts).
 */
import { identify, type AuthEnv } from './auth';

interface Env extends AuthEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

const MAX_PROJECT = 1_800_000; // octets (limite D1 : 2 Mo par ligne)
const MAX_ASSET = 1_900_000;
const TRASH_DAYS = 30;
const ID = /^[A-Za-z0-9_-]{4,40}$/;

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const error = (status: number, message: string) => json({ error: message }, status);
/** D1 renvoie les colonnes BLOB sous forme de tableau de nombres : on les remet en octets. */
const bytes = (d: unknown): Uint8Array => (d instanceof ArrayBuffer ? new Uint8Array(d) : d instanceof Uint8Array ? d : new Uint8Array(d as number[]));

interface Row {
  id: string; name: string; format: string; pages: number; data: string; version: number;
  created_at: number; created_by: string; updated_at: number; updated_by: string; deleted_at: number | null; deleted_by: string | null;
}
const meta = (r: Omit<Row, 'data'>) => ({
  id: r.id, name: r.name, format: r.format, pages: r.pages, version: r.version,
  createdAt: r.created_at, createdBy: r.created_by, updatedAt: r.updated_at, updatedBy: r.updated_by,
  deletedAt: r.deleted_at, deletedBy: r.deleted_by,
});
const META_COLS = 'id, name, format, pages, version, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);

    // Les requêtes qui modifient doivent venir du Studio lui-même
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const origin = req.headers.get('Origin');
      if (origin && origin !== url.origin) return error(403, 'Origine refusée');
    }
    const email = await identify(req, env);
    if (!email) return error(401, 'Connexion requise');

    try {
      return await route(req, env, url, email);
    } catch (e) {
      console.error(e);
      return error(500, 'Erreur du serveur');
    }
  },
} satisfies ExportedHandler<Env>;

async function route(req: Request, env: Env, url: URL, email: string): Promise<Response> {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // sans « api »
  const [res, id, sub] = parts;
  const m = req.method;
  const now = Date.now();

  if (res === 'me' && m === 'GET') return json({ email });

  /* ---------- Créations ---------- */
  if (res === 'projects') {
    if (!id && m === 'GET') {
      // Nettoyage de la corbeille (plus de 30 jours)
      await env.DB.prepare('DELETE FROM projects WHERE deleted_at IS NOT NULL AND deleted_at < ?').bind(now - TRASH_DAYS * 86_400_000).run();
      const trash = url.searchParams.get('trash') === '1';
      const { results } = await env.DB.prepare(`SELECT ${META_COLS} FROM projects WHERE deleted_at IS ${trash ? 'NOT ' : ''}NULL ORDER BY ${trash ? 'deleted_at' : 'updated_at'} DESC LIMIT 500`).all<Row>();
      return json({ projects: results.map(meta) });
    }
    if (!id || !ID.test(id)) return error(400, 'Identifiant invalide');

    if (!sub && m === 'GET') {
      const r = await env.DB.prepare(`SELECT ${META_COLS}, data FROM projects WHERE id = ?`).bind(id).first<Row>();
      if (!r) return error(404, 'Création introuvable');
      return json({ meta: meta(r), project: JSON.parse(r.data) });
    }
    if (sub === 'meta' && m === 'GET') {
      const r = await env.DB.prepare(`SELECT ${META_COLS} FROM projects WHERE id = ?`).bind(id).first<Row>();
      return r ? json({ meta: meta(r) }) : error(404, 'Création introuvable');
    }
    if (!sub && m === 'PUT') {
      const text = await req.text();
      if (text.length > MAX_PROJECT) return error(413, 'Création trop volumineuse');
      const body = JSON.parse(text) as { project: { id: string; name?: string; format?: string; pages?: unknown[] }; baseVersion: number | null; force?: boolean };
      const p = body.project;
      if (!p || p.id !== id || !Array.isArray(p.pages)) return error(400, 'Création invalide');
      const cur = await env.DB.prepare(`SELECT ${META_COLS} FROM projects WHERE id = ?`).bind(id).first<Row>();
      // Quelqu'un d'autre a enregistré entre-temps : on ne l'écrase pas sans accord
      if (cur && !body.force && body.baseVersion !== cur.version) return json({ conflict: true, meta: meta(cur) }, 409);
      const name = String(p.name ?? 'Sans titre').slice(0, 120);
      const format = ['post', 'story', 'square'].includes(String(p.format)) ? String(p.format) : 'post';
      if (cur) {
        await env.DB.prepare('UPDATE projects SET name = ?, format = ?, pages = ?, data = ?, version = version + 1, updated_at = ?, updated_by = ?, deleted_at = NULL, deleted_by = NULL WHERE id = ?')
          .bind(name, format, p.pages.length, JSON.stringify(p), now, email, id).run();
      } else {
        await env.DB.prepare('INSERT INTO projects (id, name, format, pages, data, version, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)')
          .bind(id, name, format, p.pages.length, JSON.stringify(p), now, email, now, email).run();
      }
      const r = await env.DB.prepare(`SELECT ${META_COLS} FROM projects WHERE id = ?`).bind(id).first<Row>();
      return json({ meta: meta(r!) });
    }
    if (!sub && m === 'DELETE') {
      await env.DB.prepare('UPDATE projects SET deleted_at = ?, deleted_by = ? WHERE id = ?').bind(now, email, id).run();
      return json({ ok: true });
    }
    if (sub === 'restore' && m === 'POST') {
      await env.DB.prepare('UPDATE projects SET deleted_at = NULL, deleted_by = NULL, updated_at = ?, updated_by = ? WHERE id = ?').bind(now, email, id).run();
      return json({ ok: true });
    }
    if (sub === 'thumb' && m === 'PUT') {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 400_000) return error(413, 'Vignette trop lourde');
      await env.DB.prepare('UPDATE projects SET thumb = ? WHERE id = ?').bind(buf, id).run();
      return json({ ok: true });
    }
    if (sub === 'thumb' && m === 'GET') {
      const r = await env.DB.prepare('SELECT thumb FROM projects WHERE id = ?').bind(id).first<{ thumb: unknown }>();
      if (!r?.thumb) return new Response(null, { status: 404 });
      return new Response(bytes(r.thumb), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=60' } });
    }
  }

  /* ---------- Photos ---------- */
  if (res === 'assets') {
    if (!id && m === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, size, created_at, created_by FROM assets ORDER BY created_at DESC LIMIT 300').all();
      return json({ assets: results });
    }
    if (!id || !ID.test(id)) return error(400, 'Identifiant invalide');
    if (m === 'GET') {
      const r = await env.DB.prepare('SELECT mime, data FROM assets WHERE id = ?').bind(id).first<{ mime: string; data: unknown }>();
      if (!r) return new Response(null, { status: 404 });
      return new Response(bytes(r.data), { headers: { 'Content-Type': r.mime, 'Cache-Control': 'private, max-age=31536000, immutable' } });
    }
    if (m === 'PUT') {
      const mime = (req.headers.get('Content-Type') ?? '').split(';')[0];
      if (!/^image\/(jpeg|png|webp)$/.test(mime)) return error(415, 'Format d’image non accepté');
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_ASSET) return error(413, 'Photo trop lourde');
      await env.DB.prepare('INSERT OR IGNORE INTO assets (id, mime, size, data, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)').bind(id, mime, buf.byteLength, buf, now, email).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      await env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  /* ---------- Mes modèles (équipe) ---------- */
  if (res === 'templates') {
    if (!id && m === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, name, format, data, created_by, created_at FROM templates ORDER BY created_at DESC LIMIT 200').all<{ id: string; name: string; format: string; data: string; created_by: string; created_at: number }>();
      return json({ templates: results.map((t) => ({ id: t.id, name: t.name, format: t.format, page: JSON.parse(t.data), createdBy: t.created_by, createdAt: t.created_at })) });
    }
    if (!id || !ID.test(id)) return error(400, 'Identifiant invalide');
    if (m === 'PUT') {
      const text = await req.text();
      if (text.length > MAX_PROJECT) return error(413, 'Modèle trop volumineux');
      const t = JSON.parse(text) as { name: string; format: string; page: unknown };
      await env.DB.prepare('INSERT OR REPLACE INTO templates (id, name, format, data, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, String(t.name).slice(0, 120), String(t.format), JSON.stringify(t.page), now, email).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      await env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  return error(404, 'Introuvable');
}
