/**
 * Outro des reels (1080×1920, ~4 s).
 * Même mécanique que l'exemple fourni (le clip se fond, les pastilles de contact grandissent avec rebond,
 * le texte monte, le logo s'étire depuis une ligne, les icônes « pop »), mais avec l'identité du cabinet :
 * lignes d'or qui se dessinent, arches lumineuses du mur d'accueil, logo doré.
 *
 * Aperçu en boucle : npm run ig:studio puis ouvrir /reel/outro.html
 * Rendu vidéo : npm run ig:reel
 */
import '../brand/brand.css';
import './outro.css';
import { gsap } from 'gsap';
import { brand } from '../config.js';
import { logo, icons, waves } from '../brand/motifs.js';
import { whenReady } from '../studio/ready.js';

const render = new URLSearchParams(location.search).has('render');
document.body.classList.toggle('render', render);

const pills = [
  { icon: 'phone', text: brand.phone },
  { icon: 'whatsapp', text: brand.whatsapp },
  { icon: 'pin', text: `${brand.street} · ${brand.cityShort}` },
];

const stage = document.getElementById('stage');
stage.innerHTML = `
  <div class="ig ro" data-size="tall">
    <div class="ig-bg">
      ${waves({ w: 1300, h: 700, n: 20, gap: 15, amp: 50, tilt: -0.1, bump: 70, color: '#c8a97e', width: 1.8, opacity: 0.55, x: -110, y: -170, cls: 'ro-waves', draw: true })}
      ${waves({ w: 1300, h: 700, n: 20, gap: 15, amp: 50, tilt: -0.16, bump: 70, color: '#c8a97e', width: 1.8, opacity: 0.55, x: -110, y: 1440, cls: 'ro-waves', draw: true })}
      <div class="glow-arch ro-arch" style="left:-80px;top:560px;width:150px;height:520px"></div>
      <div class="glow-arch ro-arch" style="left:-80px;top:1120px;width:150px;height:380px"></div>
      <div class="glow-arch ro-arch" style="right:-80px;top:480px;width:150px;height:400px"></div>
      <div class="glow-arch ro-arch" style="right:-80px;top:920px;width:150px;height:560px"></div>
    </div>
    <div class="ro-logo">
      <div class="ro-mark">${logo.mark}</div>
      <div class="ro-ar">${logo.ar}</div>
      <div class="ro-fr">${logo.fr}</div>
    </div>
    <div class="ro-pills">
      ${pills.map((p) => `<div class="ro-pill"><span class="ro-ic">${icons[p.icon]}</span><span class="ro-mask"><span class="ro-txt">${p.text}</span></span></div>`).join('')}
    </div>
    <p class="ro-cta"><span>Prenez rendez-vous</span><span class="dot"></span><span class="ar">احجزوا موعدكم</span></p>
    <p class="ro-handle"><span>${icons.instagram}${brand.instagram}</span><span>${icons.tiktok}${brand.tiktok}</span></p>
  </div>`;

const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

// Le fondu depuis la vidéo filmée est fait par ffmpeg (npm run ig:reel -- --append …)
tl
  // Lignes d'or qui se dessinent
  .to('.ro-waves polyline', { strokeDashoffset: 0, duration: 1.2, stagger: 0.012, ease: 'power2.inOut' }, 0)
  // Arches du mur d'accueil qui montent et s'allument
  .from('.ro-arch', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.7, stagger: 0.07, ease: 'expo.out' }, 0.05)
  // Pastilles : grandissent depuis le centre avec rebond (comme l'exemple)
  .from('.ro-pill', { scale: 0.35, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)' }, 0.12)
  // Texte qui monte dans la pastille
  .from('.ro-txt', { yPercent: 120, duration: 0.45, stagger: 0.07 }, 0.38)
  // Logo qui s'étire depuis une ligne fine
  .from('.ro-logo', { scaleY: 0.03, opacity: 0, transformOrigin: '50% 60%', duration: 0.55, ease: 'expo.out' }, 0.5)
  // Icônes qui « pop » en dernier
  .from('.ro-ic svg', { scaleY: 0.15, scaleX: 0.6, transformOrigin: '50% 50%', duration: 0.7, stagger: 0.06, ease: 'elastic.out(1, 0.5)' }, 0.85)
  .from(['.ro-cta', '.ro-handle'], { y: 30, opacity: 0, duration: 0.5, stagger: 0.1 }, 1.0)
  // Respiration douce de la lumière pendant le maintien
  .to('.ro-arch', { boxShadow: '0 0 0 1.5px rgb(255 226 180 / 0.95), 0 0 46px 10px rgb(255 208 140 / 0.7), 0 0 120px 24px rgb(255 214 150 / 0.3)', duration: 1.4, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 1.3)
  .to({}, { duration: 0.01 }, 4.0); // durée totale : 4 s

window.__duration = tl.duration();
window.__seek = (t) => { tl.seek(t, false); };

whenReady(stage).then(() => {
  window.__ready = true;
  if (!render) { tl.repeat(-1).repeatDelay(0.6).play(); }
});
