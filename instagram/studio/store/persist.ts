/**
 * Sauvegarde des créations.
 * - En ligne (Studio publié, connexion Cloudflare Access) : espace d'équipe partagé (API /api/*, base D1).
 *   Chaque enregistrement porte un numéro de version : si quelqu'un d'autre a enregistré entre-temps,
 *   rien n'est écrasé et le Studio demande quoi faire.
 * - En local (npm run ig:studio) : dans ce navigateur (IndexedDB).
 */
import { get, set, del, createStore } from 'idb-keyval';
import { useEffect, useState } from 'react';
import type { Page, Project, Format } from '../model/types';
import { useEditor, silently } from './editor';
import { api, ApiError, useCloud, type RemoteMeta } from './cloud';
import { uploadLocalAsset } from './assets';

const db = createStore('ig-studio-projects', 'projects');

export interface ProjectInfo {
  id: string; name: string; updatedAt: number; format: Format; thumb?: string; pages: number;
  updatedBy?: string; createdBy?: string; deletedAt?: number | null; deletedBy?: string | null;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const cloudOn = () => useCloud.getState().enabled;

/** Version connue de chaque création (pour détecter les modifications simultanées). */
const versions = new Map<string, number | null>();
/** Dernières informations connues (auteur, date) de chaque création chargée. */
const metas = new Map<string, RemoteMeta>();
export const remoteMeta = (id: string) => metas.get(id) ?? null;
/** Vrai pendant qu'on applique une version venue du serveur (ce n'est pas une modification locale). */
let applyingRemote = false;
function applyRemote(fn: () => void) { applyingRemote = true; try { fn(); } finally { applyingRemote = false; } }

/* ---------- Créations : navigateur ---------- */
async function localList(): Promise<ProjectInfo[]> {
  return ((await get<ProjectInfo[]>('index', db)) ?? []).sort((a, b) => b.updatedAt - a.updatedAt);
}
async function localSave(p: Project, thumb?: string) {
  await set(`p:${p.id}`, p, db);
  const index = (await get<ProjectInfo[]>('index', db)) ?? [];
  const old = index.find((i) => i.id === p.id);
  const info: ProjectInfo = { id: p.id, name: p.name, updatedAt: p.updatedAt, format: p.format, pages: p.pages.length, thumb: thumb ?? old?.thumb };
  await set('index', [info, ...index.filter((i) => i.id !== p.id)], db);
}
async function localDelete(id: string) {
  await del(`p:${id}`, db);
  await set('index', ((await get<ProjectInfo[]>('index', db)) ?? []).filter((i) => i.id !== id), db);
}
export const localProjects = localList;
export const loadLocalProject = (id: string) => get<Project>(`p:${id}`, db);

/* ---------- Créations : API commune ---------- */
const toInfo = (m: RemoteMeta): ProjectInfo => ({
  id: m.id, name: m.name, updatedAt: m.updatedAt, format: m.format, pages: m.pages, updatedBy: m.updatedBy, createdBy: m.createdBy,
  deletedAt: m.deletedAt, deletedBy: m.deletedBy, thumb: `/api/projects/${m.id}/thumb?v=${m.version}`,
});

export async function listProjects(trash = false): Promise<ProjectInfo[]> {
  if (!cloudOn()) return trash ? [] : localList();
  const { projects } = await api<{ projects: RemoteMeta[] }>(`/projects${trash ? '?trash=1' : ''}`);
  return projects.map(toInfo);
}

export async function loadProjectById(id: string): Promise<Project | undefined> {
  if (!cloudOn()) return get<Project>(`p:${id}`, db);
  try {
    const { meta, project } = await api<{ meta: RemoteMeta; project: Project }>(`/projects/${id}`);
    versions.set(id, meta.version);
    metas.set(id, meta);
    return project;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}

/** Enregistre ; en ligne, renvoie false s'il y a un conflit (quelqu'un a enregistré entre-temps). */
export async function saveProject(p: Project, opts: { thumb?: string; force?: boolean } = {}): Promise<boolean> {
  if (!cloudOn()) {
    await localSave(p, opts.thumb);
    await set('last', p.id, db);
    notify();
    return true;
  }
  try {
    const { meta } = await api<{ meta: RemoteMeta }>(`/projects/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: p, baseVersion: versions.has(p.id) ? versions.get(p.id) : null, force: !!opts.force }),
    });
    versions.set(p.id, meta.version);
    metas.set(p.id, meta);
    if (useEditor.getState().project.id === p.id) useCloud.setState({ current: meta, conflict: null });
    await set('last', p.id, db);
    notify();
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      const meta = (e.body as { meta: RemoteMeta }).meta;
      if (useEditor.getState().project.id === p.id) useCloud.setState({ conflict: meta });
      return false;
    }
    throw e;
  }
}

export async function saveThumb(id: string, dataUrl: string) {
  if (!cloudOn()) {
    const p = await get<Project>(`p:${id}`, db);
    if (p) await localSave(p, dataUrl);
    notify();
    return;
  }
  const blob = await (await fetch(dataUrl)).blob();
  await api(`/projects/${id}/thumb`, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: blob });
  notify();
}

export async function deleteProject(id: string) {
  if (cloudOn()) await api(`/projects/${id}`, { method: 'DELETE' });
  else await localDelete(id);
  notify();
}

export async function restoreProject(id: string) {
  await api(`/projects/${id}/restore`, { method: 'POST' });
  notify();
}

/** Copie d'une création (nouvel identifiant, nouvelle version). */
export async function duplicateProject(id: string, newId: string) {
  const full = await loadProjectById(id);
  if (!full) return;
  versions.set(newId, null);
  await saveProject({ ...structuredClone(full), id: newId, name: `${full.name} (copie)`, updatedAt: Date.now() });
}

export const lastProjectId = () => get<string>('last', db);
export const forgetVersion = (id: string) => versions.set(id, null);

export function useProjectList(trash = false) {
  const [list, setList] = useState<ProjectInfo[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    const refresh = () => listProjects(trash).then((l) => { if (alive) { setList(l); setErr(''); } }).catch((e) => alive && setErr((e as Error).message));
    refresh();
    listeners.add(refresh);
    return () => { alive = false; listeners.delete(refresh); };
  }, [trash]);
  return { list, err };
}

/* ---------- Envoyer les créations de ce navigateur dans l'espace d'équipe ---------- */
export async function uploadLocalProjects(onProgress?: (i: number, n: number) => void): Promise<{ sent: number; skipped: number }> {
  const local = await localList();
  const done = new Set((await get<string[]>('uploaded', db)) ?? []);
  const todo = local.filter((p) => !done.has(p.id));
  let sent = 0, skipped = 0;
  for (let i = 0; i < todo.length; i++) {
    onProgress?.(i + 1, todo.length);
    const p = await get<Project>(`p:${todo[i].id}`, db);
    if (!p) continue;
    // Photos importées : envoyées avec le même identifiant
    const srcs = new Set(p.pages.flatMap((pg) => [...pg.elements.filter((e) => e.type === 'image').map((e) => (e as { src: string }).src), pg.background.image ?? '']).filter((s) => s.startsWith('asset:')));
    for (const s of srcs) await uploadLocalAsset(s);
    versions.set(p.id, null);
    const ok = await saveProject(p);
    if (ok) { sent++; done.add(p.id); } else skipped++;
  }
  await set('uploaded', [...done], db);
  notify();
  return { sent, skipped };
}
export async function pendingLocalCount() {
  const done = new Set((await get<string[]>('uploaded', db)) ?? []);
  return (await localList()).filter((p) => !done.has(p.id)).length;
}

/* ---------- Mes modèles ---------- */
export interface SavedTemplate { id: string; name: string; format: Format; page: Page; createdBy?: string }

export async function listMyTemplates(): Promise<SavedTemplate[]> {
  if (cloudOn()) return (await api<{ templates: SavedTemplate[] }>('/templates')).templates;
  return (await get<SavedTemplate[]>('templates', db)) ?? [];
}
export async function saveMyTemplate(t: SavedTemplate) {
  if (cloudOn()) await api(`/templates/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) });
  else await set('templates', [t, ...((await get<SavedTemplate[]>('templates', db)) ?? [])], db);
  notify();
}
export async function deleteMyTemplate(id: string) {
  if (cloudOn()) await api(`/templates/${id}`, { method: 'DELETE' });
  else await set('templates', ((await get<SavedTemplate[]>('templates', db)) ?? []).filter((t) => t.id !== id), db);
  notify();
}
export function useMyTemplates() {
  const [list, setList] = useState<SavedTemplate[]>([]);
  useEffect(() => {
    const refresh = () => listMyTemplates().then(setList).catch(() => setList([]));
    refresh();
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);
  return list;
}

/* ---------- Enregistrement automatique ---------- */
let timer: ReturnType<typeof setTimeout> | undefined;
let thumbTimer: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;
let dirty = false;
/** Un enregistrement est en cours : les suivants attendent (jamais deux en même temps). */
let saving = false;
let again = false;
export const hasUnsaved = () => dirty;

/** Attend la fin de l'enregistrement en cours. */
async function idle() {
  while (saving) await new Promise((r) => setTimeout(r, 50));
}

async function flush(makeThumb: (p: Project) => Promise<string | undefined>) {
  // Un seul enregistrement à la fois : sinon deux envois partiraient avec la même version de départ
  // et le second serait pris pour la modification d'un collègue.
  if (saving) { again = true; return; }
  if (useCloud.getState().conflict) return; // en attente d'une décision
  saving = true;
  const st = useEditor.getState();
  const p = st.project;
  try {
    const ok = await saveProject(p);
    if (!ok) { st.setStatus('Modifiée par quelqu’un d’autre : choisissez quelle version garder'); return; }
    if (useEditor.getState().project === p) dirty = false;
    st.setStatus(cloudOn() ? 'Enregistré dans l’espace d’équipe' : 'Enregistré dans ce navigateur');
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(async () => {
      const cur = useEditor.getState().project;
      const thumb = await makeThumb(cur).catch(() => undefined);
      if (thumb) await saveThumb(cur.id, thumb).catch(() => {});
    }, 2500);
  } catch (e) {
    st.setStatus(e instanceof ApiError && e.status === 401 ? 'Session expirée : rechargez la page' : 'Hors connexion : nouvel essai dans 10 s…');
    clearTimeout(retry);
    retry = setTimeout(() => flush(makeThumb), 10_000);
  } finally {
    saving = false;
    // Des modifications sont arrivées pendant l'envoi : on enregistre la dernière version
    if (again) { again = false; if (dirty) void flush(makeThumb); }
  }
}

export function startAutosave(makeThumb: (p: Project) => Promise<string | undefined>) {
  const unsub = useEditor.subscribe((s, prev) => {
    if (s.project === prev.project || applyingRemote) return;
    // Nouvelle création chargée : pas une modification
    if (s.project.id !== prev.project.id) { dirty = false; return; }
    dirty = true;
    useEditor.getState().setStatus('Enregistrement…');
    clearTimeout(timer);
    timer = setTimeout(() => flush(makeThumb), cloudOn() ? 1200 : 500);
  });
  const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
  window.addEventListener('beforeunload', beforeUnload);
  const stopWatch = watchRemote();
  return () => { unsub(); stopWatch(); window.removeEventListener('beforeunload', beforeUnload); };
}

/** En ligne : vérifie toutes les 20 s si quelqu'un d'autre a modifié la création ouverte. */
function watchRemote() {
  const tick = async () => {
    if (!cloudOn() || document.hidden || useCloud.getState().conflict) return;
    // Modifications locales en attente ou en cours d'envoi : c'est l'enregistrement qui détectera
    // un éventuel conflit (réponse 409), pas cette vérification.
    if (saving || dirty) return;
    const p = useEditor.getState().project;
    const known = versions.get(p.id);
    if (known == null) return;
    try {
      const { meta } = await api<{ meta: RemoteMeta }>(`/projects/${p.id}/meta`);
      if (meta.version <= known || saving || dirty || useEditor.getState().project.id !== p.id) return;
      // Pas de modification locale : on prend simplement la nouvelle version
      const fresh = await loadProjectById(p.id);
      if (fresh) {
        const pageId = useEditor.getState().pageId;
        applyRemote(() => silently(() => useEditor.setState({ project: fresh, pageId: fresh.pages.some((x) => x.id === pageId) ? pageId : fresh.pages[0].id, selection: [] })));
        useCloud.setState({ current: meta });
        useEditor.getState().setStatus(`Mis à jour : modifications de ${meta.updatedBy.split('@')[0]}`);
      }
    } catch { /* réessaie au prochain tour */ }
  };
  const t = setInterval(tick, 20_000);
  const vis = () => { if (!document.hidden) void tick(); };
  document.addEventListener('visibilitychange', vis);
  return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
}

/** Résolution d'un conflit. */
export async function keepMine() {
  await idle();
  const p = useEditor.getState().project;
  useCloud.setState({ conflict: null });
  await saveProject(p, { force: true });
  dirty = false;
  useEditor.getState().setStatus('Votre version a été enregistrée');
}
export async function takeTheirs() {
  await idle();
  const id = useEditor.getState().project.id;
  const fresh = await loadProjectById(id);
  if (!fresh) return;
  dirty = false;
  applyRemote(() => useEditor.getState().loadProject(fresh));
  useEditor.temporal.getState().clear();
  useCloud.setState({ conflict: null, current: metas.get(id) ?? null });
  useEditor.getState().setStatus('Version la plus récente chargée');
}
export async function saveMineAsCopy(newId: string) {
  await idle();
  const p = useEditor.getState().project;
  const copy = { ...p, id: newId, name: `${p.name} (ma version)`, updatedAt: Date.now() };
  versions.set(newId, null);
  useCloud.setState({ conflict: null });
  useEditor.getState().loadProject(copy);
  await saveProject(copy);
  dirty = false;
  useEditor.getState().setStatus('Votre version est enregistrée comme une nouvelle création');
}
