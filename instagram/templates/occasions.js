/**
 * Occasions et fêtes pour le modèle « Fête / occasion » (templates/index.js → fete),
 * la « Nouvelle publication guidée » et le calendrier du Studio.
 *
 * Chaque occasion donne :
 *  - label, emoji ; motif : dessin affiché dans l'arche (flag, year, yaz, ramadan, crescent, tooth, logo) ;
 *  - when : date fixe { fixed: 'MM-JJ' } ou date du calendrier hégirien { hijri: [mois, jour] } (estimée), ou rien ;
 *  - textes pré-remplis du visuel (FR + arabe), légende (FR + darija) et hashtags propres à l'occasion.
 *
 * ⚠️ Les textes arabes et darija sont à relire et valider par le Dr El Omari avant publication.
 * Les clés existantes (independance, trone, marche, nouvelan, yennayer, ramadan, aid, logo) ne doivent pas changer :
 * les publications déjà rédigées (posts/posts.js) et les créations enregistrées les utilisent.
 */

export const SIGNATURE = 'Dr Amine El Omari et toute l’équipe';

/** @typedef {{ fixed?: string, hijri?: [number, number] }} When */
/**
 * @typedef {{
 *   label: string, emoji: string, motif: string, when?: When, tone: string, publishBefore?: number,
 *   titleFr: string, titleAr: string, wishFr: string, wishAr: string, big?: (year: number) => string,
 *   caption: { fr: string, darija: string }, hashtags: string[], note?: string
 * }} Occasion
 */

/** @type {Record<string, Occasion>} */
export const OCCASIONS = {
  /* ---------- Fêtes nationales (dates fixes) ---------- */
  manifeste: {
    label: 'Manifeste de l’Indépendance', emoji: '🇲🇦', motif: 'flag', when: { fixed: '01-11' }, tone: 'night',
    titleFr: 'Manifeste de l’Indépendance', titleAr: 'ذكرى تقديم وثيقة الاستقلال',
    wishFr: 'Une pensée pour cette page de notre histoire.', wishAr: 'كل عام والمغرب بخير',
    caption: {
      fr: '🇲🇦 En ce 11 janvier, le Centre Dentaire Sefrou commémore l’anniversaire de la présentation du Manifeste de l’Indépendance.',
      darija: '🇲🇦 بمناسبة ذكرى تقديم وثيقة الاستقلال، كل عام والمغرب بخير.',
    },
    hashtags: ['#11Janvier', '#وثيقة_الاستقلال'],
  },
  trone: {
    label: 'Fête du Trône', emoji: '🇲🇦', motif: 'flag', when: { fixed: '07-30' }, tone: 'night',
    titleFr: 'Fête du Trône', titleAr: 'عيد العرش المجيد',
    wishFr: 'Bonne fête du Trône à toutes et à tous.', wishAr: 'كل عام والمغرب بخير',
    caption: {
      fr: '🇲🇦 À l’occasion de la Fête du Trône, toute l’équipe du Centre Dentaire Sefrou vous souhaite une très belle fête.',
      darija: '🇲🇦 بمناسبة عيد العرش المجيد، كيتمنى ليكم فريق مركز طب الأسنان صفرو عيد سعيد. كل عام والمغرب بخير.',
    },
    hashtags: ['#FêteDuTrône', '#عيد_العرش'],
  },
  revolution: {
    label: 'Révolution du Roi et du Peuple', emoji: '🇲🇦', motif: 'flag', when: { fixed: '08-20' }, tone: 'night',
    titleFr: 'Révolution du Roi et du Peuple', titleAr: 'ذكرى ثورة الملك والشعب',
    wishFr: 'Une pensée pour cette page de notre histoire.', wishAr: 'كل عام والمغرب بخير',
    caption: {
      fr: '🇲🇦 En ce 20 août, le Centre Dentaire Sefrou commémore l’anniversaire de la Révolution du Roi et du Peuple.',
      darija: '🇲🇦 بمناسبة ذكرى ثورة الملك والشعب، كل عام والمغرب بخير.',
    },
    hashtags: ['#20Août', '#ثورة_الملك_والشعب'],
  },
  jeunesse: {
    label: 'Fête de la Jeunesse', emoji: '🇲🇦', motif: 'flag', when: { fixed: '08-21' }, tone: 'night',
    titleFr: 'Fête de la Jeunesse', titleAr: 'عيد الشباب',
    wishFr: 'Belle fête à toute la jeunesse de Sefrou.', wishAr: 'عيد شباب سعيد',
    caption: {
      fr: '🇲🇦 Belle Fête de la Jeunesse à toutes et à tous !',
      darija: '🇲🇦 عيد شباب سعيد لكل شباب صفرو والمغرب!',
    },
    hashtags: ['#FêteDeLaJeunesse', '#عيد_الشباب'],
  },
  marche: {
    label: 'Marche Verte', emoji: '🇲🇦', motif: 'flag', when: { fixed: '11-06' }, tone: 'night',
    titleFr: 'Anniversaire de la Marche Verte', titleAr: 'ذكرى المسيرة الخضراء',
    wishFr: 'Fiers de notre histoire, unis pour notre pays.', wishAr: 'كل عام والمغرب بخير',
    caption: {
      fr: '🇲🇦 En ce 6 novembre, le Centre Dentaire Sefrou célèbre l’anniversaire de la Marche Verte.',
      darija: '🇲🇦 بمناسبة ذكرى المسيرة الخضراء المظفرة، كل عام والمغرب بخير.',
    },
    hashtags: ['#MarcheVerte', '#المسيرة_الخضراء'],
  },
  independance: {
    label: 'Fête de l’Indépendance', emoji: '🇲🇦', motif: 'flag', when: { fixed: '11-18' }, tone: 'night',
    titleFr: 'Fête de l’Indépendance', titleAr: 'عيد الاستقلال',
    wishFr: 'Bonne fête à toutes et à tous, et longue vie au Maroc.', wishAr: 'كل عام ووطننا المغرب بألف خير',
    caption: {
      fr: '🇲🇦 En ce 18 novembre, le Centre Dentaire Sefrou vous souhaite une très belle Fête de l’Indépendance.',
      darija: '🇲🇦 بمناسبة عيد الاستقلال، كيتمنى ليكم مركز طب الأسنان صفرو عيد سعيد. كل عام والمغرب بخير.',
    },
    hashtags: ['#FêteDeLIndépendance', '#عيد_الاستقلال'],
  },

  /* ---------- Nouvel an ---------- */
  nouvelan: {
    label: 'Nouvel An', emoji: '✨', motif: 'year', when: { fixed: '01-01' }, tone: 'night', publishBefore: 1,
    big: (y) => String(y),
    titleFr: 'Bonne année', titleAr: 'سنة سعيدة',
    wishFr: 'Que cette nouvelle année vous apporte santé, sérénité… et de beaux sourires.', wishAr: 'نتمنى لكم سنة مليئة بالصحة والسعادة',
    caption: {
      fr: '✨ Toute l’équipe du Centre Dentaire Sefrou vous souhaite une très belle année : la santé avant tout, et beaucoup de sourires !',
      darija: '✨ سنة سعيدة! كنتمناو ليكم الصحة والهناء وبزاف ديال الضحكات.',
    },
    hashtags: ['#BonneAnnée', '#سنة_سعيدة'],
  },
  yennayer: {
    label: 'Yennayer (Nouvel An amazigh)', emoji: 'ⵣ', motif: 'yaz', when: { fixed: '01-14' }, tone: 'greige', publishBefore: 1,
    big: (y) => String(y + 950),
    titleFr: 'Aseggas ameggaz', titleAr: 'سنة أمازيغية سعيدة',
    wishFr: 'Belle nouvelle année amazighe à toutes les familles de Sefrou et du Moyen Atlas.', wishAr: 'كل عام وأنتم بخير',
    caption: {
      fr: 'ⵣ Aseggas ameggaz ! Belle nouvelle année amazighe à toutes les familles de Sefrou, de Bhalil et de tout le Moyen Atlas.',
      darija: 'ⵣ أسكاس أمكاز! سنة أمازيغية سعيدة لكل العائلات فصفرو والبهاليل والأطلس المتوسط.',
    },
    hashtags: ['#Yennayer', '#AseggasAmeggaz', '#إيض_يناير'],
  },

  /* ---------- Fêtes religieuses (calendrier hégirien : dates estimées) ---------- */
  ramadan: {
    label: 'Ramadan', emoji: '🌙', motif: 'ramadan', when: { hijri: [9, 1] }, tone: 'night', publishBefore: 1,
    titleFr: 'Ramadan Moubarak', titleAr: 'رمضان مبارك',
    wishFr: 'Que ce mois sacré vous apporte paix et sérénité, à vous et à vos proches.', wishAr: 'تقبّل الله منا ومنكم صالح الأعمال',
    caption: {
      fr: '🌙 Ramadan Moubarak ! Le Centre Dentaire Sefrou vous souhaite un mois béni, plein de paix et de sérénité.',
      darija: '🌙 رمضان مبارك سعيد! كنتمناو ليكم شهر مبارك مليء بالخير والبركة.',
    },
    hashtags: ['#Ramadan', '#رمضان_مبارك'],
  },
  aidfitr: {
    label: 'Aïd al-Fitr', emoji: '🌙', motif: 'crescent', when: { hijri: [10, 1] }, tone: 'night',
    titleFr: 'Aïd Moubarak', titleAr: 'عيد فطر مبارك',
    wishFr: 'Que cette fête vous apporte joie et santé, à vous et à vos proches.', wishAr: 'تقبّل الله منا ومنكم، وكل عام وأنتم بخير',
    caption: {
      fr: '🌙 Aïd Moubarak ! Toute l’équipe du Centre Dentaire Sefrou vous souhaite une très belle fête de l’Aïd al-Fitr, entourés de vos proches.',
      darija: '🌙 عيد مبارك سعيد! كنتمناو ليكم عيد زوين مع العائلة والأحباب. كل عام وأنتم بخير.',
    },
    hashtags: ['#AidMoubarak', '#AidAlFitr', '#عيد_الفطر'],
  },
  aidadha: {
    label: 'Aïd al-Adha', emoji: '🌙', motif: 'crescent', when: { hijri: [12, 10] }, tone: 'night',
    titleFr: 'Aïd al-Adha Moubarak', titleAr: 'عيد أضحى مبارك',
    wishFr: 'Belle fête de l’Aïd à toutes les familles de Sefrou.', wishAr: 'كل عام وأنتم بخير',
    caption: {
      fr: '🌙 Aïd al-Adha Moubarak ! Le Centre Dentaire Sefrou vous souhaite une fête pleine de partage et de sérénité.',
      darija: '🌙 عيد الأضحى مبروك! كنتمناو ليكم عيد مبارك سعيد مع العائلة والأحباب.',
    },
    hashtags: ['#AidMoubarak', '#AidAlAdha', '#عيد_الأضحى'],
  },
  hijri: {
    label: 'Nouvel An de l’Hégire', emoji: '🌙', motif: 'crescent', when: { hijri: [1, 1] }, tone: 'night',
    titleFr: 'Bonne année de l’Hégire', titleAr: 'سنة هجرية سعيدة',
    wishFr: 'Que cette nouvelle année vous apporte paix et santé.', wishAr: 'كل عام وأنتم بخير',
    caption: {
      fr: '🌙 Bonne et heureuse année de l’Hégire à toutes et à tous !',
      darija: '🌙 سنة هجرية سعيدة! كل عام وأنتم بخير.',
    },
    hashtags: ['#NouvelAnHégire', '#رأس_السنة_الهجرية'],
  },
  mawlid: {
    label: 'Aïd al-Mawlid', emoji: '🌙', motif: 'ramadan', when: { hijri: [3, 12] }, tone: 'night',
    titleFr: 'Aïd al-Mawlid Annabaoui', titleAr: 'ذكرى المولد النبوي الشريف',
    wishFr: 'Heureuse fête du Mawlid à toutes et à tous.', wishAr: 'كل عام وأنتم بخير',
    caption: {
      fr: '🌙 À l’occasion de l’Aïd al-Mawlid Annabaoui, le Centre Dentaire Sefrou vous présente ses vœux chaleureux.',
      darija: '🌙 بمناسبة ذكرى المولد النبوي الشريف، كل عام وأنتم بخير.',
    },
    hashtags: ['#Mawlid', '#المولد_النبوي'],
  },
  aid: {
    label: 'Aïd (générique)', emoji: '🌙', motif: 'crescent', tone: 'night',
    titleFr: 'Aïd Moubarak', titleAr: 'عيد مبارك',
    wishFr: 'Belle fête à vous et à vos proches.', wishAr: 'كل عام وأنتم بخير',
    caption: {
      fr: '🌙 Aïd Moubarak ! Toute l’équipe du Centre Dentaire Sefrou vous souhaite une très belle fête.',
      darija: '🌙 عيد مبارك سعيد! كل عام وأنتم بخير.',
    },
    hashtags: ['#AidMoubarak', '#عيد_مبارك'],
  },

  /* ---------- Journées de santé ---------- */
  sante: {
    label: 'Journée mondiale de la santé bucco-dentaire', emoji: '🦷', motif: 'tooth', when: { fixed: '03-20' }, tone: 'light',
    titleFr: 'Journée mondiale de la santé bucco-dentaire', titleAr: 'اليوم العالمي لصحة الفم والأسنان',
    wishFr: 'Un sourire en bonne santé, ça s’entretient chaque jour.', wishAr: 'ابتسامة صحية تبدأ بالعناية اليومية',
    caption: {
      fr: '🦷 20 mars, Journée mondiale de la santé bucco-dentaire. Prenez soin de votre sourire : brossage matin et soir, fil dentaire, et une visite de contrôle chez votre dentiste.',
      darija: '🦷 20 مارس، اليوم العالمي لصحة الفم والأسنان. حافظو على ضحكتكم: غسلو سنانكم الصباح والليل، وديرو زيارة مراقبة عند طبيب الأسنان.',
    },
    hashtags: ['#WorldOralHealthDay', '#SantéBuccoDentaire', '#صحة_الفم'],
    note: 'Texte de santé : à faire valider par le Dr El Omari.',
  },

  /* ---------- Autre ---------- */
  logo: {
    label: 'Autre occasion (logo du cabinet)', emoji: '✨', motif: 'logo', tone: 'night',
    titleFr: 'Bonne fête', titleAr: 'عيد سعيد',
    wishFr: 'Toute l’équipe vous souhaite une belle fête.', wishAr: 'كل عام وأنتم بخير',
    caption: { fr: '✨ Toute l’équipe du Centre Dentaire Sefrou vous souhaite une belle fête.', darija: '✨ كل عام وأنتم بخير.' },
    hashtags: [],
  },
};

/** Libellés pour la liste déroulante du modèle Fête (sans emoji : le drapeau ne s'affiche pas sous Windows). */
export const OCCASION_OPTIONS = Object.fromEntries(Object.entries(OCCASIONS).map(([k, o]) => [k, o.label]));

/** Occasions dont le dessin affiche un texte (« Texte du motif » : année). */
export const usesBig = (key) => ['year', 'yaz'].includes(OCCASIONS[key]?.motif);

/**
 * Année de la prochaine occurrence d'une occasion à date fixe, aujourd'hui compris
 * (le 13 janvier 2027, Yennayer → 2027 ; le 31 décembre 2026, Nouvel An → 2027).
 * @param {string} key @param {Date} [from]
 */
export function upcomingYear(key, from = new Date()) {
  const y = from.getFullYear();
  const fixed = OCCASIONS[key]?.when?.fixed;
  if (!fixed) return y;
  const [m, d] = fixed.split('-').map(Number);
  return new Date(y, m - 1, d) < new Date(y, from.getMonth(), from.getDate()) ? y + 1 : y;
}

/**
 * Champs du modèle Fête pré-remplis pour une occasion (année utile pour Nouvel An / Yennayer).
 * @param {string} key @param {number} [year]
 */
export function occasionFields(key, year = upcomingYear(key)) {
  const o = OCCASIONS[key] ?? OCCASIONS.logo;
  return {
    occasion: key in OCCASIONS ? key : 'logo',
    tone: o.tone,
    big: o.big ? o.big(year) : '',
    titleFr: o.titleFr,
    titleAr: o.titleAr,
    wishFr: o.wishFr,
    wishAr: o.wishAr,
    signature: SIGNATURE,
  };
}
