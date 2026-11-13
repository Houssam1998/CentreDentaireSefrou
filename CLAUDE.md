# CLAUDE.md — Centre Dentaire Sefrou

Ce fichier donne à Claude le contexte du projet. Il est lu automatiquement au début de chaque session.
Le projet est mené à deux : le **Dr Amine El Omari** (le dentiste, propriétaire du cabinet, qui n'est pas développeur) et **Houssam** (qui a construit le site avec Claude). Les deux travaillent sur ce même dossier, chacun sur son ordinateur, et se synchronisent par GitHub.

## Façon de travailler
- **Répondre en français**, simplement, sans jargon. Expliquer ce que vous allez faire avant de modifier, et résumer ce qui a changé ensuite.
- **Rien d'irréversible ou de public sans confirmation** : déploiement (`wrangler deploy`, `ig:deploy`), `git push`, suppression de fichiers, modifications dans Cloudflare.
- Le code reste **modulaire**. On **teste au fur et à mesure** : `npx astro check`, `npm run build`, puis on vérifie l'affichage sur téléphone (360 et 390 px) et sur ordinateur (1024 et 1440 px). Pour le Studio : `npm run ig:check` et `npm run ig:test`.
- Le site doit d'abord bien fonctionner **sur téléphone** : la plupart des patients le consultent ainsi.

## Synchronisation à deux (GitHub)
- Dépôt : `https://github.com/Houssam1998/CentreDentaireSefrou`, branche `main`. **Le dépôt est public.**
- Au début de chaque session : `git pull`. En fin de session : un commit clair, puis `git push` (après accord).
- En cas de conflit, ne jamais écraser le travail de l'autre. Montrer les deux versions et demander.
- **Ne jamais committer** : `instagram/.cloudflare.env` (jeton API Cloudflare), `.dev.vars`, `assets/` (CV, photos originales), `before_after/` (photos de patiente), `publication_examples/` (captures d'un autre cabinet), `Suivi_google_ads/` (données publicitaires). Le `.gitignore` les exclut déjà ; vérifier `git status` avant chaque commit.
- Ne jamais afficher le contenu du jeton dans une réponse.

## Ce que contient le dossier
| Dossier / fichier | Rôle |
|---|---|
| `src/` | Le site web (Astro 7 + Tailwind CSS v4), bilingue FR (racine) / EN (`/en/`). Architecture détaillée dans `README.md`. |
| `src/data/site.ts` | **Source unique** des coordonnées : téléphone, WhatsApp, e-mail, adresse, horaires, lien Maps, lien Dentisto, réseaux sociaux, mode du bandeau d'accueil (`heroMode`). Le Studio Instagram lit aussi ce fichier. |
| `src/data/treatments.ts`, `src/data/content.ts` | Textes des soins (FR + EN), avis Google, cas avant/après, FAQ. |
| `public/` | Logo, favicon, vidéo d'accueil. |
| `docs/deployment-seo-ads-guide.md` | Guide du déploiement, du référencement (SEO) et de la publicité (en anglais). |
| `instagram/` | Kit Instagram/TikTok : **Studio** (éditeur type Canva en React), 13 modèles, 18 publications rédigées, outro des reels, Worker Cloudflare (espace d'équipe D1 + Cloudflare Access). Mode d'emploi : `instagram/README.md`. |
| `Suivi_google_ads/` | Exports CSV et captures Google Ads (campagne depuis le 14/10/2026), rangés par date d'export. Privé. |
| `assets/`, `before_after/` | Originaux bruts (CV du docteur, photos). Les versions optimisées utilisées par le site sont dans `src/assets/`. Privé. |
| `publication_examples/` | Captures du compte d'un autre cabinet, gardées **comme référence seulement**. Ne jamais copier leur style (bleu) ni leurs textes. |
| `wrangler.jsonc` | Déploiement du site sur Cloudflare Workers (dossier `dist/`, domaines www et apex). |
| `instagram/wrangler.jsonc` | Déploiement du Studio (`studio.centredentairesefrou.com`). |

## Commandes
Node.js **24** est requis (`.nvmrc`). Il faut lancer `npm install` une fois après avoir récupéré le dossier.
```bash
npm run dev          # site en local : http://localhost:4321
npm run build        # génère le site dans dist/
npm run preview      # sert dist/ en local
npx astro check      # vérification TypeScript du site
npx wrangler deploy  # met le site en ligne (après build) — avec confirmation
npm run ig:studio    # ouvre le Studio Instagram en local
npm run ig:check     # vérification TypeScript du Studio
npm run ig:test      # tests du Studio (auth, rendu pixel, parcours complet)
npm run ig:deploy    # met le Studio en ligne — avec confirmation
npm run ig:setup -- --emails a@x.com,b@y.com --deploy   # configure l'accès au Studio (lit le jeton dans instagram/.cloudflare.env)
```

## Faits réels (à respecter dans tout contenu)
- Nom de marque : **Dr Amine El Omari**. Nom complet (biographie, mentions légales, données structurées) : **Dr Mohamed Amine El Omari**. Domaine : **www.centredentairesefrou.com**.
- Diplôme 2020 (Volgograd). Formations approfondies 2021–2022 (Innovmat, SFCO, Rabat). A exercé à Fès, Rabat et Sefrou. **Les anciens employeurs ne sont jamais cités.**
- Cabinet ouvert le **22/06/2026**. Adresse, téléphone, WhatsApp, e-mail, Maps : voir `src/data/site.ts`.
- Prise de rendez-vous : tous les boutons mènent à la page **Dentisto** du docteur (`bookingUrl`).
- Équipement : radiographie panoramique **3D CBCT (Myray)** ; scanner intra-oral **BLZ INO200**.
- **Pas de soins pour enfants** (retirés volontairement).
- Avis Google : 5,0 (10 avis au 07/10/2026). Mettre à jour `stats.reviews` dans `site.ts` quand ce nombre change.
- Comptes : Instagram **@centredentairesefrou** ; TikTok **@centre.dentaire.sefrou**.
- Toutes les personnes visibles sur les photos (équipe et patiente du cas avant/après) ont donné leur **accord le 08/11/2026**. Pour toute nouvelle photo, demander l'accord avant de publier.

## Règles de contenu
- **Déontologie** : le code de déontologie marocain des médecins-dentistes (art. 11 et 19) interdit la publicité. Tout contenu reste **informatif** : pas de prix, pas de promotion, pas de superlatif (« meilleur »), pas de garantie de résultat. Les campagnes Google Ads dépendent de l'accord de l'Ordre (voir le guide dans `docs/`).
- **Tout texte médical est relu et validé par le Dr El Omari** avant publication.
- **Contenu authentique** : une photo de banque d'images n'est jamais présentée comme le cabinet ou le docteur, et les illustrations restent signalées comme telles.
- Visuels Instagram : charte « Lumière & lignes d'or » (inspirée de l'accueil du cabinet : arches lumineuses, logo doré). Textes des visuels en FR + arabe ; légendes en FR + darija.

## Historique
- **05/10/2026, v1** : structure du site bilingue.
- **07/10, v2** : contenus réels (coordonnées, avis, CV, photos du cabinet, cas avant/après avec Digital Smile Design).
- **08/10, v3** : rendez-vous via Dentisto, CBCT et scanner, aligneurs, catégorie « Sommeil & bruxisme ».
- **12–13/10, v4** : vraies photos du docteur, guide SEO et publicité, domaine, déploiement sur Cloudflare Workers.
- **14/10** : début du suivi Google Ads (`Suivi_google_ads/`).
- **08/11** : kit Instagram/TikTok et Studio v2 (éditeur, espace d'équipe, corbeille 30 jours), lien TikTok sur le site.
- **13/11** : passation du dossier au Dr El Omari (ce fichier et `LISEZ-MOI_DR_OMARI.md`).

## Reste à faire
- [ ] Confirmer l'e-mail du cabinet et les horaires (`src/data/site.ts`).
- [ ] Liens Instagram et Facebook (`site.social`).
- [ ] Relecture médicale des pages de soins par le docteur.
- [ ] Mentions légales : n° d'inscription à l'Ordre et hébergeur (`src/views/LegalPage.astro`).
- [ ] Studio en ligne : activer Cloudflare Access avec les e-mails du docteur et de l'assistante (`npm run ig:setup`). Jusque-là, la version en ligne est l'ancienne version publique.
- [ ] Google Search Console / Analytics : renseigner les identifiants dans `site.ts` (champs vides = rien n'est chargé).
