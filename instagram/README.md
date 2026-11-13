# Instagram & TikTok — Centre Dentaire Sefrou

Le **Studio** permet de créer librement, comme dans Canva, les publications de **@centredentairesefrou** (Instagram) et **@centre.dentaire.sefrou** (TikTok). Il garde la charte « Lumière & lignes d'or », les 13 modèles et les 18 publications déjà rédigées. Ce dossier contient aussi l'outro animé des reels.

## Ouvrir le Studio

- **En ligne** : `https://studio.centredentairesefrou.com`. Saisissez votre adresse e-mail, puis le code reçu par e-mail. La connexion dure 30 jours sur cet appareil. Seules les adresses de l'équipe sont acceptées. Rien à installer.
- **Sur l'ordinateur du projet**, sans connexion : `npm install` (une seule fois), puis `npm run ig:studio`. Les créations restent alors dans ce navigateur.

Le Studio est fait pour un ordinateur ou une tablette. Sur téléphone, on peut seulement consulter et télécharger.

## Créer une publication en 5 étapes

1. **Modèles** (à gauche) : cliquez sur un modèle ou sur une publication prête. Elle s'ouvre en page modifiable. On peut aussi partir d'une page vide.
2. **Tout se déplace** : cliquez sur un élément pour le sélectionner, faites-le glisser, tirez les poignées pour l'agrandir ou le faire pivoter. Des repères magnétiques aident à centrer et à aligner.
3. **Double-clic sur un texte** pour l'écrire (français ou arabe). Sélectionnez un mot puis **Accent** pour le mettre en italique coloré.
4. **Ajoutez** des formes, des arches lumineuses, des icônes, des motifs de fête, le logo, des pastilles de contact (téléphone, WhatsApp, adresse, Instagram, TikTok), des textes prêts ou vos photos. Un clic ajoute l'élément au centre ; on peut aussi le glisser sur la page. Les fichiers photo se déposent directement sur la page ou sur un cadre photo.
5. **Télécharger** : PNG de la page, ZIP de toutes les pages pour un carrousel, ou fichier projet. Avant l'export, une vérification signale les mots qui ressemblent à de la publicité (prix, promo, %, « meilleur », « garanti »).

### Pour aller plus loin

- **Ambiance** (en haut) : Clair, Grège ou Soirée. Tout le projet change de couleurs de façon cohérente.
- **Variantes** : propose 4 déclinaisons de la page (miroir, autre ambiance, autre forme de photo, décor déplacé). Le bouton **Surprise** tire une combinaison au hasard.
- **Pages** (en bas) : ajouter, dupliquer, réordonner en glissant. C'est ainsi qu'on fait un carrousel.
- **Calques** : ordre des éléments, masquer, verrouiller.
- **Inspecteur** (à droite) : position exacte, alignement, police, couleurs, forme du cadre photo, halo lumineux…
- **Format** : publication 4:5, story/reel 9:16 ou carré. Le bouton ▣ en bas affiche la zone visible sur la grille du profil.
- **Légende** : texte FR + darija et hashtags, avec un bouton pour tout copier.
- **Enregistrer comme modèle** (inspecteur, quand rien n'est sélectionné) : la page rejoint « Mes modèles ».

**Raccourcis** : Ctrl+Z / Ctrl+Y (annuler / rétablir), Ctrl+D (dupliquer), Suppr, Ctrl+C / Ctrl+V, Ctrl+G (grouper), flèches pour décaler (Maj = 10 px), Entrée pour écrire, Échap pour quitter.

## Où sont enregistrées les créations ?

**En ligne : dans l'espace d'équipe.** Tout est enregistré automatiquement, photos importées comprises.
- Le docteur, l'assistante et vous voyez **les mêmes créations sur tous vos appareils** (bouton « Mes créations »).
- Chaque création indique **qui l'a modifiée en dernier et quand**. En haut à droite, la pastille avec votre initiale montre qui est connecté ; elle permet aussi de se déconnecter.
- **Si quelqu'un modifie la même création en même temps**, rien n'est écrasé. Un bandeau propose trois choix : « Prendre sa version », « Garder la mienne », ou « Garder la mienne en copie ». Si vous ne modifiez rien, la version de l'autre personne s'affiche d'elle-même (vérification toutes les 20 s).
- **Corbeille** : une création supprimée y reste 30 jours et peut être restaurée.
- Des créations faites avant la mise en ligne, encore enregistrées dans un navigateur ? Ouvrez « Mes créations » dans ce navigateur, puis **« Les envoyer dans l'espace d'équipe »**.
- Le **fichier projet** (Télécharger → Fichier projet) reste disponible pour garder une copie de sauvegarde.

**En local** (`npm run ig:studio`), les créations restent dans le navigateur utilisé.

## Charte « Lumière & lignes d'or »

| Élément | D'où il vient | Fichier |
|---|---|---|
| Logo vectoriel (repère, nom AR, nom FR) | tracé depuis le logo du cabinet | `brand/logo-*.svg` |
| Palette ivoire, grège, sarcelle, or | site web + mur de l'accueil | `brand/brand.css`, `studio/tokens.css` |
| Arches lumineuses | panneaux rétro-éclairés de l'accueil | `brand/motifs.js` |
| Lignes d'or | ondulations du logo | `brand/motifs.js` → `waves()` |
| Polices | Cormorant Garamond, Inter, Noto Kufi/Naskh Arabic, Aref Ruqaa | `brand/brand.css` |

Les coordonnées (téléphone, WhatsApp, adresse, horaires, lien Maps, TikTok) viennent de **`src/data/site.ts`**, la même source que le site. Le compte Instagram est dans `config.js`.

## Règles à respecter (déontologie)

Le code de déontologie interdit la publicité aux médecins-dentistes (voir `docs/deployment-seo-ads-guide.md`). Les publications restent donc **informatives** : pas de prix, de promotion, de superlatif ni de garantie de résultat. **Chaque texte médical est relu par le Dr Omari.** Les personnes visibles sur les photos de la photothèque ont donné leur accord (novembre 2026). Pour toute nouvelle photo d'un patient ou de l'équipe, demandez le leur avant de publier.

## Publier le Studio en ligne (privé)

Le Studio est un Worker Cloudflare (`instagram/wrangler.jsonc`). Il sert l'éditeur et l'API de l'espace d'équipe (`instagram/worker/`, base D1). Il est protégé par **Cloudflare Access** : connexion par code e-mail, gratuite jusqu'à 50 personnes.

**Première mise en place** (une seule fois) :
1. Créez un jeton API Cloudflare (Mon profil → Jetons API → Jeton personnalisé) avec ces droits :
   - Compte › Workers Scripts › Modifier
   - Compte › D1 › Modifier
   - Compte › Access: Apps and Policies › Modifier
   - Compte › Access: Organizations, Identity Providers, and Groups › Modifier
   - Compte › Account Settings › Lire
   - Zone `centredentairesefrou.com` › Workers Routes › Modifier, et Zone › Lire
2. Enregistrez-le dans `instagram/.cloudflare.env`, sous la forme `CLOUDFLARE_API_TOKEN=…`. Ce fichier est exclu de Git ; ne le partagez pas.
3. Lancez `npm run ig:setup -- --emails adresse1,adresse2,adresse3 --deploy`. Le script crée la base, active la connexion par code e-mail, protège `studio.centredentairesefrou.com` pour ces adresses (session de 30 jours), complète `wrangler.jsonc`, puis publie. Si Zero Trust n'a jamais été activé sur le compte, il vous demande de le faire une fois (one.dash.cloudflare.com → nom d'équipe → offre Free), puis de le relancer.

**Ajouter ou retirer une personne** : relancez `npm run ig:setup -- --emails …` avec la nouvelle liste complète, puis `npm run ig:deploy`.

**Publier une nouvelle version** : `npm run ig:deploy`.

**Sécurité** :
- Chaque appel à l'API vérifie la signature du jeton Access (`worker/auth.ts`, testé par `worker/auth.test.mjs`).
- L'adresse `*.workers.dev` est désactivée.
- Le Studio ne s'indexe pas dans les moteurs de recherche (`public/_headers`, `robots.txt`).

**Tester l'espace d'équipe en local** :
1. Lancez `npm run ig:cloud` : le Worker et une base D1 locale démarrent, avec une identité simulée définie dans `instagram/.dev.vars`, jamais publiée.
2. Dans un autre terminal, lancez `npm run ig:test:team` : ce test simule deux personnes qui travaillent en même temps.

## Commandes

| Commande | Effet |
|---|---|
| `npm run ig:studio` | Studio en local |
| `npm run ig:render` | exporte les 18 publications prêtes en PNG + `captions.md` + aperçu de la grille (`export/`) |
| `npm run ig:reel` | génère `export/outro.mp4` (fin des reels) |
| `npm run ig:reel -- --append video.mp4` | ajoute l'outro à la fin d'une vidéo filmée |
| `npm run ig:setup -- --emails … [--deploy]` | mise en place Cloudflare (base, connexion, adresses autorisées) |
| `npm run ig:build` / `npm run ig:deploy` | construire / publier le Studio en ligne |
| `npm run ig:cloud` | Studio + espace d'équipe en local (identité simulée) |
| `npm run ig:check` | vérification TypeScript |
| `npm run ig:test` | tests : sécurité de la connexion, fidélité des modèles importés, parcours complet de l'éditeur |
| `npm run ig:test:team` | test à deux personnes de l'espace d'équipe (avec `ig:cloud` lancé) |

## Pour les développeurs

```
studio/
  model/      types (projet, page, éléments), jetons de couleur, importateur des modèles, variantes, préréglages
  store/      état (Zustand + annuler/rétablir zundo), sauvegarde (espace d'équipe ou IndexedDB), photos, API
  canvas/     rendu des éléments (aussi utilisé pour l'export), plan de travail, Moveable/Selecto
  panels/     panneaux de gauche (Modèles, Éléments, Texte, Photos, Marque, Calques)
  chrome/     barre du haut, barre contextuelle, inspecteur, pages, fenêtres
  export/     PNG, ZIP, fichier projet, vérifications
templates/    les 13 modèles (HTML) — sources de l'importateur et de npm run ig:render
posts/        les 18 publications prêtes (textes, légendes, dates)
reel/         outro animé (GSAP)
worker/       Worker Cloudflare : API de l'espace d'équipe (D1), vérification Access, migrations SQL
```

L'éditeur est en HTML (pas en canvas), ce qui garde la mise en forme arabe du navigateur et les effets de lumière en CSS. L'**importateur** (`studio/model/importer.ts`) rend un modèle dans une page cachée puis convertit chaque bloc en élément libre. `scripts/regress.mjs` vérifie qu'un modèle importé reste identique à l'original (écart toléré : 1,5 % de pixels).

## Idées pour la suite

- **20 mars** : Journée mondiale de la santé bucco-dentaire (carrousel « Vrai ou faux »).
- **Aïd al-Fitr / Aïd al-Adha** : motif croissant.
- **Juin** : Festival des cerises de Sefrou (icône cerises), puis **22 juin 2027** : 1 an du cabinet.
- **30 juillet** : Fête du Trône (drapeau).
- **Reels / TikTok** : « Une journée au cabinet », « Comment se passe un détartrage », « Le scanner intra-oral en 20 s ». Filmez au téléphone, puis `npm run ig:reel -- --append video.mp4`.
- Rythme conseillé : 2 publications par semaine et 1 reel toutes les 2 semaines (le même reel peut aller sur TikTok).

## À confirmer avant de publier

- [ ] **Horaires** (encore marqués TODO dans `src/data/site.ts`).
- [ ] Le compte Instagram **@centredentairesefrou** : à changer dans `config.js` s'il porte un autre nom.
- [ ] **Avis patient** : accord de l'Ordre (un témoignage peut être assimilé à de la publicité).
- [ ] **Repères de localisation** réels, vérifiés sur place.
- [ ] Dates du **Ramadan** selon l'observation du croissant.
- [ ] Validation médicale des textes par le Dr Omari.
