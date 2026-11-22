# Centre Dentaire Sefrou — site web

Site vitrine bilingue (FR / EN) du Centre Dentaire Sefrou — Dr Amine El Omari.
Astro (site statique) + Tailwind CSS v4, animations légères (IntersectionObserver + CSS, GSAP/Lenis sur desktop uniquement).

## Lancer le projet

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # génère le site statique dans dist/
npm run preview   # sert dist/ localement
npx astro check   # vérification TypeScript
npm run site:check && npm run site:test   # Worker des avis Google : types et tests
```

`npm run build` lit d'abord la note et le nombre d'avis Google en ligne (`scripts/fetch-reviews.mjs`, sans jamais bloquer).

Déploiement, référencement (SEO) et publicité : voir **[docs/deployment-seo-ads-guide.md](docs/deployment-seo-ads-guide.md)**.
En bref : hébergement recommandé Cloudflare Pages (gratuit), variable d'environnement `SITE_URL` = domaine définitif, `NODE_VERSION` = 24.

## Où modifier quoi

| Contenu | Fichier |
|---|---|
| Téléphone, WhatsApp, e-mail, adresse, horaires, réseaux sociaux, chiffres clés | `src/data/site.ts` |
| Soins (textes, avantages, étapes, FAQ, SEO) — FR et EN | `src/data/treatments.ts` |
| Avis patients sélectionnés (affichés en secours), cas avant/après, parcours patient, FAQ générale | `src/data/content.ts` |
| Avis Google rafraîchis chaque nuit | `site-worker/` (voir « Avis Google » plus bas) |
| Libellés communs (menu, boutons, pied de page) | `src/i18n/index.ts` |
| Textes propres à une section | en haut du composant concerné (`const copy = { fr, en }`) |
| Couleurs, typographies, styles de base | `src/styles/global.css` (`@theme`) |
| Photos | `src/assets/media/` (optimisées automatiquement) |
| Vidéos et posters | `public/media/` |
| Logo / favicon | `public/brand/` |

Toutes les valeurs provisoires sont marquées `TODO` dans le code (`grep -r TODO src`).

## À remplacer avant la mise en ligne

Fait (v2) :
- [x] Téléphone (05 35 68 20 56) et WhatsApp (06 66 06 02 15)
- [x] Chiffres clés vérifiables (5+ ans, diplôme & formations, note 5,0 · 10 avis, ouverture 2026)
- [x] Vrais avis Google (`src/data/content.ts`). Depuis la v5, la note et le nombre d'avis se mettent à jour seuls (voir « Avis Google »)
- [x] Cas clinique réel + conception numérique du sourire ; illustrations signalées comme telles
- [x] Biographie et parcours du docteur d'après le CV
- [x] Photos réelles du cabinet (accueil, salles de soins, salle d'attente, radiographie panoramique)
- [x] Retrait des soins pour enfants (anciennes URL redirigées)

Reste à faire :
- [x] **Accord de la patiente** pour la publication des photos avant/après et de la conception 3D (confirmé le 08/11/2026)
- [x] **Accord de l'assistante** visible sur la photo de l'accueil (`clinic/reception.jpg`) (confirmé le 08/11/2026)
- [x] Photos réelles du docteur (profil, section d'accueil, fond de la page d'accueil)
- [ ] E-mail du cabinet (`src/data/site.ts`) — horaires confirmés le 22/11/2026
- [x] Lien TikTok (@centre.dentaire.sefrou)
- [ ] Liens Instagram / Facebook
- [ ] Faire relire les textes médicaux des soins par le docteur
- [ ] Mentions légales : n° d'inscription à l'Ordre, hébergeur (`src/views/LegalPage.astro`)
- [ ] Domaine définitif dans `astro.config.mjs`

## Options

- **Fond de la page d'accueil** : `heroMode` dans `src/data/site.ts` — `'photos'` (photos réelles en fondu, par défaut) ou `'video'` (vidéo d'origine, conservée dans `public/media/hero.mp4`).
- **Prise de rendez-vous** : tous les boutons « Prendre rendez-vous » ouvrent la page Dentisto du docteur (`bookingUrl` dans `src/data/site.ts`). Le formulaire WhatsApp reste disponible dans la section Contact.
- **Vidéo du scanner intra-oral** (BLZ INO200) : vidéo YouTube officielle du fabricant, chargée uniquement au clic (`scannerVideo` dans `site.ts`). Affichée dans la section « Du projet numérique au sourire final », sur la page Le Centre et sur les pages aligneurs, ronflement et bruxisme (`scanner: true` dans `treatments.ts`).

## Avis Google (rafraîchis chaque nuit)

Les avis apparaissent **juste après l'accueil** : les visiteurs s'y fient et descendent rarement bas dans la page.

- **Chaque nuit**, à 05:00 heure du Maroc, un petit Worker (`site-worker/`) interroge Google Places et garde les avis de **4 et 5 étoiles avec un texte**, 5★ d'abord puis les plus récents. Il les stocke dans Cloudflare KV.
- La page d'accueil lit `/api/reviews`. Elle met à jour la note et le nombre d'avis, puis ajoute devant les avis sélectionnés ceux qu'elle n'affiche pas encore.
- Les avis de `src/data/content.ts` restent affichés en secours : sans JavaScript, hors ligne, ou si Google ne répond pas.
- **Honnêteté** : la note et le nombre affichés sont ceux de Google, tous avis confondus. Seule la sélection des avis à lire met en avant les positifs.
- **Attribution** : comme l'exige Google, les avis récupérés automatiquement affichent le nom de l'auteur tel qu'il apparaît sur Google, avec un lien vers son profil.
- **Conditions de Google** : les avis ne sont pas gardés longtemps. Ils sont remplacés chaque nuit, et la copie s'efface d'elle-même après 25 jours sans rafraîchissement.
- Le reste du site reste 100 % statique : seules les adresses `/api/*` passent par le Worker.

**Mise en place** (une seule fois) :
1. Google Cloud :
   - activez **Places API (New)** ;
   - créez une **clé API** et limitez-la à cette seule API ;
   - un compte de facturation est requis, mais 60 appels par mois restent dans la partie gratuite.
2. Renseignez `googlePlaceId` dans `src/data/site.ts`, l'identifiant Google du cabinet, qui commence par `ChIJ`. Cela active aussi le bouton **« Laisser un avis »**.
3. Espace de stockage KV `REVIEWS` : créé le 22/11/2026 (son `id` est dans `wrangler.jsonc`). Sans lui, le site fonctionnerait quand même, avec les avis sélectionnés seulement.
4. Enregistrez la clé avec `npx wrangler secret put GOOGLE_PLACES_KEY`. Elle n'est jamais écrite dans un fichier du dépôt.
5. Lancez `npm run build && npx wrangler deploy`. Pour un premier remplissage sans attendre la nuit, déclenchez la tâche planifiée depuis le tableau de bord Cloudflare (Worker → Settings → Triggers).

**Vérification automatique** : à chaque push, GitHub lance les vérifications du site et du Studio (`.github/workflows/check.yml`, sans secret ni mise en ligne).

## Architecture

```
src/
├─ pages/            routes fines (FR à la racine, EN sous /en/) → appellent une vue
├─ views/            une vue par type de page, paramétrée par la langue
├─ components/
│  ├─ layout/        Header (méga-menu + menu mobile), Footer, barre d'actions mobile, bouton WhatsApp
│  ├─ home/          sections de la page d'accueil
│  ├─ contact/       formulaire (→ WhatsApp / e-mail) et bloc contact + carte
│  └─ ui/            briques réutilisables (Icon, Logo, PageHero, FaqList, BeforeAfterSlider, TreatmentCard…)
├─ data/             contenu (site, soins, avis, cas) ; reviews.ts = note et nombre d'avis Google
├─ i18n/             routes localisées + libellés
├─ lib/schema.ts     données structurées schema.org (FAQ, fil d'Ariane)
└─ scripts/
   ├─ main.ts        point d'entrée client (léger)
   └─ modules/       une fonctionnalité par fichier (header, menus, reveal, compteurs, carrousel,
                     slider avant/après, formulaire, carte, vidéo, motion desktop, avis Google en direct)
site-worker/         Worker du site : /api/reviews + rafraîchissement nocturne des avis (Google Places → KV)
```

Choix techniques notables :
- Le formulaire n'a pas besoin de serveur : il ouvre WhatsApp (ou le client e-mail) avec un message pré-rempli.
- Google Maps ne se charge qu'au clic (performance + vie privée).
- Les vidéos ne se chargent qu'après le chargement de la page, et jamais en mode économie de données ou si l'utilisateur préfère réduire les animations.
- Polices auto-hébergées ; GSAP/Lenis chargés uniquement sur grand écran avec souris.
- Chaque bouton d'action porte un attribut `data-cta` pour brancher facilement Google Analytics / Google Ads.
