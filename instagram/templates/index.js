/**
 * Modèles de publication.
 * Chaque modèle déclare : label (nom affiché), size ('post' 1080×1350 ou 'tall' 1080×1920),
 * fields (champs du formulaire du Studio), defaults (contenu d'exemple), render(d) → HTML.
 *
 * Mise en forme dans les champs : **gras**, *accent* (italique coloré), retour à la ligne = nouvelle ligne.
 * Listes : une ligne par élément, colonnes séparées par « | ».
 */
import { brand, hours } from '../config.js';
import { icons, arches, waves, flag, yaz, crescent, lantern, stars, logo } from '../brand/motifs.js';
import { photoUrl } from '../brand/photos.js';
import { md, rows, icon, head, badge, foot, frame, cornerWaves } from './parts.js';
import QRCode from 'qrcode';
import { OCCASIONS, OCCASION_OPTIONS, upcomingYear } from './occasions.js';

const TONES = { light: 'Clair (ivoire)', greige: 'Grège (mur du cabinet)', night: 'Soirée (sombre)' };
const SERIES = {
  '': '— aucune —',
  conseil: 'Le conseil du Dr Omari',
  vraifaux: 'Vrai ou faux ?',
  coulisses: 'Coulisses du cabinet',
  sefrou: 'Sefrou sourit',
  techno: 'Technologie au cabinet',
};
const SERIES_AR = { conseil: 'نصيحة الدكتور', vraifaux: 'صحيح ولا غلط؟', coulisses: 'من داخل العيادة', sefrou: 'صفرو تبتسم', techno: 'تكنولوجيا العيادة' };
const seriesBadge = (s) => (s && SERIES[s] ? badge(SERIES[s], SERIES_AR[s]) : '');
const ICON_OPTIONS = Object.fromEntries(Object.keys(icons).map((k) => [k, k]));

const F = {
  tone: { k: 'tone', label: 'Ambiance', type: 'select', options: TONES },
  series: { k: 'series', label: 'Série', type: 'select', options: SERIES },
  kicker: { k: 'kicker', label: 'Sur-titre (FR)', type: 'text' },
  titleFr: { k: 'titleFr', label: 'Titre (FR) — *mot* = accent', type: 'textarea' },
  titleAr: { k: 'titleAr', label: 'Titre (AR)', type: 'ar' },
  textFr: { k: 'textFr', label: 'Texte (FR)', type: 'textarea' },
  textAr: { k: 'textAr', label: 'Texte (AR)', type: 'ar' },
  photo: { k: 'photo', label: 'Photo', type: 'photo' },
  photoPos: { k: 'photoPos', label: 'Cadrage photo (x% y%)', type: 'text' },
  icon: { k: 'icon', label: 'Icône', type: 'select', options: ICON_OPTIONS },
};

/* ------------------------------------------------------------------ */

const annonce = {
  label: 'Annonce avec photo',
  size: 'post',
  fields: [F.tone, F.series, F.kicker, F.titleFr, F.titleAr, F.textFr, F.textAr, { k: 'signature', label: 'Signature', type: 'text' }, F.photo, F.photoPos, { k: 'side', label: 'Photo à', type: 'select', options: { right: 'droite', left: 'gauche' } }],
  defaults: {
    tone: 'light', series: '', kicker: 'Nouveau', titleFr: 'Bienvenue sur notre *Instagram*', titleAr: 'مرحبا بكم في صفحتنا',
    textFr: 'Conseils, coulisses et nouvelles du cabinet.', textAr: 'نصائح وأخبار العيادة', signature: '', photo: 'clinic/logo-wall', photoPos: '50% 40%', side: 'right',
  },
  render(d) {
    const photo = `<div class="photo-arch ann-photo"><img src="${photoUrl(d.photo)}" style="object-position:${d.photoPos || '50% 50%'}" alt=""></div>`;
    const text = `<div class="ann-text">
      ${d.kicker ? `<span class="t-kicker">${md(d.kicker)}</span>` : ''}
      <h1 class="t-h1">${md(d.titleFr)}</h1>
      ${d.titleAr ? `<p class="t-h1-ar">${md(d.titleAr)}</p>` : ''}
      <hr class="rule">
      ${d.textFr ? `<p class="t-body">${md(d.textFr)}</p>` : ''}
      ${d.textAr ? `<p class="t-ar-body">${md(d.textAr)}</p>` : ''}
      ${d.signature ? `<p class="signature">${md(d.signature)}</p>` : ''}
    </div>`;
    return frame({
      tone: d.tone,
      bg: cornerWaves(d.side === 'left' ? 'bottom-right' : 'bottom-left', d.tone),
      body: `${head({ right: seriesBadge(d.series) })}
        <div class="ann ${d.side === 'left' ? 'is-left' : ''}">${d.side === 'left' ? photo + text : text + photo}</div>
        ${foot()}`,
    });
  },
};

const conseil = {
  label: 'Conseil / éducation',
  size: 'post',
  fields: [F.tone, F.series, F.titleFr, F.titleAr, F.textFr, F.textAr, F.icon,
    { k: 'points', label: 'Points (icône | titre FR | détail FR | texte AR)', type: 'textarea' },
    { k: 'ctaFr', label: 'Conclusion (FR)', type: 'text' }, { k: 'ctaAr', label: 'Conclusion (AR)', type: 'ar' }],
  defaults: {
    tone: 'light', series: 'conseil', titleFr: 'Vos gencives *saignent* ?', titleAr: 'واش اللثة كتنزف؟',
    textFr: 'Ce n’est pas « normal ».', textAr: 'ماشي حاجة عادية', icon: 'gum',
    points: 'check | Brossez en douceur | Brosse souple, 2 minutes | نظفوا بلطف\ncalendar | Faites contrôler | Un détartrage règle souvent le problème | زوروا طبيب الأسنان',
    ctaFr: 'Un doute ? Parlez-en au cabinet.', ctaAr: 'عندك سؤال؟ مرحبا بك فالعيادة',
  },
  render(d) {
    const pts = rows(d.points).map(([ic, t, s, ar]) => `<div class="card pt">
        <div class="icon-disc">${icon(ic)}</div>
        <div class="pt-txt"><p class="pt-t">${md(t)}</p>${s ? `<p class="pt-s">${md(s)}</p>` : ''}${ar ? `<p class="pt-ar">${md(ar)}</p>` : ''}</div>
      </div>`).join('');
    return frame({
      tone: d.tone,
      bg: cornerWaves('top-right', d.tone),
      body: `${head({ right: seriesBadge(d.series) })}
        <div class="cs-top">
          <div class="cs-title">
            <h1 class="t-h1">${md(d.titleFr)}</h1>
            ${d.titleAr ? `<p class="t-h1-ar">${md(d.titleAr)}</p>` : ''}
            ${d.textFr ? `<p class="t-body">${md(d.textFr)}</p>` : ''}
            ${d.textAr ? `<p class="t-ar-body">${md(d.textAr)}</p>` : ''}
          </div>
          <div class="cs-arch glow-arch"><div class="cs-icon">${icon(d.icon)}</div></div>
        </div>
        <div class="cs-points">${pts}</div>
        ${d.ctaFr || d.ctaAr ? `<div class="cta-line"><span class="cta-ic">${icons.bulb}</span><span>${md(d.ctaFr)}</span><span class="rtl ar">${md(d.ctaAr)}</span></div>` : ''}
        ${foot()}`,
    });
  },
};

const liste = {
  label: 'Liste numérotée (FR | AR)',
  size: 'post',
  fields: [F.tone, F.series, F.kicker, F.titleFr, F.titleAr, { k: 'items', label: 'Éléments (FR | AR)', type: 'textarea' }],
  defaults: {
    tone: 'light', series: 'conseil', kicker: 'Au quotidien', titleFr: '5 gestes pour un *sourire sain*', titleAr: '5 عادات لابتسامة صحية',
    items: 'Brossez 2 min, matin et soir | نظفوا أسنانكم دقيقتين صباحا ومساء\nPassez le fil chaque soir | استعملوا خيط الأسنان كل ليلة',
  },
  render(d) {
    const its = rows(d.items).map(([fr, ar], i) => `<div class="li">
        <span class="li-n">${i + 1}</span>
        <p class="li-fr">${md(fr)}</p>
        <p class="li-ar">${md(ar ?? '')}</p>
      </div>`).join('');
    return frame({
      tone: d.tone,
      bg: cornerWaves('bottom-right', d.tone),
      body: `${head({ right: seriesBadge(d.series) })}
        <div class="li-head">
          ${d.kicker ? `<span class="t-kicker">${md(d.kicker)}</span>` : ''}
          <h1 class="t-h1">${md(d.titleFr)}</h1>
          <p class="t-h1-ar">${md(d.titleAr)}</p>
        </div>
        <div class="li-list">${its}</div>
        ${foot()}`,
    });
  },
};

const comparatif = {
  label: 'Comparatif A / B',
  size: 'post',
  fields: [F.tone, F.series, F.titleFr, F.titleAr,
    { k: 'aFr', label: 'Option A (FR)', type: 'text' }, { k: 'aAr', label: 'Option A (AR)', type: 'ar' }, { k: 'aIcon', label: 'Icône A', type: 'select', options: ICON_OPTIONS },
    { k: 'aPoints', label: 'Points A (FR | AR)', type: 'textarea' },
    { k: 'bFr', label: 'Option B (FR)', type: 'text' }, { k: 'bAr', label: 'Option B (AR)', type: 'ar' }, { k: 'bIcon', label: 'Icône B', type: 'select', options: ICON_OPTIONS },
    { k: 'bPoints', label: 'Points B (FR | AR)', type: 'textarea' },
    { k: 'noteFr', label: 'Note (FR)', type: 'text' }, { k: 'noteAr', label: 'Note (AR)', type: 'ar' }],
  defaults: {
    tone: 'light', series: 'conseil', titleFr: 'Aligneurs ou *bagues* ?', titleAr: 'التقويم الشفاف ولا المعدني؟',
    aFr: 'Aligneurs transparents', aAr: 'التقويم الشفاف', aIcon: 'aligner', aPoints: 'Presque invisibles | شبه غير مرئي',
    bFr: 'Bagues', bAr: 'التقويم المعدني', bIcon: 'braces', bPoints: 'Fixes, rien à oublier | ثابت',
    noteFr: 'Le bon choix dépend de votre cas.', noteAr: 'الاختيار كيكون حسب الحالة',
  },
  render(d) {
    const col = (fr, ar, ic, pts) => `<div class="card cmp-col">
        <div class="icon-disc big">${icon(ic)}</div>
        <p class="cmp-t">${md(fr)}</p><p class="cmp-ar">${md(ar)}</p>
        <ul>${rows(pts).map(([f, a]) => `<li><span class="b">${icons.check}</span><span><span class="f">${md(f)}</span>${a ? `<span class="a">${md(a)}</span>` : ''}</span></li>`).join('')}</ul>
      </div>`;
    return frame({
      tone: d.tone,
      bg: cornerWaves('top-right', d.tone),
      body: `${head({ right: seriesBadge(d.series) })}
        <div class="cmp-head"><h1 class="t-h1">${md(d.titleFr)}</h1><p class="t-h1-ar">${md(d.titleAr)}</p></div>
        <div class="cmp">${col(d.aFr, d.aAr, d.aIcon, d.aPoints)}<span class="cmp-vs">ou</span>${col(d.bFr, d.bAr, d.bIcon, d.bPoints)}</div>
        ${d.noteFr || d.noteAr ? `<div class="cta-line"><span class="cta-ic">${icons.bulb}</span><span>${md(d.noteFr)}</span><span class="rtl ar">${md(d.noteAr)}</span></div>` : ''}
        ${foot()}`,
    });
  },
};

const vraifaux = {
  label: 'Vrai ou faux ? (question / réponse)',
  size: 'post',
  fields: [F.tone, { k: 'reveal', label: 'Afficher', type: 'select', options: { q: 'la question', a: 'la réponse' } },
    { k: 'claimFr', label: 'Affirmation (FR)', type: 'textarea' }, { k: 'claimAr', label: 'Affirmation (AR)', type: 'ar' },
    { k: 'verdictFr', label: 'Verdict (FR)', type: 'text' }, { k: 'verdictAr', label: 'Verdict (AR)', type: 'ar' },
    F.textFr, F.textAr, { k: 'tipFr', label: 'Astuce (FR)', type: 'text' }, { k: 'tipAr', label: 'Astuce (AR)', type: 'ar' }],
  defaults: {
    tone: 'light', reveal: 'q', claimFr: '« Le blanchiment abîme l’émail. »', claimAr: 'التبييض كيضر مينا الأسنان',
    verdictFr: 'Plutôt faux', verdictAr: 'غالبا خطأ', textFr: 'Explication…', textAr: 'الشرح…', tipFr: '', tipAr: '',
  },
  render(d) {
    const q = d.reveal !== 'a';
    const body = q
      ? `<div class="vf-q">
          <span class="vf-mark">“</span>
          <h1 class="vf-claim">${md(d.claimFr)}</h1>
          <p class="t-h1-ar vf-claim-ar">${md(d.claimAr)}</p>
          <div class="vf-choices"><span class="vf-pill">Vrai · <span class="ar">صحيح</span></span><span class="vf-pill">Faux · <span class="ar">خطأ</span></span></div>
          <p class="vf-swipe">Votre avis en commentaire, la réponse en glissant <span class="sw">${icons.arrow}</span><br><span class="ar">جاوبوا فالتعليقات، والجواب فالصورة الجاية</span></p>
        </div>`
      : `<div class="vf-a">
          <p class="vf-recall">« ${md(d.claimFr)} »</p>
          <div class="vf-verdict glow-arch"><span class="v-fr">${md(d.verdictFr)}</span><span class="v-ar">${md(d.verdictAr)}</span></div>
          <p class="t-body vf-txt">${md(d.textFr)}</p>
          <p class="t-ar-body vf-txt">${md(d.textAr)}</p>
          ${d.tipFr ? `<div class="cta-line"><span class="cta-ic">${icons.bulb}</span><span>${md(d.tipFr)}</span><span class="rtl ar">${md(d.tipAr)}</span></div>` : ''}
        </div>`;
    return frame({ tone: d.tone, bg: cornerWaves(q ? 'bottom-left' : 'top-right', d.tone), body: `${head({ right: badge('Vrai ou faux ?', 'صحيح ولا غلط؟') })}${body}${foot()}` });
  },
};

const horaires = {
  label: 'Horaires (lus depuis le site)',
  size: 'post',
  fields: [F.tone, F.titleFr, F.titleAr, { k: 'noteFr', label: 'Note (FR)', type: 'text' }, { k: 'noteAr', label: 'Note (AR)', type: 'ar' }],
  defaults: { tone: 'greige', titleFr: 'Nos *horaires*', titleAr: 'أوقات العمل', noteFr: 'De préférence sur rendez-vous', noteAr: 'يفضل أخذ موعد مسبق' },
  render(d) {
    const rowsHtml = hoursRows();
    return frame({
      tone: d.tone,
      bg: arches('left', { top: 300 }) + arches('right', { top: 380 }),
      body: `${head({ center: true })}
        <div class="hr-head"><span class="hr-ic">${icons.clock}</span><h1 class="t-h1">${md(d.titleFr)}</h1><p class="t-h1-ar">${md(d.titleAr)}</p></div>
        <div class="card hr-card">${rowsHtml}</div>
        <div class="hr-note"><span>${md(d.noteFr)}</span><span class="ar">${md(d.noteAr)}</span></div>
        <div class="pill-row"><span class="pill">${icons.phone}${brand.phone}</span><span class="pill">${icons.whatsapp}${brand.whatsapp}</span></div>
        ${foot()}`,
    });
  },
};

let qrCache = { url: '', svg: '' };
export function qr(url) {
  if (qrCache.url === url) return qrCache.svg;
  // Construit le SVG à partir de la matrice (synchrone, net à toute taille)
  const { size, data } = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules;
  let path = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[y * size + x]) path += `M${x} ${y}h1v1h-1z`;
  const svg = `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="currentColor" d="${path}"/></svg>`;
  qrCache = { url, svg };
  return svg;
}

/** Lignes du tableau des horaires (aussi utilisées par l'éditeur). */
export function hoursRows() {
  return hours.map((h) => `<div class="hr-row${h.time ? '' : ' closed'}">
        <span class="hr-fr">${h.fr}</span>
        <span class="hr-time">${h.time ? h.time.map((t) => `<span>${t}</span>`).join('') : '<span>Fermé · <span class="ar">مغلق</span></span>'}</span>
        <span class="hr-ar">${h.ar}</span>
      </div>`).join('');
}

const localisation = {
  label: 'Localisation + QR Google Maps',
  size: 'post',
  fields: [F.tone, F.titleFr, F.titleAr, { k: 'landmarks', label: 'Repères (FR | AR) — à vérifier sur place', type: 'textarea' }],
  defaults: { tone: 'light', titleFr: 'Nous *trouver*', titleAr: 'موقع العيادة', landmarks: '' },
  render(d) {
    const lm = rows(d.landmarks);
    return frame({
      tone: d.tone,
      bg: waves({ w: 1300, h: 900, n: 24, gap: 26, amp: 60, tilt: -0.12, bump: 90, color: '#c8a97e', width: 1.4, opacity: 0.35, x: -120, y: 380 }),
      body: `${head()}
        <div class="loc-head"><h1 class="t-h1">${md(d.titleFr)}</h1><p class="t-h1-ar">${md(d.titleAr)}</p></div>
        <div class="loc">
          <div class="loc-info">
            <div class="loc-line"><span class="icon-disc">${icons.pin}</span><div><p class="loc-street">${brand.street}</p><p class="loc-city">${brand.city} · <span class="ar">${brand.cityAr}</span></p></div></div>
            ${lm.length ? `<div class="loc-lm">${lm.map(([f, a]) => `<p><span class="b"></span>${md(f)}${a ? ` <span class="ar">· ${md(a)}</span>` : ''}</p>`).join('')}</div>` : ''}
            <div class="loc-line"><span class="icon-disc">${icons.phone}</span><div><p class="loc-street num">${brand.phone}</p><p class="loc-city">WhatsApp ${brand.whatsapp}</p></div></div>
          </div>
          <div class="loc-qr glow-arch">
            <div class="qr">${qr(brand.mapsUrl)}</div>
            <p class="qr-t">Scannez pour l’itinéraire</p>
            <p class="qr-ar">امسحوا الرمز للوصول إلينا</p>
          </div>
        </div>
        ${foot()}`,
    });
  },
};

const fete = {
  label: 'Fête / occasion',
  size: 'post',
  fields: [F.tone, { k: 'occasion', label: 'Occasion', type: 'select', options: OCCASION_OPTIONS }, { k: 'big', label: 'Texte du motif (ex. 2027, 2977)', type: 'text' },
    { k: 'titleFr', label: 'Titre (FR)', type: 'text' }, { k: 'titleAr', label: 'Titre calligraphié (AR)', type: 'ar' },
    { k: 'wishFr', label: 'Vœu (FR)', type: 'textarea' }, { k: 'wishAr', label: 'Vœu (AR)', type: 'ar' }, { k: 'signature', label: 'Signature', type: 'text' }],
  defaults: {
    tone: 'night', occasion: 'independance', big: '', titleFr: 'Fête de l’Indépendance', titleAr: 'عيد الاستقلال',
    wishFr: 'Bonne fête à toutes et à tous.', wishAr: 'كل عام والمغرب بخير', signature: 'Dr Amine El Omari et l’équipe',
  },
  render(d) {
    // Le dessin de l'arche dépend de l'occasion (templates/occasions.js)
    const o = OCCASIONS[d.occasion];
    const kind = o?.motif ?? 'logo';
    // Texte du motif laissé vide : l'année de la prochaine occurrence (Nouvel An → 2027, Yennayer → 2977)
    const bigDefault = o?.big ? o.big(upcomingYear(d.occasion)) : '';
    let motif;
    if (kind === 'flag') motif = `<div class="ft-window flag">${flag(520)}</div>`;
    else if (kind === 'year') motif = `<div class="ft-window glow-arch"><span class="ft-big">${md(d.big || bigDefault)}</span><span class="ft-spark">${icons.sparkle}</span></div>`;
    else if (kind === 'yaz') motif = `<div class="ft-window glow-arch"><span class="ft-yaz">${yaz}</span><span class="ft-num">${md(d.big || bigDefault)}</span></div>`;
    else if (kind === 'ramadan') motif = `<div class="ft-window glow-arch"><span class="ft-cres">${crescent}</span><span class="ft-lant">${lantern}</span></div>`;
    else if (kind === 'crescent') motif = `<div class="ft-window glow-arch"><span class="ft-cres solo">${crescent}</span></div>`;
    else if (kind === 'tooth') motif = `<div class="ft-window glow-arch"><span class="ft-logo ft-ico">${icons.tooth}</span></div>`;
    else motif = `<div class="ft-window glow-arch"><span class="ft-logo">${logo.mark}</span></div>`;
    return frame({
      tone: d.tone,
      cls: 'ft',
      bg: waves({ w: 1200, h: 700, n: 18, gap: 16, amp: 50, tilt: -0.05, bump: 60, color: '#c8a97e', width: 1.5, opacity: d.tone === 'night' ? 0.35 : 0.3, x: -60, y: 1010 }),
      body: `${head({ center: true })}
        <div class="ft-body">
          ${motif}
          <p class="ft-title">${md(d.titleFr)}</p>
          <p class="ft-ar">${md(d.titleAr)}</p>
          <hr class="rule center">
          <p class="ft-wish">${md(d.wishFr)}</p>
          <p class="ft-wish-ar">${md(d.wishAr)}</p>
          ${d.signature ? `<p class="ft-sign">${md(d.signature)}</p>` : ''}
        </div>
        ${foot()}`,
    });
  },
};

const avis = {
  label: 'Avis patient',
  size: 'post',
  fields: [F.tone, { k: 'quote', label: 'Avis (texte exact, FR)', type: 'textarea' }, { k: 'name', label: 'Prénom + initiale', type: 'text' }, { k: 'when', label: 'Date de l’avis', type: 'text' }, { k: 'thanksFr', label: 'Remerciement (FR)', type: 'text' }, { k: 'thanksAr', label: 'Remerciement (AR)', type: 'ar' }],
  defaults: { tone: 'greige', quote: 'Texte de l’avis', name: 'Prénom N.', when: 'Octobre 2026', thanksFr: 'Merci pour votre confiance', thanksAr: 'شكرا على ثقتكم' },
  render(d) {
    return frame({
      tone: d.tone,
      bg: arches('right', { top: 330, scale: 0.9 }) + cornerWaves('bottom-left', d.tone),
      body: `${head({ right: badge('Ils nous font confiance', 'آراء المرضى') })}
        <div class="av">
          <div class="av-stars">${stars(5)}<span>Avis Google</span></div>
          <span class="av-mark">“</span>
          <blockquote class="av-q">${md(d.quote)}</blockquote>
          <p class="av-name">${md(d.name)} <span>· ${md(d.when)}</span></p>
          <hr class="rule">
          <p class="av-thanks">${md(d.thanksFr)} <span class="sep">·</span> <span class="ar">${md(d.thanksAr)}</span></p>
        </div>
        ${foot()}`,
    });
  },
};

const soins = {
  label: 'Nos soins (grille 2 × 2)',
  size: 'post',
  fields: [F.tone, F.titleFr, F.titleAr, { k: 'items', label: 'Catégories (icône | titre FR | titre AR | détail FR)', type: 'textarea' }, { k: 'noteFr', label: 'Note (FR)', type: 'text' }, { k: 'noteAr', label: 'Note (AR)', type: 'ar' }],
  defaults: { tone: 'light', titleFr: 'Nos *soins*', titleAr: 'خدماتنا', items: 'implant | Implants | زراعة الأسنان | Implants, extractions', noteFr: '', noteAr: '' },
  render(d) {
    const cards = rows(d.items).map(([ic, fr, ar, det]) => `<div class="card so">
        <div class="icon-disc">${icon(ic)}</div>
        <p class="so-t">${md(fr)}</p><p class="so-ar">${md(ar)}</p>${det ? `<p class="so-d">${md(det)}</p>` : ''}
      </div>`).join('');
    return frame({
      tone: d.tone,
      bg: cornerWaves('top-right', d.tone),
      body: `${head()}
        <div class="so-head"><h1 class="t-h1">${md(d.titleFr)}</h1><p class="t-h1-ar">${md(d.titleAr)}</p></div>
        <div class="so-grid">${cards}</div>
        ${d.noteFr || d.noteAr ? `<div class="hr-note"><span>${md(d.noteFr)}</span><span class="ar">${md(d.noteAr)}</span></div>` : ''}
        ${foot()}`,
    });
  },
};

const couverture = {
  label: 'Carrousel — couverture',
  size: 'post',
  fields: [F.tone, F.series, F.kicker, F.titleFr, F.titleAr, F.textFr, F.textAr, F.icon, { k: 'big', label: 'Grand chiffre (optionnel)', type: 'text' }],
  defaults: { tone: 'night', series: 'conseil', kicker: 'À enregistrer', titleFr: '5 gestes pour un *sourire sain*', titleAr: '5 عادات لابتسامة صحية', textFr: '', textAr: '', icon: 'tooth', big: '5' },
  render(d) {
    return frame({
      tone: d.tone,
      bg: cornerWaves('bottom-left', d.tone),
      body: `${head({ right: seriesBadge(d.series) })}
        <div class="cv">
          <div class="cv-arch glow-arch">${d.big ? `<span class="cv-big">${md(d.big)}</span>` : `<span class="cv-icon">${icon(d.icon)}</span>`}</div>
          ${d.kicker ? `<span class="t-kicker">${md(d.kicker)}</span>` : ''}
          <h1 class="t-h1 cv-title">${md(d.titleFr)}</h1>
          <p class="t-h1-ar">${md(d.titleAr)}</p>
          ${d.textFr ? `<p class="t-body">${md(d.textFr)}</p>` : ''}
          ${d.textAr ? `<p class="t-ar-body">${md(d.textAr)}</p>` : ''}
        </div>
        <div class="cv-swipe"><span>Glissez</span><span class="ar">اسحب</span>${icons.arrow}</div>
        ${foot()}`,
    });
  },
};

const contact = {
  label: 'Carrousel — dernière slide (contact)',
  size: 'post',
  fields: [F.tone, F.titleFr, F.titleAr, F.textFr, F.textAr],
  defaults: { tone: 'greige', titleFr: 'Une *question* ?', titleAr: 'عندك سؤال؟', textFr: 'Écrivez-nous ou passez au cabinet.', textAr: 'تواصلوا معنا أو مرحبا بكم فالعيادة' },
  render(d) {
    return frame({
      tone: d.tone,
      bg: arches('left', { top: 360, scale: 0.9 }) + arches('right', { top: 300, scale: 0.9 }),
      body: `${head({ center: true })}
        <div class="ct">
          <h1 class="t-h1">${md(d.titleFr)}</h1>
          <p class="t-h1-ar">${md(d.titleAr)}</p>
          <p class="t-body">${md(d.textFr)}</p>
          <p class="t-ar-body">${md(d.textAr)}</p>
          <div class="ct-pills">
            <span class="pill">${icons.phone}${brand.phone}</span>
            <span class="pill">${icons.whatsapp}${brand.whatsapp}</span>
            <span class="pill">${icons.pin}${brand.street}, ${brand.cityShort}</span>
          </div>
          <p class="ct-social"><span>${icons.instagram}${brand.instagram}</span><span>${icons.tiktok}${brand.tiktok}</span></p>
          <p class="ct-save">${icons.heart} Enregistrez ce post · <span class="ar">احفظوا هذا المنشور</span></p>
        </div>
        ${foot()}`,
    });
  },
};

const reelcover = {
  label: 'Couverture de reel / story (1080×1920)',
  size: 'tall',
  fields: [F.tone, F.series, F.titleFr, F.titleAr, F.photo, F.photoPos],
  defaults: { tone: 'night', series: 'coulisses', titleFr: 'Une journée au *cabinet*', titleAr: 'نهار فالعيادة', photo: 'clinic/treatment-room-1', photoPos: '50% 50%' },
  render(d) {
    return frame({
      tone: 'night',
      size: 'tall',
      cls: 'rc',
      bg: `<img class="rc-photo" src="${photoUrl(d.photo)}" style="object-position:${d.photoPos || '50% 50%'}" alt=""><div class="rc-shade"></div>`,
      body: `${head({ center: true })}
        <div class="rc-body">
          ${seriesBadge(d.series)}
          <h1 class="t-h1">${md(d.titleFr)}</h1>
          <p class="t-h1-ar">${md(d.titleAr)}</p>
        </div>
        <p class="rc-handle">${brand.instagram}</p>`,
    });
  },
};

export const templates = { annonce, conseil, liste, comparatif, vraifaux, horaires, localisation, fete, avis, soins, couverture, contact, reelcover };

/** Rend une slide : modèle + valeurs par défaut + données saisies. */
export function renderSlide(slide) {
  const t = templates[slide.template];
  if (!t) return `<div class="ig"><p class="t-body">Modèle inconnu : ${slide.template}</p></div>`;
  return t.render({ ...t.defaults, ...slide });
}
