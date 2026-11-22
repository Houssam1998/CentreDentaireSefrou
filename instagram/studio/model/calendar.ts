/**
 * Calendrier des occasions : prochaines fêtes et journées, pour préparer les publications à l'avance.
 *
 * - Dates fixes (fêtes nationales, Nouvel An, 20 mars…) : exactes.
 * - Fêtes religieuses : calculées avec le calendrier hégirien Umm al-Qura du navigateur.
 *   Au Maroc, la date dépend de l'observation du croissant : souvent un jour plus tard. Elles sont marquées « estimée ».
 */
import { OCCASIONS } from '../../templates/occasions.js';

export interface Upcoming {
  key: string;
  label: string;
  emoji: string;
  /** Jour de l'occasion (minuit, heure locale). */
  date: Date;
  /** Date conseillée de publication (la veille pour Nouvel An, Yennayer, Ramadan ; sinon le jour même). */
  publishOn: Date;
  estimated: boolean;
  /** Nombre de jours avant l'occasion (0 = aujourd'hui). */
  inDays: number;
}

const DAY = 86_400_000;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

let hijriFmt: Intl.DateTimeFormat | null | undefined;
function hijriParts(d: Date): [number, number] | null {
  if (hijriFmt === undefined) {
    try {
      hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
      if (hijriFmt.resolvedOptions().calendar !== 'islamic-umalqura') hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-civil', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
    } catch {
      hijriFmt = null;
    }
  }
  if (!hijriFmt) return null;
  const parts = Object.fromEntries(hijriFmt.formatToParts(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))).map((p) => [p.type, p.value]));
  return [Number(parts.month), Number(parts.day)];
}

/** Prochaine date (à partir d'aujourd'hui inclus) d'une occasion, ou null si elle n'a pas de date. */
export function nextDate(key: string, from = new Date()): { date: Date; estimated: boolean } | null {
  const when = OCCASIONS[key]?.when;
  const today = midnight(from);
  if (when?.fixed) {
    const [m, d] = when.fixed.split('-').map(Number);
    let date = new Date(today.getFullYear(), m - 1, d);
    if (date < today) date = new Date(today.getFullYear() + 1, m - 1, d);
    return { date, estimated: false };
  }
  if (when?.hijri) {
    const [hm, hd] = when.hijri;
    for (let i = 0; i < 400; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const p = hijriParts(date);
      if (!p) return null;
      if (p[0] === hm && p[1] === hd) return { date, estimated: true };
    }
  }
  return null;
}

/** Les `n` prochaines occasions, de la plus proche à la plus lointaine. */
export function upcoming(n = 3, from = new Date()): Upcoming[] {
  const today = midnight(from);
  const list: Upcoming[] = [];
  for (const [key, o] of Object.entries(OCCASIONS)) {
    const next = nextDate(key, from);
    if (!next) continue;
    const publishOn = new Date(next.date.getTime() - (o.publishBefore ?? 0) * DAY);
    list.push({ key, label: o.label, emoji: o.emoji, date: next.date, publishOn, estimated: next.estimated, inDays: Math.round((next.date.getTime() - today.getTime()) / DAY) });
  }
  return list.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, n);
}

/** « 14 janvier 2027 » */
export const longDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « aujourd'hui », « demain », « dans 12 jours » */
export const inDaysLabel = (n: number) => (n <= 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`);

/** AAAA-MM-JJ en heure locale (pour le champ « date de publication » du projet). */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
