/** Fenêtres : « Mes créations » (espace d'équipe ou navigateur), volet Légende, bandeaux de synchronisation. */
import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../store/editor';
import {
  useProjectList, loadProjectById, deleteProject, restoreProject, duplicateProject, saveProject, remoteMeta,
  uploadLocalProjects, pendingLocalCount, keepMine, takeTheirs, saveMineAsCopy, forgetVersion,
} from '../store/persist';
import { useCloud, who } from '../store/cloud';
import { importProjectFile, exportProjectFile } from '../export/export';
import { FORMATS, type Format, type Project } from '../model/types';
import { nanoid } from 'nanoid';
import { Icon } from '../ui/Icon';
import { openWizard } from './NewPostWizard';
import { useAssistant } from '../ai/client';
import { IconButton } from '../ui/controls';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="modal-back" role="presentation" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-h"><h2>{title}</h2><IconButton icon="close" label="Fermer" onClick={onClose} /></header>
        {children}
      </div>
    </div>
  );
}

export function openProject(p: Project) {
  useEditor.getState().loadProject(p);
  useEditor.temporal.getState().clear();
  useCloud.setState({ current: remoteMeta(p.id), conflict: null });
}

const when = (t: number) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export function ProjectsDialog({ onClose }: { onClose: () => void }) {
  const cloud = useCloud((s) => s.enabled);
  const [trash, setTrash] = useState(false);
  const { list, err: listErr } = useProjectList(trash);
  const current = useEditor((s) => s.project.id);
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState('');
  useEffect(() => { if (cloud) pendingLocalCount().then(setPending).catch(() => setPending(0)); }, [cloud]);

  const aiBusy = useAssistant((s) => s.busy);
  const create = (f: Format) => {
    useEditor.getState().newProject(f); useEditor.temporal.getState().clear(); useCloud.setState({ current: null, conflict: null });
    if (useEditor.getState().panel !== 'templates') useEditor.getState().setPanel('templates');
    onClose();
    // La publication guidée n'existe que sur ordinateur et tablette (l'éditeur est masqué sur téléphone)
    if (!window.matchMedia('(max-width: 759px)').matches) openWizard();
  };
  const guard = async (fn: () => Promise<void>) => { setErr(''); try { await fn(); } catch (x) { setErr((x as Error).message); } };

  return (
    <Modal title={cloud ? 'Créations de l’équipe' : 'Mes créations'} onClose={onClose} wide>
      <div className="row">
        {(Object.keys(FORMATS) as Format[]).map((f) => (
          <button key={f} type="button" className="btn" disabled={aiBusy} onClick={() => create(f)}><Icon name="plus" size={16} /> {FORMATS[f].label}</button>
        ))}
        <span className="grow" />
        <button type="button" className="btn" disabled={aiBusy} onClick={() => file.current?.click()}><Icon name="file" size={16} /> Ouvrir un fichier projet</button>
        <button type="button" className="btn" onClick={() => guard(() => exportProjectFile(useEditor.getState().project))}><Icon name="download" size={16} /> Exporter la création ouverte</button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void guard(async () => { const p = await importProjectFile(f); forgetVersion(p.id); await saveProject(p); openProject(p); onClose(); });
        }} />
      </div>

      {cloud ? (
        <p className="sp-hint">
          Ces créations sont partagées avec toute l’équipe et enregistrées en ligne : vous les retrouvez sur n’importe quel appareil, après connexion.
        </p>
      ) : (
        <p className="sp-hint">Mode local : les créations sont enregistrées dans ce navigateur. Pour les retrouver ailleurs, exportez le fichier projet.</p>
      )}
      {cloud && pending > 0 ? (
        <div className="sp-warn row">
          <span>{pending} création(s) enregistrée(s) seulement dans ce navigateur.</span>
          <span className="grow" />
          <button type="button" className="btn" disabled={!!busy} onClick={() => guard(async () => {
            const r = await uploadLocalProjects((i, n) => setBusy(`Envoi ${i}/${n}…`));
            setBusy('');
            setPending(await pendingLocalCount());
            if (r.skipped) setErr(`${r.skipped} création(s) existaient déjà dans l’espace d’équipe et n’ont pas été remplacées.`);
          })}>{busy || 'Les envoyer dans l’espace d’équipe'}</button>
        </div>
      ) : null}
      {aiBusy ? <p className="sp-warn">L’assistant IA travaille sur la création ouverte : attendez qu’il ait fini pour en ouvrir ou en créer une autre.</p> : null}
      {err || listErr ? <p className="sp-warn">{err || listErr}</p> : null}

      {cloud ? (
        <div className="seg" role="tablist">
          <button type="button" className={!trash ? 'on' : ''} onClick={() => setTrash(false)}>Créations</button>
          <button type="button" className={trash ? 'on' : ''} onClick={() => setTrash(true)}>Corbeille (30 jours)</button>
        </div>
      ) : null}

      {list === null ? <p className="sp-hint">Chargement…</p> : list.length === 0 ? <p className="sp-hint">{trash ? 'La corbeille est vide.' : 'Aucune création pour l’instant.'}</p> : null}
      <div className="projects">
        {(list ?? []).map((p) => (
          <div key={p.id} className={`proj${p.id === current ? ' on' : ''}`}>
            <button type="button" className="proj-open" disabled={trash || aiBusy} onClick={() => guard(async () => { const full = await loadProjectById(p.id); if (full) { openProject(full); onClose(); } })}>
              <span className={`proj-thumb f-${p.format}`}>{p.thumb ? <img src={p.thumb} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}</span>
              <strong>{p.name}</strong>
              <small>{trash && p.deletedAt ? `Supprimée le ${when(p.deletedAt)}${p.deletedBy ? ` par ${who(p.deletedBy)}` : ''}` : `${when(p.updatedAt)}${p.updatedBy ? ` · ${who(p.updatedBy)}` : ''}`}</small>
              <small>{p.pages} page(s){p.createdBy && p.createdBy !== p.updatedBy ? ` · créée par ${who(p.createdBy)}` : ''}</small>
            </button>
            <div className="proj-actions">
              {trash ? (
                <IconButton icon="undo" label="Restaurer" size={16} onClick={() => guard(() => restoreProject(p.id))} />
              ) : (
                <>
                  <IconButton icon="dup" label="Dupliquer" size={16} onClick={() => guard(() => duplicateProject(p.id, nanoid(10)))} />
                  <IconButton icon="trash" label={cloud ? 'Mettre à la corbeille' : 'Supprimer'} size={16} disabled={p.id === current} onClick={() => {
                    if (confirm(cloud ? `Mettre « ${p.name} » à la corbeille ? (restaurable pendant 30 jours)` : `Supprimer « ${p.name} » ?`)) void guard(() => deleteProject(p.id));
                  }} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function CaptionDrawer({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project);
  const st = useEditor.getState();
  const [copied, setCopied] = useState(false);
  const full = [project.caption.fr, '', project.caption.darija, '', project.hashtags.join(' ')].join('\n').trim();
  return (
    <aside className="drawer" aria-label="Légende">
      <header className="sp-head"><h2>Légende</h2><IconButton icon="close" label="Fermer" onClick={onClose} size={18} /></header>
      <div className="sp-body">
        <label className="field">Date de publication conseillée<input type="date" value={project.date} onChange={(e) => st.setMeta({ date: e.target.value })} /></label>
        <label className="field">Légende (français)<textarea rows={8} value={project.caption.fr} onChange={(e) => st.setMeta({ caption: { ...project.caption, fr: e.target.value } })} /></label>
        <label className="field">Légende (darija)<textarea rows={6} dir="rtl" value={project.caption.darija} onChange={(e) => st.setMeta({ caption: { ...project.caption, darija: e.target.value } })} /></label>
        <label className="field">Hashtags<input type="text" value={project.hashtags.join(' ')} onChange={(e) => st.setMeta({ hashtags: e.target.value.split(/\s+/).filter(Boolean) })} /></label>
        <button type="button" className="btn primary wide" onClick={async () => {
          try { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
        }}>{copied ? 'Copiée ✓' : 'Copier la légende complète'}</button>
        <p className="sp-hint">À coller dans Instagram ou TikTok au moment de publier. Pas de prix, de promotion ni de promesse de résultat.</p>
      </div>
    </aside>
  );
}

/** Bandeaux : modification simultanée, session expirée, coupure réseau. */
export function SyncBanner() {
  const conflict = useCloud((s) => s.conflict);
  const expired = useCloud((s) => s.sessionExpired);
  const offline = useCloud((s) => s.offline);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  if (expired) {
    return (
      <div className="banner warn no-select" role="alert">
        <span>Votre session a expiré. Vos dernières modifications sont gardées dans cette page.</span>
        <button type="button" className="btn primary" onClick={() => window.location.reload()}>Se reconnecter</button>
      </div>
    );
  }
  if (conflict) {
    return (
      <div className="banner warn no-select" role="alert">
        <span><strong>{who(conflict.updatedBy)}</strong> a modifié cette création à {new Date(conflict.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} pendant que vous travailliez dessus.</span>
        <span className="grow" />
        <button type="button" className="btn" disabled={busy} onClick={() => run(takeTheirs)}>Prendre sa version</button>
        <button type="button" className="btn" disabled={busy} onClick={() => run(() => saveMineAsCopy(nanoid(10)))}>Garder la mienne en copie</button>
        <button type="button" className="btn primary" disabled={busy} onClick={() => run(keepMine)}>Garder la mienne</button>
      </div>
    );
  }
  if (offline) return <div className="banner no-select" role="status">Connexion interrompue : vos modifications seront enregistrées dès le retour du réseau.</div>;
  return null;
}
