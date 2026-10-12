/**
 * YouTube videos load only when the visitor presses play (privacy-enhanced domain):
 * no third-party requests or cookies before that, and no impact on page speed.
 */
export function initVideoFacades() {
  document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach((root) => {
    const btn = root.querySelector<HTMLButtonElement>('[data-video-play]');
    btn?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${root.dataset.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      iframe.title = root.dataset.videoTitle ?? 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      iframe.className = 'absolute inset-0 size-full border-0';
      root.append(iframe);
      btn.remove();
    });
  });
}
