/** Count-up animation for `[data-count]` numbers when they scroll into view. */
export function initCounters() {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!els.length) return;

  const animate = (el: HTMLElement) => {
    const end = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const fmt = new Intl.NumberFormat(el.dataset.locale ?? 'fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt.format(end * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animate(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}
