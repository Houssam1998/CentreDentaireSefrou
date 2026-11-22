/**
 * Turns two Google Places API (New) "Place Details" responses (French and English)
 * into the payload served at /api/reviews. Pure functions: tested by reviews.test.mjs.
 */
import type { LiveReview, ReviewsPayload } from '../src/data/reviews.types';

interface LocalizedText {
  text?: string;
  languageCode?: string;
}
export interface PlacesReview {
  name?: string;
  rating?: number;
  publishTime?: string;
  text?: LocalizedText;
  originalText?: LocalizedText;
  authorAttribution?: { displayName?: string; uri?: string };
  googleMapsUri?: string;
}
export interface PlacesPlace {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
}

/** Only reviews at or above this rating are shown (the average and the count stay Google's real figures). */
export const MIN_RATING = 4;

const baseLang = (code: string | undefined) => (code ?? '').toLowerCase().split('-')[0];

function textIn(review: PlacesReview | undefined, lang: 'fr' | 'en'): { text: string; translated: boolean } {
  const original = review?.originalText?.text?.trim() ?? '';
  const shown = review?.text?.text?.trim() || original;
  const sourceLang = baseLang(review?.originalText?.languageCode ?? review?.text?.languageCode);
  return { text: shown, translated: !!sourceLang && sourceLang !== lang && shown !== original };
}

export function buildPayload(fr: PlacesPlace, en: PlacesPlace | null, now: Date): ReviewsPayload {
  if (typeof fr.rating !== 'number' || typeof fr.userRatingCount !== 'number') {
    throw new Error('Réponse Google incomplète : note ou nombre d’avis manquant');
  }
  const english = new Map((en?.reviews ?? []).filter((r) => r.name).map((r) => [r.name as string, r]));

  const reviews: LiveReview[] = (fr.reviews ?? [])
    .filter((r) => (r.rating ?? 0) >= MIN_RATING && (r.originalText?.text ?? r.text?.text ?? '').trim().length > 0)
    .map((r, i) => {
      const f = textIn(r, 'fr');
      const twin = english.get(r.name ?? '');
      // Without the English twin, fall back to the original text (never to the French translation).
      const e = twin ? textIn(twin, 'en') : { text: r.originalText?.text?.trim() || f.text, translated: false };
      return {
        id: r.name ?? `review-${i}`,
        // Attribution exigée par Google : nom de l'auteur tel quel, avec le lien vers son profil
        name: r.authorAttribution?.displayName?.trim() || 'Utilisateur Google',
        authorUri: r.authorAttribution?.uri ?? null,
        rating: Math.round(r.rating ?? 5),
        time: r.publishTime ?? null,
        text: { fr: f.text, en: e.text },
        translated: { fr: f.translated, en: e.translated },
        uri: r.googleMapsUri ?? null,
      };
    })
    .sort((a, b) => b.rating - a.rating || (b.time ?? '').localeCompare(a.time ?? ''));

  return {
    fetchedAt: now.toISOString(),
    rating: Math.round(fr.rating * 10) / 10,
    count: fr.userRatingCount,
    mapsUri: fr.googleMapsUri ?? null,
    reviews,
  };
}
