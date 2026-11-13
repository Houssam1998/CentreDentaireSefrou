/**
 * Éléments prêts à l'emploi proposés dans les panneaux (Texte, Éléments, Marque).
 * Chaque préréglage fabrique un ou plusieurs éléments ; l'éditeur les place au centre ou au point de dépôt.
 */
import type { NewEl, TextEl, ComponentName, Tone } from './types';
import { COMPONENTS, componentHtml } from './components';
import { icons } from '../../brand/motifs.js';

type TextNew = Omit<TextEl, 'id' | 'x' | 'y' | 'rotation' | 'opacity'>;

const text = (p: Partial<TextNew> & { html: string; w: number; x?: number; y?: number }): NewEl => ({
  type: 'text', h: Math.round((p.size ?? 30) * (p.lineHeight ?? 1.3)), font: 'sans', italic: false, size: 30, weight: 400, color: 'text', accent: 'accent',
  align: 'left', dir: 'ltr', lineHeight: 1.3, letterSpacing: 0, upper: false, wrap: 'balance', ...p,
});

export interface Preset { id: string; label: string; hint?: string; make: () => NewEl[] }
/** Les préréglages de plusieurs éléments sont ajoutés groupés. */

export const TEXT_PRESETS: Preset[] = [
  { id: 'title', label: 'Grand titre', make: () => [text({ html: 'Votre <em>titre</em>', w: 860, font: 'serif', size: 92, weight: 600, lineHeight: 0.98 })] },
  { id: 'title-ar', label: 'Titre arabe', make: () => [text({ html: 'عنوان بالعربية', w: 860, font: 'kufi', size: 50, weight: 700, lineHeight: 1.55, color: 'accent', dir: 'rtl', align: 'right' })] },
  { id: 'pair', label: 'Paire titre FR + AR', hint: 'Les deux restent groupés', make: () => [
    text({ html: 'Titre en <em>français</em>', w: 860, font: 'serif', size: 84, weight: 600, lineHeight: 1, y: 0 }),
    text({ html: 'العنوان بالعربية', w: 860, font: 'kufi', size: 46, weight: 700, lineHeight: 1.55, color: 'accent', dir: 'rtl', y: 100 }),
  ] },
  { id: 'kicker', label: 'Sur-titre', make: () => [text({ html: 'Sur-titre', w: 420, size: 21, weight: 600, color: 'gold', upper: true, letterSpacing: 0.2, kicker: true, nowrap: true, lineHeight: 1 })] },
  { id: 'subtitle', label: 'Sous-titre', make: () => [text({ html: 'Un sous-titre', w: 760, font: 'serif', size: 52, weight: 600, lineHeight: 1.05 })] },
  { id: 'body', label: 'Paragraphe', make: () => [text({ html: 'Un paragraphe court et clair, pour expliquer simplement.', w: 760, size: 29, color: 'soft', lineHeight: 1.45, wrap: 'pretty' })] },
  { id: 'body-ar', label: 'Paragraphe arabe', make: () => [text({ html: 'فقرة قصيرة وواضحة لشرح الفكرة ببساطة', w: 760, font: 'naskh', size: 31, weight: 500, color: 'soft', lineHeight: 1.7, dir: 'rtl', align: 'right', wrap: 'pretty' })] },
  { id: 'calli', label: 'Calligraphie (vœux)', make: () => [text({ html: 'عيد مبارك', w: 760, font: 'ruqaa', size: 104, weight: 700, color: 'accent', lineHeight: 1.25, dir: 'rtl', align: 'center' })] },
  { id: 'quote', label: 'Citation', make: () => [text({ html: '« Une phrase qui marque. »', w: 820, font: 'serif', italic: true, size: 54, weight: 500, lineHeight: 1.2 })] },
  { id: 'sign', label: 'Signature', make: () => [text({ html: '— Dr Amine El Omari', w: 520, font: 'serif', italic: true, size: 38, weight: 600, color: 'gold', lineHeight: 1.1, nowrap: true })] },
  { id: 'small', label: 'Petit texte', make: () => [text({ html: 'Petit texte d’information', w: 600, size: 22, weight: 500, color: 'muted', lineHeight: 1.4 })] },
];

export const SHAPE_PRESETS: Preset[] = [
  { id: 'card', label: 'Carte', make: () => [{ type: 'shape', shape: 'card', w: 700, h: 260, fill: 'surface', glow: false, radius: 28 }] },
  { id: 'arch', label: 'Arche lumineuse', make: () => [{ type: 'shape', shape: 'arch', w: 340, h: 420, fill: 'arch', glow: true }] },
  { id: 'stadium', label: 'Panneau lumineux', make: () => [{ type: 'shape', shape: 'glow-arch', w: 250, h: 360, fill: 'arch', glow: true }] },
  { id: 'circle', label: 'Cercle', make: () => [{ type: 'shape', shape: 'circle', w: 220, h: 220, fill: 'gold2', glow: false }] },
  { id: 'rect', label: 'Rectangle', make: () => [{ type: 'shape', shape: 'rect', w: 600, h: 300, fill: 'accent', glow: false, radius: 0 }] },
  { id: 'rounded', label: 'Rectangle arrondi', make: () => [{ type: 'shape', shape: 'rect', w: 600, h: 300, fill: 'accent', glow: false, radius: 36 }] },
  { id: 'pill', label: 'Contour pastille', make: () => [{ type: 'shape', shape: 'stadium', w: 420, h: 90, fill: 'transparent', stroke: 'gold2', strokeWidth: 2, glow: false }] },
  { id: 'line', label: 'Filet doré', make: () => [{ type: 'shape', shape: 'line', w: 240, h: 3, fill: 'linear-gradient(90deg, #c8a97e, transparent)', glow: false }] },
  { id: 'line-c', label: 'Filet centré', make: () => [{ type: 'shape', shape: 'line', w: 300, h: 3, fill: 'linear-gradient(90deg, transparent, #c8a97e, transparent)', glow: false }] },
];

export const MOTIF_PRESETS: Preset[] = [
  { id: 'waves', label: 'Lignes d’or', make: () => [{ type: 'motif', kind: 'waves', w: 1080, h: 600, color: 'gold2', opacity: 0.45 }] },
  { id: 'wall', label: 'Arches du mur', hint: '3 panneaux groupés', make: () => [
    { type: 'shape', shape: 'glow-arch', x: 0, y: 0, w: 150, h: 430, fill: 'arch', glow: true },
    { type: 'shape', shape: 'glow-arch', x: 0, y: 470, w: 150, h: 360, fill: 'arch', glow: true },
    { type: 'shape', shape: 'glow-arch', x: 178, y: 150, w: 150, h: 560, fill: 'arch', glow: true },
  ] },
  { id: 'mark', label: 'Repère du logo', make: () => [{ type: 'motif', kind: 'mark', w: 220, h: 223, color: 'gold' }] },
  { id: 'flag', label: 'Drapeau (arche)', make: () => [{ type: 'motif', kind: 'flag', w: 340, h: 400, color: 'text', mask: 'arch', glow: true }] },
  { id: 'yaz', label: 'Yaz ⵣ', make: () => [{ type: 'motif', kind: 'yaz', w: 120, h: 160, color: 'accent' }] },
  { id: 'crescent', label: 'Croissant', make: () => [{ type: 'motif', kind: 'crescent', w: 170, h: 170, color: 'gold2' }] },
  { id: 'lantern', label: 'Lanterne', make: () => [{ type: 'motif', kind: 'lantern', w: 80, h: 160, color: 'gold2' }] },
  { id: 'stars', label: '5 étoiles', make: () => [{ type: 'motif', kind: 'stars', w: 220, h: 40, color: 'gold2' }] },
];

/** Taille naturelle d'un composant, mesurée dans une page cachée de la même ambiance. */
export function measureComponent(name: ComponentName, props: Record<string, string>, tone: Tone) {
  const host = document.createElement('div');
  host.className = 'ig free';
  host.dataset.tone = tone;
  host.style.cssText = 'position:fixed;left:-20000px;top:0;width:1080px;height:600px;';
  host.innerHTML = `<div class="el-comp" style="position:static;transform:none">${componentHtml(name, props)}</div>`;
  document.body.append(host);
  const c = host.firstElementChild as HTMLElement;
  const size = { w: c.offsetWidth, h: c.offsetHeight };
  host.remove();
  return size;
}

export function componentPreset(name: ComponentName, props: Record<string, string> = {}, tone: Tone = 'light', scale = 1): NewEl {
  const full = { ...COMPONENTS[name].defaults, ...props };
  const { w, h } = measureComponent(name, full, tone);
  return { type: 'component', name, props: full, baseW: w, baseH: h, w: Math.round(w * scale), h: Math.round(h * scale) };
}

export const COMPONENT_ITEMS: { id: string; label: string; name: ComponentName; props?: Record<string, string>; scale?: number }[] = [
  { id: 'logo', label: 'Logo', name: 'logo', scale: 1 },
  { id: 'logo-big', label: 'Logo (grand)', name: 'logo', scale: 2.2 },
  { id: 'footer', label: 'Pied de page', name: 'footer' },
  { id: 'badge-conseil', label: 'Badge « Le conseil »', name: 'badge', props: { fr: 'Le conseil du Dr Omari', ar: 'نصيحة الدكتور' } },
  { id: 'badge-vf', label: 'Badge « Vrai ou faux »', name: 'badge', props: { fr: 'Vrai ou faux ?', ar: 'صحيح ولا غلط؟' } },
  { id: 'badge-coulisses', label: 'Badge « Coulisses »', name: 'badge', props: { fr: 'Coulisses du cabinet', ar: 'من داخل العيادة' } },
  { id: 'badge-techno', label: 'Badge « Technologie »', name: 'badge', props: { fr: 'Technologie au cabinet', ar: 'تكنولوجيا العيادة' } },
  { id: 'badge-sefrou', label: 'Badge « Sefrou sourit »', name: 'badge', props: { fr: 'Sefrou sourit', ar: 'صفرو تبتسم' } },
  { id: 'pill-phone', label: 'Pastille téléphone', name: 'pill', props: { icon: 'phone' } },
  { id: 'pill-wa', label: 'Pastille WhatsApp', name: 'pill', props: { icon: 'whatsapp', text: '06 66 06 02 15' } },
  { id: 'pill-pin', label: 'Pastille adresse', name: 'pill', props: { icon: 'pin', text: 'N464 Derb El Miter, Sefrou' } },
  { id: 'pill-ig', label: 'Pastille Instagram', name: 'pill', props: { icon: 'instagram', text: '@centredentairesefrou' } },
  { id: 'pill-tt', label: 'Pastille TikTok', name: 'pill', props: { icon: 'tiktok', text: '@centre.dentaire.sefrou' } },
  { id: 'hours', label: 'Horaires', name: 'hours' },
  { id: 'qr', label: 'QR code Maps', name: 'qr' },
  { id: 'number', label: 'Numéro', name: 'number' },
  { id: 'vs', label: 'Pastille « ou »', name: 'vs' },
];

export const ICON_NAMES: string[] = Object.keys(icons);
export const iconSvg = (name: string): string => (icons as Record<string, string>)[name] ?? '';

export const ICON_LABELS: Record<string, string> = {
  tooth: 'dent', sparkle: 'éclat', brush: 'brosse', floss: 'fil dentaire', water: 'eau', sugar: 'bonbon', calendar: 'calendrier', clock: 'horloge',
  pin: 'adresse', phone: 'téléphone', whatsapp: 'whatsapp', instagram: 'instagram', tiktok: 'tiktok', globe: 'site web', check: 'coche', cross: 'croix', dot: 'point',
  drop: 'goutte', gum: 'gencive', shield: 'protection', scan: 'scanner', aligner: 'aligneur', braces: 'bagues', moon: 'lune', sleep: 'sommeil',
  bite: 'mâchoire', implant: 'implant', heart: 'cœur', team: 'équipe', star: 'étoile', cherry: 'cerises', arrow: 'flèche', swipe: 'glisser', bulb: 'idée',
};
