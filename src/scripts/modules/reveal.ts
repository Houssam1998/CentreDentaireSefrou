/**
 * Scroll reveals with IntersectionObserver + CSS transitions (see global.css).
 * No layout reads, no animation library: cheap enough for low-end phones.
 * Elements entering together get a small stagger via the `--d` custom property.
 */
export function initReveals() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal], [data-img-reveal]');
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.setProperty('--d', String(Math.min(i++, 6)));
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => io.observe(el));
}
