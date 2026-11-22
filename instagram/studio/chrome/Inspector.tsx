/** Inspecteur (panneau de droite) : position, taille, apparence et réglages propres à chaque type d'élément. */
import { useEditor, usePage } from '../store/editor';
import type { El, TextEl, ImageEl, ShapeEl, IconEl, MotifEl, ComponentEl, FontKey, Mask, ShapeKind, Tone } from '../model/types';
import { COMPONENTS } from '../model/components';
import { ICON_NAMES, ICON_LABELS, iconSvg, measureComponent } from '../model/presets';
import { ColorPicker, IconButton, NumberField, Popover, Segmented, Slider } from '../ui/controls';
import { layerName } from '../panels/Panels';
import { saveMyTemplate } from '../store/persist';
import { nanoid } from 'nanoid';
import { typeOf } from '../model/postTypes';
import { OCCASIONS } from '../../templates/occasions.js';
import { openWizard } from './NewPostWizard';
import { Icon } from '../ui/Icon';

export const FONTS: { v: FontKey; label: string }[] = [
  { v: 'serif', label: 'Cormorant (titres)' },
  { v: 'sans', label: 'Inter (texte)' },
  { v: 'kufi', label: 'Kufi (titre arabe)' },
  { v: 'naskh', label: 'Naskh (texte arabe)' },
  { v: 'ruqaa', label: 'Ruqaa (calligraphie)' },
];

const MASKS: { v: Mask; label: string }[] = [
  { v: 'rect', label: 'Droit' }, { v: 'rounded', label: 'Arrondi' }, { v: 'arch', label: 'Arche' }, { v: 'stadium', label: 'Panneau' }, { v: 'circle', label: 'Cercle' },
];
const SHAPES: { v: ShapeKind; label: string }[] = [
  { v: 'rect', label: 'Rectangle' }, { v: 'card', label: 'Carte' }, { v: 'arch', label: 'Arche' }, { v: 'glow-arch', label: 'Panneau' }, { v: 'stadium', label: 'Pastille' }, { v: 'circle', label: 'Cercle' }, { v: 'line', label: 'Filet' },
];

export function Inspector() {
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const sel = page.elements.filter((e) => selection.includes(e.id));
  if (!sel.length) return <PageInspector />;
  const st = useEditor.getState();
  const ids = sel.map((e) => e.id);
  const one = sel.length === 1 ? sel[0] : null;
  const grouped = sel.some((e) => e.groupId);
  const up = (patch: Partial<El>) => st.update(ids, patch);
  return (
    <aside className="inspector" aria-label="Réglages de l’élément">
      <header className="ins-head">
        {one ? (
          <input className="ins-name" value={layerName(one)} onChange={(e) => st.update(one.id, { name: e.target.value })} aria-label="Nom du calque" />
        ) : (
          <strong>{sel.length} éléments</strong>
        )}
      </header>

      <section className="ins-sec">
        <h3>Disposition</h3>
        <div className="row">
          {(['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'] as const).map((a) => (
            <IconButton key={a} icon={`al-${a}`} label={`Aligner ${{ left: 'à gauche', hcenter: 'au centre', right: 'à droite', top: 'en haut', vcenter: 'au milieu', bottom: 'en bas' }[a]}${sel.length === 1 ? ' de la page' : ''}`} size={18} onClick={() => st.align(ids, a)} />
          ))}
        </div>
        <div className="row">
          <IconButton icon="front" label="Premier plan" size={18} onClick={() => st.arrange(ids, 'front')} />
          <IconButton icon="forward" label="Avancer" size={18} onClick={() => st.arrange(ids, 'forward')} />
          <IconButton icon="backward" label="Reculer" size={18} onClick={() => st.arrange(ids, 'backward')} />
          <IconButton icon="back" label="Arrière-plan" size={18} onClick={() => st.arrange(ids, 'back')} />
          {sel.length > 1 && !grouped ? <IconButton icon="group" label="Grouper (Ctrl+G)" size={18} onClick={() => st.group(ids)} /> : null}
          {grouped ? <IconButton icon="ungroup" label="Dissocier (Ctrl+Maj+G)" size={18} onClick={() => st.ungroup(ids)} /> : null}
        </div>
        {one ? (
          <div className="grid-num">
            <NumberField label="X" value={one.x} onChange={(v) => st.update(one.id, { x: v })} />
            <NumberField label="Y" value={one.y} onChange={(v) => st.update(one.id, { y: v })} />
            <NumberField label="L" value={one.w} onChange={(v) => st.update(one.id, one.type === 'component' ? { w: v, h: Math.round((v / one.baseW) * one.baseH) } : { w: Math.max(4, v) })} />
            {one.type !== 'text' ? <NumberField label="H" value={one.h} onChange={(v) => st.update(one.id, { h: Math.max(2, v) })} /> : <span />}
            <NumberField label="Rotation" value={one.rotation} onChange={(v) => st.update(one.id, { rotation: v })} />
          </div>
        ) : null}
        <Slider label="Opacité" min={0} max={1} step={0.05} value={sel[0].opacity} onChange={(v) => up({ opacity: v })} />
      </section>

      {one?.type === 'text' && <TextSettings el={one} tone={page.tone} />}
      {one?.type === 'image' && <ImageSettings el={one} />}
      {one?.type === 'shape' && <ShapeSettings el={one} tone={page.tone} />}
      {one?.type === 'icon' && <IconSettings el={one} tone={page.tone} />}
      {one?.type === 'motif' && <MotifSettings el={one} tone={page.tone} />}
      {one?.type === 'component' && <ComponentSettings el={one} tone={page.tone} />}

      <section className="ins-sec row">
        <button type="button" className="btn" onClick={() => st.duplicate(ids)}>Dupliquer</button>
        <button type="button" className="btn" onClick={() => st.update(ids, { locked: !sel[0].locked })}>{sel[0].locked ? 'Déverrouiller' : 'Verrouiller'}</button>
        <button type="button" className="btn danger" onClick={() => st.remove(ids)}>Supprimer</button>
      </section>
    </aside>
  );
}

function TextSettings({ el, tone }: { el: TextEl; tone: Tone }) {
  const st = useEditor.getState();
  const up = (p: Partial<TextEl>) => st.update(el.id, p);
  return (
    <section className="ins-sec">
      <h3>Texte</h3>
      <button type="button" className="btn wide" onClick={() => st.setEditing(el.id)}>Modifier le texte (double-clic)</button>
      <label className="field">Police
        <select value={el.font} onChange={(e) => up({ font: e.target.value as FontKey, dir: e.target.value === 'kufi' || e.target.value === 'naskh' || e.target.value === 'ruqaa' ? 'rtl' : el.dir })}>
          {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
        </select>
      </label>
      <Slider label="Taille" min={10} max={260} value={el.size} onChange={(v) => up({ size: v })} unit="px" />
      <div className="row">
        <label className="field small">Graisse
          <select value={el.weight} onChange={(e) => up({ weight: Number(e.target.value) })}>
            {[400, 500, 600, 700].map((w) => <option key={w} value={w}>{{ 400: 'Normal', 500: 'Moyen', 600: 'Demi-gras', 700: 'Gras' }[w]}</option>)}
          </select>
        </label>
        <div className="field small">Couleur <ColorPicker value={el.color} onChange={(c) => up({ color: c })} tone={tone} /></div>
        <div className="field small">Accent <ColorPicker value={el.accent} onChange={(c) => up({ accent: c })} tone={tone} label="Couleur des mots en accent" /></div>
      </div>
      <Segmented label="Alignement" value={el.align} onChange={(v) => up({ align: v })} options={[{ v: 'left', label: 'Gauche', icon: 'ta-left' }, { v: 'center', label: 'Centre', icon: 'ta-center' }, { v: 'right', label: 'Droite', icon: 'ta-right' }]} />
      <Segmented label="Sens d’écriture" value={el.dir} onChange={(v) => up({ dir: v })} options={[{ v: 'ltr', label: 'FR →' }, { v: 'rtl', label: '← AR' }, { v: 'auto', label: 'Auto' }]} />
      <Slider label="Interligne" min={0.7} max={2.4} step={0.05} value={el.lineHeight} onChange={(v) => up({ lineHeight: v })} />
      <Slider label="Espacement" min={-0.05} max={0.4} step={0.01} value={el.letterSpacing} onChange={(v) => up({ letterSpacing: v })} />
      <div className="checks">
        <label><input type="checkbox" checked={el.italic} onChange={(e) => up({ italic: e.target.checked })} /> Italique</label>
        <label><input type="checkbox" checked={el.upper} onChange={(e) => up({ upper: e.target.checked })} /> Majuscules</label>
        <label><input type="checkbox" checked={!!el.kicker} onChange={(e) => up({ kicker: e.target.checked, nowrap: e.target.checked || el.nowrap })} /> Trait doré avant</label>
        <label><input type="checkbox" checked={!!el.nowrap} onChange={(e) => up({ nowrap: e.target.checked })} /> Sur une ligne</label>
        <label><input type="checkbox" checked={!!el.box} onChange={(e) => up({ box: e.target.checked ? { border: '2px solid #c8a97e', radius: 999, padding: '16px 34px', background: 'rgba(255,255,255,0.6)' } : undefined })} /> Encadré (pastille)</label>
      </div>
    </section>
  );
}

function ImageSettings({ el }: { el: ImageEl }) {
  const st = useEditor.getState();
  const up = (p: Partial<ImageEl>) => st.update(el.id, p);
  return (
    <section className="ins-sec">
      <h3>Photo</h3>
      <label className="field">Forme du cadre
        <select value={el.mask} onChange={(e) => up({ mask: e.target.value as Mask })}>{MASKS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}</select>
      </label>
      <div className="checks"><label><input type="checkbox" checked={el.glow} onChange={(e) => up({ glow: e.target.checked })} /> Halo lumineux</label></div>
      <button type="button" className="btn wide" onClick={() => st.setCrop(el.id)}>Recadrer (double-clic)</button>
      <Slider label="Zoom" min={1} max={4} step={0.05} value={el.crop.zoom} onChange={(v) => up({ crop: { ...el.crop, zoom: v } })} />
      <Slider label="Horizontal" min={0} max={100} value={el.crop.x} onChange={(v) => up({ crop: { ...el.crop, x: v } })} unit="%" />
      <Slider label="Vertical" min={0} max={100} value={el.crop.y} onChange={(v) => up({ crop: { ...el.crop, y: v } })} unit="%" />
      <p className="sp-hint">Pour changer la photo : panneau Photos, cliquez sur une photo pendant que celle-ci est sélectionnée.</p>
    </section>
  );
}

function ShapeSettings({ el, tone }: { el: ShapeEl; tone: Tone }) {
  const st = useEditor.getState();
  const up = (p: Partial<ShapeEl>) => st.update(el.id, p);
  return (
    <section className="ins-sec">
      <h3>Forme</h3>
      <label className="field">Type
        <select value={el.shape} onChange={(e) => up({ shape: e.target.value as ShapeKind })}>{SHAPES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}</select>
      </label>
      <div className="row">
        <div className="field small">Remplissage <ColorPicker value={el.fill} onChange={(c) => up({ fill: c })} tone={tone} allowNone /></div>
        <div className="field small">Contour <ColorPicker value={el.stroke ?? 'transparent'} onChange={(c) => up({ stroke: c === 'transparent' ? undefined : c })} tone={tone} allowNone /></div>
      </div>
      {el.stroke ? <Slider label="Épaisseur" min={1} max={12} value={el.strokeWidth ?? 2} onChange={(v) => up({ strokeWidth: v })} unit="px" /> : null}
      {el.shape === 'rect' || el.shape === 'card' ? <Slider label="Arrondi" min={0} max={200} value={el.radius ?? 0} onChange={(v) => up({ radius: v })} unit="px" /> : null}
      <div className="checks"><label><input type="checkbox" checked={el.glow} onChange={(e) => up({ glow: e.target.checked })} /> Halo lumineux (comme les arches du cabinet)</label></div>
    </section>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (n: string) => void }) {
  return (
    <Popover trigger={(_, toggle) => (
      <button type="button" className="btn icon-pick" onClick={toggle}><span className="mini-ic" dangerouslySetInnerHTML={{ __html: iconSvg(value) }} /> {ICON_LABELS[value] ?? value}</button>
    )}>
      {(close) => (
        <div className="icon-pop">
          {ICON_NAMES.map((n) => (
            <button key={n} type="button" className={`ibtn${n === value ? ' on' : ''}`} title={ICON_LABELS[n] ?? n} onClick={() => { onChange(n); close(); }}>
              <span className="mini-ic" dangerouslySetInnerHTML={{ __html: iconSvg(n) }} />
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function IconSettings({ el, tone }: { el: IconEl; tone: Tone }) {
  const st = useEditor.getState();
  const up = (p: Partial<IconEl>) => st.update(el.id, p);
  return (
    <section className="ins-sec">
      <h3>Icône</h3>
      <IconPicker value={el.name} onChange={(n) => up({ name: n })} />
      <div className="row">
        <div className="field small">Couleur <ColorPicker value={el.color} onChange={(c) => up({ color: c })} tone={tone} /></div>
        <label className="checks"><span><input type="checkbox" checked={el.disc} onChange={(e) => up({ disc: e.target.checked })} /> Pastille dorée</span></label>
      </div>
    </section>
  );
}

function MotifSettings({ el, tone }: { el: MotifEl; tone: Tone }) {
  const st = useEditor.getState();
  const up = (p: Partial<MotifEl>) => st.update(el.id, p);
  const p = el.params ?? {};
  return (
    <section className="ins-sec">
      <h3>Motif</h3>
      {el.kind !== 'flag' ? <div className="field small">Couleur <ColorPicker value={el.color} onChange={(c) => up({ color: c })} tone={tone} /></div> : null}
      {el.kind === 'waves' ? (
        <>
          <Slider label="Nombre de lignes" min={4} max={40} value={p.n ?? 16} onChange={(v) => up({ params: { ...p, n: v } })} />
          <Slider label="Ondulation" min={0} max={200} value={p.amp ?? el.h * 0.07} onChange={(v) => up({ params: { ...p, amp: v } })} />
          <Slider label="Pente" min={-0.5} max={0.5} step={0.01} value={p.tilt ?? -0.12} onChange={(v) => up({ params: { ...p, tilt: v } })} />
          <Slider label="Épaisseur" min={0.5} max={5} step={0.1} value={el.strokeWidth ?? 1.6} onChange={(v) => up({ strokeWidth: v })} />
        </>
      ) : null}
      {el.kind === 'flag' || el.mask ? (
        <>
          <label className="field">Cadre
            <select value={el.mask ?? 'rect'} onChange={(e) => up({ mask: e.target.value as Mask })}>{MASKS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}</select>
          </label>
          <div className="checks"><label><input type="checkbox" checked={!!el.glow} onChange={(e) => up({ glow: e.target.checked })} /> Halo lumineux</label></div>
        </>
      ) : null}
    </section>
  );
}

function ComponentSettings({ el, tone }: { el: ComponentEl; tone: Tone }) {
  const st = useEditor.getState();
  const def = COMPONENTS[el.name];
  const setProp = (k: string, v: string) => {
    const props = { ...el.props, [k]: v };
    // La taille naturelle change avec le texte : on la remesure en gardant l'échelle
    const scale = el.w / el.baseW;
    const { w, h } = measureComponent(el.name, props, tone);
    st.update(el.id, { props, baseW: w, baseH: h, w: Math.round(w * scale), h: Math.round(h * scale) } as Partial<ComponentEl>);
  };
  return (
    <section className="ins-sec">
      <h3>{def.label}</h3>
      {def.fields.length === 0 ? <p className="sp-hint">Les coordonnées viennent de la fiche du cabinet (src/data/site.ts).</p> : null}
      {def.fields.map((f) =>
        f.type === 'icon' ? (
          <div key={f.k} className="field">{f.label} <IconPicker value={el.props[f.k] ?? def.defaults[f.k]} onChange={(n) => setProp(f.k, n)} /></div>
        ) : (
          <label key={f.k} className="field">{f.label}
            <input type="text" dir={f.type === 'ar' ? 'rtl' : 'auto'} value={el.props[f.k] ?? def.defaults[f.k] ?? ''} onChange={(e) => setProp(f.k, e.target.value)} />
          </label>
        ),
      )}
    </section>
  );
}

/** Page créée depuis un modèle : rappel du type (et de l'occasion) + bouton pour la régénérer. */
function SourceSection({ template, data }: { template: string; data: Record<string, string> }) {
  const type = typeOf(template);
  const occasion = template === 'fete' ? OCCASIONS[data.occasion] : undefined;
  return (
    <section className="ins-sec" data-source>
      <h3>Réglages de la publication</h3>
      <p className="ins-src">{type?.title ?? template}{occasion ? ` · ${occasion.label}` : ''}</p>
      <button type="button" className="btn wide" onClick={() => openWizard({ template, data, edit: true })}>
        <Icon name="sparkles" size={16} /> {template === 'fete' ? 'Changer l’occasion ou les textes' : 'Modifier les textes'}
      </button>
    </section>
  );
}

function PageInspector() {
  const page = usePage();
  const format = useEditor((s) => s.project.format);
  return (
    <aside className="inspector" aria-label="Réglages de la page">
      <header className="ins-head"><strong>Page</strong></header>
      {page.source ? <SourceSection key={page.id} template={page.source.template} data={page.source.data} /> : null}
      <section className="ins-sec">
        <p className="sp-hint">Cliquez sur un élément pour le modifier. Glissez sur la page pour en sélectionner plusieurs. Maj+clic pour ajouter à la sélection.</p>
        <button type="button" className="btn wide" disabled={!page.elements.length} onClick={() => {
          const name = prompt('Nom du modèle :', 'Mon modèle');
          if (name) saveMyTemplate({ id: nanoid(8), name, format, page: structuredClone(page) }).then(() => useEditor.getState().setStatus('Ajouté à « Mes modèles »'));
        }}>Enregistrer comme modèle</button>
      </section>
      <section className="ins-sec">
        <h3>Raccourcis</h3>
        <ul className="keys">
          <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> annuler · <kbd>Ctrl</kbd>+<kbd>Y</kbd> rétablir</li>
          <li><kbd>Ctrl</kbd>+<kbd>D</kbd> dupliquer · <kbd>Suppr</kbd> effacer</li>
          <li><kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copier / coller</li>
          <li><kbd>Ctrl</kbd>+<kbd>G</kbd> grouper · <kbd>Maj</kbd> pour ignorer la grille</li>
          <li>Flèches : déplacer (Maj = 10 px)</li>
          <li>Double-clic : écrire / recadrer</li>
        </ul>
      </section>
    </aside>
  );
}
