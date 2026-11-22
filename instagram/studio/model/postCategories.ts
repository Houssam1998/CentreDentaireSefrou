/**
 * Catégories et types de publication (sans dépendance : partagé par le Studio et le Worker de l'assistant IA).
 * Chaque type correspond à un modèle de templates/index.js.
 */
export interface PostType {
  template: string;
  /** Titre court affiché sur la carte. */
  title: string;
  /** À quoi sert ce type de publication. */
  help: string;
}
export interface PostCategory {
  id: string;
  title: string;
  types: PostType[];
}

export const CATEGORIES: PostCategory[] = [
  {
    id: 'occasions',
    title: 'Occasions & fêtes',
    types: [{ template: 'fete', title: 'Fête / occasion', help: 'Vœux pour une fête nationale, religieuse, le Nouvel An ou une journée de santé.' }],
  },
  {
    id: 'conseils',
    title: 'Conseils & éducation',
    types: [
      { template: 'conseil', title: 'Conseil', help: 'Un conseil de santé avec 3 points clés.' },
      { template: 'liste', title: 'Liste', help: 'Une liste numérotée (gestes, étapes…).' },
      { template: 'vraifaux', title: 'Vrai ou faux ?', help: 'Une idée reçue et la bonne réponse (souvent en 2 pages).' },
      { template: 'comparatif', title: 'Comparatif A / B', help: 'Deux options côte à côte (ex. implant ou bridge).' },
    ],
  },
  {
    id: 'cabinet',
    title: 'Le cabinet',
    types: [
      { template: 'annonce', title: 'Annonce avec photo', help: 'Une nouvelle, la présentation de l’équipe ou d’un équipement.' },
      { template: 'soins', title: 'Nos soins', help: 'Quatre soins du cabinet en grille.' },
      { template: 'horaires', title: 'Horaires', help: 'Les horaires du site, toujours à jour.' },
      { template: 'localisation', title: 'Localisation', help: 'L’adresse et un QR code vers Google Maps.' },
      { template: 'contact', title: 'Contact (fin de carrousel)', help: 'Dernière page d’un carrousel : comment nous joindre.' },
    ],
  },
  {
    id: 'patients',
    title: 'Patients',
    types: [{ template: 'avis', title: 'Avis patient', help: 'Un avis Google, recopié mot pour mot.' }],
  },
  {
    id: 'carrousel',
    title: 'Carrousel & reel',
    types: [
      { template: 'couverture', title: 'Couverture de carrousel', help: 'La première page d’un carrousel.' },
      { template: 'reelcover', title: 'Couverture de reel / story', help: 'Format vertical 1080 × 1920.' },
    ],
  },
];

