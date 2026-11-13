/**
 * Export : PNG d'une page (rendu hors écran à l'échelle 1, sans poignées), ZIP de toutes les pages,
 * fichier projet (.json avec les photos importées), vérifications avant publication.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';
import { zipSync } from 'fflate';
import { nanoid } from 'nanoid';
import { PageView } from '../canvas/ElementView';
import { FORMATS, type Page, type Project, type Format } from '../model/types';
import { loadUrl, isAsset, getAssetBlob, storeAssetBlob } from '../store/assets';
import { plainText } from '../model/sanitize';
import { whenReady } from '../ready.js';

const imageSrcs = (pages: Page[]) =>
  pages.flatMap((p) => [
    ...p.elements.filter((e) => e.type === 'image').map((e) => (e as { src: string }).src),
    ...(p.background.kind === 'image' && p.background.image ? [p.background.image] : []),
  ]);

/** Rend une page hors écran et renvoie un PNG (data URL). */
export async function pageToPng(page: Page, format: Format, pixelRatio = 1): Promise<string> {
  await Promise.all(imageSrcs([page]).map(loadUrl));
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-30000px;top:0;';
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(PageView, { page, format })));
    await whenReady(host);
    const node = host.querySelector<HTMLElement>('.ig')!;
    const { w, h } = FORMATS[format];
    return await toPng(node, { width: w, height: h, pixelRatio, cacheBust: false });
  } finally {
    root.unmount();
    host.remove();
  }
}

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creation';

export function download(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

const dataUrlToBytes = (u: string) => Uint8Array.from(atob(u.split(',')[1]), (c) => c.charCodeAt(0));

export async function downloadPage(project: Project, index: number) {
  const url = await pageToPng(project.pages[index], project.format);
  download(url, `${slug(project.name)}${project.pages.length > 1 ? `-${index + 1}` : ''}.png`);
}

export async function downloadAllZip(project: Project, onProgress?: (i: number, n: number) => void) {
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < project.pages.length; i++) {
    onProgress?.(i + 1, project.pages.length);
    files[`${slug(project.name)}-${i + 1}.png`] = dataUrlToBytes(await pageToPng(project.pages[i], project.format));
  }
  const zip = zipSync(files, { level: 0 });
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }));
  download(url, `${slug(project.name)}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ---------- Fichier projet ---------- */
interface ProjectFile { app: 'studio-centre-dentaire-sefrou'; version: 1; project: Project; assets: Record<string, string> }

const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(b); });

export async function exportProjectFile(project: Project) {
  const assets: Record<string, string> = {};
  for (const src of new Set(imageSrcs(project.pages).filter(isAsset))) {
    const blob = await getAssetBlob(src);
    if (blob) assets[src] = await blobToDataUrl(blob);
  }
  const file: ProjectFile = { app: 'studio-centre-dentaire-sefrou', version: 1, project, assets };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  download(url, `${slug(project.name)}.studio.json`);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function importProjectFile(file: File): Promise<Project> {
  const data = JSON.parse(await file.text()) as ProjectFile;
  if (data.app !== 'studio-centre-dentaire-sefrou' || !data.project?.pages) throw new Error('Ce fichier n’est pas un projet du Studio.');
  for (const [src, url] of Object.entries(data.assets ?? {})) {
    const blob = await (await fetch(url)).blob();
    await storeAssetBlob(src.replace(/^asset:/, ''), blob);
  }
  // Nouvel identifiant : un projet ouvert n'écrase jamais une création existante
  return { ...data.project, id: nanoid(10), updatedAt: Date.now() };
}

/* ---------- Vérifications avant publication ---------- */
const FORBIDDEN = [
  { re: /\bprix\b|\btarifs?\b|\bdh\b|\bmad\b|دراهم|درهم|ثمن/i, why: 'mentionne un prix ou un tarif' },
  { re: /promo|réduction|remise|offre spéciale|gratuit|تخفيض|مجان/i, why: 'ressemble à une promotion' },
  { re: /\d+\s?%/, why: 'contient un pourcentage (souvent une promotion)' },
  { re: /meilleur|n°\s?1|numéro un|le plus|أفضل/i, why: 'emploie un superlatif' },
  { re: /garanti|sans risque|100\s?%|مضمون/i, why: 'promet un résultat' },
];

export interface Issue { page: number; text: string; why: string }

export function checkProject(project: Project): Issue[] {
  const { w: W, h: H } = FORMATS[project.format];
  const issues: Issue[] = [];
  project.pages.forEach((p, i) => {
    for (const e of p.elements) {
      if (e.hidden) continue;
      if (e.type === 'text') {
        const t = plainText(e.html);
        for (const f of FORBIDDEN) if (f.re.test(t)) issues.push({ page: i + 1, text: t.slice(0, 60), why: f.why });
      }
      const out = e.x + e.w < 0 || e.y + e.h < 0 || e.x > W || e.y > H;
      if (out) issues.push({ page: i + 1, text: e.name ?? e.type, why: 'est en dehors de la page (invisible)' });
    }
  });
  return issues;
}
