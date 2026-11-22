/**
 * Shape of the Google reviews refreshed every night by the site Worker (site-worker/)
 * and served at /api/reviews. Types only: shared by the Worker, the build and the page script.
 */
export interface LiveReview {
  /** Google resource name of the review (stable id). */
  id: string;
  /** Author name exactly as Google gives it (Google's attribution rules). */
  name: string;
  /** Link to the author's Google Maps profile (attribution), if any. */
  authorUri: string | null;
  rating: number;
  /** Publication date (ISO) or null if Google did not give one. */
  time: string | null;
  text: { fr: string; en: string };
  /** True when Google machine-translated the text into that language. */
  translated: { fr: boolean; en: boolean };
  /** Link to the review on Google Maps. */
  uri: string | null;
}

export interface ReviewsPayload {
  fetchedAt: string;
  /** Average rating over ALL Google reviews (not only the ones shown). */
  rating: number;
  /** Total number of Google reviews. */
  count: number;
  mapsUri: string | null;
  /** 4★ and 5★ reviews with a text, 5★ first then newest first. */
  reviews: LiveReview[];
}
