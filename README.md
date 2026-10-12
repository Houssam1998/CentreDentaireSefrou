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
```

Déploiement, référencement (SEO) et publicité : voir **[docs/deployment-seo-ads-guide.md](docs/deployment-seo-ads-guide.md)**.
En bref : hébergement recommandé Cloudflare Pages (gratuit), variable d'environnement `SITE_URL` = domaine définitif, `NODE_VERSION` = 24.

## Où modifier quoi

| Contenu | Fichier |
|---|---|
| Téléphone, WhatsApp, e-mail, adresse, horaires, réseaux sociaux, chiffres clés | `src/data/site.ts` |
| Soins (textes, avantages, étapes, FAQ, SEO) — FR et EN | `src/data/treatments.ts` |
| Avis patients, cas avant/après, parcours patient, FAQ générale | `src/data/content.ts` |
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
- [x] Vrais avis Google (`src/data/content.ts`) — mettre à jour `stats.reviews` dans `site.ts` quand le nombre d'avis évolue
- [x] Cas clinique réel + conception numérique du sourire ; illustrations signalées comme telles
- [x] Biographie et parcours du docteur d'après le CV
- [x] Photos réelles du cabinet (accueil, salles de soins, salle d'attente, radiographie panoramique)
- [x] Retrait des soins pour enfants (anciennes URL redirigées)

Reste à faire :
- [ ] **Accord écrit de la patiente** pour la publication des photos avant/après et de la conception 3D
- [ ] **Accord de l'assistante** visible sur la photo de l'accueil (`clinic/reception.jpg`)
- [x] Photos réelles du docteur (profil, section d'accueil, fond de la page d'accueil)
- [ ] E-mail du cabinet (`src/data/site.ts`) et vérification des horaires
- [ ] Liens Instagram / Facebook / TikTok
- [ ] Faire relire les textes médicaux des soins par le docteur
- [ ] Mentions légales : n° d'inscription à l'Ordre, hébergeur (`src/views/LegalPage.astro`)
- [ ] Domaine définitif dans `astro.config.mjs`

## Options

- **Fond de la page d'accueil** : `heroMode` dans `src/data/site.ts` — `'photos'` (photos réelles en fondu, par défaut) ou `'video'` (vidéo d'origine, conservée dans `public/media/hero.mp4`).
- **Prise de rendez-vous** : tous les boutons « Prendre rendez-vous » ouvrent la page Dentisto du docteur (`bookingUrl` dans `src/data/site.ts`). Le formulaire WhatsApp reste disponible dans la section Contact.
- **Vidéo du scanner intra-oral** (BLZ INO200) : vidéo YouTube officielle du fabricant, chargée uniquement au clic (`scannerVideo` dans `site.ts`). Affichée dans la section « Du projet numérique au sourire final », sur la page Le Centre et sur les pages aligneurs, ronflement et bruxisme (`scanner: true` dans `treatments.ts`).

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
├─ data/             contenu (site, soins, avis, cas)
├─ i18n/             routes localisées + libellés
├─ lib/schema.ts     données structurées schema.org (FAQ, fil d'Ariane)
└─ scripts/
   ├─ main.ts        point d'entrée client (léger)
   └─ modules/       une fonctionnalité par fichier (header, menus, reveal, compteurs, carrousel,
                     slider avant/après, formulaire, carte, vidéo, motion desktop)
```

Choix techniques notables :
- Le formulaire n'a pas besoin de serveur : il ouvre WhatsApp (ou le client e-mail) avec un message pré-rempli.
- Google Maps ne se charge qu'au clic (performance + vie privée).
- Les vidéos ne se chargent qu'après le chargement de la page, et jamais en mode économie de données ou si l'utilisateur préfère réduire les animations.
- Polices auto-hébergées ; GSAP/Lenis chargés uniquement sur grand écran avec souris.
- Chaque bouton d'action porte un attribut `data-cta` pour brancher facilement Google Analytics / Google Ads.
