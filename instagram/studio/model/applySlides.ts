/**
 * Ajout de pages créées à partir des modèles (templates/index.js), utilisé par le panneau Modèles,
 * la « Nouvelle publication guidée » et l'assistant IA.
 * Chaque page garde la trace de son modèle et de ses champs (`page.source`) pour pouvoir être régénérée.
 */
import { useEditor, currentPage } from '../store/editor';
import { importSlide } from './importer';
import type { Page, PageSource, Project } from './types';

export type Slide = Record<string, unknown> & { template?: string };
export interface PostMeta {
  caption?: Project['caption'];
  hashtags?: string[];
  date?: string;
  /** Identifiant d'une publication prête (ex. « 06-fete-independance ») : sert à nommer la création. */
  id?: string;
  /** Nom à donner à une création encore sans nom. */
  name?: string;
}

/** Champs d'une slide sous forme de texte (sans la clé `template`). */
export function slideData(slide: Slide): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(slide)) {
    if (k === 'template' || v == null || typeof v === 'object') continue;
    out[k] = String(v);
  }
  return out;
}

const sourceOf = (slide: Slide): PageSource | undefined =>
  typeof slide.template === 'string' ? { template: slide.template, data: slideData(slide) } : undefined;

/** Rend chaque slide en page d'éléments libres. */
export async function buildPages(slides: Slide[]) {
  const pages: Page[] = [];
  let format = useEditor.getState().project.format;
  for (const s of slides) {
    const r = await importSlide(s);
    const source = sourceOf(s);
    pages.push(source ? { ...r.page, source } : r.page);
    format = r.format;
  }
  return { pages, format };
}

/**
 * Ajoute les slides comme nouvelles pages (ou remplit la page vide).
 * Si la création était vide, reprend aussi la légende, les hashtags, la date et le nom.
 */
export async function applySlides(slides: Slide[], post?: PostMeta) {
  const st = useEditor.getState();
  st.setStatus('Préparation du modèle…');
  const { pages, format } = await buildPages(slides);
  const project = useEditor.getState().project;
  const allEmpty = project.pages.every((p) => p.elements.length === 0);
  if (allEmpty && format !== project.format) st.setFormat(format);
  const page = currentPage();
  if (page.elements.length === 0) {
    st.replacePage(pages[0]);
    if (pages.length > 1) st.insertPages(pages.slice(1));
  } else {
    st.insertPages(pages);
  }
  if (post && allEmpty) {
    st.setMeta({ caption: post.caption ?? project.caption, hashtags: post.hashtags ?? project.hashtags, date: post.date ?? project.date });
    const name = post.name ?? (post.id ? post.id.replace(/^\d+-/, '').replace(/-/g, ' ') : undefined);
    if (project.name === 'Nouvelle création' && name) st.setName(name);
  }
  st.setStatus(pages.length > 1 ? `${pages.length} pages ajoutées` : 'Modèle ajouté');
  return pages;
}

/** Recrée la page affichée avec d'autres champs (même modèle). Une seule étape « Annuler ». */
export async function regeneratePage(template: string, data: Record<string, string>) {
  const { pages } = await buildPages([{ template, ...data }]);
  useEditor.getState().replacePage(pages[0]);
  useEditor.getState().setStatus('Page mise à jour');
  return pages[0];
}
