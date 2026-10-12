export const languages = { fr: 'Français', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'fr';

/** Localized paths of every static page. Treatment pages are built from `treatments.ts`. */
export const routes = {
  home: { fr: '/', en: '/en/' },
  centre: { fr: '/le-centre/', en: '/en/the-centre/' },
  doctor: { fr: '/dr-amine-el-omari/', en: '/en/dr-amine-el-omari/' },
  treatments: { fr: '/soins/', en: '/en/treatments/' },
  beforeAfter: { fr: '/avant-apres/', en: '/en/before-after/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  legal: { fr: '/mentions-legales/', en: '/en/legal/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof routes;

export const path = (key: RouteKey, lang: Lang) => routes[key][lang];

export const treatmentPath = (slug: string, lang: Lang) =>
  lang === 'fr' ? `/soins/${slug}/` : `/en/treatments/${slug}/`;

export const ui = {
  fr: {
    'nav.home': 'Accueil',
    'nav.centre': 'Le Centre',
    'nav.doctor': 'Dr El Omari',
    'nav.treatments': 'Soins',
    'nav.beforeAfter': 'Avant / Après',
    'nav.contact': 'Contact',
    'nav.allTreatments': 'Voir tous les soins',
    'nav.menu': 'Menu',
    'nav.close': 'Fermer',
    'nav.skip': 'Aller au contenu',
    'cta.book': 'Prendre rendez-vous',
    'cta.bookShort': 'RDV',
    'cta.call': 'Appeler',
    'cta.whatsapp': 'WhatsApp',
    'cta.whatsappChat': 'Écrire sur WhatsApp',
    'cta.discover': 'Découvrir',
    'cta.learnMore': 'En savoir plus',
    'whatsapp.greeting': "Bonjour Centre Dentaire Sefrou, je souhaite prendre rendez-vous.",
    'whatsapp.tooltip': 'Une question ? Écrivez-nous',
    'rating.google': 'avis Google',
    'footer.tagline': 'Des soins dentaires modernes, précis et bienveillants, au cœur de Sefrou.',
    'footer.navigation': 'Navigation',
    'footer.treatments': 'Nos soins',
    'footer.contact': 'Contact',
    'footer.hours': 'Horaires',
    'footer.closed': 'Fermé',
    'footer.legal': 'Mentions légales',
    'footer.rights': 'Tous droits réservés.',
    'footer.credits': 'Crédits photos',
    'breadcrumb.home': 'Accueil',
    'lang.switch': 'English',
    'lang.label': 'Changer de langue',
  },
  en: {
    'nav.home': 'Home',
    'nav.centre': 'The Centre',
    'nav.doctor': 'Dr El Omari',
    'nav.treatments': 'Treatments',
    'nav.beforeAfter': 'Before / After',
    'nav.contact': 'Contact',
    'nav.allTreatments': 'See all treatments',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.skip': 'Skip to content',
    'cta.book': 'Book an appointment',
    'cta.bookShort': 'Book',
    'cta.call': 'Call',
    'cta.whatsapp': 'WhatsApp',
    'cta.whatsappChat': 'Chat on WhatsApp',
    'cta.discover': 'Discover',
    'cta.learnMore': 'Learn more',
    'whatsapp.greeting': 'Hello Centre Dentaire Sefrou, I would like to book an appointment.',
    'whatsapp.tooltip': 'A question? Message us',
    'rating.google': 'Google reviews',
    'footer.tagline': 'Modern, precise and caring dentistry in the heart of Sefrou.',
    'footer.navigation': 'Navigation',
    'footer.treatments': 'Treatments',
    'footer.contact': 'Contact',
    'footer.hours': 'Opening hours',
    'footer.closed': 'Closed',
    'footer.legal': 'Legal notice',
    'footer.rights': 'All rights reserved.',
    'footer.credits': 'Photo credits',
    'breadcrumb.home': 'Home',
    'lang.switch': 'Français',
    'lang.label': 'Change language',
  },
} as const;

export type UiKey = keyof (typeof ui)['fr'];

export const useT = (lang: Lang) => (key: UiKey) => ui[lang][key] ?? ui[defaultLang][key];

/** Picks the localized value from a `{ fr, en }` object. */
export const l = <T>(value: Record<Lang, T>, lang: Lang): T => value[lang];
