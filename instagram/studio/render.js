/** Page de rendu 1:1 utilisée par scripts/render.mjs : ?post=<id>&slide=<n> */
import '../brand/brand.css';
import '../templates/templates.css';
import { renderSlide } from '../templates/index.js';
import { posts, slidesOf } from '../posts/posts.js';
import { whenReady } from './ready.js';

const q = new URLSearchParams(location.search);
const post = posts.find((p) => p.id === q.get('post'));
const out = document.getElementById('out');

if (!post) {
  out.textContent = `Publication introuvable : ${q.get('post')}`;
  window.__ready = 'error';
} else {
  const slide = slidesOf(post)[Number(q.get('slide') ?? 0)];
  out.innerHTML = renderSlide(slide);
  whenReady(out).then(() => (window.__ready = true));
}

// Liste des publications pour le script d'export
window.__posts = posts.map((p) => ({ id: p.id, slides: slidesOf(p).length }));
