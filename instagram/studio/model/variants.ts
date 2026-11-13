/**
 * Variantes : déclinaisons automatiques d'une page pour sortir du cadre sans repartir de zéro.
 */
import type { Page, Tone, Format, Mask, El } from './types';
import { FORMATS } from './types';
import { freshPage } from '../store/editor';

const TONES: Tone[] = ['light', 'greige', 'night'];
const MASKS: Mask[] = ['arch', 'stadium', 'circle', 'rounded'];

const nextTone = (t: Tone, step = 1) => TONES[(TONES.indexOf(t) + step) % TONES.length];

/** Les composants pleine largeur (pied de page) et le logo restent à leur place. */
const fixed = (e: El) => e.type === 'component' && (e.name === 'footer');

export function mirror(page: Page, format: Format): Page {
  const { w: W } = FORMATS[format];
  const p = freshPage(page);
  for (const e of p.elements) {
    if (fixed(e)) continue;
    e.x = Math.round(W - e.x - e.w);
    e.rotation = -e.rotation;
  }
  return p;
}

export function retone(page: Page, step = 1): Page {
  const p = freshPage(page);
  p.tone = nextTone(page.tone, step);
  return p;
}

export function remask(page: Page): Page {
  const p = freshPage(page);
  for (const e of p.elements) {
    if (e.type === 'image') e.mask = MASKS[(MASKS.indexOf(e.mask) + 1) % MASKS.length];
    if (e.type === 'motif' && e.mask) e.mask = MASKS[(MASKS.indexOf(e.mask) + 1) % MASKS.length];
  }
  return p;
}

/** Fait basculer les lignes d'or et les arches de l'autre côté (haut ↔ bas). */
export function flipDecor(page: Page, format: Format): Page {
  const { h: H } = FORMATS[format];
  const p = freshPage(page);
  for (const e of p.elements) {
    const decor = (e.type === 'motif' && (e.kind === 'waves' || e.kind === 'svg')) || (e.type === 'shape' && e.shape === 'glow-arch' && (e.x < 0 || e.x + e.w > 1000));
    if (decor) e.y = Math.round(H - e.y - e.h);
  }
  return p;
}

export function variantsOf(page: Page, format: Format): { label: string; page: Page }[] {
  return [
    { label: 'Miroir', page: mirror(page, format) },
    { label: 'Autre ambiance', page: retone(page, 1) },
    { label: 'Miroir + ambiance', page: retone(mirror(page, format), 2) },
    { label: 'Formes et décor', page: flipDecor(remask(page), format) },
  ];
}

/** Une combinaison au hasard. */
export function surprise(page: Page, format: Format): Page {
  let p = page;
  if (Math.random() < 0.5) p = mirror(p, format);
  p = retone(p, 1 + Math.floor(Math.random() * 2));
  if (Math.random() < 0.6) p = remask(p);
  if (Math.random() < 0.5) p = flipDecor(p, format);
  return p === page ? freshPage(page) : p;
}
