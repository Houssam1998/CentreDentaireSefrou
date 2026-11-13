/**
 * Jetons de couleur : la même publication change de couleurs avec l'ambiance (clair, grège, soirée).
 * Les valeurs vivent dans studio/tokens.css (variables CSS par data-tone).
 */
import type { Color, Tone } from './types';

export const TOKENS = {
  text: 'Texte',
  soft: 'Texte doux',
  muted: 'Discret',
  accent: 'Accent',
  gold: 'Or',
  gold2: 'Or clair',
  surface: 'Carte',
  line: 'Filet',
  inverse: 'Inversé',
  arch: 'Arche',
  disc: 'Pastille',
} as const;
export type Token = keyof typeof TOKENS;

/** Valeurs des jetons par ambiance (pour l'importateur et les aperçus). Doit refléter tokens.css. */
export const TOKEN_VALUES: Record<Tone, Record<Token, string>> = {
  light: { text: '#14202b', soft: '#3a4651', muted: '#6b7480', accent: '#0f6e77', gold: '#9a7b4f', gold2: '#c8a97e', surface: 'rgba(255,255,255,0.62)', line: 'rgba(200,169,126,0.45)', inverse: '#faf8f4', arch: 'linear-gradient(180deg, #e9e4dc, #ddd6cb)', disc: 'radial-gradient(circle at 50% 35%, #fffaf0, #e8d3b0)' },
  greige: { text: '#14202b', soft: '#3a4651', muted: '#6b7480', accent: '#0f6e77', gold: '#9a7b4f', gold2: '#c8a97e', surface: 'rgba(255,255,255,0.62)', line: 'rgba(200,169,126,0.45)', inverse: '#faf8f4', arch: 'linear-gradient(180deg, #e9e4dc, #ddd6cb)', disc: 'radial-gradient(circle at 50% 35%, #fffaf0, #e8d3b0)' },
  night: { text: '#faf8f4', soft: '#d9e2e2', muted: '#aab6b7', accent: '#e8d3b0', gold: '#e8d3b0', gold2: '#c8a97e', surface: 'rgba(255,255,255,0.05)', line: 'rgba(200,169,126,0.4)', inverse: '#14202b', arch: 'linear-gradient(180deg, #1b363d, #142a30)', disc: 'radial-gradient(circle at 50% 35%, #2a4a52, #18343b)' },
};

/** Couleurs fixes de la marque proposées en plus des jetons. */
export const BRAND_COLORS: { value: string; label: string }[] = [
  { value: '#14202b', label: 'Encre' },
  { value: '#0f6e77', label: 'Sarcelle' },
  { value: '#0b5960', label: 'Sarcelle foncé' },
  { value: '#9a7b4f', label: 'Or profond' },
  { value: '#c8a97e', label: 'Or' },
  { value: '#e8d3b0', label: 'Or clair' },
  { value: '#faf8f4', label: 'Ivoire' },
  { value: '#efe9df', label: 'Sable' },
  { value: '#e6e0d7', label: 'Grège' },
  { value: '#0f2226', label: 'Nuit' },
  { value: '#ffffff', label: 'Blanc' },
  { value: '#c1272d', label: 'Rouge drapeau' },
];

export const isToken = (c: Color): c is Token => c in TOKENS;

/** Couleur CSS à utiliser dans le rendu. */
export const css = (c: Color | undefined, fallback = 'currentColor') => (!c ? fallback : isToken(c) ? `var(--t-${c})` : c);

/** Couleur effective (pour comparer, afficher une pastille). */
export const resolve = (c: Color, tone: Tone) => (isToken(c) ? TOKEN_VALUES[tone][c] : c);

function rgba(s: string): [number, number, number, number] | null {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  const h = s.match(/^#([0-9a-f]{6})$/i);
  if (h) return [parseInt(h[1].slice(0, 2), 16), parseInt(h[1].slice(2, 4), 16), parseInt(h[1].slice(4, 6), 16), 1];
  return null;
}

/** Ramène une couleur calculée au jeton le plus proche de l'ambiance (sinon la garde telle quelle). */
export function toToken(computed: string, tone: Tone, only: Token[] = ['text', 'soft', 'muted', 'accent', 'gold', 'gold2', 'inverse']): Color {
  const c = rgba(computed);
  if (!c) return computed;
  let best: Token | null = null;
  let bestD = Infinity;
  for (const t of only) {
    const v = rgba(TOKEN_VALUES[tone][t]);
    if (!v) continue;
    const d = Math.hypot(c[0] - v[0], c[1] - v[1], c[2] - v[2]) + Math.abs(c[3] - v[3]) * 255;
    if (d < bestD) { bestD = d; best = t; }
  }
  return best && bestD < 18 ? best : computed;
}
