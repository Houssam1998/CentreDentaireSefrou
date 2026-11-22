/**
 * « Nouvelle publication guidée » : 1. choisir le type (et l'occasion pour une fête), 2. remplir les champs
 * avec un aperçu en direct, 3. créer la page. Sert aussi à modifier une page créée ainsi (page.source).
 */
import { useMemo, useState } from 'react';
import { create } from 'zustand';
import { useEditor, blankProject } from '../store/editor';
import { applySlides, regeneratePage } from '../model/applySlides';
import { CATEGORIES, TEMPLATES, typeOf, type TemplateField } from '../model/postTypes';
import { upcoming, nextDate, longDate, inDaysLabel, isoDay } from '../model/calendar';
import { OCCASIONS, occasionFields, usesBig } from '../../templates/occasions.js';
import { OccasionIcon } from '../ui/OccasionIcon';
import { photos } from '../../brand/photos.js';
import { SlideThumb } from '../panels/Panels';
import { Modal } from './Dialogs';
import { Icon } from '../ui/Icon';

export interface WizardInit {
  /** Type déjà choisi : on ouvre directement le formulaire. */
  template?: string;
  /** Occasion déjà choisie (modèle Fête). */
  occasion?: string;
  /** Champs déjà remplis (modification d'une page existante). */
  data?: Record<string, string>;
  /** Modification de la page affichée au lieu d'en créer une nouvelle. */
  edit?: boolean;
}

export const useWizard = create<{ init: WizardInit | null }>(() => ({ init: null }));
export const openWizard = (init: WizardInit = {}) => useWizard.setState({ init });
const closeWizard = () => useWizard.setState({ init: null });

export function NewPostWizard() {
  const init = useWizard((s) => s.init);
  return init ? <Wizard init={init} /> : null;
}

interface Meta {
  caption: { fr: string; darija: string };
  hashtags: string[];
  date: string;
  name: string;
}

const BASE_TAGS = blankProject().hashtags;
const PHOTO_KEYS = Object.keys(photos as Record<string, string>).sort();

/** Champs + légende pré-remplis pour un type (et une occasion). */
function prefill(template: string, occasion?: string): { data: Record<string, string>; meta: Meta | null } {
  const data = { ...TEMPLATES[template].defaults };
  if (template !== 'fete') return { data, meta: null };
  const key = occasion && occasion in OCCASIONS ? occasion : 'logo';
  const next = nextDate(key);
  const o = OCCASIONS[key];
  Object.assign(data, occasionFields(key, next?.date.getFullYear()));
  const publishOn = next ? new Date(next.date.getTime() - (o.publishBefore ?? 0) * 86_400_000) : null;
  return {
    data,
    meta: {
      caption: { ...o.caption },
      hashtags: [...new Set([...BASE_TAGS, ...o.hashtags])],
      date: publishOn ? isoDay(publishOn) : useEditor.getState().project.date,
      name: `${o.label}${next ? ` ${next.date.getFullYear()}` : ''}`,
    },
  };
}

function Wizard({ init }: { init: WizardInit }) {
  const [template, setTemplate] = useState<string | null>(init.template ?? null);
  const [data, setData] = useState<Record<string, string>>(() => {
    if (!init.template) return {};
    return init.data ? { ...TEMPLATES[init.template].defaults, ...init.data } : prefill(init.template, init.occasion).data;
  });
  const [meta, setMeta] = useState<Meta | null>(() => {
    if (!init.template || init.template !== 'fete') return null;
    if (init.edit) {
      const p = useEditor.getState().project;
      return { caption: { ...p.caption }, hashtags: [...p.hashtags], date: p.date, name: p.name };
    }
    return prefill(init.template, init.occasion).meta;
  });
  const [busy, setBusy] = useState(false);

  const choose = (t: string, occasion?: string) => {
    const p = prefill(t, occasion);
    setTemplate(t);
    setData(p.data);
    setMeta(p.meta);
  };

  const submit = async () => {
    if (!template || busy) return;
    setBusy(true);
    try {
      const st = useEditor.getState();
      if (init.edit) {
        if (!confirm('La page affichée va être recréée avec ces réglages. Les retouches faites à la main sur cette page seront remplacées (Ctrl+Z pour revenir en arrière).')) return;
        await regeneratePage(template, data);
        if (meta) st.setMeta({ caption: meta.caption, hashtags: meta.hashtags, date: meta.date });
      } else {
        await applySlides([{ template, ...data }], meta ? { caption: meta.caption, hashtags: meta.hashtags, date: meta.date, name: meta.name } : undefined);
      }
      closeWizard();
    } finally {
      setBusy(false);
    }
  };

  const title = init.edit ? 'Réglages de la publication' : 'Nouvelle publication';
  return (
    <Modal title={title} onClose={closeWizard} wide>
      {template ? (
        <Details
          template={template}
          data={data}
          setData={setData}
          meta={meta}
          setMeta={setMeta}
          onBack={init.edit ? undefined : () => setTemplate(null)}
          onSubmit={submit}
          busy={busy}
          edit={!!init.edit}
        />
      ) : (
        <TypeStep onChoose={choose} />
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 1 : type de publication                                        */

function TypeStep({ onChoose }: { onChoose: (template: string, occasion?: string) => void }) {
  const next = useMemo(() => upcoming(3), []);
  const format = useEditor((s) => s.project.format);
  return (
    <div className="wiz">
      <p className="sp-hint">Choisissez le type de publication. Les textes proposés restent modifiables, et tout reste ajustable ensuite dans l’éditeur.</p>
      {next.length ? (
        <section className="wiz-sec">
          <h3>Prochaines occasions</h3>
          <div className="wiz-next">
            {next.map((u) => (
              <button key={u.key} type="button" className="wiz-occ" onClick={() => onChoose('fete', u.key)} data-occasion={u.key}>
                <OccasionIcon occasion={u.key} size={30} />
                <span className="wiz-occ-text">
                  <strong>{u.label}</strong>
                  <small>{longDate(u.date)}{u.estimated ? ' (estimée)' : ''} · {inDaysLabel(u.inDays)}</small>
                </span>
                <span className="btn primary">Préparer</span>
              </button>
            ))}
          </div>
          {next.some((u) => u.estimated) ? <p className="sp-hint">Dates « estimées » : calendrier hégirien Umm al-Qura. Au Maroc, la fête tombe souvent un jour plus tard : à confirmer selon l’observation du croissant.</p> : null}
        </section>
      ) : null}
      {CATEGORIES.map((c) => (
        <section key={c.id} className="wiz-sec">
          <h3>{c.title}</h3>
          <div className="wiz-types">
            {c.types.map((t) => {
              const tall = TEMPLATES[t.template].size === 'tall';
              return (
                <button key={t.template} type="button" className="wiz-type" onClick={() => onChoose(t.template)} data-template={t.template}>
                  <SlideThumb slide={{ template: t.template }} width={96} />
                  <span>
                    <strong>{t.title}</strong>
                    <small>{t.help}</small>
                    {tall !== (format === 'story') ? <small className="wiz-warn">Format {tall ? 'story' : 'publication'}</small> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div className="row end">
        <button type="button" className="btn ghost" onClick={closeWizard}>Commencer avec une page vierge</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 2 : champs + aperçu                                            */

function Details({ template, data, setData, meta, setMeta, onBack, onSubmit, busy, edit }: {
  template: string;
  data: Record<string, string>;
  setData: (d: Record<string, string>) => void;
  meta: Meta | null;
  setMeta: (m: Meta | null) => void;
  onBack?: () => void;
  onSubmit: () => void;
  busy: boolean;
  edit: boolean;
}) {
  const def = TEMPLATES[template];
  const type = typeOf(template);
  const set = (k: string, v: string) => {
    if (template === 'fete' && k === 'occasion') {
      // Changer d'occasion pré-remplit tous les textes du visuel et la légende
      const p = prefill('fete', v);
      setData({ ...p.data, signature: data.signature || p.data.signature });
      setMeta(p.meta);
      return;
    }
    setData({ ...data, [k]: v });
  };
  const slide = useMemo(() => ({ template, ...data }), [template, data]);
  const note = template === 'fete' ? OCCASIONS[data.occasion]?.note : undefined;

  return (
    <div className="wiz">
      <div className="row">
        {onBack ? <button type="button" className="btn ghost" onClick={onBack}><Icon name="undo" size={16} /> Autre type</button> : null}
        <strong className="wiz-title">{type?.title ?? def.label}</strong>
        {type ? <span className="sp-hint">{type.help}</span> : null}
      </div>
      <div className="wiz-grid">
        <form className="wiz-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          {def.fields
            .filter((f) => !(template === 'fete' && f.k === 'big' && !usesBig(data.occasion)))
            .map((f) => <FieldInput key={f.k} field={f} value={data[f.k] ?? ''} onChange={(v) => set(f.k, v)} />)}
          {note ? <p className="sp-warn">{note}</p> : null}
          {meta ? (
            <fieldset className="wiz-caption">
              <legend>Légende Instagram</legend>
              <label className="field">Légende (français)<textarea rows={4} value={meta.caption.fr} onChange={(e) => setMeta({ ...meta, caption: { ...meta.caption, fr: e.target.value } })} /></label>
              <label className="field">Légende (darija)<textarea rows={3} dir="rtl" value={meta.caption.darija} onChange={(e) => setMeta({ ...meta, caption: { ...meta.caption, darija: e.target.value } })} /></label>
              <label className="field">Hashtags<input type="text" value={meta.hashtags.join(' ')} onChange={(e) => setMeta({ ...meta, hashtags: e.target.value.split(/\s+/).filter(Boolean) })} /></label>
              <label className="field">Date de publication conseillée<input type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} /></label>
            </fieldset>
          ) : null}
          <p className="sp-hint">Textes arabes et darija, et tout texte médical : à faire relire par le Dr El Omari avant publication.</p>
        </form>
        <div className="wiz-preview">
          <SlideThumb slide={slide} width={300} eager />
          <button type="button" className="btn primary wide" disabled={busy} onClick={onSubmit}>
            <Icon name={edit ? 'check' : 'plus'} size={16} /> {busy ? 'Préparation…' : edit ? 'Mettre à jour la page' : 'Créer la publication'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: TemplateField; value: string; onChange: (v: string) => void }) {
  const label = field.label.replace(/ — \*mot\* = accent/, '');
  if (field.type === 'select' || field.type === 'photo') {
    const options = field.type === 'photo' ? Object.fromEntries(PHOTO_KEYS.map((k) => [k, k.replace(/^clinic\//, 'Cabinet · ')])) : field.options ?? {};
    return (
      <label className="field">{label}
        <select value={value} onChange={(e) => onChange(e.target.value)} name={field.k}>
          {value && !(value in options) ? <option value={value}>{value}</option> : null}
          {Object.entries(options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === 'text') {
    return <label className="field">{label}<input type="text" name={field.k} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
  }
  const ar = field.type === 'ar';
  const rows = Math.min(8, Math.max(ar ? 2 : 3, value.split('\n').length + 1));
  return (
    <label className="field">{label}
      <textarea name={field.k} rows={rows} dir={ar ? 'rtl' : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
