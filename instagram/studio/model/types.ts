/**
 * Modèle de données de l'éditeur. Tout est sérialisable en JSON (sauvegarde, fichier projet).
 * Les couleurs sont des jetons (« text », « accent »…) ou des couleurs CSS libres.
 */

export type Tone = 'light' | 'greige' | 'night';
export type Format = 'post' | 'story' | 'square';

export const FORMATS: Record<Format, { w: number; h: number; label: string }> = {
  post: { w: 1080, h: 1350, label: 'Publication 4:5' },
  story: { w: 1080, h: 1920, label: 'Story / Reel 9:16' },
  square: { w: 1080, h: 1080, label: 'Carré 1:1' },
};

/** Jeton de couleur (voir tokens.ts) ou couleur CSS libre (#hex, rgb…). */
export type Color = string;

export type FontKey = 'serif' | 'sans' | 'kufi' | 'naskh' | 'ruqaa';

interface Base {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  hidden?: boolean;
  name?: string;
  groupId?: string;
}

export interface TextEl extends Base {
  type: 'text';
  html: string; // HTML limité : b, em, br
  font: FontKey;
  italic: boolean;
  size: number;
  weight: number;
  color: Color;
  accent: Color; // couleur des mots en *accent*
  align: 'left' | 'center' | 'right';
  dir: 'auto' | 'ltr' | 'rtl';
  lineHeight: number; // multiplicateur
  letterSpacing: number; // em
  upper: boolean;
  kicker?: boolean; // petit trait doré avant le texte (sur-titre)
  nowrap?: boolean;
  wrap?: 'balance' | 'pretty' | 'wrap'; // retour à la ligne équilibré (titres) ou naturel (paragraphes)
  box?: BoxStyle; // fond / bordure éventuels (pastille)
}

export interface BoxStyle {
  background?: string;
  border?: string;
  radius?: number;
  shadow?: string;
  padding?: string;
}

export type Mask = 'rect' | 'rounded' | 'arch' | 'stadium' | 'circle';

export interface ImageEl extends Base {
  type: 'image';
  src: string; // clé de la photothèque (clinic/…) ou asset:<id>
  mask: Mask;
  glow: boolean;
  crop: { x: number; y: number; zoom: number }; // x,y en % (object-position), zoom ≥ 1
}

export type ShapeKind = 'rect' | 'card' | 'arch' | 'glow-arch' | 'stadium' | 'circle' | 'line';

export interface ShapeEl extends Base {
  type: 'shape';
  shape: ShapeKind;
  fill: Color; // jeton, couleur ou fond CSS complet (dégradé)
  stroke?: Color;
  strokeWidth?: number;
  glow: boolean;
  radius?: number;
}

export interface IconEl extends Base {
  type: 'icon';
  name: string; // clé de brand/motifs.js → icons
  color: Color;
  disc: boolean; // pastille dorée autour
  stroke?: number;
}

export type MotifKind = 'waves' | 'flag' | 'yaz' | 'crescent' | 'lantern' | 'stars' | 'mark' | 'svg';

export interface MotifEl extends Base {
  type: 'motif';
  kind: MotifKind;
  color: Color;
  svg?: string; // pour kind = 'svg' (motif importé)
  params?: Record<string, number>;
  mask?: Mask;
  glow?: boolean;
  strokeWidth?: number;
}

export type ComponentName = 'logo' | 'badge' | 'footer' | 'pill' | 'hours' | 'qr' | 'number' | 'vs';

export interface ComponentEl extends Base {
  type: 'component';
  name: ComponentName;
  props: Record<string, string>;
  baseW: number; // taille naturelle : le composant est agrandi/réduit proportionnellement
  baseH: number;
}

export type El = TextEl | ImageEl | ShapeEl | IconEl | MotifEl | ComponentEl;
export type ElType = El['type'];

export interface Background {
  kind: 'tone' | 'color' | 'image';
  color?: string;
  image?: string;
  overlay?: number; // assombrissement 0..1 pour une photo de fond
}

/** Modèle et champs qui ont servi à créer une page (pour la « régénérer » avec d'autres réglages). */
export interface PageSource {
  template: string;
  data: Record<string, string>;
}

export interface Page {
  id: string;
  tone: Tone;
  background: Background;
  elements: El[];
  /** Absent pour une page faite à la main ou créée avant cette fonction. */
  source?: PageSource;
}

export interface Project {
  id: string;
  version: 1;
  name: string;
  format: Format;
  pages: Page[];
  caption: { fr: string; darija: string };
  hashtags: string[];
  date: string;
  updatedAt: number;
  thumb?: string;
}

/** Distributive Omit : garde l'union des types d'éléments. */
export type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewEl = DistOmit<El, 'id' | 'x' | 'y' | 'rotation' | 'opacity'> & Partial<Pick<Base, 'x' | 'y' | 'rotation' | 'opacity'>>;
