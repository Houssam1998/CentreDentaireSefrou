/**
 * Google Maps loads only when the visitor asks for it: saves ~500 KB and avoids
 * third-party cookies until then.
 */
export function initMapFacade() {
  document.querySelectorAll<HTMLElement>('[data-map]').forEach((root) => {
    const btn = root.querySelector<HTMLButtonElement>('[data-map-load]');
    btn?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = root.dataset.map!;
      iframe.title = root.dataset.mapTitle ?? 'Google Maps';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'absolute inset-0 size-full border-0';
      iframe.allowFullscreen = true;
      root.append(iframe);
      btn.remove();
    });
  });
}
