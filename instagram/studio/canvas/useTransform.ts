/**
 * Manipulation directe : Moveable (déplacer, redimensionner, pivoter, magnétisme) + Selecto (sélection au lasso).
 * Pendant un geste, seul le DOM bouge ; le store n'est mis à jour qu'à la fin (une seule étape d'historique).
 */
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Moveable from 'moveable';
import Selecto from 'selecto';
import { useEditor, currentPage, undo, redo } from '../store/editor';
import type { El, TextEl } from '../model/types';

interface Frame { x: number; y: number; w: number; h: number; r: number; size?: number; startW: number }

const frames = new Map<string, Frame>();
const idOf = (t: HTMLElement | SVGElement) => (t as HTMLElement).dataset.id!;

function frameOf(t: HTMLElement | SVGElement): Frame {
  const id = idOf(t);
  let f = frames.get(id);
  if (!f) {
    const el = currentPage().elements.find((e) => e.id === id)!;
    f = { x: el.x, y: el.y, w: el.w, h: el.h, r: el.rotation, size: el.type === 'text' ? el.size : undefined, startW: el.w };
    frames.set(id, f);
  }
  return f;
}

function apply(t: HTMLElement | SVGElement, f: Frame, isText: boolean) {
  const s = (t as HTMLElement).style;
  s.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)`;
  s.width = `${f.w}px`;
  if (!isText) s.height = `${f.h}px`;
  if (isText && f.size) {
    const inner = t.firstElementChild as HTMLElement | null;
    if (inner) inner.style.fontSize = `${f.size}px`;
  }
}

const elOf = (id: string): El | undefined => currentPage().elements.find((e) => e.id === id);

function commit(targets: (HTMLElement | SVGElement)[]) {
  const patch: Record<string, Partial<El>> = {};
  for (const t of targets) {
    const id = idOf(t);
    const f = frames.get(id);
    if (!f) continue;
    const el = elOf(id);
    const p: Partial<El> = { x: Math.round(f.x), y: Math.round(f.y), w: Math.round(f.w), rotation: Math.round(f.r * 10) / 10 };
    if (el?.type === 'text') {
      (p as Partial<TextEl>).size = Math.round((f.size ?? el.size) * 10) / 10;
      p.h = (t as HTMLElement).offsetHeight;
    } else {
      p.h = Math.round(f.h);
      if (el?.type === 'component') p.h = Math.round((f.w / el.baseW) * el.baseH);
    }
    patch[id] = p;
  }
  frames.clear();
  if (Object.keys(patch).length) useEditor.getState().setFrames(patch);
}

/** Proportions verrouillées pour les icônes, motifs et composants (et en multi-sélection). */
function keepsRatio(ids: string[]) {
  if (ids.length > 1) return true;
  const el = elOf(ids[0]);
  return !!el && (el.type === 'icon' || el.type === 'component' || (el.type === 'motif' && el.kind !== 'waves'));
}

function directions(ids: string[]) {
  if (ids.length > 1) return ['nw', 'ne', 'sw', 'se'];
  const el = elOf(ids[0]);
  if (!el) return [];
  if (el.type === 'text') return ['nw', 'ne', 'sw', 'se', 'w', 'e'];
  if (keepsRatio(ids)) return ['nw', 'ne', 'sw', 'se'];
  return ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
}

export function useTransform(opts: {
  workspace: React.RefObject<HTMLDivElement | null>;
  stage: React.RefObject<HTMLDivElement | null>; // conteneur non mis à l'échelle (accueille les poignées)
  pageNode: () => HTMLElement | null;
  zoom: number;
}) {
  const moveable = useRef<Moveable | null>(null);
  const selecto = useRef<Selecto | null>(null);
  const selection = useEditor((s) => s.selection);
  const editingId = useEditor((s) => s.editingId);
  const cropId = useEditor((s) => s.cropId);
  const project = useEditor((s) => s.project);
  const pageId = useEditor((s) => s.pageId);

  /* Création (une fois) */
  useEffect(() => {
    const container = opts.stage.current!;
    const m = new Moveable(container, {
      target: [],
      draggable: true,
      resizable: true,
      rotatable: true,
      snappable: true,
      keepRatio: false,
      origin: false,
      rotationPosition: 'bottom',
      throttleDrag: 0,
      throttleResize: 0,
      throttleRotate: 0,
      snapRotationDegrees: [0, 45, 90, 135, 180, 225, 270, 315],
      snapRotationThreshold: 4,
      snapThreshold: 6,
      snapGap: true,
      isDisplaySnapDigit: false,
      snapDirections: { top: true, left: true, bottom: true, right: true, center: true, middle: true },
      elementSnapDirections: { top: true, left: true, bottom: true, right: true, center: true, middle: true },
      className: 'mv',
    });
    moveable.current = m;
    const isText = (t: HTMLElement | SVGElement) => elOf(idOf(t))?.type === 'text';

    m.on('dragStart', (e) => { const f = frameOf(e.target); e.set([f.x, f.y]); })
      .on('drag', (e) => { const f = frameOf(e.target); f.x = e.beforeTranslate[0]; f.y = e.beforeTranslate[1]; apply(e.target, f, isText(e.target)); })
      .on('dragEnd', (e) => { if (e.isDrag) commit([e.target]); else frames.clear(); })
      .on('resizeStart', (e) => { const f = frameOf(e.target); f.startW = f.w; e.setOrigin(['%', '%']); if (e.dragStart) e.dragStart.set([f.x, f.y]); })
      .on('resize', (e) => {
        const f = frameOf(e.target);
        const text = isText(e.target);
        const corner = e.direction[0] !== 0 && e.direction[1] !== 0;
        if (text && corner) {
          const el = elOf(idOf(e.target)) as TextEl;
          f.size = el.size * (e.width / f.startW);
        }
        f.w = e.width;
        f.h = e.height;
        f.x = e.drag.beforeTranslate[0];
        f.y = e.drag.beforeTranslate[1];
        apply(e.target, f, text);
      })
      .on('resizeEnd', (e) => { if (e.isDrag) commit([e.target]); else frames.clear(); })
      .on('rotateStart', (e) => { const f = frameOf(e.target); e.set(f.r); })
      .on('rotate', (e) => { const f = frameOf(e.target); f.r = e.beforeRotate; apply(e.target, f, isText(e.target)); })
      .on('rotateEnd', (e) => { if (e.isDrag) commit([e.target]); else frames.clear(); })
      // Groupes (multi-sélection)
      .on('dragGroupStart', (e) => e.events.forEach((ev) => { const f = frameOf(ev.target); ev.set([f.x, f.y]); }))
      .on('dragGroup', (e) => e.events.forEach((ev) => { const f = frameOf(ev.target); f.x = ev.beforeTranslate[0]; f.y = ev.beforeTranslate[1]; apply(ev.target, f, isText(ev.target)); }))
      .on('dragGroupEnd', (e) => { if (e.isDrag) commit(e.targets); else frames.clear(); })
      .on('resizeGroupStart', (e) => e.events.forEach((ev) => { const f = frameOf(ev.target); f.startW = f.w; ev.setOrigin(['%', '%']); if (ev.dragStart) ev.dragStart.set([f.x, f.y]); }))
      .on('resizeGroup', (e) => e.events.forEach((ev) => {
        const f = frameOf(ev.target);
        const text = isText(ev.target);
        if (text) { const el = elOf(idOf(ev.target)) as TextEl; f.size = el.size * (ev.width / f.startW); }
        f.w = ev.width; f.h = ev.height; f.x = ev.drag.beforeTranslate[0]; f.y = ev.drag.beforeTranslate[1];
        apply(ev.target, f, text);
      }))
      .on('resizeGroupEnd', (e) => { if (e.isDrag) commit(e.targets); else frames.clear(); })
      .on('rotateGroupStart', (e) => e.events.forEach((ev) => { const f = frameOf(ev.target); ev.set(f.r); if (ev.dragStart) ev.dragStart.set([f.x, f.y]); }))
      .on('rotateGroup', (e) => e.events.forEach((ev) => { const f = frameOf(ev.target); f.r = ev.rotate; f.x = ev.drag.beforeTranslate[0]; f.y = ev.drag.beforeTranslate[1]; apply(ev.target, f, isText(ev.target)); }))
      .on('rotateGroupEnd', (e) => { if (e.isDrag) commit(e.targets); else frames.clear(); });

    const ws = opts.workspace.current!;
    const sel = new Selecto({
      container: ws,
      dragContainer: ws,
      selectableTargets: ['.page-scale .ig.free > .el:not(.locked)'],
      hitRate: 0,
      selectByClick: true,
      selectFromInside: false,
      toggleContinueSelect: ['shift'],
      preventClickEventOnDrag: true,
      ratio: 0,
    });
    selecto.current = sel;
    sel.on('dragStart', (e) => {
      const t = e.inputEvent.target as HTMLElement;
      const st = useEditor.getState();
      // Laisser la main à Moveable, à l'édition de texte, aux barres d'outils
      if (m.isMoveableElement(t) || (m.getTargets() as HTMLElement[]).some((x) => x === t || x.contains(t))) e.stop();
      else if (st.editingId && t.closest('.editing')) e.stop();
      else if (t.closest('.no-select, .crop-layer')) e.stop();
    });
    sel.on('selectEnd', (e) => {
      const ids = e.selected.map((n) => (n as HTMLElement).dataset.id!).filter(Boolean);
      const st = useEditor.getState();
      if (st.editingId) st.setEditing(null);
      flushSync(() => st.select(ids, e.inputEvent?.shiftKey && !e.isDragStart));
      if (e.isDragStart && ids.length) {
        e.inputEvent.preventDefault();
        syncTargets();
        m.dragStart(e.inputEvent);
      }
    });

    return () => { m.destroy(); sel.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Met les poignées sur les éléments sélectionnés (sauf édition / recadrage). */
  function syncTargets() {
    const m = moveable.current;
    const page = opts.pageNode();
    if (!m || !page) return;
    const st = useEditor.getState();
    const ids = st.selection.filter((id) => id !== st.editingId && id !== st.cropId);
    const pageEls = currentPage().elements;
    const targets = ids
      .filter((id) => !pageEls.find((e) => e.id === id)?.locked)
      .map((id) => page.querySelector<HTMLElement>(`.el[data-id="${id}"]`))
      .filter((n): n is HTMLElement => !!n);
    m.target = targets;
    m.keepRatio = keepsRatio(ids);
    m.renderDirections = directions(ids);
    m.elementGuidelines = [
      page,
      ...page.parentElement!.querySelectorAll<HTMLElement>('.guide'),
      ...[...page.querySelectorAll<HTMLElement>('.el')].filter((n) => !targets.includes(n) && n.offsetWidth < 1070),
    ];
    m.zoom = 1;
    m.updateRect();
  }

  useEffect(() => {
    requestAnimationFrame(syncTargets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, editingId, cropId, project, pageId, opts.zoom]);

  /* Clavier */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      const st = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      const ids = st.selection;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && k === 'a') { e.preventDefault(); st.select(currentPage().elements.filter((x) => !x.locked).map((x) => x.id)); return; }
      if (mod && k === 'v') { e.preventDefault(); st.paste(); return; }
      if (!ids.length) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); st.remove(ids); return; }
      if (e.key === 'Escape') { st.select([]); st.setCrop(null); return; }
      if (mod && k === 'c') { e.preventDefault(); st.copy(); return; }
      if (mod && k === 'x') { e.preventDefault(); st.copy(); st.remove(ids); return; }
      if (mod && k === 'd') { e.preventDefault(); st.duplicate(ids); return; }
      if (mod && k === 'g') { e.preventDefault(); if (e.shiftKey) st.ungroup(ids); else st.group(ids); return; }
      if (e.key === 'Enter' && ids.length === 1 && elOf(ids[0])?.type === 'text') { e.preventDefault(); st.setEditing(ids[0]); return; }
      const step = e.shiftKey ? 10 : 1;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) {
        e.preventDefault();
        const patch: Record<string, Partial<El>> = {};
        for (const id of ids) { const el = elOf(id); if (el && !el.locked) patch[id] = { x: el.x + d[0], y: el.y + d[1] }; }
        st.setFrames(patch);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { moveable, syncTargets };
}
