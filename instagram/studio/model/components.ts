/**
 * Composants de la marque : blocs prêts (logo, badge, pied de page, horaires, QR…).
 * Ils réutilisent les pièces des modèles (templates/parts.js) : même rendu que les publications.
 * Un composant est dessiné à sa taille naturelle (baseW × baseH) puis agrandi/réduit proportionnellement.
 */
import { head, badge, foot, md } from '../../templates/parts.js';
import { qr, hoursRows } from '../../templates/index.js';
import { icons } from '../../brand/motifs.js';
import { brand } from '../../config.js';
import type { ComponentName } from './types';

export interface ComponentDef {
  label: string;
  /** Champs modifiables dans l'inspecteur. */
  fields: { k: string; label: string; type?: 'text' | 'ar' | 'icon' | 'select'; options?: Record<string, string> }[];
  defaults: Record<string, string>;
  html: (p: Record<string, string>) => string;
}

export const COMPONENTS: Record<ComponentName, ComponentDef> = {
  logo: {
    label: 'Logo du cabinet',
    fields: [],
    defaults: {},
    html: () => head({}),
  },
  badge: {
    label: 'Badge de série',
    fields: [{ k: 'fr', label: 'Texte (FR)' }, { k: 'ar', label: 'Texte (AR)', type: 'ar' }],
    defaults: { fr: 'Le conseil du Dr Omari', ar: 'نصيحة الدكتور' },
    html: (p) => badge(p.fr, p.ar),
  },
  footer: {
    label: 'Pied de page (contacts)',
    fields: [],
    defaults: {},
    html: () => `<div class="comp-footer">${foot()}</div>`,
  },
  pill: {
    label: 'Pastille de contact',
    fields: [{ k: 'icon', label: 'Icône', type: 'icon' }, { k: 'text', label: 'Texte' }],
    defaults: { icon: 'phone', text: brand.phone },
    html: (p) => `<span class="pill">${(icons as Record<string, string>)[p.icon] ?? ''}${md(p.text)}</span>`,
  },
  hours: {
    label: 'Tableau des horaires',
    fields: [],
    defaults: {},
    html: (p) => `<div class="card hr-card comp-hours" style="width:${Number(p.w) || 940}px">${hoursRows()}</div>`,
  },
  qr: {
    label: 'QR code Google Maps',
    fields: [{ k: 'url', label: 'Lien' }],
    defaults: { url: brand.mapsUrl },
    html: (p) => `<div class="comp-qr">${qr(p.url || brand.mapsUrl)}</div>`,
  },
  number: {
    label: 'Numéro (liste)',
    fields: [{ k: 'n', label: 'Numéro' }],
    defaults: { n: '1' },
    html: (p) => `<span class="li-n">${md(p.n)}</span>`,
  },
  vs: {
    label: 'Pastille « ou »',
    fields: [{ k: 'text', label: 'Texte' }],
    defaults: { text: 'ou' },
    html: (p) => `<span class="cmp-vs comp-vs">${md(p.text)}</span>`,
  },
};

export const componentHtml = (name: ComponentName, props: Record<string, string>) => {
  const def = COMPONENTS[name];
  return def ? def.html({ ...def.defaults, ...props }) : '';
};
