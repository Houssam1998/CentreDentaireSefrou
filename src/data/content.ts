import type { ImageMetadata } from 'astro';
import type { Lang } from '@/i18n';

import teeth3 from '@/assets/media/teeth-3.jpg';
import teeth3Before from '@/assets/media/teeth-3-before.jpg';
import teeth2 from '@/assets/media/teeth-2.jpg';
import teeth2Before from '@/assets/media/teeth-2-before.jpg';
import case1SmileBefore from '@/assets/media/cases/case1-smile-before.jpg';
import case1SmileAfter from '@/assets/media/cases/case1-smile-after.jpg';
import case1IntraBefore from '@/assets/media/cases/case1-intra-before.jpg';
import case1IntraAfter from '@/assets/media/cases/case1-intra-after.jpg';
import dsd1 from '@/assets/media/cases/dsd-1.jpg';
import dsd2 from '@/assets/media/cases/dsd-2.jpg';
import dsd3 from '@/assets/media/cases/dsd-3.jpg';

type L<T> = Record<Lang, T>;

/**
 * Real Google reviews (5★) from the clinic's listing, names shortened.
 * English versions are translations; the card says so.
 */
export const testimonials: { name: string; rating: number; date: L<string>; text: L<string> }[] = [
  {
    name: 'Fadoua B.',
    rating: 5,
    date: { fr: 'Octobre 2026', en: 'October 2026' },
    text: {
      fr: 'Dr Amine assure le suivi dentaire de notre famille et nous en sommes pleinement satisfaits. Il fait preuve d’un grand professionnalisme, de rigueur et de bienveillance. Le cabinet est bien organisé et l’accueil irréprochable. Je le recommande sans réserve.',
      en: 'Dr Amine looks after our whole family’s dental care and we are fully satisfied. Great professionalism, rigour and kindness. The clinic is well organised and the welcome is impeccable. I recommend him without reservation.',
    },
  },
  {
    name: 'Abderrahman B.',
    rating: 5,
    date: { fr: 'Octobre 2026', en: 'October 2026' },
    text: {
      fr: 'Excellent dentiste ! Dr Mohamed Amine El Omari est humain, professionnel et à l’écoute. Le cabinet est propre et l’accueil est parfait. Je recommande sans hésiter !',
      en: 'Excellent dentist! Dr Mohamed Amine El Omari is caring, professional and a good listener. The clinic is clean and the welcome is perfect. I recommend him without hesitation!',
    },
  },
  {
    name: 'Rachida B.',
    rating: 5,
    date: { fr: 'Octobre 2026', en: 'October 2026' },
    text: {
      fr: 'Je recommande vivement Dr Amine. Dès l’accueil, on se sent en confiance : le cabinet est propre, moderne et l’équipe est chaleureuse. Mon cas était difficile, et le docteur l’a pris en charge avec beaucoup de sérieux […]',
      en: 'I highly recommend Dr Amine. From the moment you arrive you feel confident: the clinic is clean and modern and the team is warm. My case was difficult, and the doctor handled it very seriously […]',
    },
  },
  {
    name: 'Zaineb Z.',
    rating: 5,
    date: { fr: 'Octobre 2026', en: 'October 2026' },
    text: {
      fr: 'Très satisfaite de mon détartrage ! Dentiste professionnel, doux et à l’écoute. Le soin s’est très bien passé, sans douleur, et le résultat est excellent. Cabinet propre et accueil chaleureux. Je recommande vivement !',
      en: 'Very happy with my scaling! A professional, gentle and attentive dentist. The treatment went very well, painlessly, and the result is excellent. Clean clinic and a warm welcome. Highly recommended!',
    },
  },
  {
    name: 'Rits M.',
    rating: 5,
    date: { fr: 'Septembre 2026', en: 'September 2026' },
    text: {
      fr: 'Très belle expérience chez Dr El Omari. Le cabinet est moderne, très propre et équipé de matériel de dernière génération. Le Dr est très patient, à l’écoute et agréable. Je recommande !',
      en: 'A very good experience with Dr El Omari. The clinic is modern, very clean and equipped with the latest equipment. The doctor is very patient, attentive and pleasant. I recommend!',
    },
  },
  {
    name: 'Khadija B.',
    rating: 5,
    date: { fr: 'Septembre 2026', en: 'September 2026' },
    text: {
      fr: 'Je suis plus que satisfaite du résultat de mon détartrage dentaire. Le travail a été réalisé avec beaucoup de soin et de professionnalisme, et le résultat est vraiment excellent.',
      en: 'I am more than satisfied with the result of my dental scaling. The work was done with great care and professionalism, and the result is truly excellent.',
    },
  },
  {
    name: 'Ibrahim R.',
    rating: 5,
    date: { fr: 'Septembre 2026', en: 'September 2026' },
    text: {
      fr: 'Très compétent et sait parler au patient. Merci docteur !',
      en: 'Very competent and knows how to talk to patients. Thank you, doctor!',
    },
  },
  {
    name: 'Chawki B.',
    rating: 5,
    date: { fr: 'Septembre 2026', en: 'September 2026' },
    text: {
      fr: 'Docteur toujours présent, souriant : retrouvez votre sourire chez notre aimable docteur.',
      en: 'A doctor who is always there and always smiling: get your smile back with our kind doctor.',
    },
  },
];

export interface CaseView {
  label: L<string>;
  before: ImageMetadata;
  after: ImageMetadata;
}

export interface Case {
  id: string;
  /** Real clinical case from the clinic (true) or an illustration (false). */
  real: boolean;
  /** Treatment ids this case illustrates. */
  treatments: string[];
  title: L<string>;
  text: L<string>;
  views: CaseView[];
  /** Digital Smile Design screenshots, when available. */
  design?: ImageMetadata[];
}

/** Real cases first. Illustrations are clearly labelled on the site. */
export const cases: Case[] = [
  {
    id: 'case-incisors',
    real: true,
    treatments: ['veneers', 'smile-design'],
    title: { fr: 'Réhabilitation esthétique des incisives', en: 'Aesthetic restoration of the front teeth' },
    text: {
      fr: 'Incisives colorées, abîmées et espacées : après une conception numérique du sourire, quatre restaurations esthétiques sur mesure redonnent teinte, forme et harmonie.',
      en: 'Discoloured, damaged and spaced front teeth: after a digital smile design, four custom aesthetic restorations restore shade, shape and harmony.',
    },
    views: [
      { label: { fr: 'Sourire', en: 'Smile' }, before: case1SmileBefore, after: case1SmileAfter },
      { label: { fr: 'Vue rapprochée', en: 'Close-up' }, before: case1IntraBefore, after: case1IntraAfter },
    ],
    design: [dsd3, dsd1, dsd2],
  },
  {
    id: 'illustration-whitening',
    real: false,
    treatments: ['whitening'],
    title: { fr: 'Blanchiment professionnel', en: 'Professional whitening' },
    text: { fr: 'Éclaircissement de plusieurs teintes, résultat homogène.', en: 'Lightened by several shades with an even result.' },
    views: [{ label: { fr: 'Vue rapprochée', en: 'Close-up' }, before: teeth3Before, after: teeth3 }],
  },
  {
    id: 'illustration-scaling',
    real: false,
    treatments: ['checkup', 'periodontics'],
    title: { fr: 'Détartrage & polissage', en: 'Scaling & polishing' },
    text: { fr: 'Élimination du tartre et des colorations.', en: 'Removal of tartar and stains.' },
    views: [{ label: { fr: 'Sourire', en: 'Smile' }, before: teeth2Before, after: teeth2 }],
  },
];

export const caseFor = (treatmentId: string) => cases.find((c) => c.treatments.includes(treatmentId));

export const process: L<{ title: string; text: string }[]> = {
  fr: [
    { title: 'Prise de contact', text: 'Par téléphone, WhatsApp ou formulaire : nous vous proposons un rendez-vous rapidement.' },
    { title: 'Consultation & diagnostic', text: 'Examen complet, radiographies si besoin, et écoute de vos attentes.' },
    { title: 'Plan de traitement & devis', text: 'Des options claires, expliquées simplement, avec un devis détaillé.' },
    { title: 'Soins & suivi', text: 'Des soins confortables et un suivi attentif jusqu’au résultat final.' },
  ],
  en: [
    { title: 'Get in touch', text: 'By phone, WhatsApp or form: we offer you an appointment quickly.' },
    { title: 'Consultation & diagnosis', text: 'A complete exam, X-rays if needed, and time to hear your expectations.' },
    { title: 'Treatment plan & quote', text: 'Clear options, explained simply, with a detailed quote.' },
    { title: 'Treatment & follow-up', text: 'Comfortable care and attentive follow-up until the final result.' },
  ],
};

export const generalFaq: L<{ q: string; a: string }[]> = {
  fr: [
    { q: 'Comment prendre rendez-vous ?', a: 'Appelez-nous, écrivez-nous sur WhatsApp ou remplissez le formulaire de contact : nous vous répondons rapidement pour fixer un créneau.' },
    { q: 'Comment se déroule la première consultation ?', a: 'Nous faisons connaissance, examinons vos dents et vos gencives, réalisons des radiographies si nécessaire puis vous expliquons les options possibles.' },
    { q: 'Les soins sont-ils douloureux ?', a: 'Nos soins sont réalisés sous anesthésie locale lorsque c’est nécessaire. Votre confort est une priorité : n’hésitez pas à nous faire part de vos appréhensions.' },
    { q: 'Acceptez-vous les assurances et mutuelles ?', a: 'Nous vous remettons les documents nécessaires à vos remboursements (CNSS, CNOPS, mutuelles privées). Renseignez-vous auprès de notre accueil pour votre cas.' },
    { q: 'Prenez-vous en charge les urgences dentaires ?', a: 'Oui, en cas de douleur, d’infection ou de dent cassée, appelez-nous : nous faisons le maximum pour vous recevoir le jour même.' },
    { q: 'Comment connaître le prix d’un traitement ?', a: 'Chaque cas est différent. Après la consultation, un devis détaillé et transparent vous est remis avant tout soin.' },
  ],
  en: [
    { q: 'How do I book an appointment?', a: 'Call us, message us on WhatsApp or fill in the contact form: we reply quickly to arrange a time.' },
    { q: 'What happens at the first consultation?', a: 'We get to know you, examine your teeth and gums, take X-rays if needed and explain the possible options.' },
    { q: 'Are treatments painful?', a: 'Treatments are done under local anaesthesia when needed. Your comfort is a priority — feel free to tell us about any anxiety.' },
    { q: 'Do you accept insurance?', a: 'We provide the documents needed for your reimbursements (CNSS, CNOPS, private insurers). Ask our front desk about your case.' },
    { q: 'Do you handle dental emergencies?', a: 'Yes. For pain, infection or a broken tooth, call us — we do our best to see you the same day.' },
    { q: 'How can I know the price of a treatment?', a: 'Every case is different. After the consultation you receive a detailed, transparent quote before any treatment.' },
  ],
};
