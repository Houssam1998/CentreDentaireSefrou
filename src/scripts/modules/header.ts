/**
 * Turns the header solid once the page scrolls past the top.
 * Uses an IntersectionObserver on a tiny sentinel instead of reading `scrollY`
 * on every scroll (which forces synchronous layout).
 */
export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting)).observe(sentinel);
}
