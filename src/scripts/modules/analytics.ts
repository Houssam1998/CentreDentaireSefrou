/**
 * Conversion tracking for every call-to-action carrying a `data-cta` attribute.
 * Inactive unless a GA4 / Google Ads ID is configured in `src/data/site.ts`
 * (BaseLayout then loads the Google tag and exposes `window.__cds`).
 *
 * - GA4: `generate_lead` event with the CTA name and contact method
 * - Google Ads: `conversion` event using the label configured for that method
 */
type Method = 'booking' | 'whatsapp' | 'call';

interface TrackingConfig {
  adsId: string;
  conversions: Partial<Record<Method, string>>;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __cds?: TrackingConfig;
  }
}

export function methodFor(cta: string): Method | null {
  if (cta.endsWith('-book') || cta === 'contact-dentisto') return 'booking';
  if (cta.includes('whatsapp')) return 'whatsapp';
  if (cta.includes('call')) return 'call';
  return null;
}

export function initAnalytics() {
  const config = window.__cds;
  if (!window.gtag || !config) return;

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cta]');
    const cta = el?.dataset.cta;
    if (!cta) return;
    const method = methodFor(cta);
    if (!method) return;

    window.gtag!('event', 'generate_lead', { method, cta, transport_type: 'beacon' });
    const label = config.conversions[method];
    if (config.adsId && label) {
      window.gtag!('event', 'conversion', { send_to: `${config.adsId}/${label}`, transport_type: 'beacon' });
    }
  });
}
