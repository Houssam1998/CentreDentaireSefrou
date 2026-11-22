/**
 * État de l'éditeur (Zustand + immer) avec historique annuler / rétablir (zundo, 100 étapes).
 * Seul le projet est historisé ; la sélection, le zoom et les panneaux ne le sont pas.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { nanoid } from 'nanoid';
import type { El, NewEl, Page, Project, Format, Tone, Background } from '../model/types';
import { FORMATS } from '../model/types';

export type PanelId = 'templates' | 'elements' | 'text' | 'photos' | 'brand' | 'layers' | 'assistant';

export interface EditorState {
  project: Project;
  pageId: string;
  selection: string[];
  editingId: string | null; // texte en cours d'édition
  cropId: string | null; // image en cours de recadrage
  zoom: number; // 0 = ajusté à l'écran
  panel: PanelId | null;
  showSafe: boolean;
  clipboard: El[];
  status: string;

  /* Projet */
  loadProject: (p: Project) => void;
  newProject: (format?: Format) => void;
  setName: (name: string) => void;
  setFormat: (f: Format) => void;
  setTone: (t: Tone, all?: boolean) => void;
  setBackground: (bg: Background) => void;
  setMeta: (patch: Partial<Pick<Project, 'caption' | 'hashtags' | 'date'>>) => void;

  /* Pages */
  selectPage: (id: string) => void;
  addPage: (page?: Page, after?: string) => void;
  insertPages: (pages: Page[], after?: string) => void;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  movePage: (from: number, to: number) => void;
  replacePage: (page: Page) => void;

  /* Éléments */
  add: (els: NewEl | NewEl[], opts?: { at?: { x: number; y: number }; select?: boolean }) => string[];
  update: (ids: string | string[], patch: Partial<El> | ((el: El) => void)) => void;
  /** Plusieurs éléments modifiés d'un coup (un seul pas d'historique). */
  setFrames: (frames: Record<string, Partial<El>>) => void;
  remove: (ids: string[]) => void;
  duplicate: (ids: string[]) => void;
  arrange: (ids: string[], where: 'front' | 'back' | 'forward' | 'backward') => void;
  reorderTo: (id: string, index: number) => void;
  group: (ids: string[]) => void;
  ungroup: (ids: string[]) => void;
  align: (ids: string[], edge: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void;
  copy: () => void;
  paste: () => void;

  /* Sélection / interface */
  select: (ids: string[], additive?: boolean) => void;
  setEditing: (id: string | null) => void;
  setCrop: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPanel: (p: PanelId | null) => void;
  toggleSafe: () => void;
  setStatus: (s: string) => void;
}

export const blankPage = (tone: Tone = 'light'): Page => ({ id: nanoid(8), tone, background: { kind: 'tone' }, elements: [] });

export const blankProject = (format: Format = 'post'): Project => ({
  id: nanoid(10),
  version: 1,
  name: 'Nouvelle création',
  format,
  pages: [blankPage()],
  caption: { fr: '', darija: '' },
  hashtags: ['#Sefrou', '#صفرو', '#CentreDentaireSefrou', '#DentisteSefrou', '#طبيب_الأسنان', '#Maroc'],
  date: new Date().toISOString().slice(0, 10),
  updatedAt: Date.now(),
});

/** Donne de nouveaux identifiants à une page (et garde la cohérence des groupes). */
export function freshPage(p: Page): Page {
  const groups = new Map<string, string>();
  return {
    ...structuredClone(p),
    id: nanoid(8),
    elements: p.elements.map((e) => ({
      ...structuredClone(e),
      id: nanoid(8),
      groupId: e.groupId ? (groups.get(e.groupId) ?? groups.set(e.groupId, nanoid(6)).get(e.groupId)) : undefined,
    })),
  };
}

const first = blankProject();

export const useEditor = create<EditorState>()(
  temporal(
    immer((set, get) => {
      const cur = (s: EditorState) => s.project.pages.find((p) => p.id === s.pageId) ?? s.project.pages[0];
      const touch = (s: EditorState) => { s.project.updatedAt = Date.now(); };
      /** Étend la sélection aux autres membres des groupes. */
      const withGroups = (page: Page, ids: string[]) => {
        const groups = new Set(page.elements.filter((e) => ids.includes(e.id) && e.groupId).map((e) => e.groupId));
        return page.elements.filter((e) => ids.includes(e.id) || (e.groupId && groups.has(e.groupId))).map((e) => e.id);
      };

      return {
        project: first,
        pageId: first.pages[0].id,
        selection: [],
        editingId: null,
        cropId: null,
        zoom: 0,
        panel: 'templates',
        showSafe: false,
        clipboard: [],
        status: '',

        loadProject: (p) => set((s) => { s.project = p; s.pageId = p.pages[0].id; s.selection = []; s.editingId = null; s.cropId = null; }),
        newProject: (format = 'post') => get().loadProject(blankProject(format)),
        setName: (name) => set((s) => { s.project.name = name; touch(s); }),
        setFormat: (f) => set((s) => { s.project.format = f; touch(s); }),
        setTone: (t, all = true) => set((s) => {
          for (const p of s.project.pages) if (all || p.id === s.pageId) p.tone = t;
          touch(s);
        }),
        setBackground: (bg) => set((s) => { cur(s).background = bg; touch(s); }),
        setMeta: (patch) => set((s) => { Object.assign(s.project, patch); touch(s); }),

        selectPage: (id) => set((s) => { s.pageId = id; s.selection = []; s.editingId = null; s.cropId = null; }),
        addPage: (page, after) => get().insertPages([page ?? blankPage(cur(get()).tone)], after),
        insertPages: (pages, after) => set((s) => {
          const i = s.project.pages.findIndex((p) => p.id === (after ?? s.pageId));
          s.project.pages.splice(i + 1, 0, ...pages);
          s.pageId = pages[0].id;
          s.selection = [];
          touch(s);
        }),
        duplicatePage: (id) => {
          const p = get().project.pages.find((x) => x.id === id);
          if (p) get().insertPages([freshPage(p)], id);
        },
        deletePage: (id) => set((s) => {
          if (s.project.pages.length <= 1) return;
          const i = s.project.pages.findIndex((p) => p.id === id);
          s.project.pages.splice(i, 1);
          if (s.pageId === id) s.pageId = s.project.pages[Math.max(0, i - 1)].id;
          s.selection = [];
          touch(s);
        }),
        movePage: (from, to) => set((s) => {
          const [p] = s.project.pages.splice(from, 1);
          s.project.pages.splice(to, 0, p);
          touch(s);
        }),
        replacePage: (page) => set((s) => {
          const i = s.project.pages.findIndex((p) => p.id === s.pageId);
          s.project.pages[i] = { ...page, id: s.pageId };
          s.selection = [];
          touch(s);
        }),

        add: (input, opts = {}) => {
          const list = Array.isArray(input) ? input : [input];
          const { w: W, h: H } = FORMATS[get().project.format];
          const ids: string[] = [];
          set((s) => {
            const page = cur(s);
            // Bloc ajouté : centré (ou au point de dépôt), en gardant les positions relatives
            const minX = Math.min(...list.map((e) => e.x ?? 0)), minY = Math.min(...list.map((e) => e.y ?? 0));
            const bw = Math.max(...list.map((e) => (e.x ?? 0) + e.w)) - minX, bh = Math.max(...list.map((e) => (e.y ?? 0) + e.h)) - minY;
            const at = opts.at ?? { x: W / 2, y: H / 2 };
            const offX = at.x - bw / 2 - minX, offY = at.y - bh / 2 - minY;
            for (const e of list) {
              const el = { rotation: 0, opacity: 1, ...e, id: nanoid(8), x: Math.round((e.x ?? 0) + offX), y: Math.round((e.y ?? 0) + offY) } as El;
              page.elements.push(el);
              ids.push(el.id);
            }
            if (opts.select !== false) s.selection = ids;
            touch(s);
          });
          return ids;
        },
        update: (ids, patch) => set((s) => {
          const list = Array.isArray(ids) ? ids : [ids];
          for (const el of cur(s).elements) {
            if (!list.includes(el.id)) continue;
            if (typeof patch === 'function') patch(el as El);
            else Object.assign(el, patch);
          }
          touch(s);
        }),
        setFrames: (frames) => set((s) => {
          for (const el of cur(s).elements) if (frames[el.id]) Object.assign(el, frames[el.id]);
          touch(s);
        }),
        remove: (ids) => set((s) => {
          const page = cur(s);
          page.elements = page.elements.filter((e) => !ids.includes(e.id) || e.locked);
          s.selection = s.selection.filter((id) => page.elements.some((e) => e.id === id));
          touch(s);
        }),
        duplicate: (ids) => set((s) => {
          const page = cur(s);
          const groups = new Map<string, string>();
          const copies = page.elements
            .filter((e) => ids.includes(e.id))
            .map((e) => ({ ...structuredClone(e), id: nanoid(8), x: e.x + 24, y: e.y + 24, locked: false, groupId: e.groupId ? (groups.get(e.groupId) ?? groups.set(e.groupId, nanoid(6)).get(e.groupId)) : undefined }));
          page.elements.push(...(copies as El[]));
          s.selection = copies.map((c) => c.id);
          touch(s);
        }),
        arrange: (ids, where) => set((s) => {
          const page = cur(s);
          const moving = page.elements.filter((e) => ids.includes(e.id));
          const rest = page.elements.filter((e) => !ids.includes(e.id));
          if (where === 'front') page.elements = [...rest, ...moving];
          else if (where === 'back') page.elements = [...moving, ...rest];
          else {
            const idx = page.elements.findIndex((e) => e.id === ids[0]);
            const target = where === 'forward' ? Math.min(page.elements.length - 1, idx + 1) : Math.max(0, idx - 1);
            const arr = [...page.elements];
            const [m] = arr.splice(idx, 1);
            arr.splice(target, 0, m);
            page.elements = arr;
          }
          touch(s);
        }),
        reorderTo: (id, index) => set((s) => {
          const page = cur(s);
          const i = page.elements.findIndex((e) => e.id === id);
          const [m] = page.elements.splice(i, 1);
          page.elements.splice(index, 0, m);
          touch(s);
        }),
        group: (ids) => set((s) => {
          if (ids.length < 2) return;
          const g = nanoid(6);
          for (const e of cur(s).elements) if (ids.includes(e.id)) e.groupId = g;
          touch(s);
        }),
        ungroup: (ids) => set((s) => {
          for (const e of cur(s).elements) if (ids.includes(e.id)) e.groupId = undefined;
          touch(s);
        }),
        align: (ids, edge) => set((s) => {
          const { w: W, h: H } = FORMATS[s.project.format];
          const els = cur(s).elements.filter((e) => ids.includes(e.id) && !e.locked);
          // Un seul élément : aligné sur la page ; plusieurs : alignés entre eux
          const box = els.length > 1
            ? { x: Math.min(...els.map((e) => e.x)), y: Math.min(...els.map((e) => e.y)), r: Math.max(...els.map((e) => e.x + e.w)), b: Math.max(...els.map((e) => e.y + e.h)) }
            : { x: 0, y: 0, r: W, b: H };
          for (const e of els) {
            if (edge === 'left') e.x = box.x;
            if (edge === 'right') e.x = box.r - e.w;
            if (edge === 'hcenter') e.x = Math.round((box.x + box.r) / 2 - e.w / 2);
            if (edge === 'top') e.y = box.y;
            if (edge === 'bottom') e.y = box.b - e.h;
            if (edge === 'vcenter') e.y = Math.round((box.y + box.b) / 2 - e.h / 2);
          }
          touch(s);
        }),
        copy: () => set((s) => { s.clipboard = structuredClone(cur(s).elements.filter((e) => s.selection.includes(e.id))) as El[]; }),
        paste: () => {
          const clip = get().clipboard;
          if (!clip.length) return;
          set((s) => {
            const page = cur(s);
            const copies = clip.map((e) => ({ ...structuredClone(e), id: nanoid(8), x: e.x + 24, y: e.y + 24 }));
            page.elements.push(...(copies as El[]));
            s.selection = copies.map((c) => c.id);
            s.clipboard = copies as El[];
            touch(s);
          });
        },

        select: (ids, additive) => set((s) => {
          const page = cur(s);
          const expanded = withGroups(page, ids);
          s.selection = additive ? [...new Set([...s.selection, ...expanded])] : expanded;
          if (s.editingId && !s.selection.includes(s.editingId)) s.editingId = null;
          if (s.cropId && !s.selection.includes(s.cropId)) s.cropId = null;
        }),
        setEditing: (id) => set((s) => { s.editingId = id; if (id) s.selection = [id]; }),
        setCrop: (id) => set((s) => { s.cropId = id; if (id) s.selection = [id]; }),
        setZoom: (z) => set((s) => { s.zoom = z; }),
        setPanel: (p) => set((s) => { s.panel = s.panel === p ? null : p; }),
        toggleSafe: () => set((s) => { s.showSafe = !s.showSafe; }),
        setStatus: (st) => set((s) => { s.status = st; }),
      };
    }),
    {
      limit: 100,
      partialize: (s) => ({ project: s.project }),
      equality: (a, b) => a.project === b.project,
      // Les modifications rapprochées (curseur, saisie, recadrage) comptent pour une seule étape
      handleSet: (handleSet) => {
        let last = 0;
        return (...args: Parameters<typeof handleSet>) => {
          const now = Date.now();
          if (now - last > 400) handleSet(...args);
          last = now;
        };
      },
    },
  ),
);

/** Page affichée. */
export const usePage = () => useEditor((s) => s.project.pages.find((p) => p.id === s.pageId) ?? s.project.pages[0]);

export const currentPage = () => {
  const s = useEditor.getState();
  return s.project.pages.find((p) => p.id === s.pageId) ?? s.project.pages[0];
};

/** Modifie le projet sans créer d'étape d'historique (mesures automatiques). */
export function silently(fn: () => void) {
  const t = useEditor.temporal.getState();
  t.pause();
  try { fn(); } finally { t.resume(); }
}

/** Annuler / rétablir, en gardant une sélection valide. */
export function undo() { useEditor.temporal.getState().undo(); fixSelection(); }
export function redo() { useEditor.temporal.getState().redo(); fixSelection(); }
function fixSelection() {
  const s = useEditor.getState();
  if (!s.project.pages.some((p) => p.id === s.pageId)) useEditor.setState({ pageId: s.project.pages[0].id });
  const page = currentPage();
  useEditor.setState({ selection: s.selection.filter((id) => page.elements.some((e) => e.id === id)), editingId: null, cropId: null });
}
