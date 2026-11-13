/**
 * Photos : photothèque du cabinet (fichiers du site) et photos importées (IndexedDB, restent dans ce navigateur).
 * Une image est désignée par une clé : 'clinic/xray-unit' ou 'asset:<id>'.
 */
import { get, set, del, keys, createStore } from 'idb-keyval';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { photos } from '../../brand/photos.js';
import { api, useCloud } from './cloud';

const cloudOn = () => useCloud.getState().enabled;

const db = createStore('ig-studio-assets', 'assets');
const urls = new Map<string, string>();
const listeners = new Set<() => void>();

export const LIBRARY: Record<string, string> = photos;

/** Photos proposées dans le panneau (cabinet d'abord). */
export const libraryKeys = () =>
  Object.keys(LIBRARY).sort((a, b) => (a.startsWith('clinic/') === b.startsWith('clinic/') ? a.localeCompare(b) : a.startsWith('clinic/') ? -1 : 1));

export const isAsset = (src: string) => src.startsWith('asset:');

/** URL synchrone si déjà connue (photothèque ou photo déjà chargée). */
export function urlNow(src: string): string {
  if (!src) return '';
  if (isAsset(src)) return urls.get(src) ?? (cloudOn() ? `/api/assets/${src.slice(6)}` : '');
  if (/^(data:|blob:|https?:|\/)/.test(src)) return src;
  return LIBRARY[src] ?? '';
}

export async function loadUrl(src: string): Promise<string> {
  if (!isAsset(src)) return urlNow(src);
  if (urls.has(src)) return urls.get(src)!;
  if (cloudOn()) return `/api/assets/${src.slice(6)}`;
  const blob = await get<Blob>(src.slice(6), db).catch(() => undefined);
  if (!blob) return '';
  const u = URL.createObjectURL(blob);
  urls.set(src, u);
  return u;
}

/** Hook : URL d'une image (charge depuis IndexedDB si besoin). */
export function useImageUrl(src: string) {
  const [url, setUrl] = useState(() => urlNow(src));
  useEffect(() => {
    let alive = true;
    const now = urlNow(src);
    if (now) setUrl(now);
    else loadUrl(src).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [src]);
  return url;
}

/** Réduit une photo (1600 px max, JPEG) pour rester légère, puis la stocke. */
export async function importPhoto(file: Blob): Promise<string> {
  const blob = await downscale(file);
  const id = nanoid(10);
  if (cloudOn()) await api(`/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  else await set(id, blob, db);
  urls.set(`asset:${id}`, URL.createObjectURL(blob));
  listeners.forEach((l) => l());
  return `asset:${id}`;
}

export async function storeAssetBlob(id: string, blob: Blob) {
  if (cloudOn()) await api(`/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
  else await set(id, blob, db);
  urls.set(`asset:${id}`, URL.createObjectURL(blob));
  listeners.forEach((l) => l());
}

export async function getAssetBlob(src: string): Promise<Blob | undefined> {
  const local = await get<Blob>(src.replace(/^asset:/, ''), db).catch(() => undefined);
  if (local || !cloudOn()) return local;
  const r = await fetch(`/api/assets/${src.slice(6)}`, { credentials: 'same-origin' });
  return r.ok ? r.blob() : undefined;
}

/** Envoie une photo de ce navigateur dans l'espace d'équipe (même identifiant). */
export async function uploadLocalAsset(src: string) {
  const blob = await get<Blob>(src.replace(/^asset:/, ''), db).catch(() => undefined);
  if (!blob) return;
  await api(`/assets/${src.slice(6)}`, { method: 'PUT', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob });
}

export async function listAssets(): Promise<string[]> {
  if (cloudOn()) return (await api<{ assets: { id: string }[] }>('/assets')).assets.map((a) => `asset:${a.id}`);
  return (await keys(db)).map((k) => `asset:${String(k)}`);
}

export async function deleteAsset(src: string) {
  if (cloudOn()) await api(`/assets/${src.slice(6)}`, { method: 'DELETE' });
  else await del(src.replace(/^asset:/, ''), db);
  urls.delete(src);
  listeners.forEach((l) => l());
}

export function useAssetList() {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const refresh = () => listAssets().then(setList).catch(() => setList([]));
    refresh();
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);
  return list;
}

function downscale(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 1600;
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('conversion impossible'))), 'image/jpeg', 0.88);
    };
    img.onerror = () => reject(new Error('image illisible'));
    img.src = URL.createObjectURL(file);
  });
}
