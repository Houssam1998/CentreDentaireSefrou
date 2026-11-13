/**
 * Motifs graphiques maison : lignes d'or (tirées du logo), arches lumineuses, icônes, symboles des fêtes.
 * Tout est en SVG pour rester net à n'importe quelle taille.
 */
import markSvg from './logo-mark.svg?raw';
import arSvg from './logo-ar.svg?raw';
import frSvg from './logo-fr.svg?raw';

export const logo = { mark: markSvg, ar: arSvg, fr: frSvg };

/**
 * « Lignes d'or » : faisceau de courbes parallèles qui ondulent comme les lignes du logo.
 * @param {object} o  w,h taille ; n nombre de lignes ; gap écart ; amp amplitude ; tilt pente ; bump bosse centrale
 */
export function waves({ w = 1080, h = 600, n = 18, gap = 16, amp = 46, tilt = -0.18, bump = 70, color = 'currentColor', width = 2, opacity = 1, x = 0, y = 0, cls = '', draw = false } = {}) {
  const paths = [];
  for (let i = 0; i < n; i++) {
    const pts = [];
    const steps = 48;
    const y0 = h * 0.18 + i * gap;
    const phase = i * 0.09;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = t * w;
      const py =
        y0 +
        tilt * px +
        amp * Math.sin(t * Math.PI * 1.35 + phase) -
        bump * Math.exp(-(((t - 0.62 + i * 0.006) / 0.16) ** 2)) * (0.35 + i / n);
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    const len = Math.round(w * 1.8);
    const dash = draw ? ` stroke-dasharray="${len}" stroke-dashoffset="${len}"` : '';
    paths.push(`<polyline points="${pts.join(' ')}"${dash} />`);
  }
  return `<svg class="${cls}" style="left:${x}px;top:${y}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}">${paths.join('')}</svg>`;
}

/** Paire d'arches rétro-éclairées, comme sur le mur de l'accueil. side = 'left' | 'right' */
export function arches(side = 'left', { top = 260, scale = 1 } = {}) {
  const s = (v) => Math.round(v * scale);
  const edge = side === 'left' ? 'left' : 'right';
  return `
    <div class="glow-arch" style="${edge}:${s(-70)}px;top:${top}px;width:${s(150)}px;height:${s(430)}px"></div>
    <div class="glow-arch" style="${edge}:${s(-70)}px;top:${top + s(470)}px;width:${s(150)}px;height:${s(360)}px"></div>
    <div class="glow-arch" style="${edge}:${s(108)}px;top:${top + s(150)}px;width:${s(150)}px;height:${s(560)}px"></div>`;
}

const ic = (body, vb = 48) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/** Icônes au trait (dessinées pour la charte). */
export const icons = {
  tooth: ic('<path d="M15 7c-4.5 0-8 3.5-8 9 0 4 1.6 7 2.6 10.5 1 4 1.6 14.5 5.4 14.5 2.6 0 3.2-6 4.8-9.2.8-1.6 2-2.3 3.2-2.3s2.4.7 3.2 2.3c1.6 3.2 2.2 9.2 4.8 9.2 3.8 0 4.4-10.5 5.4-14.5 1-3.5 2.6-6.5 2.6-10.5 0-5.5-3.5-9-8-9-3.2 0-5 1.6-8 1.6S18.2 7 15 7z"/>'),
  sparkle: ic('<path d="M24 5v10M24 33v10M5 24h10M33 24h10M11 11l6 6M31 31l6 6M37 11l-6 6M17 31l-6 6"/>'),
  brush: ic('<rect x="3" y="31" width="26" height="6" rx="3"/><rect x="27" y="30" width="18" height="8" rx="2.5"/><path d="M30 30v-8M34 30v-9M38 30v-9M42 30v-8"/><path d="M29 18c2.5-3 5.5-3 8 0 2-2 5-2 7 0" stroke-width="2"/>'),
  floss: ic('<rect x="6" y="18" width="24" height="24" rx="7"/><circle cx="18" cy="30" r="4.5"/><path d="M27 21c6-3 10-8 13-15"/><path d="M38 4l4 3" stroke-width="2"/>'),
  water: ic('<path d="M24 5c7 9 13 16 13 23a13 13 0 0 1-26 0c0-7 6-14 13-23z"/><path d="M18 30a6 6 0 0 0 6 6"/>'),
  sugar: ic('<path d="M17 16h14a8 8 0 0 1 0 16H17a8 8 0 0 1 0-16z"/><path d="M9 24 3 17v14zM39 24l6-7v14z"/><path d="M20 16c-2 5-2 11 0 16M28 16c2 5 2 11 0 16" stroke-width="1.8"/>'),
  calendar: ic('<rect x="6" y="10" width="36" height="32" rx="5"/><path d="M6 19h36M16 5v9M32 5v9"/><path d="M15 27h4M22 27h4M29 27h4M15 34h4M22 34h4"/>'),
  clock: ic('<circle cx="24" cy="24" r="18"/><path d="M24 13v11l7 5"/>'),
  pin: ic('<path d="M24 44s14-13 14-24a14 14 0 0 0-28 0c0 11 14 24 14 24z"/><circle cx="24" cy="20" r="5"/>'),
  phone: ic('<path d="M15 6h-4a4 4 0 0 0-4 4c0 17 14 31 31 31a4 4 0 0 0 4-4v-5l-8-3-4 4c-5-2-9-6-11-11l4-4-3-8z"/>'),
  whatsapp: ic('<path d="M8 40l3-8a16 16 0 1 1 6 6z"/><path d="M18 17c0 7 6 13 13 13l2-3-4-2-2 2c-2-1-4-3-5-5l2-2-2-4z" stroke-width="2"/>'),
  instagram: ic('<rect x="7" y="7" width="34" height="34" rx="10"/><circle cx="24" cy="24" r="8"/><circle cx="34.5" cy="13.5" r="1.4" fill="currentColor"/>'),
  tiktok: ic('<path d="M30 6c.6 4.6 3.4 8 8 8.6v6.6c-3 0-5.8-.8-8-2.4v12.2a11.2 11.2 0 1 1-11.2-11.2c.6 0 1.2 0 1.8.2v6.8a4.6 4.6 0 1 0 3 4.2V6z"/>'),
  globe: ic('<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c6 6 6 30 0 36M24 6c-6 6-6 30 0 36"/>'),
  check: ic('<path d="M10 25l9 9 19-20"/>'),
  cross: ic('<path d="M13 13l22 22M35 13 13 35"/>'),
  dot: ic('<circle cx="24" cy="24" r="5" fill="currentColor"/>'),
  drop: ic('<path d="M24 6c6 8 11 14 11 20a11 11 0 0 1-22 0c0-6 5-12 11-20z"/><path d="M12 42h24"/>'),
  gum: ic('<path d="M13 9c-3.6 0-6.4 2.8-6.4 7.2 0 3.2 1.3 5.6 2.1 8.4.8 3.2 1.3 11.6 4.3 11.6 2.1 0 2.6-4.8 3.8-7.4.6-1.3 1.6-1.8 2.6-1.8s2 .5 2.6 1.8c1.2 2.6 1.7 7.4 3.8 7.4 3 0 3.5-8.4 4.3-11.6.8-2.8 2.1-5.2 2.1-8.4 0-4.4-2.8-7.2-6.4-7.2-2.6 0-4 1.3-6.4 1.3S15.6 9 13 9z"/><path d="M4 26c3-1.6 5 .6 7.5-.4M28 25.6c2.6 1 4.6-1.2 7.6.4" stroke-width="2"/><path d="M40 6c1.8 2.6 3.4 4.4 3.4 6.2a3.4 3.4 0 0 1-6.8 0c0-1.8 1.6-3.6 3.4-6.2z" fill="currentColor" fill-opacity=".25"/>'),
  shield: ic('<path d="M24 5l15 6v11c0 10-7 17-15 21C16 39 9 32 9 22V11z"/><path d="M17 24l5 5 9-10"/>'),
  scan: ic('<path d="M8 16V10a2 2 0 0 1 2-2h6M32 8h6a2 2 0 0 1 2 2v6M40 32v6a2 2 0 0 1-2 2h-6M16 40h-6a2 2 0 0 1-2-2v-6"/><path d="M14 24h20"/><path d="M19 17c0-2 2-3 5-3s5 1 5 3c0 4-1 6-2 11-.5 2-1 3-2 3s-1-2-1-4-1-3-1-3-1 1-1 3-0 4-1 4-1.5-1-2-3c-1-5-2-7-2-11z" stroke-width="1.8"/>'),
  aligner: ic('<path d="M6 22c0-6 8-10 18-10s18 4 18 10c0 3-2 5-5 5-2 0-3-2-5-2s-3 2-5 2-3-2-3-2-1 2-3 2-3-2-5-2-3 2-5 2c-3 0-5-2-5-5z"/><path d="M10 31c4 3 9 5 14 5s10-2 14-5" stroke-dasharray="3 4"/>'),
  braces: ic('<path d="M6 20c0-5 8-9 18-9s18 4 18 9"/><rect x="9" y="19" width="6" height="7" rx="1.5"/><rect x="21" y="18" width="6" height="7" rx="1.5"/><rect x="33" y="19" width="6" height="7" rx="1.5"/><path d="M6 22.5h36"/><path d="M8 30c4 4 10 6 16 6s12-2 16-6"/>'),
  moon: ic('<path d="M32 8a17 17 0 1 0 8 26A14 14 0 0 1 32 8z"/>'),
  sleep: ic('<path d="M30 8a15 15 0 1 0 10 24 12 12 0 0 1-10-24z"/><path d="M30 18h7l-7 8h7" stroke-width="2"/>'),
  bite: ic('<path d="M8 18c4-5 10-7 16-7s12 2 16 7"/><path d="M8 30c4 5 10 7 16 7s12-2 16-7"/><path d="M14 21v6M20 20v8M28 20v8M34 21v6"/><path d="M4 24h6M38 24h6" stroke-width="2"/>'),
  implant: ic('<path d="M15 8c3-2 6-1 9-1s6-1 9 1c3 3 1 9-1 11H16c-2-2-4-8-1-11z"/><path d="M18 19h12M19 24h10M20 29h8M21 34h6M22 39h4M24 39v4"/>'),
  heart: ic('<path d="M24 41S7 31 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 13-17 23-17 23z"/>'),
  team: ic('<circle cx="17" cy="16" r="6"/><circle cx="33" cy="18" r="5"/><path d="M5 40c1-8 6-12 12-12s11 4 12 12"/><path d="M29 30c2-2 4-3 6-3 5 0 8 4 9 11"/>'),
  star: '<svg viewBox="0 0 48 48"><path fill="currentColor" d="M24 4l6 13 14 1.5-10.5 9.5 3 14L24 35l-12.5 7 3-14L4 18.5 18 17z"/></svg>',
  cherry: ic('<circle cx="15" cy="34" r="8"/><circle cx="33" cy="36" r="7"/><path d="M15 26c2-9 8-16 16-20M33 29c-1-9-2-16-2-23"/><path d="M31 6c4-2 9-1 11 3-4 2-8 1-11-3z"/>'),
  arrow: ic('<path d="M8 24h30M28 14l10 10-10 10"/>'),
  swipe: ic('<path d="M6 24h26M24 16l8 8-8 8"/><path d="M38 12v24"/>'),
  bulb: ic('<path d="M17 30c-4-3-6-7-6-11a13 13 0 0 1 26 0c0 4-2 8-6 11v5H17z"/><path d="M19 41h10"/>'),
};

/** Drapeau du Maroc : fond rouge, pentagramme vert entrelacé. */
export function flag(w = 300) {
  const h = Math.round(w * 2 / 3);
  // Pentagramme : 5 sommets, tracé en une seule ligne (étoile de Salomon à 5 branches)
  const cx = w / 2, cy = h / 2, r = h * 0.3;
  const p = [0, 2, 4, 1, 3, 0].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#c1272d"/><polyline points="${p.join(' ')}" fill="none" stroke="#006233" stroke-width="${(h * 0.045).toFixed(1)}" stroke-linejoin="miter"/></svg>`;
}

/** Yaz (ⵣ), symbole amazigh, dessiné au trait. */
export const yaz = `<svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M24 4v56"/><path d="M10 6c0 12 6 18 14 18s14-6 14-18"/><path d="M10 58c0-12 6-18 14-18s14 6 14 18"/></svg>`;

/** Croissant + étoile, et lanterne, au trait (Ramadan, Aïd). */
export const crescent = `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M74 14a46 46 0 1 0 30 70A38 38 0 0 1 74 14z"/><path d="M88 34l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>`;
export const lantern = `<svg viewBox="0 0 80 160" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M40 2v16"/><path d="M30 18h20l6 12H24z"/><path d="M24 30c-8 10-10 26-10 40s4 30 12 40h28c8-10 12-26 12-40s-2-30-10-40"/><path d="M40 30v80M27 40c-4 9-5 20-5 30s2 22 6 32M53 40c4 9 5 20 5 30s-2 22-6 32"/><path d="M26 110h28l-4 12H30z"/><path d="M40 122v10"/><circle cx="40" cy="70" r="7" fill="currentColor" opacity=".35"/></svg>`;

/** Rangée d'étoiles (avis). */
export const stars = (n = 5) => `<span class="stars">${Array.from({ length: n }, () => icons.star).join('')}</span>`;
