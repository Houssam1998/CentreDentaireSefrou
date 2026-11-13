/** Petits composants d'interface réutilisés : bouton icône, menu déroulant, pipette de couleur, curseur. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { TOKENS, BRAND_COLORS, resolve, isToken, type Token } from '../model/tokens';
import type { Tone } from '../model/types';

export function IconButton({ icon, label, onClick, active, disabled, size = 20, className = '', children }: {
  icon: string; label: string; onClick?: () => void; active?: boolean; disabled?: boolean; size?: number; className?: string; children?: ReactNode;
}) {
  return (
    <button type="button" className={`ibtn ${active ? 'on' : ''} ${className}`} onClick={onClick} disabled={disabled} title={label} aria-label={label} aria-pressed={active}>
      <Icon name={icon} size={size} />
      {children}
    </button>
  );
}

/** Menu ou panneau flottant (rendu au-dessus de tout, recalé pour rester dans l'écran). */
export function Popover({ trigger, children, align = 'left', className = '' }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = pop.current;
      if (!a || !p) return;
      const w = p.offsetWidth, h = p.offsetHeight;
      let left = align === 'right' ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      let top = a.bottom + 6;
      if (top + h > window.innerHeight - 8) top = Math.max(8, a.top - h - 6);
      setPos({ left, top });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, align]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!anchor.current?.contains(t) && !pop.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', down);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div className={`pop-wrap ${className}`} ref={anchor}>
      {trigger(open, () => setOpen((o) => !o))}
      {open
        ? createPortal(
            <div ref={pop} className="pop" role="dialog" style={{ position: 'fixed', left: pos?.left ?? -9999, top: pos?.top ?? 0 }}>
              {children(() => setOpen(false))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

const CSS_SWATCH = (c: string, tone: Tone) => (isToken(c) ? resolve(c, tone) : c);

/** Pastille de couleur + choix : couleurs d'ambiance (jetons), couleurs de la marque, couleur libre. */
export function ColorPicker({ value, onChange, tone, label = 'Couleur', allowNone }: { value: string; onChange: (c: string) => void; tone: Tone; label?: string; allowNone?: boolean }) {
  const tokenList: Token[] = ['text', 'soft', 'muted', 'accent', 'gold', 'gold2', 'inverse', 'surface', 'arch'];
  return (
    <Popover
      trigger={(_, toggle) => (
        <button type="button" className="swatch-btn" onClick={toggle} title={label} aria-label={label}>
          <span className="swatch" style={{ background: CSS_SWATCH(value, tone) }} />
        </button>
      )}
    >
      {(close) => (
        <div className="color-pop">
          <p className="pop-title">Couleurs de l’ambiance <span>(suivent le changement d’ambiance)</span></p>
          <div className="swatches">
            {tokenList.map((t) => (
              <button key={t} type="button" className={`swatch-btn${value === t ? ' on' : ''}`} title={TOKENS[t]} onClick={() => { onChange(t); close(); }}>
                <span className="swatch" style={{ background: resolve(t, tone) }} />
              </button>
            ))}
            {allowNone ? (
              <button type="button" className={`swatch-btn${value === 'transparent' ? ' on' : ''}`} title="Aucune" onClick={() => { onChange('transparent'); close(); }}>
                <span className="swatch none" />
              </button>
            ) : null}
          </div>
          <p className="pop-title">Couleurs de la marque</p>
          <div className="swatches">
            {BRAND_COLORS.map((c) => (
              <button key={c.value} type="button" className={`swatch-btn${value === c.value ? ' on' : ''}`} title={c.label} onClick={() => { onChange(c.value); close(); }}>
                <span className="swatch" style={{ background: c.value }} />
              </button>
            ))}
          </div>
          <label className="custom-color">
            Couleur libre
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(CSS_SWATCH(value, tone)) ? CSS_SWATCH(value, tone) : '#0f6e77'} onChange={(e) => onChange(e.target.value)} />
          </label>
        </div>
      )}
    </Popover>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="slider">
      <span className="slider-l">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input type="number" min={min} max={max} step={step} value={Math.round(value * 100) / 100} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      {unit ? <span className="unit">{unit}</span> : null}
    </label>
  );
}

export function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="numf">
      <span>{label}</span>
      <input type="number" step={step} value={Math.round(value * 10) / 10} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string; icon?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)} title={o.label}>
          {o.icon ? <Icon name={o.icon} size={18} /> : o.label}
        </button>
      ))}
    </div>
  );
}
