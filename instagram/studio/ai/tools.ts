/**
 * Exécution, dans le navigateur, des outils de l'assistant IA (définis dans toolDefs.ts).
 * Tout ce qui vient du modèle est vérifié avant d'être appliqué : type, bornes, couleurs, HTML nettoyé.
 */
import type { BetaToolResultBlockParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { useEditor, currentPage } from '../store/editor';
import { applySlides, regeneratePage } from '../model/applySlides';
import { TEMPLATES } from '../model/postTypes';
import { nextDate } from '../model/calendar';
import { sanitizeHtml, plainText } from '../model/sanitize';
import { TOKENS } from '../model/tokens';
import { FORMATS, type El, type FontKey, type Tone } from '../model/types';
import { presetById } from '../panels/dnd';
import { checkProject, forbiddenIn, pageToPng } from '../export/export';
import { OCCASIONS, occasionFields } from '../../templates/occasions.js';
import { FONT_KEYS, TONE_KEYS, PRESETS } from './toolDefs';
import { snapshot } from './snapshot';

export type ToolContent = Exclude<BetaToolResultBlockParam['content'], undefined>;
export interface ToolOutcome { content: ToolContent; isError?: boolean; /** Le projet a été modifié. */ changed?: boolean }

class ToolError extends Error {}
const fail = (msg: string): never => { throw new ToolError(msg); };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const optStr = (v: unknown, name: string, max = 3000) => {
  if (v === undefined) return undefined;
  if (typeof v !== 'string') fail(`« ${name} » doit être un texte`);
  if ((v as string).length > max) fail(`« ${name} » est trop long (${max} caractères au plus)`);
  return v as string;
};
const optNum = (v: unknown, name: string, min: number, max: number) => {
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`« ${name} » doit être un nombre`);
  return Math.min(max, Math.max(min, v as number));
};
const optEnum = <T extends string>(v: unknown, name: string, list: readonly T[]) => {
  if (v === undefined) return undefined;
  if (!list.includes(v as T)) fail(`« ${name} » doit valoir ${list.join(', ')}`);
  return v as T;
};
/** Jeton de couleur ou couleur CSS valide. */
const optColor = (v: unknown, name: string) => {
  const c = optStr(v, name, 80)?.trim();
  if (c === undefined) return undefined;
  if (c in TOKENS || (typeof CSS !== 'undefined' && CSS.supports('color', c))) return c;
  return fail(`« ${name} » : couleur inconnue (${c})`);
};

const ok = (text: string, changed = true): ToolOutcome => ({ content: text, changed });
const withPage = (text: string): ToolOutcome => ({ content: `${text}\nPage à jour : ${JSON.stringify(snapshot())}`, changed: true });

async function toJpeg(pngUrl: string, quality = 0.82): Promise<string> {
  const img = new Image();
  img.src = pngUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

/* ------------------------------------------------------------------ */

const handlers: Record<string, (input: Obj) => Promise<ToolOutcome> | ToolOutcome> = {
  get_page: () => ({ content: JSON.stringify(snapshot()) }),

  view_design: async () => {
    const { project } = useEditor.getState();
    const data = await toJpeg(await pageToPng(currentPage(), project.format, 0.5));
    return { content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }, { type: 'text', text: `Aperçu de la page affichée (réduit à 50 % ; format ${FORMATS[project.format].w} × ${FORMATS[project.format].h}).` }] };
  },

  get_template: (input) => {
    const key = optEnum(input.template, 'template', Object.keys(TEMPLATES)) ?? fail('template manquant');
    const t = TEMPLATES[key];
    return {
      content: JSON.stringify({
        template: key,
        label: t.label,
        format: t.size === 'tall' ? 'story 1080 × 1920' : 'publication 1080 × 1350',
        fields: t.fields.map((f) => ({ key: f.k, label: f.label, type: f.type === 'ar' ? 'texte arabe' : f.type, ...(f.options ? { options: Object.keys(f.options) } : {}) })),
        defaults: t.defaults,
      }),
    };
  },

  create_post: async (input) => {
    const template = optEnum(input.template, 'template', Object.keys(TEMPLATES)) ?? fail('template manquant');
    const mode = optEnum(input.mode, 'mode', ['new_page', 'replace_page'] as const) ?? 'new_page';
    const def = TEMPLATES[template];
    const allowed = new Set(def.fields.map((f) => f.k));
    const fields: Record<string, string> = {};
    const ignored: string[] = [];
    if (input.fields !== undefined) {
      if (!isObj(input.fields)) fail('« fields » doit être un objet');
      for (const [k, v] of Object.entries(input.fields as Obj)) {
        if (!allowed.has(k)) { ignored.push(k); continue; }
        fields[k] = optStr(v, k) ?? '';
      }
    }
    let data: Record<string, string> = { ...def.defaults };
    if (template === 'fete') {
      const occasion = optEnum(input.occasion ?? fields.occasion, 'occasion', Object.keys(OCCASIONS)) ?? 'logo';
      data = { ...data, ...occasionFields(occasion, nextDate(occasion)?.date.getFullYear()) };
    }
    data = { ...data, ...fields };
    // Les valeurs des listes doivent exister (ambiance, série, icône…)
    for (const f of def.fields) {
      if ((f.type === 'select') && f.options && data[f.k] && !(data[f.k] in f.options)) fail(`« ${f.k} » doit valoir ${Object.keys(f.options).join(', ')}`);
    }
    const { project } = useEditor.getState();
    const otherFormat = (def.size === 'tall') !== (project.format === 'story') && project.pages.some((p) => p.elements.length);
    if (mode === 'replace_page') await regeneratePage(template, data);
    else await applySlides([{ template, ...data }]);
    const notes = [ignored.length ? `Champs ignorés (inconnus pour ce modèle) : ${ignored.join(', ')}.` : '', otherFormat ? 'Attention : ce modèle n’a pas le format de la création.' : ''].filter(Boolean).join(' ');
    return withPage(`Page ${mode === 'replace_page' ? 'recréée' : 'créée'} avec le modèle « ${template} ». ${notes}`.trim());
  },

  edit_elements: (input) => {
    if (!Array.isArray(input.changes) || !input.changes.length) fail('« changes » doit être une liste non vide');
    const st = useEditor.getState();
    const { w: W, h: H } = FORMATS[st.project.format];
    const page = currentPage();
    const report: string[] = [];
    for (const raw of input.changes as unknown[]) {
      if (!isObj(raw)) fail('Chaque changement doit être un objet');
      const c = raw as Obj;
      const el = page.elements.find((e) => e.id === c.id);
      if (!el) { report.push(`${String(c.id)} : introuvable (appelez get_page)`); continue; }
      if (el.locked) { report.push(`${el.id} : verrouillé, non modifié`); continue; }
      const patch: Partial<El> & Record<string, unknown> = {};
      const x = optNum(c.x, 'x', -W, 2 * W), y = optNum(c.y, 'y', -H, 2 * H);
      const w = optNum(c.w, 'w', 4, 3 * W), h = optNum(c.h, 'h', 2, 3 * H);
      if (x !== undefined) patch.x = Math.round(x);
      if (y !== undefined) patch.y = Math.round(y);
      if (w !== undefined) {
        patch.w = Math.round(w);
        if (el.type === 'component') patch.h = Math.round((w / el.baseW) * el.baseH);
      }
      if (h !== undefined && el.type !== 'text' && el.type !== 'component') patch.h = Math.round(h);
      const rot = optNum(c.rotation, 'rotation', -360, 360);
      if (rot !== undefined) patch.rotation = rot;
      const op = optNum(c.opacity, 'opacity', 0, 1);
      if (op !== undefined) patch.opacity = op;
      if (c.hidden !== undefined) patch.hidden = c.hidden === true;
      const color = optColor(c.color, 'color');
      if (color !== undefined) {
        if (el.type === 'shape') patch.fill = color;
        else if (el.type === 'text' || el.type === 'icon' || el.type === 'motif') patch.color = color;
        else report.push(`${el.id} : couleur non modifiable sur ce type d’élément`);
      }
      if (el.type === 'text') {
        const html = optStr(c.html, 'html');
        if (html !== undefined) patch.html = sanitizeHtml(html);
        const size = optNum(c.size, 'size', 12, 300);
        if (size !== undefined) patch.size = Math.round(size);
        const weight = optNum(c.weight, 'weight', 300, 800);
        if (weight !== undefined) patch.weight = Math.round(weight / 100) * 100;
        const font = optEnum(c.font, 'font', FONT_KEYS);
        if (font !== undefined) patch.font = font as FontKey;
        const align = optEnum(c.align, 'align', ['left', 'center', 'right'] as const);
        if (align !== undefined) patch.align = align;
      } else if (['html', 'size', 'weight', 'font', 'align'].some((k) => c[k] !== undefined)) {
        report.push(`${el.id} : texte, taille, police et alignement ne s’appliquent qu’aux éléments texte`);
      }
      if (Object.keys(patch).length) {
        st.update(el.id, patch as Partial<El>);
        report.push(`${el.id} : modifié`);
      }
    }
    return ok(report.join('\n'));
  },

  add_element: (input) => {
    const id = optEnum(input.preset, 'preset', Object.keys(PRESETS)) ?? fail('preset manquant');
    const els = presetById(id, currentPage().tone) ?? fail(`préréglage inconnu : ${id}`);
    const html = optStr(input.html, 'html');
    if (html !== undefined) {
      const first = els.find((e) => e.type === 'text');
      if (!first || first.type !== 'text') fail('« html » ne s’applique qu’aux préréglages texte');
      else first.html = sanitizeHtml(html);
    }
    const { w: W, h: H } = FORMATS[useEditor.getState().project.format];
    const x = optNum(input.x, 'x', 0, W), y = optNum(input.y, 'y', 0, H);
    const st = useEditor.getState();
    const ids = st.add(els, { at: x !== undefined || y !== undefined ? { x: x ?? W / 2, y: y ?? H / 2 } : undefined, select: false });
    if (ids.length > 1) st.group(ids);
    return withPage(`Ajouté : ${ids.join(', ')}.`);
  },

  remove_elements: (input) => {
    if (!Array.isArray(input.ids) || !input.ids.every((i) => typeof i === 'string')) fail('« ids » doit être une liste d’identifiants');
    const before = currentPage().elements.length;
    useEditor.getState().remove(input.ids as string[]);
    const removed = before - currentPage().elements.length;
    return ok(`${removed} élément(s) supprimé(s)${removed < (input.ids as string[]).length ? ' (les autres sont verrouillés ou introuvables)' : ''}.`);
  },

  set_page_style: (input) => {
    const st = useEditor.getState();
    const tone = optEnum(input.tone, 'tone', TONE_KEYS);
    const bg = input.background_color === '' ? '' : optColor(input.background_color, 'background_color');
    if (tone === undefined && bg === undefined) fail('Rien à changer');
    if (tone) st.setTone(tone as Tone, input.all_pages !== false);
    if (bg === '') st.setBackground({ kind: 'tone' });
    else if (bg) st.setBackground({ kind: 'color', color: bg });
    return ok(`Style appliqué${tone ? ` (ambiance ${tone})` : ''}.`);
  },

  set_caption: (input) => {
    const st = useEditor.getState();
    const { caption } = st.project;
    const fr = optStr(input.fr, 'fr', 2200), darija = optStr(input.darija, 'darija', 2200);
    let hashtags: string[] | undefined;
    if (input.hashtags !== undefined) {
      if (!Array.isArray(input.hashtags) || !input.hashtags.every((h) => typeof h === 'string')) fail('« hashtags » doit être une liste');
      hashtags = [...new Set((input.hashtags as string[]).map((h) => h.trim().replace(/^#?/, '#')).filter((h) => h.length > 1))].slice(0, 30);
    }
    const date = optStr(input.date, 'date', 10);
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('« date » doit être au format AAAA-MM-JJ');
    st.setMeta({ caption: { fr: fr ?? caption.fr, darija: darija ?? caption.darija }, ...(hashtags ? { hashtags } : {}), ...(date ? { date } : {}) });
    return ok('Légende mise à jour.');
  },

  go_to_page: (input) => {
    const { project } = useEditor.getState();
    const i = optNum(input.index, 'index', 1, project.pages.length) ?? fail('index manquant');
    useEditor.getState().selectPage(project.pages[Math.round(i) - 1].id);
    return { content: `Page ${Math.round(i)} affichée.\n${JSON.stringify(snapshot())}` };
  },

  run_checks: () => {
    const { project } = useEditor.getState();
    const issues = checkProject(project).map((i) => `Page ${i.page} — « ${i.text} » ${i.why}`);
    for (const [label, text] of [['Légende FR', project.caption.fr], ['Légende darija', project.caption.darija]] as const) {
      for (const why of forbiddenIn(text)) issues.push(`${label} ${why}`);
    }
    const empty = project.pages.findIndex((p) => !p.elements.some((e) => e.type === 'text' && plainText(e.html).trim()));
    if (empty >= 0) issues.push(`Page ${empty + 1} : aucun texte`);
    if (!project.caption.fr.trim()) issues.push('Légende française vide');
    return { content: issues.length ? `Points à corriger :\n- ${issues.join('\n- ')}` : 'Aucun problème détecté.' };
  },
};

/** Exécute un outil ; les erreurs deviennent un résultat « is_error » que le modèle peut corriger. */
export async function runTool(name: string, input: unknown): Promise<ToolOutcome> {
  const h = handlers[name];
  if (!h) return { content: `Outil inconnu : ${name}`, isError: true };
  if (!isObj(input)) return { content: 'Paramètres illisibles : renvoyez un objet JSON complet.', isError: true };
  try {
    return await h(input);
  } catch (e) {
    return { content: e instanceof ToolError ? e.message : `Erreur : ${(e as Error).message}`, isError: true };
  }
}

/** Outils qui ne modifient pas la création (pas besoin d'étape « Annuler »). */
export const READ_ONLY = new Set(['get_page', 'view_design', 'get_template', 'run_checks']);
