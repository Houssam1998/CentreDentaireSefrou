/**
 * Rendu d'une page et de ses éléments. Le même rendu sert à l'éditeur, aux vignettes et à l'export PNG.
 */
import { memo, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { El, Page, Format, TextEl, ImageEl, ShapeEl, IconEl, MotifEl, ComponentEl, Mask, FontKey } from '../model/types';
import { FORMATS } from '../model/types';
import { css } from '../model/tokens';
import { componentHtml } from '../model/components';
import { useImageUrl } from '../store/assets';
import { icons, waves, flag, yaz, crescent, lantern, stars, logo } from '../../brand/motifs.js';

export const FONT: Record<FontKey, string> = {
  serif: 'var(--serif)',
  sans: 'var(--sans)',
  kufi: 'var(--kufi)',
  naskh: 'var(--naskh)',
  ruqaa: 'var(--ruqaa)',
};

export function maskRadius(mask: Mask | undefined, w: number, radius = 28): string | undefined {
  switch (mask) {
    case 'rounded': return `${radius}px`;
    case 'arch': return `${w / 2}px ${w / 2}px 36px 36px`;
    case 'stadium': return '9999px';
    case 'circle': return '50%';
    default: return undefined;
  }
}

/* ---------------- Page ---------------- */

interface PageProps {
  page: Page;
  format: Format;
  editingId?: string | null;
  onCommitText?: (id: string, html: string) => void;
  className?: string;
}

export const PageView = memo(function PageView({ page, format, editingId, onCommitText, className = '' }: PageProps) {
  const { w, h } = FORMATS[format];
  const bg = page.background;
  const style: CSSProperties = { width: w, height: h };
  if (bg.kind === 'color' && bg.color) style.background = bg.color;
  return (
    <div className={`ig free ${className}`} data-tone={page.tone} data-size={format === 'story' ? 'tall' : 'post'} style={style} data-page={page.id}>
      {bg.kind === 'image' && bg.image ? <BgImage src={bg.image} overlay={bg.overlay ?? 0.35} /> : null}
      {page.elements.map((el) =>
        el.hidden ? null : (
          <ElementView key={el.id} el={el} editing={editingId === el.id} onCommitText={onCommitText} />
        ),
      )}
    </div>
  );
});

function BgImage({ src, overlay }: { src: string; overlay: number }) {
  const url = useImageUrl(src);
  return (
    <div className="el-bg">
      {url ? <img src={url} alt="" /> : null}
      <div style={{ position: 'absolute', inset: 0, background: `rgb(15 34 38 / ${overlay})` }} />
    </div>
  );
}

/* ---------------- Élément ---------------- */

interface ElProps {
  el: El;
  editing?: boolean;
  onCommitText?: (id: string, html: string) => void;
}

export const ElementView = memo(function ElementView({ el, editing, onCommitText }: ElProps) {
  const style: CSSProperties = {
    width: el.w,
    height: el.type === 'text' ? 'auto' : el.h,
    transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)`,
    opacity: el.opacity,
  };
  return (
    <div className={`el el-${el.type}-wrap${el.locked ? ' locked' : ''}`} data-id={el.id} style={style}>
      {renderInner(el, editing, onCommitText)}
    </div>
  );
});

function renderInner(el: El, editing?: boolean, onCommit?: (id: string, html: string) => void) {
  switch (el.type) {
    case 'text': return editing ? <EditableText el={el} onCommit={onCommit} /> : <TextView el={el} />;
    case 'image': return <ImageView el={el} />;
    case 'shape': return <ShapeView el={el} />;
    case 'icon': return <IconView el={el} />;
    case 'motif': return <MotifView el={el} />;
    case 'component': return <ComponentView el={el} />;
  }
}

export function textStyle(el: TextEl): CSSProperties {
  const s: CSSProperties & Record<string, string | number> = {
    fontFamily: FONT[el.font],
    fontStyle: el.italic ? 'italic' : 'normal',
    fontWeight: el.weight,
    fontSize: el.size,
    lineHeight: el.lineHeight,
    letterSpacing: `${el.letterSpacing}em`,
    textAlign: el.align,
    textTransform: el.upper ? 'uppercase' : 'none',
    color: css(el.color),
    '--accent': css(el.accent),
  };
  if (el.box) {
    if (el.box.background) s.background = el.box.background;
    if (el.box.border) s.border = el.box.border;
    if (el.box.radius != null) s.borderRadius = el.box.radius;
    if (el.box.shadow) s.boxShadow = el.box.shadow;
    if (el.box.padding) s.padding = el.box.padding;
  }
  return s;
}

const textClass = (el: TextEl) => `el-text${el.kicker ? ' kicker' : ''}${el.nowrap ? ' nowrap' : ''}${el.wrap && el.wrap !== 'balance' ? ` w-${el.wrap}` : ''}`;

function TextView({ el }: { el: TextEl }) {
  return <div className={textClass(el)} dir={el.dir} style={textStyle(el)} dangerouslySetInnerHTML={{ __html: el.html }} />;
}

/** Texte en cours d'édition : contenu libre, nettoyé à la validation. */
function EditableText({ el, onCommit }: { el: TextEl; onCommit?: (id: string, html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const d = ref.current!;
    d.innerHTML = el.html;
    d.focus();
    const r = document.createRange();
    r.selectNodeContents(d);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={ref}
      className={`${textClass(el)} editing`}
      dir={el.dir}
      style={textStyle(el)}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onBlur={(e) => onCommit?.(el.id, e.currentTarget.innerHTML)}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') (e.currentTarget as HTMLDivElement).blur();
        e.stopPropagation();
      }}
    />
  );
}

function ImageView({ el }: { el: ImageEl }) {
  const url = useImageUrl(el.src);
  const { x, y, zoom } = el.crop;
  return (
    <div className={`el-image${el.glow ? ' el-glow' : ''}`} style={{ borderRadius: maskRadius(el.mask, el.w) }}>
      {url ? (
        <img src={url} alt="" draggable={false} style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }} />
      ) : null}
    </div>
  );
}

function ShapeView({ el }: { el: ShapeEl }) {
  const s: CSSProperties = {};
  const fill = css(el.fill, 'transparent');
  s.background = fill;
  if (el.stroke) s.border = `${el.strokeWidth ?? 2}px solid ${css(el.stroke)}`;
  let cls = 'el-shape';
  switch (el.shape) {
    case 'card': cls += ' card'; s.borderRadius = el.radius ?? 28; break;
    case 'rect': s.borderRadius = el.radius ?? 0; break;
    case 'arch': s.borderRadius = maskRadius('arch', el.w); break;
    case 'glow-arch': s.borderRadius = 9999; break;
    case 'stadium': s.borderRadius = 9999; break;
    case 'circle': s.borderRadius = '50%'; break;
    case 'line': s.borderRadius = 2; break;
  }
  if (el.glow) cls += ' glow';
  return <div className={cls} style={s} />;
}

function IconView({ el }: { el: IconEl }) {
  return (
    <div
      className={`el-icon${el.disc ? ' disc' : ''}`}
      style={{ color: css(el.color) }}
      dangerouslySetInnerHTML={{ __html: (icons as Record<string, string>)[el.name] ?? icons.tooth }}
    />
  );
}

function motifSvg(el: MotifEl): string {
  const p = el.params ?? {};
  switch (el.kind) {
    case 'waves':
      return waves({ w: Math.round(el.w), h: Math.round(el.h), n: p.n ?? 16, gap: p.gap ?? Math.max(6, el.h / 40), amp: p.amp ?? el.h * 0.07, tilt: p.tilt ?? -0.12, bump: p.bump ?? el.h * 0.1, color: 'currentColor', width: el.strokeWidth ?? 1.6, opacity: 1 }).replace(/style="[^"]*"/, '');
    case 'flag': return flag(600).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');
    case 'yaz': return yaz;
    case 'crescent': return crescent;
    case 'lantern': return lantern;
    case 'stars': return stars(p.n ?? 5);
    case 'mark': return logo.mark;
    case 'svg': return el.svg ?? '';
  }
}

function MotifView({ el }: { el: MotifEl }) {
  return (
    <div
      className={`el-motif m-${el.kind}${el.glow ? ' el-glow' : ''}`}
      style={{ color: css(el.color), borderRadius: maskRadius(el.mask, el.w) }}
      dangerouslySetInnerHTML={{ __html: motifSvg(el) }}
    />
  );
}

function ComponentView({ el }: { el: ComponentEl }) {
  const s = el.w / (el.baseW || 1);
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="el-comp" style={{ width: el.baseW, transform: `scale(${s})` }} dangerouslySetInnerHTML={{ __html: componentHtml(el.name, el.props) }} />
    </div>
  );
}

/* ---------------- Vignette ---------------- */

export function PageThumb({ page, format, width }: { page: Page; format: Format; width: number }) {
  const { w, h } = FORMATS[format];
  const s = width / w;
  return (
    <div className="thumb" style={{ width, height: h * s }}>
      <div style={{ transform: `scale(${s})`, transformOrigin: '0 0', width: w, height: h }}>
        <PageView page={page} format={format} />
      </div>
    </div>
  );
}

/** Mesure la hauteur réelle des textes (hauteur automatique) après rendu. */
export function useMeasureTexts(root: HTMLElement | null, page: Page, onMeasure: (sizes: Record<string, number>) => void) {
  useEffect(() => {
    if (!root) return;
    const out: Record<string, number> = {};
    for (const el of page.elements) {
      if (el.type !== 'text') continue;
      const node = root.querySelector<HTMLElement>(`.el[data-id="${el.id}"]`);
      if (node && Math.abs(node.offsetHeight - el.h) > 1) out[el.id] = node.offsetHeight;
    }
    if (Object.keys(out).length) onMeasure(out);
  });
}
