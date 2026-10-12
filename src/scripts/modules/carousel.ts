/**
 * Scroll-snap carousels (swipe natively on touch). Prev/next buttons scroll by one card
 * and disable themselves at either end. Set up lazily when the carousel nears the viewport,
 * so no layout is forced on offscreen sections at page load.
 */
function setup(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-carousel-track]');
  const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
  if (!track) return;

  const step = () => {
    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.offsetWidth + gap : track.clientWidth;
  };

  const updateButtons = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };

  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', () => requestAnimationFrame(updateButtons), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(updateButtons), { passive: true });
  updateButtons();
}

export function initCarousels() {
  const roots = document.querySelectorAll<HTMLElement>('[data-carousel]');
  if (!roots.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        setup(entry.target as HTMLElement);
      }
    },
    { rootMargin: '300px 0px' },
  );
  roots.forEach((r) => io.observe(r));
}
