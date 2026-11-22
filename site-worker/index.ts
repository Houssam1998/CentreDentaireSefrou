/**
 * Site Worker (www.centredentairesefrou.com).
 *
 * The site itself stays 100 % static: thanks to `run_worker_first: ["/api/*"]` in wrangler.jsonc,
 * only /api/* requests reach this code; every page is served straight from ./dist.
 *
 * - Every night (cron), the Google reviews are fetched from Google Places API (New) and stored in KV.
 * - GET /api/reviews returns them to the home page, which shows them on top of the curated ones.
 *
 * Google's terms do not allow keeping Places content for long: the KV entry is replaced every night
 * and expires on its own after 25 days if the refresh keeps failing (the page then shows the curated reviews).
 */
import { site } from '../src/data/site';
import { buildPayload, type PlacesPlace } from './reviews';

interface Env {
  ASSETS: Fetcher;
  /** Absent tant que l'espace KV n'est pas créé (voir wrangler.jsonc) : le site garde alors les avis sélectionnés. */
  REVIEWS?: KVNamespace;
  /** Secret (npx wrangler secret put GOOGLE_PLACES_KEY) — Google Cloud key restricted to Places API (New). */
  GOOGLE_PLACES_KEY?: string;
}

const KV_KEY = 'reviews:v1';
const TTL_SECONDS = 25 * 24 * 3600;

const json = (body: unknown, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } });

async function fetchPlace(lang: 'fr' | 'en', env: Env): Promise<PlacesPlace> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(site.googlePlaceId)}?languageCode=${lang}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY ?? '',
      'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri',
    },
  });
  if (!res.ok) throw new Error(`Google Places (${lang}) : HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

export async function refreshReviews(env: Env) {
  if (!env.REVIEWS || !env.GOOGLE_PLACES_KEY || !site.googlePlaceId) {
    console.warn('Avis Google : espace KV REVIEWS, GOOGLE_PLACES_KEY ou site.googlePlaceId manquant, rafraîchissement ignoré');
    return null;
  }
  const fr = await fetchPlace('fr', env);
  // The English call only provides translations: the French data is enough if it fails.
  const en = await fetchPlace('en', env).catch((err) => (console.warn(String(err)), null));
  const payload = buildPayload(fr, en, new Date());
  await env.REVIEWS.put(KV_KEY, JSON.stringify(payload), { expirationTtl: TTL_SECONDS });
  console.log(`Avis Google : ${payload.reviews.length} avis affichables, note ${payload.rating}, ${payload.count} avis au total`);
  return payload;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/reviews' || pathname === '/api/reviews/') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method' }, 405);
      const data = env.REVIEWS ? await env.REVIEWS.get(KV_KEY) : null;
      if (!data) return json({ error: 'no-data' }, 404);
      return new Response(data, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not-found' }, 404);
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(refreshReviews(env));
  },
} satisfies ExportedHandler<Env>;
