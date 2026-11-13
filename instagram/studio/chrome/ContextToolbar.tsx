/** Barre contextuelle au-dessus de la page : les réglages les plus utilisés de la sélection. */
import { useEditor, usePage } from '../store/editor';
import type { TextEl, ImageEl, FontKey } from '../model/types';
import { ColorPicker, IconButton } from '../ui/controls';
import { FONTS } from './Inspector';
import { css } from '../model/tokens';

/** Mise en forme pendant l'édition : sans perdre la sélection de texte. */
const keep = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

export function ContextToolbar() {
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const editingId = useEditor((s) => s.editingId);
  const cropId = useEditor((s) => s.cropId);
  const st = useEditor.getState();
  const sel = page.elements.filter((e) => selection.includes(e.id));

  if (cropId) {
    const el = page.elements.find((e) => e.id === cropId) as ImageEl | undefined;
    if (!el) return null;
    return (
      <div className="ctx no-select">
        <span className="ctx-l">Recadrage : glissez la photo, molette pour zoomer</span>
        <label className="ctx-range">Zoom <input type="range" min={1} max={4} step={0.05} value={el.crop.zoom} onChange={(e) => st.update(el.id, { crop: { ...el.crop, zoom: Number(e.target.value) } } as Partial<ImageEl>)} /></label>
        <button type="button" className="btn primary" onClick={() => st.setCrop(null)}>Terminé</button>
      </div>
    );
  }

  if (!sel.length) return <div className="ctx ctx-empty no-select">Sélectionnez un élément, ou ajoutez-en un depuis les panneaux à gauche.</div>;

  const ids = sel.map((e) => e.id);
  const text = sel.length === 1 && sel[0].type === 'text' ? (sel[0] as TextEl) : null;
  const editing = text && editingId === text.id;
  const up = (p: Partial<TextEl>) => text && st.update(text.id, p);

  return (
    <div className="ctx no-select">
      {text ? (
        <>
          <select className="ctx-font" value={text.font} onChange={(e) => up({ font: e.target.value as FontKey })} aria-label="Police" style={{ fontFamily: `var(--${text.font === 'sans' ? 'sans' : text.font})` }}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
          <div className="ctx-size">
            <button type="button" onClick={() => up({ size: Math.max(8, Math.round(text.size - 2)) })} aria-label="Plus petit">−</button>
            <input type="number" value={Math.round(text.size)} onChange={(e) => up({ size: Number(e.target.value) })} aria-label="Taille du texte" />
            <button type="button" onClick={() => up({ size: Math.round(text.size + 2) })} aria-label="Plus grand">+</button>
          </div>
          <ColorPicker value={text.color} onChange={(c) => up({ color: c })} tone={page.tone} label="Couleur du texte" />
          {editing ? (
            <>
              <button type="button" className="ibtn" title="Gras (sur la sélection)" onMouseDown={keep(() => document.execCommand('bold'))}><b>G</b></button>
              <button type="button" className="ibtn accent-btn" title="Accent : mot en italique coloré" style={{ color: css(text.accent) }} onMouseDown={keep(() => document.execCommand('italic'))}><i>Accent</i></button>
              <button type="button" className="btn primary" onMouseDown={keep(() => (document.activeElement as HTMLElement)?.blur())}>Terminé</button>
            </>
          ) : (
            <>
              <IconButton icon="bold" label="Gras" active={text.weight >= 600} onClick={() => up({ weight: text.weight >= 600 ? 400 : 700 })} size={18} />
              <IconButton icon="accent" label="Italique" active={text.italic} onClick={() => up({ italic: !text.italic })} size={18} />
              <IconButton icon={`ta-${text.align}`} label="Alignement" onClick={() => up({ align: text.align === 'left' ? 'center' : text.align === 'center' ? 'right' : 'left' })} size={18} />
              <button type="button" className="btn" onClick={() => st.setEditing(text.id)}>Écrire</button>
            </>
          )}
          <span className="sep" />
        </>
      ) : null}
      {sel.length === 1 && sel[0].type === 'image' ? <><button type="button" className="btn" onClick={() => st.setCrop(sel[0].id)}>Recadrer</button><span className="sep" /></> : null}
      <IconButton icon="front" label="Premier plan" onClick={() => st.arrange(ids, 'front')} size={18} />
      <IconButton icon="back" label="Arrière-plan" onClick={() => st.arrange(ids, 'back')} size={18} />
      {sel.length > 1 ? <IconButton icon={sel.some((e) => e.groupId) ? 'ungroup' : 'group'} label={sel.some((e) => e.groupId) ? 'Dissocier' : 'Grouper'} onClick={() => (sel.some((e) => e.groupId) ? st.ungroup(ids) : st.group(ids))} size={18} /> : null}
      <IconButton icon={sel[0].locked ? 'lock' : 'unlock'} label={sel[0].locked ? 'Déverrouiller' : 'Verrouiller'} active={sel[0].locked} onClick={() => st.update(ids, { locked: !sel[0].locked })} size={18} />
      <IconButton icon="dup" label="Dupliquer (Ctrl+D)" onClick={() => st.duplicate(ids)} size={18} />
      <IconButton icon="trash" label="Supprimer (Suppr)" onClick={() => st.remove(ids)} size={18} />
    </div>
  );
}
