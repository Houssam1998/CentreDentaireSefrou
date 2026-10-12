/** Full-screen mobile menu: open/close, Escape key, focus handling and scroll lock. */
export function initMobileMenu() {
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const closeBtn = menu?.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!menu || !openBtn || !closeBtn) return;

  const setOpen = (open: boolean) => {
    menu.toggleAttribute('data-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : openBtn).focus();
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.hasAttribute('data-open')) setOpen(false);
  });
  // Close after following an in-page link
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  // Leaving mobile layout while open must not keep the page locked
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && menu.hasAttribute('data-open')) setOpen(false);
  });
}
