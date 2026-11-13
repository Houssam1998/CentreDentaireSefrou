/**
 * Coordonnées affichées sur les visuels.
 * La source de vérité reste src/data/site.ts (même fichier que le site) : changez-les là-bas.
 * Seul le compte Instagram et les traductions arabes vivent ici.
 */
import { site } from '@site/data/site.ts';

export const brand = {
  instagram: '@centredentairesefrou',
  tiktok: '@centre.dentaire.sefrou',
  tiktokUrl: site.social.tiktok,
  website: 'centredentairesefrou.com',
  name: site.name,
  nameAr: site.nameAr,
  doctor: site.doctor,
  doctorAr: 'الدكتور أمين العمري',
  phone: site.phone,
  whatsapp: site.whatsappDisplay,
  email: site.email,
  street: site.address.street,
  city: `${site.address.city} ${site.address.postalCode}`,
  cityShort: site.address.city,
  cityAr: 'صفرو',
  mapsUrl: site.mapsUrl,
  bookingUrl: site.bookingUrl,
};

const dayAr = { 'Lundi – Vendredi': 'من الإثنين إلى الجمعة', Samedi: 'السبت', Dimanche: 'الأحد' };

/** Horaires du site (src/data/site.ts → hours), avec la traduction arabe des jours. */
export const hours = site.hours.map((h) => ({
  fr: h.days.fr,
  ar: dayAr[h.days.fr] ?? h.days.fr,
  time: h.time,
}));
