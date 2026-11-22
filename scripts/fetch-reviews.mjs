/**
 * Runs before `npm run build`: copies the live Google rating and review count
 * (refreshed every night by the site Worker) into src/data/reviews.generated.json,
 * so the static pages and the structured data show up-to-date figures.
 *
 * Never blocks the build: on any problem the file is left empty and site.ts values are used.
 * Only the two figures are kept, not the review texts.
 */
import { writeFile } from 'node:fs/promises';

const url = `${process.env.SITE_URL ?? 'https://www.centredentairesefrou.com'}/api/reviews`;
const out = new URL('../src/data/reviews.generated.json', import.meta.url);

let data = {};
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
  if (res.ok) {
    const json = await res.json();
    if (typeof json.rating === 'number' && typeof json.count === 'number') {
      data = { rating: json.rating, count: json.count, fetchedAt: json.fetchedAt };
      console.log(`Avis Google : note ${json.rating}, ${json.count} avis (relevés le ${json.fetchedAt})`);
    }
  } else {
    console.log(`Avis Google : pas encore de données en ligne (HTTP ${res.status}), valeurs de site.ts utilisées`);
  }
} catch (err) {
  console.log(`Avis Google : site injoignable (${err.message}), valeurs de site.ts utilisées`);
}
await writeFile(out, `${JSON.stringify(data, null, 2)}\n`);
