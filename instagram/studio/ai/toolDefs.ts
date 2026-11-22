/**
 * Outils de l'assistant IA : ce que Claude peut faire dans le Studio.
 * Définis ici sans dépendance (le Worker les envoie à l'API ; le Studio les exécute dans le navigateur,
 * voir tools.ts). Toute modification de ce fichier change le préfixe mis en cache côté API : à éviter à la légère.
 */
import type { BetaTool } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { CATEGORIES } from '../model/postCategories';
import { OCCASIONS } from '../../templates/occasions.js';
import { TOKENS } from '../model/tokens';

export const TEMPLATE_KEYS = CATEGORIES.flatMap((c) => c.types.map((t) => t.template));
export const OCCASION_KEYS = Object.keys(OCCASIONS);
export const FONT_KEYS = ['serif', 'sans', 'kufi', 'naskh', 'ruqaa'] as const;
export const TONE_KEYS = ['light', 'greige', 'night'] as const;
export const ICON_KEYS = [
  'tooth', 'sparkle', 'brush', 'floss', 'water', 'sugar', 'calendar', 'clock', 'pin', 'phone', 'whatsapp', 'instagram', 'tiktok', 'globe',
  'check', 'cross', 'dot', 'drop', 'gum', 'shield', 'scan', 'aligner', 'braces', 'moon', 'sleep', 'bite', 'implant', 'heart', 'team',
  'star', 'cherry', 'arrow', 'swipe', 'bulb',
];

/** Éléments prêts à l'emploi (identifiants de studio/panels/dnd.ts → presetById). Vérifié par scripts/e2e-ai.mjs. */
export const PRESETS: Record<string, string> = {
  'text:title': 'Grand titre (serif)', 'text:title-ar': 'Titre arabe', 'text:pair': 'Paire titre FR + AR (groupés)', 'text:kicker': 'Sur-titre',
  'text:subtitle': 'Sous-titre', 'text:body': 'Paragraphe', 'text:body-ar': 'Paragraphe arabe', 'text:calli': 'Calligraphie arabe (vœux)',
  'text:quote': 'Citation', 'text:sign': 'Signature', 'text:small': 'Petit texte',
  'shape:card': 'Carte', 'shape:arch': 'Arche lumineuse', 'shape:stadium': 'Panneau lumineux', 'shape:circle': 'Cercle', 'shape:rect': 'Rectangle',
  'shape:rounded': 'Rectangle arrondi', 'shape:pill': 'Contour pastille', 'shape:line': 'Filet doré', 'shape:line-c': 'Filet centré',
  'motif:waves': 'Lignes d’or', 'motif:wall': 'Arches du mur (3 panneaux)', 'motif:mark': 'Repère du logo', 'motif:flag': 'Drapeau du Maroc (arche)',
  'motif:yaz': 'Yaz amazigh', 'motif:crescent': 'Croissant', 'motif:lantern': 'Lanterne', 'motif:stars': '5 étoiles',
  'comp:logo': 'Logo', 'comp:logo-big': 'Logo (grand)', 'comp:footer': 'Pied de page (Instagram, téléphone, adresse)',
  'comp:badge-conseil': 'Badge « Le conseil du Dr Omari »', 'comp:badge-vf': 'Badge « Vrai ou faux ? »', 'comp:badge-coulisses': 'Badge « Coulisses »',
  'comp:badge-techno': 'Badge « Technologie »', 'comp:badge-sefrou': 'Badge « Sefrou sourit »',
  'comp:pill-phone': 'Pastille téléphone', 'comp:pill-wa': 'Pastille WhatsApp', 'comp:pill-pin': 'Pastille adresse', 'comp:pill-ig': 'Pastille Instagram',
  'comp:pill-tt': 'Pastille TikTok', 'comp:hours': 'Tableau des horaires', 'comp:qr': 'QR code Google Maps', 'comp:number': 'Numéro (pastille)', 'comp:vs': 'Pastille « ou »',
  ...Object.fromEntries(ICON_KEYS.map((k) => [`icon:${k}`, `Icône ${k}`])),
  ...Object.fromEntries(ICON_KEYS.map((k) => [`icon-disc:${k}`, `Icône ${k} dans une pastille`])),
};

const empty = { type: 'object' as const, properties: {}, additionalProperties: false };
const num = (description: string) => ({ type: 'number', description });
const colorDesc = `Couleur : un jeton qui suit l'ambiance (${Object.keys(TOKENS).join(', ')}) — à préférer — ou une couleur CSS (#0f6e77).`;

export const AI_TOOLS: BetaTool[] = [
  {
    name: 'get_page',
    description: 'Renvoie l’état à jour de la page affichée (format, ambiance, éléments avec id, position, taille, texte, police, couleur) et la légende. À utiliser pour retrouver les identifiants après une création ou des modifications.',
    input_schema: empty,
  },
  {
    name: 'view_design',
    description: 'Renvoie une image réduite de la page affichée, telle qu’elle sera publiée. À utiliser pour vérifier le rendu (lisibilité, équilibre, chevauchements, texte qui dépasse) après une création ou des retouches importantes, et quand on demande un avis sur le visuel.',
    input_schema: empty,
  },
  {
    name: 'get_template',
    description: 'Renvoie les champs d’un modèle (clé, libellé, type, options) et ses valeurs par défaut. À appeler avant create_post pour connaître les clés exactes des champs.',
    input_schema: { type: 'object', properties: { template: { type: 'string', enum: TEMPLATE_KEYS } }, required: ['template'], additionalProperties: false },
  },
  {
    name: 'create_post',
    description:
      'Crée une page à partir d’un modèle de la charte (mise en page professionnelle, à préférer à une composition élément par élément). ' +
      'Pour le modèle « fete », donner « occasion » : les textes du visuel sont pré-remplis pour cette occasion, et « fields » ne sert qu’à les remplacer. ' +
      'La page garde la trace du modèle : on peut ensuite la recréer avec mode « replace_page ».',
    input_schema: {
      type: 'object',
      properties: {
        template: { type: 'string', enum: TEMPLATE_KEYS },
        occasion: { type: 'string', enum: OCCASION_KEYS, description: 'Seulement pour template « fete ».' },
        fields: {
          type: 'object',
          description: 'Valeurs des champs du modèle (texte uniquement). Dans les textes : *mot* = accent coloré, **mot** = gras, retour à la ligne = nouvelle ligne. Champs absents = valeur par défaut.',
          additionalProperties: { type: 'string' },
        },
        mode: { type: 'string', enum: ['new_page', 'replace_page'], description: 'new_page : ajoute une page (ou remplit la page vide). replace_page : recrée la page affichée.' },
      },
      required: ['template', 'mode'],
      additionalProperties: false,
    },
  },
  {
    name: 'edit_elements',
    description: 'Modifie des éléments existants de la page affichée (identifiants donnés par get_page). Ne donner que les propriétés à changer. Les positions et tailles sont en pixels de la page (1080 de large).',
    input_schema: {
      type: 'object',
      properties: {
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              html: { type: 'string', description: 'Texte (éléments texte seulement). Balises permises : <b>, <em> (accent), <br>, <span class="ar"> (arabe dans un texte français).' },
              color: { type: 'string', description: colorDesc },
              size: num('Taille du texte en px (12 à 300).'),
              font: { type: 'string', enum: [...FONT_KEYS], description: 'serif = Cormorant (titres FR), sans = Inter (texte), kufi = titre arabe, naskh = texte arabe, ruqaa = calligraphie.' },
              weight: num('Graisse du texte (300 à 800).'),
              align: { type: 'string', enum: ['left', 'center', 'right'] },
              x: num('Position gauche.'), y: num('Position haut.'), w: num('Largeur.'), h: num('Hauteur (sauf texte : calculée).'),
              rotation: num('Rotation en degrés.'),
              opacity: num('Opacité de 0 à 1.'),
              hidden: { type: 'boolean' },
            },
            required: ['id'],
            additionalProperties: false,
          },
        },
      },
      required: ['changes'],
      additionalProperties: false,
    },
  },
  {
    name: 'add_element',
    description: `Ajoute un élément prêt à l’emploi sur la page affichée. Identifiants : ${Object.entries(PRESETS).filter(([k]) => !k.startsWith('icon')).map(([k, l]) => `${k} (${l})`).join(' ; ')} ; icônes : icon:<nom> ou icon-disc:<nom> avec <nom> parmi ${ICON_KEYS.join(', ')}.`,
    input_schema: {
      type: 'object',
      properties: {
        preset: { type: 'string', enum: Object.keys(PRESETS) },
        html: { type: 'string', description: 'Texte à mettre (préréglages texte seulement).' },
        x: num('Centre horizontal souhaité (défaut : centre de la page).'),
        y: num('Centre vertical souhaité.'),
      },
      required: ['preset'],
      additionalProperties: false,
    },
  },
  {
    name: 'remove_elements',
    description: 'Supprime des éléments de la page affichée (les éléments verrouillés sont conservés).',
    input_schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'], additionalProperties: false },
  },
  {
    name: 'set_page_style',
    description: 'Change l’ambiance (light = clair ivoire, greige = grège du mur du cabinet, night = soirée sombre) et/ou la couleur de fond de la page affichée.',
    input_schema: {
      type: 'object',
      properties: {
        tone: { type: 'string', enum: [...TONE_KEYS] },
        all_pages: { type: 'boolean', description: 'Appliquer l’ambiance à toutes les pages (défaut : oui).' },
        background_color: { type: 'string', description: 'Couleur CSS de fond, ou chaîne vide pour revenir au fond de l’ambiance.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'set_caption',
    description: 'Écrit la légende Instagram de la création (français + darija), les hashtags et la date de publication conseillée. Ne donner que ce qui change.',
    input_schema: {
      type: 'object',
      properties: {
        fr: { type: 'string' },
        darija: { type: 'string' },
        hashtags: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', description: 'AAAA-MM-JJ' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'go_to_page',
    description: 'Affiche une autre page de la création (carrousel). Les outils agissent toujours sur la page affichée.',
    input_schema: { type: 'object', properties: { index: { type: 'integer', description: 'Numéro de page, à partir de 1.' } }, required: ['index'], additionalProperties: false },
  },
  {
    name: 'run_checks',
    description: 'Vérifie la création avant publication : mots interdits par la déontologie (prix, promotion, superlatif, garantie) et éléments qui sortent de la page. À lancer avant de conclure une création.',
    input_schema: empty,
  },
].map((t) => ({ ...t, eager_input_streaming: true }) as BetaTool);
