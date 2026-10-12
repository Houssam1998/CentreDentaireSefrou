/**
 * Client entry point. Each feature lives in its own module and only activates
 * when its markup is present on the page.
 *
 * Interaction modules are tiny and run immediately. Scroll reveals and counters use
 * IntersectionObserver + CSS. The heavy desktop-only layer (GSAP, ScrollTrigger, Lenis)
 * is a separate chunk loaded on idle, and only on large screens with a mouse.
 */
import { initHeader } from './modules/header';
import { initMobileMenu } from './modules/mobileMenu';
import { initMegaMenu } from './modules/megaMenu';
import { initHeroVideo } from './modules/heroVideo';
import { initBeforeAfter } from './modules/beforeAfter';
import { initCarousels } from './modules/carousel';
import { initContactForm } from './modules/contactForm';
import { initMapFacade } from './modules/mapFacade';
import { initVideoFacades } from './modules/videoFacade';
import { initReveals } from './modules/reveal';
import { initCounters } from './modules/counters';
import { initAnalytics } from './modules/analytics';

const motionOk = document.documentElement.classList.contains('js-motion');

initHeader();
initMobileMenu();
initMegaMenu();
initBeforeAfter();
initCarousels();
initContactForm();
initMapFacade();
initVideoFacades();
initAnalytics();
if (motionOk) {
  initReveals();
  initCounters();
}

const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);

// Background videos only start downloading after everything critical has loaded
if (document.readyState === 'complete') whenIdle(initHeroVideo);
else window.addEventListener('load', () => whenIdle(initHeroVideo), { once: true });

if (motionOk && window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
  // Pure enhancement: if the chunk fails to load, the page simply keeps native scrolling
  whenIdle(() =>
    import('./modules/motion')
      .then((m) => m.initMotion())
      .catch(() => {}),
  );
}
