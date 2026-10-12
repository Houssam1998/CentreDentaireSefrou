import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Desktop-only enhancements: Lenis smooth scrolling and subtle parallax on hero media.
 * Loaded as a separate chunk (dynamic import) only on large screens with a fine pointer,
 * so phones keep native scrolling and never download GSAP.
 */
export function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  initSmoothScroll();
  parallax();
}

function initSmoothScroll() {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links scroll smoothly with Lenis and account for the fixed header
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -88 });
      if (id === '#main') target.focus({ preventScroll: true });
    }),
  );
}

function parallax() {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true },
    });
  });
}
