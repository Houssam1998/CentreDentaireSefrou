/**
 * Before/after comparison sliders. The native range input provides keyboard and
 * touch support; we mirror its value into a CSS variable that drives the clip.
 * Cases with several views (smile / close-up) get toggle buttons.
 */
export function initBeforeAfter() {
  document.querySelectorAll<HTMLElement>('[data-compare]').forEach((root) => {
    const input = root.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) return;
    const sync = () => root.style.setProperty('--pos', `${input.value}%`);
    input.addEventListener('input', sync);
    sync();
  });

  document.querySelectorAll<HTMLElement>('[data-case]').forEach((figure) => {
    const buttons = figure.querySelectorAll<HTMLButtonElement>('[data-case-view]');
    const panels = figure.querySelectorAll<HTMLElement>('[data-case-panel]');
    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        const view = btn.dataset.caseView;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        panels.forEach((p) => (p.hidden = p.dataset.casePanel !== view));
      }),
    );
  });
}
