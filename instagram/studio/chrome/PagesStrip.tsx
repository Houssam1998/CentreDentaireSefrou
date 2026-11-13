/** Bande du bas : pages (carrousel) réordonnables, zoom, zone visible du profil. */
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor } from '../store/editor';
import { PageThumb } from '../canvas/ElementView';
import type { Page } from '../model/types';
import { IconButton } from '../ui/controls';
import { Icon } from '../ui/Icon';

export function PagesStrip() {
  const pages = useEditor((s) => s.project.pages);
  const pageId = useEditor((s) => s.pageId);
  const format = useEditor((s) => s.project.format);
  const zoom = useEditor((s) => s.zoom);
  const showSafe = useEditor((s) => s.showSafe);
  const st = useEditor.getState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    st.movePage(pages.findIndex((p) => p.id === e.active.id), pages.findIndex((p) => p.id === e.over!.id));
  };
  const fitZoom = () => (window as unknown as { __zoom?: number }).__zoom ?? 0.4;
  return (
    <footer className="pages">
      <div className="pages-scroll">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={pages.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
          <ol className="pages-list" aria-label="Pages">
            {pages.map((p, i) => <PageItem key={p.id} page={p} index={i} active={p.id === pageId} format={format} single={pages.length === 1} />)}
          </ol>
        </SortableContext>
      </DndContext>
      <button type="button" className="add-page" onClick={() => st.addPage()} title="Ajouter une page vide"><Icon name="plus" size={22} /></button>
      </div>
      <IconButton icon="safe" label="Zone visible sur la grille du profil" active={showSafe} onClick={st.toggleSafe} size={18} />
      <div className="zoom">
        <IconButton icon="minus" label="Dézoomer" onClick={() => st.setZoom(Math.max(0.1, (zoom || fitZoom()) - 0.1))} size={16} />
        <button type="button" className="zoom-v" onClick={() => st.setZoom(0)} title="Ajuster à l’écran">{zoom ? `${Math.round(zoom * 100)} %` : 'Ajusté'}</button>
        <IconButton icon="plus" label="Zoomer" onClick={() => st.setZoom(Math.min(2, (zoom || fitZoom()) + 0.1))} size={16} />
      </div>
    </footer>
  );
}

function PageItem({ page, index, active, format, single }: { page: Page; index: number; active: boolean; format: 'post' | 'story' | 'square'; single: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id });
  const st = useEditor.getState();
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`page-item${active ? ' on' : ''}`}>
      <button type="button" className="page-btn" {...attributes} {...listeners} onClick={() => st.selectPage(page.id)} aria-label={`Page ${index + 1}`} aria-current={active}>
        <PageThumb page={page} format={format} width={format === 'story' ? 44 : 62} />
        <span className="page-n">{index + 1}</span>
      </button>
      {active ? (
        <div className="page-actions">
          <IconButton icon="dup" label="Dupliquer la page" size={14} onClick={() => st.duplicatePage(page.id)} />
          {!single ? <IconButton icon="trash" label="Supprimer la page" size={14} onClick={() => { if (!page.elements.length || confirm('Supprimer cette page ?')) st.deletePage(page.id); }} /> : null}
        </div>
      ) : null}
    </li>
  );
}
