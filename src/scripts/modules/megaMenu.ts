/**
 * Desktop "Soins" mega-menu. One source of truth (`data-open`) driven by:
 * mouse hover (with a short close delay), click/Enter, Escape, outside click and focus leaving.
 */
export function initMegaMenu() {
  const root = document.querySelector<HTMLElement>('[data-mega]');
  const toggle = root?.querySelector<HTMLButtonElement>('[data-mega-toggle]');
  if (!root || !toggle) return;

  let closeTimer: number | undefined;

  const setOpen = (open: boolean) => {
    window.clearTimeout(closeTimer);
    root.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  // Hover only for real mice — on touch, the tap (click) toggles instead
  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') setOpen(true);
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    closeTimer = window.setTimeout(() => setOpen(false), 120);
  });

  // Mouse users already opened it by hovering, so a click must not close it again;
  // keyboard (Enter/Space) and touch taps toggle.
  toggle.addEventListener('click', (e) => {
    const isMouse = (e as PointerEvent).pointerType === 'mouse';
    setOpen(isMouse ? true : !root.hasAttribute('data-open'));
  });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) setOpen(false);
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.hasAttribute('data-open')) {
      setOpen(false);
      if (root.contains(document.activeElement)) toggle.focus();
    }
  });
  // Following a link inside the panel closes it immediately
  root.querySelectorAll('#mega-panel a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}
