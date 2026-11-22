/**
 * Résumé compact de la page affichée, envoyé à l'assistant IA avec chaque message et après ses modifications.
 * Il contient ce qu'il faut pour agir (identifiants, positions, textes, styles) sans tout le détail interne.
 */
import { useEditor, currentPage } from '../store/editor';
import { FORMATS, type El } from '../model/types';
import { typeOf } from '../model/postTypes';
import { OCCASIONS } from '../../templates/occasions.js';

const r = (n: number) => Math.round(n);

function describe(e: El): Record<string, unknown> {
  const base: Record<string, unknown> = { id: e.id, type: e.type, x: r(e.x), y: r(e.y), w: r(e.w), h: r(e.h) };
  if (e.name) base.name = e.name;
  if (e.rotation) base.rotation = r(e.rotation);
  if (e.opacity !== 1) base.opacity = e.opacity;
  if (e.hidden) base.hidden = true;
  if (e.locked) base.locked = true;
  if (e.groupId) base.group = e.groupId;
  switch (e.type) {
    case 'text':
      return { ...base, html: e.html, font: e.font, size: e.size, weight: e.weight, color: e.color, align: e.align };
    case 'image':
      return { ...base, photo: e.src.startsWith('asset:') ? 'photo importée' : e.src, mask: e.mask };
    case 'shape':
      return { ...base, shape: e.shape, fill: e.fill.length > 40 ? 'dégradé' : e.fill };
    case 'icon':
      return { ...base, icon: e.name, color: e.color, disc: e.disc };
    case 'motif':
      return { ...base, motif: e.kind, color: e.color };
    case 'component':
      return { ...base, component: e.name, ...(Object.keys(e.props).length ? { props: e.props } : {}) };
  }
}

export function snapshot() {
  const { project, pageId } = useEditor.getState();
  const page = currentPage();
  const index = project.pages.findIndex((p) => p.id === pageId);
  const src = page.source;
  return {
    creation: project.name,
    format: { name: project.format, ...FORMATS[project.format] },
    page: `${index + 1} / ${project.pages.length}`,
    ambiance: page.tone,
    fond: page.background.kind === 'color' ? page.background.color : page.background.kind === 'image' ? 'photo' : 'fond de l’ambiance',
    modele: src
      ? { template: src.template, type: typeOf(src.template)?.title, ...(src.template === 'fete' ? { occasion: src.data.occasion, occasionLabel: OCCASIONS[src.data.occasion]?.label } : {}) }
      : null,
    elements: page.elements.map(describe),
    legende: { fr: project.caption.fr, darija: project.caption.darija, hashtags: project.hashtags, date: project.date },
  };
}

/** Bloc texte ajouté à chaque message de l'utilisateur. */
export function stateBlock() {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `<etat_du_studio>\nDate du jour : ${today}\n${JSON.stringify(snapshot())}\n</etat_du_studio>`;
}
