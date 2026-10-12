// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Public URL of the site (canonical links, sitemap, Open Graph, robots.txt).
 * Set the SITE_URL environment variable on the hosting platform once the domain is known;
 * the fallback below is used for local builds.
 */
const SITE_URL = process.env.SITE_URL ?? 'https://www.centredentairesefrou.com';

export default defineConfig({
  site: SITE_URL,
  // One URL per page (always with a trailing slash) — avoids duplicate-content variants
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-MA', en: 'en' } },
      lastmod: new Date(),
    }),
  ],
  image: {
    layout: 'constrained',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
