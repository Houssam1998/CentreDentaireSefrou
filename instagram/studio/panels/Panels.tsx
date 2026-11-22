/** Panneaux de gauche : Modèles, Éléments, Texte, Photos, Marque, Calques. */
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor, usePage, currentPage, freshPage, type PanelId } from '../store/editor';
import { applySlides } from '../model/applySlides';
import { upcoming, longDate, inDaysLabel } from '../model/calendar';
import { openWizard } from '../chrome/NewPostWizard';
import { AssistantPanel } from './AssistantPanel';
import { OccasionIcon } from '../ui/OccasionIcon';
import { TEXT_PRESETS, SHAPE_PRESETS, MOTIF_PRESETS, COMPONENT_ITEMS, ICON_NAMES, ICON_LABELS, iconSvg, type Preset } from '../model/presets';
import { presetById, dragData } from './dnd';
import { DND_TYPE, } from '../canvas/Artboard';
import { ElementView, PageThumb } from '../canvas/ElementView';
import { libraryKeys, LIBRARY, importPhoto, useAssetList, useImageUrl, deleteAsset } from '../store/assets';
import { useMyTemplates, deleteMyTemplate } from '../store/persist';
import { useCloud } from '../store/cloud';
import { plainText } from '../model/sanitize';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/controls';
import { FORMATS, type El, type ImageEl, type NewEl, type Tone } from '../model/types';
import { templates, renderSlide } from '../../templates/index.js';
import { posts, slidesOf } from '../../posts/posts.js';

export const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: 'templates', label: 'Modèles', icon: 'templates' },
  { id: 'elements', label: 'Éléments', icon: 'elements' },
  { id: 'text', label: 'Texte', icon: 'text' },
  { id: 'photos', label: 'Photos', icon: 'photos' },
  { id: 'brand', label: 'Marque', icon: 'brand' },
  { id: 'layers', label: 'Calques', icon: 'layers' },
  { id: 'assistant', label: 'Assistant IA', icon: 'sparkles' },
];

export function LeftPanel({ id }: { id: PanelId }) {
  const title = PANELS.find((p) => p.id === id)?.label;
  return (
    <aside className="side-panel" aria-label={title}>
      <header className="sp-head">
        <h2>{title}</h2>
        <IconButton icon="close" label="Fermer le panneau" onClick={() => useEditor.getState().setPanel(null)} size={18} />
      </header>
      <div className="sp-body">
        {id === 'templates' && <TemplatesPanel />}
        {id === 'elements' && <ElementsPanel />}
        {id === 'text' && <TextPanel />}
        {id === 'photos' && <PhotosPanel />}
        {id === 'brand' && <BrandPanel />}
        {id === 'layers' && <LayersPanel />}
        {id === 'assistant' && <AssistantPanel />}
      </div>
    </aside>
  );
}

const Section = ({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) => (
  <section className="sp-sec">
    <h3>{title}{hint ? <small> · {hint}</small> : null}</h3>
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/* Ajout d'éléments : clic = au centre, glisser = à l'endroit voulu     */

function addPreset(id: string) {
  const st = useEditor.getState();
  const els = presetById(id, currentPage().tone);
  if (!els) return;
  const ids = st.add(els);
  if (ids.length > 1) st.group(ids);
}

function Draggable({ id, label, children, className = '' }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`tile ${className}`}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData(DND_TYPE, dragData({ kind: 'preset', id })); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={() => addPreset(id)}
      title={`${label} — cliquer pour ajouter, ou glisser sur la page`}
    >
      {children}
      <span className="tile-l">{label}</span>
    </button>
  );
}

/** Aperçu miniature d'éléments (rendu réel). */
const PresetPreview = memo(function PresetPreview({ els, tone, box = 92 }: { els: NewEl[]; tone: Tone; box?: number }) {
  const minX = Math.min(...els.map((e) => e.x ?? 0)), minY = Math.min(...els.map((e) => e.y ?? 0));
  const W = Math.max(...els.map((e) => (e.x ?? 0) + e.w)) - minX, H = Math.max(...els.map((e) => (e.y ?? 0) + e.h)) - minY;
  const s = Math.min(box / W, box / H, 1);
  return (
    <div className="pv" style={{ width: box, height: box }}>
      <div className="ig free pv-page" data-tone={tone} style={{ width: W, height: H, transform: `scale(${s})` }}>
        {els.map((e, i) => (
          <ElementView key={i} el={{ rotation: 0, opacity: 1, ...e, id: `pv${i}`, x: (e.x ?? 0) - minX, y: (e.y ?? 0) - minY } as El} />
        ))}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Modèles                                                             */

/** Rendu HTML d'un modèle, à l'échelle, dessiné seulement quand il devient visible. */
export const SlideThumb = memo(function SlideThumb({ slide, width = 128, eager = false }: { slide: Record<string, unknown>; width?: number; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(eager);
  useEffect(() => {
    if (eager) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: '200px' });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [eager]);
  const tall = (templates as Record<string, { size: string }>)[slide.template as string]?.size === 'tall';
  const H = tall ? 1920 : 1350;
  const s = width / 1080;
  return (
    <div ref={ref} className="thumb" style={{ width, height: H * s }}>
      {show ? <div style={{ transform: `scale(${s})`, transformOrigin: '0 0', width: 1080, height: H }} dangerouslySetInnerHTML={{ __html: renderSlide(slide) }} /> : null}
    </div>
  );
});

/** Les deux prochaines occasions, avec un bouton pour préparer la publication. */
function UpcomingOccasions() {
  const next = useMemo(() => upcoming(2), []);
  if (!next.length) return null;
  return (
    <Section title="Prochaines occasions">
      <ul className="sp-occ">
        {next.map((u) => (
          <li key={u.key}>
            <OccasionIcon occasion={u.key} />
            <span className="grow"><strong>{u.label}</strong><small>{longDate(u.date)}{u.estimated ? ' (estimée)' : ''} · {inDaysLabel(u.inDays)}</small></span>
            <button type="button" className="btn" onClick={() => openWizard({ template: 'fete', occasion: u.key })}>Préparer</button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TemplatesPanel() {
  const mine = useMyTemplates();
  const format = useEditor((s) => s.project.format);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => { if (busy) return; setBusy(true); try { await fn(); } finally { setBusy(false); } };
  return (
    <div className={busy ? 'busy' : ''}>
      <button type="button" className="btn primary wide" onClick={() => openWizard()} data-guided>
        <Icon name="sparkles" size={16} /> Nouvelle publication guidée
      </button>
      <UpcomingOccasions />
      <p className="sp-hint">Ou cliquez sur un modèle : il s’ajoute comme nouvelle page (ou remplit la page vide). Tout reste ensuite modifiable.</p>
      {mine.length ? (
        <Section title="Mes modèles">
          <div className="grid2">
            {mine.map((t) => (
              <div key={t.id} className="tpl">
                <button type="button" className="tpl-btn" onClick={() => run(async () => {
                  const st = useEditor.getState();
                  if (currentPage().elements.length === 0) st.replacePage(freshPage(t.page)); else st.insertPages([freshPage(t.page)]);
                })} title={t.name}>
                  <PageThumb page={t.page} format={t.format} width={128} />
                  <span className="tile-l">{t.name}</span>
                </button>
                <button type="button" className="tpl-del" title="Supprimer ce modèle" onClick={() => { if (confirm(`Supprimer le modèle « ${t.name} » ?`)) deleteMyTemplate(t.id); }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="Modèles" hint="13 mises en page">
        <div className="grid2">
          {Object.entries(templates as Record<string, { label: string; size: string }>).map(([k, t]) => (
            <button key={k} type="button" className={`tpl-btn${(t.size === 'tall') !== (format === 'story') ? ' other-format' : ''}`} onClick={() => run(() => applySlides([{ template: k }]))} title={t.label}>
              <SlideThumb slide={{ template: k }} />
              <span className="tile-l">{t.label}{t.size === 'tall' ? ' · story' : ''}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Publications prêtes" hint="textes rédigés">
        <div className="grid2">
          {(posts as { id: string; date: string; slides?: unknown[] }[]).map((p) => {
            const sl = slidesOf(p) as Record<string, unknown>[];
            return (
              <button key={p.id} type="button" className="tpl-btn" onClick={() => run(() => applySlides(sl, p as never))} title={p.id}>
                <SlideThumb slide={sl[0]} />
                <span className="tile-l">{p.id.replace(/^\d+-/, '').replace(/-/g, ' ')}{sl.length > 1 ? ` · ${sl.length} pages` : ''}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Éléments                                                            */

function PresetGrid({ list, prefix }: { list: Preset[]; prefix: string }) {
  const tone = usePage().tone;
  return (
    <div className="grid3">
      {list.map((p) => (
        <Draggable key={p.id} id={`${prefix}:${p.id}`} label={p.label}>
          <PresetPreview els={p.make()} tone={tone} />
        </Draggable>
      ))}
    </div>
  );
}

function ElementsPanel() {
  const [q, setQ] = useState('');
  const tone = usePage().tone;
  const list = ICON_NAMES.filter((n) => !q || n.includes(q.toLowerCase()) || (ICON_LABELS[n] ?? '').includes(q.toLowerCase()));
  return (
    <>
      <Section title="Formes"><PresetGrid list={SHAPE_PRESETS} prefix="shape" /></Section>
      <Section title="Motifs et fêtes"><PresetGrid list={MOTIF_PRESETS} prefix="motif" /></Section>
      <Section title="Icônes" hint="clic : icône, Maj+clic : pastille">
        <label className="search">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Chercher : dent, brosse, horloge…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="grid4">
          {list.map((n) => (
            <button
              key={n}
              type="button"
              className="tile icon-tile"
              draggable
              onDragStart={(e) => e.dataTransfer.setData(DND_TYPE, dragData({ kind: 'preset', id: `icon${e.shiftKey ? '-disc' : ''}:${n}` }))}
              onClick={(e) => addPreset(`icon${e.shiftKey ? '-disc' : ''}:${n}`)}
              title={`${ICON_LABELS[n] ?? n} — Maj+clic pour une pastille dorée`}
            >
              <span className="ig free icon-pv" data-tone={tone} dangerouslySetInnerHTML={{ __html: iconSvg(n) }} />
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Texte                                                               */

function TextPanel() {
  const tone = usePage().tone;
  return (
    <>
      <p className="sp-hint">Double-cliquez sur un texte de la page pour l’écrire. Sélectionnez un mot puis « Accent » pour le mettre en couleur.</p>
      <div className="text-list">
        {TEXT_PRESETS.map((p) => (
          <Draggable key={p.id} id={`text:${p.id}`} label={p.label} className="text-tile">
            <PresetPreview els={p.make()} tone={tone} box={250} />
          </Draggable>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */

function placePhoto(src: string) {
  const st = useEditor.getState();
  const sel = currentPage().elements.filter((e) => st.selection.includes(e.id) && e.type === 'image');
  if (sel.length) { st.update(sel.map((e) => e.id), { src } as Partial<ImageEl>); st.setStatus('Photo remplacée'); return; }
  st.add({ type: 'image', src, w: 560, h: 700, mask: 'rounded', glow: false, crop: { x: 50, y: 50, zoom: 1 } } as NewEl);
}

function PhotoTile({ src, onDelete }: { src: string; onDelete?: () => void }) {
  const url = useImageUrl(src);
  return (
    <div className="ph">
      <button
        type="button"
        className="ph-btn"
        draggable
        onDragStart={(e) => e.dataTransfer.setData(DND_TYPE, dragData({ kind: 'photo', src }))}
        onClick={() => placePhoto(src)}
        title="Cliquer pour ajouter (ou remplacer la photo sélectionnée), ou glisser sur un cadre"
      >
        {url ? <img src={url} alt="" loading="lazy" /> : null}
      </button>
      {onDelete ? <button type="button" className="tpl-del" title="Supprimer cette photo" onClick={onDelete}><Icon name="trash" size={14} /></button> : null}
    </div>
  );
}

function PhotosPanel() {
  const assets = useAssetList();
  const cloud = useCloud((s) => s.enabled);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try { for (const f of [...files]) if (f.type.startsWith('image/')) placePhoto(await importPhoto(f)); }
    finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" className="btn primary wide" onClick={() => input.current?.click()} disabled={busy}>
        <Icon name="upload" size={18} /> {busy ? 'Import…' : 'Importer des photos'}
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      <p className="sp-hint">Vous pouvez aussi glisser vos fichiers directement sur la page. Une photo sélectionnée est remplacée au clic. Double-clic sur une photo pour la recadrer.</p>
      <p className="sp-warn">Les personnes des photos ci-dessous ont donné leur accord. Pour toute nouvelle photo d’un patient ou de l’équipe, demandez le leur avant de publier.</p>
      {assets.length ? (
        <Section title={cloud ? 'Photos de l’équipe' : 'Vos photos'}>
          <div className="grid3">{assets.map((a) => <PhotoTile key={a} src={a} onDelete={() => { if (confirm(cloud ? 'Supprimer cette photo pour toute l’équipe ? Les créations qui l’utilisent ne l’afficheront plus.' : 'Supprimer cette photo de ce navigateur ?')) deleteAsset(a); }} />)}</div>
        </Section>
      ) : null}
      <Section title="Photos du cabinet">
        <div className="grid3">{libraryKeys().filter((k) => k.startsWith('clinic/')).map((k) => <PhotoTile key={k} src={k} />)}</div>
      </Section>
      <Section title="Cas cliniques" hint="patients consentants">
        <div className="grid3">{libraryKeys().filter((k) => k.startsWith('cases/')).map((k) => <PhotoTile key={k} src={k} />)}</div>
      </Section>
      <Section title="Illustrations" hint="à présenter comme telles">
        <div className="grid3">{libraryKeys().filter((k) => !k.startsWith('clinic/') && !k.startsWith('cases/') && LIBRARY[k]).map((k) => <PhotoTile key={k} src={k} />)}</div>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Marque                                                              */

const TONES: { v: Tone; label: string }[] = [
  { v: 'light', label: 'Clair' },
  { v: 'greige', label: 'Grège' },
  { v: 'night', label: 'Soirée' },
];

function BrandPanel() {
  const page = usePage();
  const tone = page.tone;
  const format = useEditor((s) => s.project.format);
  const selection = useEditor((s) => s.selection);
  const selectedImage = page.elements.find((e) => selection.includes(e.id) && e.type === 'image') as ImageEl | undefined;
  return (
    <>
      <Section title="Ambiance" hint="toutes les pages">
        <div className="tone-row">
          {TONES.map((t) => (
            <button key={t.v} type="button" className={`tone-card${tone === t.v ? ' on' : ''}`} onClick={() => useEditor.getState().setTone(t.v, true)}>
              <span className="ig tone-pv" data-tone={t.v} />
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn wide" onClick={() => useEditor.getState().setTone(TONES[(TONES.findIndex((t) => t.v === tone) + 1) % 3].v, false)}>
          Changer seulement cette page
        </button>
      </Section>
      <Section title="Fond de la page">
        <div className="row-wrap">
          <button type="button" className="btn" onClick={() => useEditor.getState().setBackground({ kind: 'tone' })}>Fond de l’ambiance</button>
          {['#faf8f4', '#e6e0d7', '#0f2226', '#0f6e77', '#ffffff'].map((c) => (
            <button key={c} type="button" className="swatch-btn" title={`Fond ${c}`} onClick={() => useEditor.getState().setBackground({ kind: 'color', color: c })}>
              <span className="swatch" style={{ background: c }} />
            </button>
          ))}
        </div>
        <button type="button" className="btn wide" disabled={!selectedImage} onClick={() => {
          if (!selectedImage) return;
          const st = useEditor.getState();
          st.setBackground({ kind: 'image', image: selectedImage.src, overlay: 0.35 });
          st.remove([selectedImage.id]);
        }}>
          Mettre la photo sélectionnée en fond
        </button>
        {page.background.kind === 'image' ? (
          <label className="slider">
            <span className="slider-l">Assombrir</span>
            <input type="range" min={0} max={0.9} step={0.05} value={page.background.overlay ?? 0.35} onChange={(e) => useEditor.getState().setBackground({ ...page.background, overlay: Number(e.target.value) })} />
          </label>
        ) : null}
      </Section>
      <Section title="Logo, contacts et badges">
        <div className="comp-list">
          {COMPONENT_ITEMS.map((c) => (
            <Draggable key={c.id} id={`comp:${c.id}`} label={c.label} className="comp-tile">
              <CompPreview id={`comp:${c.id}`} tone={tone} />
            </Draggable>
          ))}
        </div>
      </Section>
      <p className="sp-hint">Format actuel : {FORMATS[format].label}.</p>
    </>
  );
}

const CompPreview = memo(function CompPreview({ id, tone }: { id: string; tone: Tone }) {
  const els = presetById(id, tone);
  return els ? <PresetPreview els={els} tone={tone} box={250} /> : null;
});

/* ------------------------------------------------------------------ */
/* Calques                                                             */

const TYPE_LABEL: Record<string, string> = { text: 'Texte', image: 'Photo', shape: 'Forme', icon: 'Icône', motif: 'Motif', component: 'Bloc' };
export const layerName = (e: El) => e.name || (e.type === 'text' ? plainText(e.html).slice(0, 30) : TYPE_LABEL[e.type]);

function LayersPanel() {
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ordered = [...page.elements].reverse(); // le plus haut en premier
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const to = page.elements.findIndex((x) => x.id === e.over!.id);
    useEditor.getState().reorderTo(String(e.active.id), to);
  };
  if (!page.elements.length) return <p className="sp-hint">La page est vide.</p>;
  return (
    <>
      <p className="sp-hint">Glissez pour changer l’ordre (en haut = au premier plan).</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ul className="layers">
            {ordered.map((e) => <LayerRow key={e.id} el={e} selected={selection.includes(e.id)} />)}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

function LayerRow({ el, selected }: { el: El; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: el.id });
  const st = useEditor.getState();
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`layer${selected ? ' on' : ''}${el.hidden ? ' off' : ''}`}>
      <button type="button" className="layer-main" {...attributes} {...listeners} onClick={(e) => st.select([el.id], e.shiftKey)}>
        <span className="layer-type">{TYPE_LABEL[el.type]}</span>
        <span className="layer-name">{layerName(el)}</span>
        {el.groupId ? <span className="layer-g" title="Groupé">G</span> : null}
      </button>
      <IconButton icon={el.hidden ? 'eyeoff' : 'eye'} label={el.hidden ? 'Afficher' : 'Masquer'} size={16} onClick={() => st.update(el.id, { hidden: !el.hidden })} />
      <IconButton icon={el.locked ? 'lock' : 'unlock'} label={el.locked ? 'Déverrouiller' : 'Verrouiller'} size={16} active={el.locked} onClick={() => st.update(el.id, { locked: !el.locked })} />
    </li>
  );
}
