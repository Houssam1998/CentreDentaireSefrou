/**
 * Importateur : transforme une slide d'un modèle existant (templates/index.js) en page d'éléments libres.
 * Principe : on rend la slide dans un conteneur caché, on attend les polices, puis on parcourt le DOM.
 * Chaque titre, paragraphe, carte, photo, icône, motif devient un élément déplaçable, à la même place.
 */
import { renderSlide } from '../../templates/index.js';
import { icons, logo } from '../../brand/motifs.js';
import { whenReady } from '../ready.js';
import { nanoid } from 'nanoid';
import { LIBRARY } from '../store/assets';
import { toToken } from './tokens';
import { sanitizeHtml } from './sanitize';
import type { El, Page, Format, Tone, TextEl, FontKey, ShapeEl, Mask, ComponentName } from './types';

type R = { x: number; y: number; w: number; h: number };

/* Empreintes des icônes pour les reconnaître dans le DOM */
let iconPrints: Map<string, string> | null = null;
const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/ ?(class|style)="[^"]*"/g, '').trim();
function iconName(svg: Element): string | null {
  if (!iconPrints) {
    iconPrints = new Map();
    const tmp = document.createElement('div');
    for (const [k, v] of Object.entries(icons as Record<string, string>)) {
      tmp.innerHTML = v;
      iconPrints.set(norm(tmp.firstElementChild!.innerHTML), k);
    }
  }
  return iconPrints.get(norm(svg.innerHTML)) ?? null;
}
let markPrint: string | null = null;
function isMark(svg: Element) {
  if (!markPrint) {
    const t = document.createElement('div');
    t.innerHTML = logo.mark;
    markPrint = norm(t.firstElementChild!.innerHTML).slice(0, 400);
  }
  return norm(svg.innerHTML).slice(0, 400) === markPrint;
}

const urlToKey = () => Object.fromEntries(Object.entries(LIBRARY).map(([k, u]) => [u, k]));

const transparent = (c: string) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);

function fontKey(stack: string): FontKey {
  const family = stack.split(',')[0]; // la police principale (les suivantes sont des secours)
  if (/Cormorant/i.test(family)) return 'serif';
  if (/Ruqaa/i.test(family)) return 'ruqaa';
  if (/Kufi/i.test(family)) return 'kufi';
  if (/Naskh/i.test(family)) return 'naskh';
  return 'sans';
}

export interface Imported {
  page: Page;
  format: Format;
}

export async function importSlide(slide: Record<string, unknown>): Promise<Imported> {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;';
  host.innerHTML = renderSlide(slide);
  document.body.append(host);
  try {
    await whenReady(host);
    return walkRoot(host.querySelector<HTMLElement>('.ig')!);
  } finally {
    host.remove();
  }
}

function walkRoot(root: HTMLElement): Imported {
  const tone = (root.dataset.tone as Tone) || 'light';
  const format: Format = root.dataset.size === 'tall' ? 'story' : 'post';
  const R0 = root.getBoundingClientRect();
  const keyOf = urlToKey();
  const out: El[] = [];

  const rect = (n: Element | Range): R => {
    const r = n.getBoundingClientRect();
    return { x: r.left - R0.left, y: r.top - R0.top, w: r.width, h: r.height };
  };
  const union = (rs: R[]): R => {
    const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
    return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
  };
  const base = (r: R, name?: string) => ({ id: nanoid(8), x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h), rotation: 0, opacity: 1, name });
  const color = (c: string) => toToken(c, tone);

  /* ----- Fabriques ----- */
  const component = (name: ComponentName, r: R, props: Record<string, string> = {}) =>
    out.push({ ...base(r), type: 'component', name, props, baseW: round(r.w), baseH: round(r.h) });

  const svgEl = (svg: SVGElement, r: R = rect(svg)) => {
    if (r.w < 1 || r.h < 1) return;
    const c = color(getComputedStyle(svg).color);
    const name = iconName(svg);
    if (name) return void out.push({ ...base(r), type: 'icon', name, color: c, disc: false });
    if (isMark(svg)) return void out.push({ ...base(r), type: 'motif', kind: 'mark', color: c });
    const op = Number(svg.getAttribute('opacity') ?? 1);
    const strokeAttr = svg.getAttribute('stroke');
    let html = svg.outerHTML.replace(/\sstyle="[^"]*"/, '').replace(/\sopacity="[^"]*"/, '');
    let col = c;
    if (strokeAttr && strokeAttr !== 'currentColor' && strokeAttr !== 'none') {
      col = color(strokeAttr);
      html = html.replace(`stroke="${strokeAttr}"`, 'stroke="currentColor"');
    }
    out.push({ ...base(r), opacity: op, type: 'motif', kind: 'svg', svg: html, color: col });
  };

  const shapeFromBox = (n: HTMLElement, r: R, extra: Partial<ShapeEl> = {}) => {
    const cs = getComputedStyle(n);
    const bg = cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor;
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    const radB = parseFloat(cs.borderBottomLeftRadius) || 0;
    let shape: ShapeEl['shape'] = 'rect';
    if (cs.borderTopLeftRadius.endsWith('%') || (rad >= Math.min(r.w, r.h) / 2 - 1 && Math.abs(r.w - r.h) < 2)) shape = 'circle';
    else if (rad >= r.w / 2 - 1 && radB < r.w / 3) shape = 'arch';
    else if (rad >= Math.min(r.w, r.h) / 2 - 1) shape = 'stadium';
    const el: ShapeEl = { ...base(r), type: 'shape', shape, fill: transparent(bg) ? 'transparent' : bg, glow: false, radius: shape === 'rect' ? rad : undefined, ...extra };
    out.push(el);
  };

  const textEl = (n: HTMLElement, html: string, r: R) => {
    const cs = getComputedStyle(n);
    const size = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / size;
    const rtl = cs.direction === 'rtl';
    let align: TextEl['align'] = 'left';
    const ta = cs.textAlign;
    if (ta === 'center') align = 'center';
    else if (ta === 'right' || (ta === 'start' && rtl) || (ta === 'end' && !rtl)) align = 'right';
    const em = n.querySelector('em');
    const before = getComputedStyle(n, '::before');
    const t: TextEl = {
      // +2 px de marge pour éviter un retour à la ligne dû aux arrondis (recentré selon l'alignement)
      ...base({ ...r, x: r.x - (align === 'center' ? 1 : align === 'right' ? 2 : 0), w: r.w + 2 }),
      type: 'text',
      html: sanitizeHtml(html.replace(/\s+/g, ' ').trim()),
      font: fontKey(cs.fontFamily),
      italic: cs.fontStyle === 'italic',
      size: round(size),
      weight: parseInt(cs.fontWeight, 10) || 400,
      color: color(cs.color),
      accent: em ? color(getComputedStyle(em).color) : 'accent',
      align,
      dir: rtl ? 'rtl' : 'ltr',
      lineHeight: Math.round(lh * 100) / 100,
      letterSpacing: cs.letterSpacing === 'normal' ? 0 : Math.round((parseFloat(cs.letterSpacing) / size) * 1000) / 1000,
      upper: cs.textTransform === 'uppercase',
      kicker: before.content !== 'none' && before.content !== 'normal' && parseFloat(before.width) > 0,
      nowrap: cs.whiteSpace === 'nowrap',
      wrap: wrapOf(cs),
    };
    const bg = cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor;
    const bw = parseFloat(cs.borderTopWidth);
    if (!transparent(bg) || bw > 0) {
      t.box = {
        background: transparent(bg) ? undefined : cs.backgroundColor + (cs.backgroundImage !== 'none' ? ` ${cs.backgroundImage}` : ''),
        border: bw > 0 ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : undefined,
        radius: parseFloat(cs.borderTopLeftRadius) || 0,
        padding: cs.padding,
        shadow: cs.boxShadow !== 'none' ? cs.boxShadow : undefined,
      };
    }
    out.push(t);
  };

  /* ----- Parcours ----- */
  const isInline = (c: Element) => getComputedStyle(c).display.startsWith('inline') || c.tagName === 'BR';
  const hasSvg = (n: Element) => !!n.querySelector('svg');

  function visitBg(n: HTMLElement) {
    const r = rect(n);
    if (n.tagName.toLowerCase() === 'svg') return svgEl(n as unknown as SVGElement, r);
    if (n.tagName === 'IMG') {
      const src = keyOf[(n as HTMLImageElement).getAttribute('src') ?? ''] ?? (n as HTMLImageElement).src;
      const [px, py] = (getComputedStyle(n).objectPosition || '50% 50%').split(' ').map((v) => parseFloat(v));
      return void out.push({ ...base(r, 'Photo de fond'), type: 'image', src, mask: 'rect', glow: false, crop: { x: px, y: py, zoom: 1 } });
    }
    if (n.classList.contains('glow-arch')) return shapeFromBox(n, r, { shape: 'glow-arch', fill: 'arch', glow: true, name: 'Arche lumineuse' });
    shapeFromBox(n, r);
  }

  function visit(n: HTMLElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = rect(n);
    if (r.w < 0.5 && r.h < 0.5) return;
    const c = n.classList;
    const tag = n.tagName.toLowerCase();

    if (c.contains('ig-bg')) return void [...n.children].forEach((k) => visitBg(k as HTMLElement));
    if (c.contains('ig-head')) {
      component('logo', union([rect(n.querySelector('.mark')!), rect(n.querySelector('.names')!)]));
      const b = n.querySelector<HTMLElement>('.series .badge');
      if (b) visit(b);
      return;
    }
    if (c.contains('ig-foot')) return component('footer', r);
    if (c.contains('badge')) {
      const spans = [...n.querySelectorAll(':scope > span')];
      return component('badge', r, { fr: spans.find((s) => !s.classList.contains('ar') && !s.classList.contains('dot'))?.textContent ?? '', ar: n.querySelector('.ar')?.textContent ?? '' });
    }
    if (c.contains('pill')) return component('pill', r, { icon: iconName(n.querySelector('svg')!) ?? 'phone', text: n.textContent?.trim() ?? '' });
    if (c.contains('hr-card')) return component('hours', r, { w: String(round(r.w)) });
    if (c.contains('qr')) return component('qr', r);
    if (c.contains('li-n')) return component('number', r, { n: n.textContent?.trim() ?? '1' });
    if (c.contains('cmp-vs')) return component('vs', r, { text: n.textContent?.trim() ?? 'ou' });
    if (c.contains('photo-arch')) {
      const img = n.querySelector('img')!;
      const [px, py] = (getComputedStyle(img).objectPosition || '50% 50%').split(' ').map((v) => parseFloat(v));
      const mask: Mask = c.contains('full') ? 'stadium' : 'arch';
      return void out.push({ ...base(r, 'Photo'), type: 'image', src: keyOf[img.getAttribute('src') ?? ''] ?? img.src, mask, glow: true, crop: { x: px, y: py, zoom: 1 } });
    }
    if (c.contains('ft-window') && c.contains('flag')) return void out.push({ ...base(r, 'Drapeau'), type: 'motif', kind: 'flag', color: 'text', mask: 'arch', glow: true });
    if (c.contains('glow-arch')) {
      const rad = parseFloat(cs.borderBottomLeftRadius) || 0;
      shapeFromBox(n, r, { shape: rad < r.w / 3 ? 'arch' : 'glow-arch', fill: 'arch', glow: true, name: 'Arche lumineuse' });
      return void [...n.children].forEach((k) => visit(k as HTMLElement));
    }
    if (c.contains('card')) {
      out.push({ ...base(r, 'Carte'), type: 'shape', shape: 'card', fill: 'surface', glow: false, radius: parseFloat(cs.borderTopLeftRadius) || 28 });
      return void [...n.children].forEach((k) => visit(k as HTMLElement));
    }
    if (c.contains('icon-disc')) {
      const svg = n.querySelector('svg')!;
      return void out.push({ ...base(r), type: 'icon', name: iconName(svg) ?? 'tooth', color: color(getComputedStyle(svg).color), disc: true });
    }
    if (c.contains('stars')) return void out.push({ ...base(r, 'Étoiles'), type: 'motif', kind: 'stars', color: color(cs.color) });
    if (tag === 'svg') return svgEl(n as unknown as SVGElement);

    const kids = [...n.children] as HTMLElement[];
    // Emballage d'une seule icône (sans texte)
    if (kids.length === 1 && kids[0].tagName.toLowerCase() === 'svg' && !n.textContent?.trim()) return svgEl(kids[0] as unknown as SVGElement, rect(kids[0]));

    const text = n.textContent?.trim();
    // Bloc de texte simple (enfants en ligne seulement, pas d'icône)
    if (text && !hasSvg(n) && kids.every(isInline)) return textEl(n, n.innerHTML, r);
    // Texte mélangé avec une icône : l'icône d'un côté, le texte de l'autre
    if (text && hasSvg(n) && kids.every((k) => isInline(k) || k.tagName.toLowerCase() === 'svg' || (!!k.querySelector('svg') && !k.textContent?.trim()))) {
      const parts: R[] = [];
      const clone = n.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('svg').forEach((s) => s.remove());
      clone.querySelectorAll('span').forEach((s) => { if (!s.textContent?.trim()) s.remove(); });
      for (const child of [...n.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          const rg = document.createRange();
          rg.selectNodeContents(child);
          parts.push(rect(rg));
        } else if (child instanceof Element) {
          if (child.tagName.toLowerCase() === 'svg' || (child.querySelector('svg') && !child.textContent?.trim())) svgEl((child.tagName.toLowerCase() === 'svg' ? child : child.querySelector('svg')!) as SVGElement);
          else parts.push(rect(child));
        }
      }
      if (parts.length) textEl(n, clone.innerHTML, union(parts));
      return;
    }
    // Élément décoratif vide (filet, point) : une forme
    if (!text && !kids.length) {
      const bg = cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor;
      if (!transparent(bg)) shapeFromBox(n, r, { name: tag === 'hr' ? 'Filet doré' : 'Forme' });
      return;
    }
    kids.forEach(visit);
  }

  [...root.children].forEach((k) => visit(k as HTMLElement));

  const page: Page = { id: nanoid(8), tone, background: { kind: 'tone' }, elements: out };
  return { page, format };
}

const round = (v: number) => Math.round(v * 10) / 10;

function wrapOf(cs: CSSStyleDeclaration): TextEl['wrap'] {
  const v = `${cs.getPropertyValue('text-wrap-style')} ${cs.getPropertyValue('text-wrap')}`;
  return /balance/.test(v) ? 'balance' : /pretty/.test(v) ? 'pretty' : 'wrap';
}
