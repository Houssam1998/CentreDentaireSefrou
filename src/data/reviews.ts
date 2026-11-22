/**
 * Google rating and review count used by the pages and the structured data.
 *
 * `npm run build` first runs scripts/fetch-reviews.mjs, which reads the live figures from
 * https://www.centredentairesefrou.com/api/reviews into reviews.generated.json (git-ignored).
 * When that file is missing or empty (offline, first deploy…), the values of site.stats are used.
 */
import { site } from './site';
import type { ReviewsPayload } from './reviews.types';

type Generated = Partial<Pick<ReviewsPayload, 'rating' | 'count' | 'fetchedAt'>>;
const generated: Generated =
  Object.values(import.meta.glob<{ default: Generated }>('./reviews.generated.json', { eager: true }))[0]?.default ?? {};

/** Chiffres relevés il y a plus de 30 jours : ignorés (conditions de Google sur la conservation des données). */
const fresh = !!generated.fetchedAt && Date.now() - new Date(generated.fetchedAt).getTime() < 30 * 86_400_000;
const valid = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;

export const reviewStats = {
  rating: fresh && valid(generated.rating, 1, 5) ? generated.rating : site.stats.rating,
  count: fresh && valid(generated.count, 1, 100000) ? generated.count : site.stats.reviews,
};

/** Google's "write a review" page for the clinic, or null while site.googlePlaceId is empty. */
export const writeReviewUrl = site.googlePlaceId
  ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(site.googlePlaceId)}`
  : null;
