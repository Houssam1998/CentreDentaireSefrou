/**
 * Clinic details — single source of truth.
 * Every value marked TODO is still a placeholder to replace with the clinic's real information.
 */
export const site = {
  name: 'Centre Dentaire Sefrou',
  nameAr: 'مركز طب و جراحة الأسنان صفرو',
  /** Short name used in titles, header and buttons. */
  doctor: 'Dr Amine El Omari',
  /** Full name used in the biography, legal notice and structured data. */
  doctorFull: 'Dr Mohamed Amine El Omari',
  /** Opening date of the centre (ISO). */
  openedOn: '2026-06-22',

  /**
   * Home hero background: 'photos' = crossfade over real clinic photos,
   * 'video' = stock video (kept so the previous version can be restored with one word).
   */
  heroMode: 'photos' as 'photos' | 'video',

  /** Online booking on the doctor's Dentisto page — used by every "Prendre rendez-vous" button. */
  bookingUrl: 'https://dentisto.ma/rendez-vous/docteurs/el-omari-mohamed-amine-2936',

  /** Official BLZ Dental video of the clinic's intraoral scanner (YouTube, loaded on click only). */
  scannerVideo: { id: 'QdWK328RXc0', name: 'BLZ INO200' },

  phone: '05 35 68 20 56',
  phoneHref: 'tel:+212535682056',
  whatsapp: '212666060215', // format international sans "+" ni espaces, utilisé par wa.me
  whatsappDisplay: '06 66 06 02 15',
  email: 'centredentairesefrou@gmail.com', // TODO: confirmer l'adresse e-mail du cabinet

  // Adresse issue de la fiche Google Maps du cabinet
  address: {
    street: 'N464 Derb El Miter',
    city: 'Sefrou',
    postalCode: '31000',
    country: 'MA',
  },
  /** Google Maps listing (shared link) — used for "Itinéraire", reviews and schema.org `hasMap`. */
  mapsUrl: 'https://maps.app.goo.gl/tCKEdeicvFQSDHrHA',
  /** Query used by the embedded map; resolves to the Google listing. */
  mapsQuery: 'Centre Dentaire Sefrou, N464 Derb El Miter, Sefrou 31000',
  googleReviewsUrl: 'https://maps.app.goo.gl/tCKEdeicvFQSDHrHA',
  /**
   * Google Place ID of the clinic (starts with "ChIJ…"). Used by the nightly refresh of the reviews
   * (site-worker/) and by the "Laisser un avis" button. Empty = both stay off.
   */
  googlePlaceId: 'ChIJD38ZMvSbnw0RsmGdJ6YZI2M',

  /**
   * Exact GPS position of the clinic (from the Google Business Profile: right-click the pin → copy coordinates).
   * Source : fiche Google Maps du cabinet — ajouté automatiquement au balisage schema.org.
   */
  geo: { lat: 33.828063, lng: -4.836093 } as { lat: number; lng: number } | null,

  /** Towns served — used in structured data (areaServed) and the footer for local search. */
  areaServed: ['Sefrou', 'Bhalil', 'Imouzzer Kandar', 'El Menzel', 'Aïn Cheggag', 'Fès'],

  /**
   * Search engines & measurement. Leave empty until the accounts exist: nothing is loaded while empty.
   * See docs/deployment-seo-ads-guide.md.
   */
  googleSiteVerification: '', // contenu de la balise meta fournie par Google Search Console
  bingSiteVerification: '', // contenu de la balise meta fournie par Bing Webmaster Tools
  analytics: {
    ga4: '', // ex. 'G-XXXXXXXXXX'
    googleAds: '', // ex. 'AW-XXXXXXXXXX'
    /** Google Ads conversion labels (the part after the slash in "AW-XXX/label"). */
    conversions: { booking: '', whatsapp: '', call: '' },
  },

  /** Horaires officiels (journée continue). `schema` = jours schema.org pour les données structurées. */
  hours: [
    { days: { fr: 'Lundi – Vendredi', en: 'Monday – Friday' }, time: ['09:00 – 18:00'], schema: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
    { days: { fr: 'Samedi', en: 'Saturday' }, time: ['09:00 – 13:00'], schema: ['Saturday'], opens: '09:00', closes: '13:00' },
    { days: { fr: 'Dimanche', en: 'Sunday' }, time: null, schema: [], opens: null, closes: null },
  ],

  // TODO: remplacer par les vrais comptes
  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    tiktok: 'https://www.tiktok.com/@centre.dentaire.sefrou',
  },

  /** Verifiable figures only: CV (practising since 2020, 5 in-depth courses + degree) and the Google listing. */
  stats: {
    years: 5,
    trainings: 6,
    rating: 5,
    reviews: 16, // nombre d'avis Google au 22/11/2026 (valeur de secours : le chiffre en direct vient de Google)
    openedYear: 2026,
  },
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}, Maroc`;

export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`;
