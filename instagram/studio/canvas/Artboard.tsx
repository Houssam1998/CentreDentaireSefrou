/**
 * Plan de travail : la page à l'échelle, les repères (centre, zone visible du profil), le dépôt d'éléments
 * et de photos, le double-clic (éditer un texte, recadrer une photo).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor, usePage, silently } from '../store/editor';
import { PageView } from './ElementView';
import { FORMATS, type ImageEl, type NewEl } from '../model/types';
import { useTransform } from './useTransform';
import { sanitizeHtml, plainText } from '../model/sanitize';
import { importPhoto } from '../store/assets';
import { dropPayload, presetById } from '../panels/dnd';

export const DND_TYPE = 'application/x-ig-studio';

export function Artboard() {
  const page = usePage();
  const format = useEditor((s) => s.project.format);
  const zoomSetting = useEditor((s) => s.zoom);
  const editingId = useEditor((s) => s.editingId);
  const cropId = useEditor((s) => s.cropId);
  const showSafe = useEditor((s) => s.showSafe);
  const { w: W, h: H } = FORMATS[format];
  const ws = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scaleBox = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.4);
  const [dropHint, setDropHint] = useState(false);

  /* Zoom « ajusté » selon la place disponible */
  useLayoutEffect(() => {
    const el = ws.current!;
    const ro = new ResizeObserver(() => setFit(Math.max(0.1, Math.min((el.clientWidth - 96) / W, (el.clientHeight - 96) / H))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);
  const zoom = zoomSetting || fit;
  useEffect(() => { (window as unknown as { __zoom: number }).__zoom = zoom; }, [zoom]);

  const pageNode = useCallback(() => scaleBox.current?.querySelector<HTMLElement>('.ig.free') ?? null, []);
  useTransform({ workspace: ws, stage, pageNode, zoom });

  /* Hauteur réelle des textes (sans créer d'étape d'historique) */
  useEffect(() => {
    const root = pageNode();
    if (!root) return;
    const patch: Record<string, { h: number }> = {};
    for (const el of page.elements) {
      if (el.type !== 'text') continue;
      const n = root.querySelector<HTMLElement>(`.el[data-id="${el.id}"]`);
      if (n && Math.abs(n.offsetHeight - el.h) > 1) patch[el.id] = { h: n.offsetHeight };
    }
    if (Object.keys(patch).length) silently(() => useEditor.getState().setFrames(patch));
  });

  const onCommitText = useCallback((id: string, html: string) => {
    const st = useEditor.getState();
    const clean = sanitizeHtml(html);
    if (!plainText(clean)) st.remove([id]);
    else st.update(id, { html: clean });
    st.setEditing(null);
  }, []);

  const onDoubleClick = (e: React.MouseEvent) => {
    const n = (e.target as HTMLElement).closest<HTMLElement>('.ig.free > .el');
    if (!n) return;
    const el = page.elements.find((x) => x.id === n.dataset.id);
    if (!el || el.locked) return;
    if (el.type === 'text') useEditor.getState().setEditing(el.id);
    if (el.type === 'image') useEditor.getState().setCrop(el.id);
  };

  /** Coordonnées dans la page à partir d'un point de l'écran. */
  const toPage = (cx: number, cy: number) => {
    const r = pageNode()!.getBoundingClientRect();
    return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom };
  };
  const imageUnder = (cx: number, cy: number) => {
    const n = document.elementsFromPoint(cx, cy).find((x) => x.matches?.('.ig.free > .el-image-wrap')) as HTMLElement | undefined;
    return n?.dataset.id;
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropHint(false);
    const st = useEditor.getState();
    const at = toPage(e.clientX, e.clientY);
    const target = imageUnder(e.clientX, e.clientY);
    const placePhoto = (src: string) => {
      if (target) st.update(target, { src } as Partial<ImageEl>);
      else st.add({ type: 'image', src, w: 560, h: 700, mask: 'rounded', glow: false, crop: { x: 50, y: 50, zoom: 1 } } as NewEl, { at });
    };
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      st.setStatus('Import de la photo…');
      for (const f of files) placePhoto(await importPhoto(f));
      st.setStatus('Photo importée');
      return;
    }
    const payload = dropPayload(e.dataTransfer.getData(DND_TYPE));
    if (!payload) return;
    if (payload.kind === 'photo') return placePhoto(payload.src);
    const preset = presetById(payload.id, page.tone);
    if (preset) {
      const ids = st.add(preset, { at });
      if (ids.length > 1) st.group(ids);
    }
  };

  const empty = page.elements.length === 0;

  return (
    <div
      ref={ws}
      className={`workspace${dropHint ? ' drop' : ''}`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes(DND_TYPE) || e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropHint(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDropHint(false); }}
      onDrop={onDrop}
    >
      <div className="stage-pad" style={{ width: W * zoom + 96, height: H * zoom + 96 }}>
        <div ref={stage} className="stage" style={{ width: W * zoom, height: H * zoom }}>
          <div ref={scaleBox} className="page-scale" style={{ width: W, height: H, transform: `scale(${zoom})` }} onDoubleClick={onDoubleClick}>
            <PageView page={page} format={format} editingId={editingId} onCommitText={onCommitText} />
            {/* Repères magnétiques invisibles : centre de la page et zone visible sur la grille du profil */}
            <div className="guide" style={{ left: W / 2, top: 0, width: 0, height: H }} />
            <div className="guide" style={{ left: 0, top: H / 2, width: W, height: 0 }} />
            {safeZone(format).map((g, i) => <div key={i} className="guide" style={g} />)}
            {showSafe ? <div className="safe-zone" style={safeRect(format)} /> : null}
            {cropId ? <CropLayer id={cropId} zoom={zoom} /> : null}
          </div>
          {empty ? (
            <div className="empty-hint no-select">
              <strong>Page vide</strong>
              <span>Choisissez un modèle à gauche, ou glissez un texte, une forme ou une photo ici.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Zone visible sur la grille du profil Instagram (recadrage 3:4). */
function safeRect(format: keyof typeof FORMATS): React.CSSProperties {
  const { w, h } = FORMATS[format];
  const cw = Math.min(w, (h * 3) / 4), ch = Math.min(h, (w * 4) / 3);
  return { left: (w - cw) / 2, top: (h - ch) / 2, width: cw, height: ch };
}
function safeZone(format: keyof typeof FORMATS): React.CSSProperties[] {
  const r = safeRect(format) as { left: number; top: number; width: number; height: number };
  const { w, h } = FORMATS[format];
  const out: React.CSSProperties[] = [];
  if (r.left > 0) out.push({ left: r.left, top: 0, width: 0, height: h }, { left: r.left + r.width, top: 0, width: 0, height: h });
  if (r.top > 0) out.push({ left: 0, top: r.top, width: w, height: 0 }, { left: 0, top: r.top + r.height, width: w, height: 0 });
  return out;
}

/** Recadrage : glisser pour déplacer la photo dans son cadre, molette pour zoomer. */
function CropLayer({ id, zoom }: { id: string; zoom: number }) {
  const el = usePage().elements.find((e) => e.id === id) as ImageEl | undefined;
  if (!el) return null;
  const update = (crop: ImageEl['crop']) => useEditor.getState().update(id, { crop } as Partial<ImageEl>);
  return (
    <div
      className="crop-layer"
      style={{ width: el.w, height: el.h, transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)` }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const start = { x: e.clientX, y: e.clientY, cx: el.crop.x, cy: el.crop.y };
        const move = (ev: PointerEvent) => {
          const dx = ((ev.clientX - start.x) / zoom / el.w) * 100 / el.crop.zoom;
          const dy = ((ev.clientY - start.y) / zoom / el.h) * 100 / el.crop.zoom;
          update({ ...el.crop, x: clamp(start.cx - dx * 1.5, 0, 100), y: clamp(start.cy - dy * 1.5, 0, 100) });
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
      onWheel={(e) => update({ ...el.crop, zoom: clamp(el.crop.zoom - e.deltaY * 0.001, 1, 4) })}
      title="Glissez pour déplacer la photo, molette pour zoomer"
    />
  );
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(v * 10) / 10));
