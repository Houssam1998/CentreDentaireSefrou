/** Studio Instagram — éditeur libre façon Canva pour le Centre Dentaire Sefrou. */
import { useEffect, useState } from 'react';
import { useEditor } from './store/editor';
import { startAutosave, lastProjectId, loadProjectById } from './store/persist';
import { pageToPng } from './export/export';
import { Artboard } from './canvas/Artboard';
import { LeftPanel, PANELS } from './panels/Panels';
import { Inspector } from './chrome/Inspector';
import { ContextToolbar } from './chrome/ContextToolbar';
import { TopBar } from './chrome/TopBar';
import { PagesStrip } from './chrome/PagesStrip';
import { ProjectsDialog, CaptionDrawer, SyncBanner, openProject } from './chrome/Dialogs';
import { NewPostWizard } from './chrome/NewPostWizard';
import { detectCloud } from './store/cloud';
import { Icon } from './ui/Icon';

function useNarrow() {
  const q = '(max-width: 759px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

export function App() {
  const panel = useEditor((s) => s.panel);
  const [projects, setProjects] = useState(false);
  const [caption, setCaption] = useState(false);
  const [ready, setReady] = useState(false);
  const narrow = useNarrow();

  useEffect(() => {
    let stop: (() => void) | undefined;
    (async () => {
      await detectCloud();
      try {
        const id = await lastProjectId();
        const p = id ? await loadProjectById(id) : undefined;
        if (p) openProject(p);
      } catch { /* stockage indisponible : on démarre une création vide */ }
      stop = startAutosave((p) => pageToPng(p.pages[0], p.format, 0.18));
      setReady(true);
    })();
    return () => stop?.();
  }, []);

  return (
    <div className={`app${panel && !narrow ? ' with-panel' : ''}${narrow ? ' narrow' : ''}`}>
      <TopBar onOpenProjects={() => setProjects(true)} onOpenCaption={() => setCaption((c) => !c)} />
      {narrow ? (
        <p className="narrow-note">Pour modifier les créations, ouvrez le Studio sur un ordinateur ou une tablette. Ici, vous pouvez les consulter et les télécharger.</p>
      ) : (
        <nav className="rail" aria-label="Panneaux">
          {PANELS.map((p) => (
            <button key={p.id} type="button" className={`rail-btn${panel === p.id ? ' on' : ''}`} onClick={() => useEditor.getState().setPanel(p.id)} aria-pressed={panel === p.id}>
              <Icon name={p.icon} size={22} />
              <span>{p.label}</span>
            </button>
          ))}
        </nav>
      )}
      {panel && !narrow ? <LeftPanel id={panel} /> : null}
      <main className="center">
        <SyncBanner />
        {!narrow ? <ContextToolbar /> : null}
        {ready ? <Artboard /> : <div className="workspace" />}
        <PagesStrip />
      </main>
      {!narrow ? <Inspector /> : null}
      {caption ? <CaptionDrawer onClose={() => setCaption(false)} /> : null}
      {projects ? <ProjectsDialog onClose={() => setProjects(false)} /> : null}
      {!narrow ? <NewPostWizard /> : null}
    </div>
  );
}
