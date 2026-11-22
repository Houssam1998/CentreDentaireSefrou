/**
 * Live Google reviews: reads /api/reviews (refreshed every night by the site Worker) and
 * - updates every `[data-reviews-rating]` / `[data-reviews-count]` on the page,
 * - adds the latest 4★/5★ reviews in front of the curated ones in `[data-reviews-track]`.
 *
 * Pure enhancement: on any problem (offline, no data yet, local dev) the page keeps
 * the curated reviews rendered at build time.
 */
import type { LiveReview, ReviewsPayload } from '@/data/reviews.types';

/** How many live reviews may be added in front of the curated ones. */
const MAX_ADDED = 6;

/** "Fadoua B." / "fadoua bennani" → "fadoua b" — used to avoid showing the same review twice. */
const key = (name: string) => {
  const parts = name.toLocaleLowerCase('fr').replace(/\./g, '').trim().split(/\s+/);
  return `${parts[0] ?? ''} ${Array.from(parts[parts.length - 1] ?? '')[0] ?? ''}`.trim();
};

/** Début du texte d'un avis, sans accents ni ponctuation : repère un même avis signé autrement (« Ben Rachida » / « Rachida B. »). */
export const textKey = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '').slice(0, 40);

const isPayload = (d: unknown): d is ReviewsPayload =>
  !!d && typeof d === 'object' && typeof (d as ReviewsPayload).rating === 'number' && typeof (d as ReviewsPayload).count === 'number' && Array.isArray((d as ReviewsPayload).reviews);

function monthYear(iso: string | null, locale: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const s = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

function card(tpl: HTMLTemplateElement, r: LiveReview, lang: 'fr' | 'en', locale: string, translatedLabel: string) {
  const li = (tpl.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
  const set = (sel: string, text: string) => {
    const el = li.querySelector<HTMLElement>(sel);
    if (el) el.textContent = text;
  };
  set('[data-r-text]', r.text[lang]);
  set('[data-r-name]', r.name);
  // Attribution Google : le nom mène au profil de l'auteur (ou à l'avis)
  const link = li.querySelector<HTMLAnchorElement>('a[data-r-name]');
  const href = r.authorUri ?? r.uri;
  if (link && href?.startsWith('https://')) link.href = href;
  else link?.removeAttribute('target');
  set('[data-r-initial]', Array.from(r.name)[0] ?? '');
  set('[data-r-meta]', `${monthYear(r.time, locale)}${r.translated[lang] ? translatedLabel : ''}`);
  const stars = li.querySelector<HTMLElement>('[data-r-stars]');
  if (stars) {
    stars.setAttribute('aria-label', `${r.rating}/5`);
    Array.from(stars.children).slice(r.rating).forEach((s) => s.remove());
  }
  li.dataset.reviewName = r.name;
  li.dataset.live = '';
  return li;
}

function apply(data: ReviewsPayload) {
  const root = document.querySelector<HTMLElement>('[data-reviews]');
  const lang = (root?.dataset.lang ?? document.documentElement.lang).startsWith('en') ? 'en' : 'fr';
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  const rating = data.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  document.querySelectorAll<HTMLElement>('[data-reviews-rating]').forEach((el) => {
    // Animated counters (Stats section) read their target from data-count
    if (el.dataset.count !== undefined) el.dataset.count = String(data.rating);
    el.textContent = rating;
  });
  document.querySelectorAll<HTMLElement>('[data-reviews-count]').forEach((el) => {
    el.textContent = data.count.toLocaleString(locale);
  });

  const track = root?.querySelector<HTMLElement>('[data-reviews-track]');
  const tpl = root?.querySelector<HTMLTemplateElement>('[data-review-template]');
  if (!root || !track || !tpl) return;
  if (data.mapsUri) root.querySelector<HTMLAnchorElement>('[data-reviews-link]')?.setAttribute('href', data.mapsUri);

  const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-review-name]'));
  const shown = new Set(cards.map((li) => key(li.dataset.reviewName ?? '')));
  // Comparaison sur le texte français (celui des avis sélectionnés), quelle que soit la langue affichée
  const shownText = new Set(cards.map((li) => li.dataset.reviewText ?? '').filter(Boolean));
  const fresh = data.reviews
    .filter((r) => r.rating >= 4 && r.text[lang]?.trim() && !shown.has(key(r.name)) && !shownText.has(textKey(r.text.fr)))
    .slice(0, MAX_ADDED);
  if (!fresh.length) return;

  const frag = document.createDocumentFragment();
  for (const r of fresh) frag.append(card(tpl, r, lang, locale, root.dataset.translated ?? ''));
  track.prepend(frag);
  track.scrollLeft = 0;
}

export function initLiveReviews() {
  if (!document.querySelector('[data-reviews], [data-reviews-count]')) return;
  fetch('/api/reviews', { headers: { accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (isPayload(data)) apply(data);
    })
    .catch(() => {});
}
