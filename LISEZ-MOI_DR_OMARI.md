# À lire en premier — Dr El Omari

Ce dossier contient tout le travail fait pour le Centre Dentaire Sefrou : le site web, le Studio Instagram/TikTok et le suivi Google Ads.
Le fichier **`CLAUDE.md`** donne à Claude tout le contexte du projet. Il le lit automatiquement : vous n'avez rien à lui réexpliquer.

## Ce qu'il y a dans le dossier
- **Le site web** www.centredentairesefrou.com (français et anglais) : soins, présentation du docteur et du centre, avant/après, avis Google, contact, prise de rendez-vous via Dentisto.
- **Le Studio Instagram/TikTok** (`instagram/`) : un éditeur semblable à Canva, aux couleurs du cabinet, avec 13 modèles et 18 publications déjà rédigées. Mode d'emploi : `instagram/README.md`.
- **Le suivi Google Ads** (`Suivi_google_ads/`) : les rapports exportés depuis le début de la campagne (14/10/2026).
- **Les guides** : `README.md` (où modifier quoi sur le site) et `docs/deployment-seo-ads-guide.md` (mise en ligne, référencement, publicité).
- **Les originaux** : CV, photos du cabinet, photos avant/après (`assets/`, `before_after/`).

## Installation (une seule fois, environ 20 minutes)
1. **Git** : téléchargez-le sur https://git-scm.com/download/win et installez-le en gardant les options par défaut.
2. **Node.js 24 LTS** : téléchargez-le sur https://nodejs.org (bouton « LTS ») et installez-le avec les options par défaut.
3. **Claude Desktop** : téléchargez-le sur https://claude.ai/download, installez-le, puis connectez-vous. Il faut un abonnement **Pro ou Max** pour utiliser l'onglet Code.
4. **Le dossier** : clic droit sur le zip → « Extraire tout… » vers `Documents`. Vous obtenez `Documents\Site_Web_Centre_Dentaire_Sefrou`.
5. **GitHub** : Houssam vous envoie une invitation au dépôt par e-mail. Créez un compte sur https://github.com si besoin, puis acceptez l'invitation.
6. Dans Claude Desktop, ouvrez l'onglet **Code**, choisissez le dossier `Site_Web_Centre_Dentaire_Sefrou`, puis collez le message ci-dessous.

## Message de démarrage à coller dans Claude
```
Bonjour Claude. Je suis le Dr Amine El Omari, propriétaire du Centre Dentaire Sefrou. Je reprends ce projet, que Houssam a préparé avec toi sur son ordinateur. Nous allons continuer à travailler dessus à deux, via GitHub.

1. Lis CLAUDE.md, LISEZ-MOI_DR_OMARI.md, README.md et instagram/README.md.
2. Vérifie que Git et Node.js 24 sont installés sur mon ordinateur. S'il manque quelque chose, guide-moi pas à pas.
3. Lance npm install, puis npx astro check et npm run build, pour vérifier que tout fonctionne ici.
4. Aide-moi à me connecter à GitHub, puis vérifie avec git status et git pull que mon dossier est à jour.
5. Lance le site en local et donne-moi l'adresse pour le voir dans mon navigateur.
6. Fais-moi un résumé simple, en français, de ce qui a été fait et de ce qui reste à faire.

Ne déploie rien, ne pousse rien sur GitHub et ne supprime rien sans me demander d'abord. Explique simplement, je ne suis pas développeur.
```

## Au quotidien
- Commencez chaque séance par : *« Récupère les dernières modifications de Houssam (git pull). »*
- Terminez par : *« Enregistre et envoie mes modifications sur GitHub. »* Claude vous demandera confirmation.
- Exemples de demandes : *« Change les horaires du samedi »*, *« Analyse les derniers rapports Google Ads »*, *« Prépare une publication Instagram sur le détartrage »*.
- **Avis Google** : ils se mettent à jour seuls chaque nuit sur le site. Les avis de 4 et 5 étoiles s'affichent juste après l'accueil. Pensez à demander aux patients satisfaits de laisser un avis : un bouton « Laisser un avis » est prévu sur le site.

## Nouveau dans le Studio (v5)
- **Nouvelle publication guidée** : choisissez le type de publication, puis l'occasion pour une fête (Aïd al-Fitr, Aïd al-Adha, Ramadan, Trône, Indépendance, Nouvel An, Yennayer, 20 mars…). Les textes en français et en arabe, la légende en darija et les hashtags se remplissent seuls. Les **prochaines occasions** s'affichent avec un bouton « Préparer ».
- **Assistant IA** (panneau à gauche) : demandez simplement, par exemple *« Prépare la publication de l'Aïd al-Adha »* ou *« Le titre est trop long, raccourcis-le »*. Claude crée ou retouche le visuel et écrit la légende. Le bouton « Annuler ce que l'IA a fait » défait tout d'un coup.
- **Relisez toujours** les textes arabes et darija, et tout texte de santé, avant de publier.
- L'assistant IA utilise une **clé API Claude**. Elle est différente de votre abonnement Claude Desktop et facturée à l'usage : quelques centimes par demande, avec un plafond mensuel que vous fixez sur console.anthropic.com. Mise en place : `instagram/README.md`.

## Important : le jeton Cloudflare
Le fichier `instagram/.cloudflare.env` contient une **clé d'accès** au compte Cloudflare, qui sert à mettre le site et le Studio en ligne. Ne l'envoyez à personne et ne le publiez nulle part. En cas de doute, cette clé peut être révoquée et remplacée depuis le tableau de bord Cloudflare (Mon profil → Jetons d'API).

Il en va de même pour la **clé Google Places** (avis) et la **clé API Claude** (assistant IA). Elles sont enregistrées comme « secrets » dans Cloudflare et ne sont jamais écrites dans un fichier du dossier.

Les fichiers privés (jeton, CV, photos de patients, rapports Google Ads) ne sont **jamais** envoyés sur GitHub : le dépôt est public.
