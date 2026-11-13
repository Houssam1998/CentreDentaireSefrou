/** Barre du haut : projet, annuler / rétablir, format, ambiance, variantes, légende, téléchargement. */
import { useState } from 'react';
import { useStore } from 'zustand';
import { useEditor, usePage, undo, redo } from '../store/editor';
import { FORMATS, type Format, type Tone } from '../model/types';
import { variantsOf, surprise } from '../model/variants';
import { PageThumb } from '../canvas/ElementView';
import { downloadPage, downloadAllZip, exportProjectFile, checkProject, type Issue } from '../export/export';
import { Icon } from '../ui/Icon';
import { IconButton, Popover, Segmented } from '../ui/controls';
import { useCloud, who, logoutUrl } from '../store/cloud';
import { logo } from '../../brand/motifs.js';

export function TopBar({ onOpenProjects, onOpenCaption }: { onOpenProjects: () => void; onOpenCaption: () => void }) {
  const name = useEditor((s) => s.project.name);
  const format = useEditor((s) => s.project.format);
  const status = useEditor((s) => s.status);
  const page = usePage();
  const canUndo = useStore(useEditor.temporal, (t) => t.pastStates.length > 0);
  const canRedo = useStore(useEditor.temporal, (t) => t.futureStates.length > 0);
  const st = useEditor.getState();

  return (
    <header className="topbar">
      <div className="tb-brand" aria-hidden="true"><span className="tb-mark" dangerouslySetInnerHTML={{ __html: logo.mark }} /></div>
      <button type="button" className="btn ghost" onClick={onOpenProjects} title="Mes créations"><Icon name="folder" size={18} /><span className="lbl">Mes créations</span></button>
      <input className="tb-name" value={name} onChange={(e) => st.setName(e.target.value)} aria-label="Nom de la création" />
      <span className="sep" />
      <IconButton icon="undo" label="Annuler (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
      <IconButton icon="redo" label="Rétablir (Ctrl+Y)" onClick={redo} disabled={!canRedo} />
      <span className="sep" />
      <label className="tb-field">
        <span className="lbl">Format</span>
        <select value={format} onChange={(e) => st.setFormat(e.target.value as Format)}>
          {Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
        </select>
      </label>
      <Segmented<Tone>
        label="Ambiance"
        value={page.tone}
        onChange={(t) => st.setTone(t, true)}
        options={[{ v: 'light', label: 'Clair' }, { v: 'greige', label: 'Grège' }, { v: 'night', label: 'Soirée' }]}
      />
      <span className="tb-variants"><Variants /></span>
      <span className="grow" />
      <span className="status" role="status">{status}<LastEdit /></span>
      <button type="button" className="btn ghost tb-caption" onClick={onOpenCaption} title="Légende Instagram"><Icon name="caption" size={18} /><span className="lbl">Légende</span></button>
      <ExportMenu />
      <UserChip />
    </header>
  );
}

function Variants() {
  const page = usePage();
  const format = useEditor((s) => s.project.format);
  const [list, setList] = useState<ReturnType<typeof variantsOf>>([]);
  return (
    <Popover
      trigger={(_, toggle) => (
        <button type="button" className="btn ghost" disabled={!page.elements.length} onClick={() => { setList(variantsOf(page, format)); toggle(); }} title="Proposer des déclinaisons de cette page">
          <Icon name="sparkles" size={18} /><span className="lbl">Variantes</span>
        </button>
      )}
    >
      {(close) => (
        <div className="variants">
          <p className="pop-title">Cliquez sur une variante pour remplacer la page (Ctrl+Z pour revenir).</p>
          <div className="var-grid">
            {list.map((v) => (
              <button key={v.label} type="button" className="var" onClick={() => { useEditor.getState().replacePage(v.page); close(); }}>
                <PageThumb page={v.page} format={format} width={150} />
                <span>{v.label}</span>
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => setList(variantsOf(page, format))}>Recalculer</button>
            <button type="button" className="btn" onClick={() => { useEditor.getState().replacePage(surprise(page, format)); close(); }}><Icon name="dice" size={16} /> Surprise</button>
            <button type="button" className="btn" onClick={() => { useEditor.getState().insertPages([list[0]?.page ?? surprise(page, format)]); close(); }}>Ajouter comme nouvelle page</button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function ExportMenu() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);
  const [busy, setBusy] = useState(false);

  const guarded = (fn: () => Promise<void>) => {
    const found = checkProject(useEditor.getState().project);
    if (found.length) { setIssues(found); setPending(() => fn); return; }
    void run(fn);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    const st = useEditor.getState();
    try { await fn(); st.setStatus('Téléchargement prêt'); }
    catch (e) { st.setStatus(`Échec : ${(e as Error).message}`); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Popover
        align="right"
        trigger={(_, toggle) => (
          <button type="button" className="btn primary" onClick={toggle} disabled={busy} title="Télécharger">
            <Icon name="download" size={18} /><span className="lbl">{busy ? 'Préparation…' : 'Télécharger'}</span>
          </button>
        )}
      >
        {(close) => {
          const s = useEditor.getState();
          const idx = s.project.pages.findIndex((p) => p.id === s.pageId);
          return (
            <div className="menu">
              <button type="button" onClick={() => { close(); guarded(() => downloadPage(useEditor.getState().project, idx)); }}>
                <strong>Cette page (PNG)</strong><small>{FORMATS[s.project.format].w} × {FORMATS[s.project.format].h} px, prête pour Instagram</small>
              </button>
              <button type="button" onClick={() => { close(); guarded(() => downloadAllZip(useEditor.getState().project, (i, n) => useEditor.getState().setStatus(`Image ${i}/${n}…`))); }}>
                <strong>Toutes les pages (ZIP)</strong><small>{s.project.pages.length} image(s), pour un carrousel</small>
              </button>
              <hr />
              <button type="button" onClick={() => { close(); void run(() => exportProjectFile(useEditor.getState().project)); }}>
                <strong>Fichier projet (.json)</strong><small>Pour continuer sur un autre ordinateur (photos incluses)</small>
              </button>
            </div>
          );
        }}
      </Popover>
      {issues ? (
        <div className="modal-back" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="chk-t">
            <h2 id="chk-t">Avant de publier</h2>
            <p>Quelques points à vérifier (le code de déontologie interdit la publicité) :</p>
            <ul className="issues">{issues.map((i, k) => <li key={k}><strong>Page {i.page}</strong> : « {i.text} » {i.why}.</li>)}</ul>
            <div className="row end">
              <button type="button" className="btn" onClick={() => { setIssues(null); setPending(null); }}>Corriger</button>
              <button type="button" className="btn primary" onClick={() => { const fn = pending; setIssues(null); setPending(null); if (fn) void run(fn); }}>Télécharger quand même</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** « Modifiée par … à … » pour la création ouverte (espace d'équipe). */
function LastEdit() {
  const cur = useCloud((s) => s.current);
  const me = useCloud((s) => s.email);
  if (!cur || cur.updatedBy === me) return null;
  return <span className="last-edit"> · dernière modification : {who(cur.updatedBy)}, {new Date(cur.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>;
}

/** Personne connectée, déconnexion ; en local, rappelle où sont enregistrées les créations. */
function UserChip() {
  const enabled = useCloud((s) => s.enabled);
  const email = useCloud((s) => s.email);
  if (!enabled) return <span className="user-chip local" title="Les créations sont enregistrées dans ce navigateur">Local</span>;
  return (
    <Popover align="right" trigger={(_, toggle) => (
      <button type="button" className="user-chip" onClick={toggle} title={email}>
        <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
      </button>
    )}>
      {() => (
        <div className="menu">
          <p className="pop-title">Connecté(e) : {email}</p>
          <p className="sp-hint">Vos créations sont enregistrées dans l’espace d’équipe et visibles par toute l’équipe.</p>
          <a className="btn" href={logoutUrl}>Se déconnecter</a>
        </div>
      )}
    </Popover>
  );
}
