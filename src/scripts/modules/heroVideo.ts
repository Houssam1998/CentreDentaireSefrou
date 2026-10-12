interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/** True when the visitor's connection or preferences call for a static image instead of video. */
export function shouldSkipVideo() {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const slow = conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return Boolean(slow || reduced);
}

/**
 * Background videos carry their source in `data-src` so nothing heavy downloads
 * on slow connections; the poster image is shown instead.
 * Videos below the fold only load when they approach the viewport.
 */
export function initHeroVideo() {
  const videos = document.querySelectorAll<HTMLVideoElement>('video[data-src]');
  if (!videos.length || shouldSkipVideo()) return;

  const load = (video: HTMLVideoElement) => {
    video.src = video.dataset.src!;
    video.removeAttribute('data-src');
    video.play().catch(() => {
      /* Autoplay refused (e.g. low-power mode): the poster stays visible */
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (video.dataset.src) load(video);
          else video.play().catch(() => {});
        } else if (!video.dataset.src) {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px' },
  );
  videos.forEach((v) => io.observe(v));
}
