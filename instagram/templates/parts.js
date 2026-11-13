/** Pièces communes à tous les modèles : en-tête avec le logo, pied de page, badge, mise en forme du texte. */
import { brand } from '../config.js';
import { logo, icons, waves } from '../brand/motifs.js';

/** Échappe le HTML puis applique une mise en forme minimale : **gras**, *italique/accent*, retour à la ligne. */
export function md(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

/** Liste saisie ligne par ligne, colonnes séparées par « | ». */
export function rows(s = '') {
  return String(s)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split('|').map((c) => c.trim()));
}

export const icon = (name) => icons[name] ?? icons.tooth;

export function head({ center = false, right = '' } = {}) {
  return `<header class="ig-head${center ? ' center' : ''}">
    <div class="mark">${logo.mark}</div>
    <div class="names"><div class="logo-ar">${logo.ar}</div><div class="logo-fr">${logo.fr}</div></div>
    ${right ? `<div class="series">${right}</div>` : ''}
  </header>`;
}

export function badge(fr, ar) {
  if (!fr && !ar) return '';
  return `<span class="badge">${fr ? `<span>${md(fr)}</span>` : ''}${fr && ar ? '<span class="dot"></span>' : ''}${ar ? `<span class="ar">${md(ar)}</span>` : ''}</span>`;
}

export function foot() {
  return `<footer class="ig-foot">
    <span>${icons.instagram}${brand.instagram}</span>
    <span>${icons.phone}${brand.phone}</span>
    <span>${icons.pin}Derb El Miter · ${brand.cityShort}</span>
  </footer>`;
}

/** Cadre complet. bg = calques de fond (HTML), body = contenu. */
export function frame({ tone = 'light', size = 'post', bg = '', body = '', cls = '' }) {
  return `<div class="ig ${cls}" data-tone="${tone}" data-size="${size}"><div class="ig-bg">${bg}</div>${body}</div>`;
}

/** Lignes d'or en filigrane, dans un coin. */
export function cornerWaves(corner = 'bottom-left', tone = 'light') {
  const color = tone === 'night' ? '#c8a97e' : '#c8a97e';
  const op = tone === 'night' ? 0.45 : 0.3;
  const pos = {
    'bottom-left': { x: -160, y: 960, tilt: -0.22 },
    'bottom-right': { x: 260, y: 900, tilt: -0.1 },
    'top-right': { x: 360, y: -120, tilt: 0.12 },
    top: { x: 0, y: -170, tilt: -0.08 },
  }[corner];
  return waves({ w: 960, h: 620, n: 16, gap: 15, amp: 40, tilt: pos.tilt, bump: 60, color, width: 1.6, opacity: op, x: pos.x, y: pos.y });
}
