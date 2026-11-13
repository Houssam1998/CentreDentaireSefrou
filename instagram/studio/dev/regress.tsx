/**
 * Page de contrôle (outil de développement) : importe une slide puis la rend avec l'éditeur.
 * regress.html?post=<id>&slide=<n>  — utilisée par scripts/regress.mjs pour comparer aux exports.
 */
import '../../brand/brand.css';
import '../../templates/templates.css';
import '../tokens.css';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { posts, slidesOf } from '../../posts/posts.js';
import { whenReady } from '../ready.js';
import { importSlide } from '../model/importer';
import { PageView } from '../canvas/ElementView';

declare global {
  interface Window { __ready?: boolean | string; __page?: unknown }
}

const q = new URLSearchParams(location.search);
const post = posts.find((p: { id: string }) => p.id === q.get('post'));
const out = document.getElementById('out')!;

(async () => {
  if (!post) { window.__ready = 'error'; return; }
  const slide = slidesOf(post)[Number(q.get('slide') ?? 0)];
  const { page, format } = await importSlide(slide);
  window.__page = page;
  const root = createRoot(out);
  flushSync(() => root.render(<PageView page={page} format={format} />));
  await whenReady(out);
  window.__ready = true;
})().catch((e) => { console.error(e); window.__ready = 'error'; });
