import type { ImageMetadata } from 'astro';
import type { Lang } from '@/i18n';

import implantModel from '@/assets/media/implant-model.jpg';
import dsd1 from '@/assets/media/cases/dsd-1.jpg';
import scanTablet from '@/assets/media/scan-tablet.jpg';
import teeth1 from '@/assets/media/teeth-1.jpg';
import whiteningKit from '@/assets/media/whitening-kit.jpg';
import examMirror from '@/assets/media/exam-mirror.jpg';
import teeth3 from '@/assets/media/teeth-3.jpg';
import teeth2 from '@/assets/media/teeth-2.jpg';
import xrayUnit from '@/assets/media/clinic/xray-unit.jpg';
import dentistExam2 from '@/assets/media/dentist-exam-2.jpg';
import procedure from '@/assets/media/procedure.jpg';
import smileCloseup from '@/assets/media/smile-closeup.jpg';
import treatmentRoom2 from '@/assets/media/clinic/treatment-room-2.jpg';
import sleepCouple from '@/assets/media/sleep-couple.jpg';
import jawPain from '@/assets/media/jaw-pain.jpg';

export type CategoryId = 'implants' | 'aesthetics' | 'general' | 'sleep';

interface TreatmentContent {
  slug: string;
  title: string;
  tagline: string;
  intro: string[];
  benefits: string[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  seo: { title: string; description: string };
}

export interface Treatment {
  id: string;
  category: CategoryId;
  image: ImageMetadata;
  /** Show the intraoral-scanner video on this treatment page (digital impression is part of the workflow). */
  scanner?: boolean;
  fr: TreatmentContent;
  en: TreatmentContent;
}

export interface Category {
  id: CategoryId;
  image: ImageMetadata;
  fr: { title: string; text: string };
  en: { title: string; text: string };
}

export const categories: Category[] = [
  {
    id: 'implants',
    image: xrayUnit,
    fr: {
      title: 'Implants & Chirurgie',
      text: 'Remplacer une dent manquante durablement et réaliser les gestes chirurgicaux en toute sérénité.',
    },
    en: {
      title: 'Implants & Surgery',
      text: 'Replace missing teeth for the long term and undergo oral surgery with complete peace of mind.',
    },
  },
  {
    id: 'aesthetics',
    image: smileCloseup,
    fr: {
      title: 'Esthétique du sourire',
      text: 'Facettes, blanchiment, smile design et aligneurs invisibles pour un sourire lumineux, harmonieux et naturel.',
    },
    en: {
      title: 'Smile Aesthetics',
      text: 'Veneers, whitening, smile design and clear aligners for a bright, harmonious and natural-looking smile.',
    },
  },
  {
    id: 'general',
    image: treatmentRoom2,
    fr: {
      title: 'Soins généraux',
      text: 'Prévention, détartrage, soins des caries, prothèses et gencives : le suivi bucco-dentaire de toute la famille.',
    },
    en: {
      title: 'General Care',
      text: 'Prevention, scaling, fillings, prosthetics and gum care: ongoing dental care for the whole family.',
    },
  },
  {
    id: 'sleep',
    image: sleepCouple,
    fr: {
      title: 'Sommeil & bruxisme',
      text: 'Ronflement, apnée du sommeil et grincement des dents : des solutions sur mesure pour des nuits plus sereines.',
    },
    en: {
      title: 'Sleep & Bruxism',
      text: 'Snoring, sleep apnea and teeth grinding: custom solutions for calmer nights.',
    },
  },
];

// TODO: faire relire et ajuster les textes médicaux par le Dr Omari
export const treatments: Treatment[] = [
  /* ───────────── Implants & Chirurgie ───────────── */
  {
    id: 'implants',
    category: 'implants',
    image: implantModel,
    fr: {
      slug: 'implants-dentaires',
      title: 'Implants dentaires',
      tagline: 'Retrouvez une dent fixe, naturelle et durable.',
      intro: [
        "L'implant dentaire est la solution la plus fiable pour remplacer une ou plusieurs dents manquantes. Une petite racine en titane biocompatible est placée dans l'os de la mâchoire, puis surmontée d'une couronne en céramique réalisée sur mesure.",
        "Au Centre Dentaire Sefrou, chaque implant est planifié avec précision à partir d'un examen radiologique, afin de garantir un résultat esthétique, confortable et pérenne.",
      ],
      benefits: [
        'Aspect et sensation identiques à une dent naturelle',
        'Préserve l’os de la mâchoire',
        'Aucune préparation des dents voisines',
        'Mastication et élocution retrouvées',
        'Solution durable avec un bon entretien',
      ],
      steps: [
        { title: 'Bilan & planification', text: 'Examen clinique et imagerie 3D (CBCT) réalisée au cabinet pour mesurer l’os et planifier précisément l’implant, puis devis détaillé.' },
        { title: 'Pose de l’implant', text: 'Intervention sous anesthésie locale, généralement indolore et réalisée en une séance.' },
        { title: 'Cicatrisation', text: 'L’implant s’intègre à l’os (ostéo-intégration) pendant quelques semaines à quelques mois.' },
        { title: 'Couronne définitive', text: 'Une couronne en céramique, teintée comme vos dents, est fixée sur l’implant.' },
      ],
      faq: [
        { q: 'La pose d’un implant est-elle douloureuse ?', a: 'Non. L’intervention se fait sous anesthésie locale. Une légère gêne peut apparaître les jours suivants ; elle se gère avec des antalgiques classiques.' },
        { q: 'Combien de temps dure le traitement ?', a: 'Comptez en général 3 à 6 mois entre la pose et la couronne définitive, le temps que l’implant s’intègre à l’os. Une dent provisoire peut être proposée selon les cas.' },
        { q: 'Quel est le prix d’un implant dentaire ?', a: 'Le tarif dépend de votre situation (nombre d’implants, besoin de greffe, type de couronne). Un devis détaillé vous est remis après la consultation.' },
      ],
      seo: {
        title: 'Implants dentaires à Sefrou | Dr Amine El Omari',
        description: 'Remplacez vos dents manquantes par des implants dentaires durables et naturels au Centre Dentaire Sefrou. Bilan, devis détaillé et suivi personnalisé.',
      },
    },
    en: {
      slug: 'dental-implants',
      title: 'Dental implants',
      tagline: 'A fixed, natural-looking and long-lasting tooth.',
      intro: [
        'A dental implant is the most reliable way to replace one or more missing teeth. A small biocompatible titanium root is placed in the jawbone, then topped with a custom-made ceramic crown.',
        'At Centre Dentaire Sefrou, every implant is carefully planned from X-ray imaging to deliver an aesthetic, comfortable and long-lasting result.',
      ],
      benefits: [
        'Looks and feels like a natural tooth',
        'Preserves the jawbone',
        'No need to grind down neighbouring teeth',
        'Restores chewing and speech',
        'Long-lasting with good care',
      ],
      steps: [
        { title: 'Assessment & planning', text: 'Clinical exam and in-house 3D imaging (CBCT) to measure the bone and plan the implant precisely, then a detailed quote.' },
        { title: 'Implant placement', text: 'Performed under local anaesthesia, usually painless and completed in one session.' },
        { title: 'Healing', text: 'The implant fuses with the bone (osseointegration) over a few weeks to a few months.' },
        { title: 'Final crown', text: 'A ceramic crown, colour-matched to your teeth, is fixed onto the implant.' },
      ],
      faq: [
        { q: 'Is getting an implant painful?', a: 'No. The procedure is done under local anaesthesia. Mild discomfort may follow for a few days and is easily managed with standard painkillers.' },
        { q: 'How long does treatment take?', a: 'Usually 3 to 6 months between placement and the final crown, while the implant integrates with the bone. A temporary tooth may be offered depending on the case.' },
        { q: 'How much does a dental implant cost?', a: 'It depends on your situation (number of implants, need for grafting, crown type). You receive a detailed quote after the consultation.' },
      ],
      seo: {
        title: 'Dental implants in Sefrou | Dr Amine El Omari',
        description: 'Replace missing teeth with durable, natural-looking dental implants at Centre Dentaire Sefrou. Assessment, detailed quote and personal follow-up.',
      },
    },
  },
  {
    id: 'extraction',
    category: 'implants',
    image: procedure,
    fr: {
      slug: 'extraction-dents-de-sagesse',
      title: 'Extractions & dents de sagesse',
      tagline: 'Des extractions maîtrisées, en douceur.',
      intro: [
        "Lorsqu'une dent ne peut plus être conservée, ou qu'une dent de sagesse est mal positionnée, douloureuse ou incluse, son extraction devient nécessaire pour protéger votre santé bucco-dentaire.",
        "Nous privilégions des techniques atraumatiques qui préservent l'os et accélèrent la cicatrisation, avec des consignes post-opératoires claires pour un rétablissement serein.",
      ],
      benefits: [
        'Anesthésie locale efficace et geste précis',
        'Soulagement des douleurs et infections',
        'Prévention des problèmes d’encombrement dentaire',
        'Préservation de l’os pour un futur implant',
      ],
      steps: [
        { title: 'Diagnostic radiologique', text: 'Une radiographie panoramique, ou 3D (CBCT) pour les dents de sagesse incluses, localise la dent et ses racines avec précision.' },
        { title: 'Intervention', text: 'Extraction sous anesthésie locale, avec des gestes doux et maîtrisés.' },
        { title: 'Suivi', text: 'Conseils personnalisés et contrôle de la cicatrisation.' },
      ],
      faq: [
        { q: 'Faut-il toujours retirer les dents de sagesse ?', a: 'Non. On les retire lorsqu’elles provoquent douleurs, infections, caries ou manquent de place. Un examen radiologique permet de décider.' },
        { q: 'Combien de temps dure la récupération ?', a: 'En général quelques jours. Un léger gonflement est normal les 48 premières heures ; nous vous remettons des consignes précises.' },
        { q: 'Puis-je travailler le lendemain ?', a: 'Pour une extraction simple, oui le plus souvent. Pour une dent de sagesse incluse, prévoyez un à deux jours de repos.' },
      ],
      seo: {
        title: 'Extraction des dents de sagesse à Sefrou | Centre Dentaire Sefrou',
        description: 'Extraction dentaire et retrait des dents de sagesse en douceur au Centre Dentaire Sefrou. Diagnostic radiologique et suivi post-opératoire.',
      },
    },
    en: {
      slug: 'wisdom-teeth-extraction',
      title: 'Extractions & wisdom teeth',
      tagline: 'Gentle, carefully controlled extractions.',
      intro: [
        'When a tooth can no longer be saved, or a wisdom tooth is badly positioned, painful or impacted, removing it protects your oral health.',
        'We favour atraumatic techniques that preserve the bone and speed up healing, with clear aftercare instructions for a calm recovery.',
      ],
      benefits: [
        'Effective local anaesthesia and precise technique',
        'Relief from pain and infection',
        'Prevents crowding problems',
        'Preserves bone for a future implant',
      ],
      steps: [
        { title: 'X-ray diagnosis', text: 'A panoramic X-ray, or 3D CBCT for impacted wisdom teeth, locates the tooth and its roots precisely.' },
        { title: 'Procedure', text: 'Extraction under local anaesthesia with gentle, controlled movements.' },
        { title: 'Follow-up', text: 'Personal aftercare advice and a healing check.' },
      ],
      faq: [
        { q: 'Do wisdom teeth always need to come out?', a: 'No. They are removed when they cause pain, infection, decay or lack space. An X-ray helps decide.' },
        { q: 'How long is recovery?', a: 'Usually a few days. Some swelling is normal for the first 48 hours; we give you precise instructions.' },
        { q: 'Can I work the next day?', a: 'After a simple extraction, usually yes. For an impacted wisdom tooth, plan one or two days of rest.' },
      ],
      seo: {
        title: 'Wisdom teeth extraction in Sefrou | Centre Dentaire Sefrou',
        description: 'Gentle tooth and wisdom teeth extraction at Centre Dentaire Sefrou. X-ray diagnosis and post-operative follow-up.',
      },
    },
  },
  {
    id: 'bone-graft',
    category: 'implants',
    image: scanTablet,
    fr: {
      slug: 'greffe-osseuse',
      title: 'Greffe osseuse',
      tagline: 'Reconstruire l’os pour accueillir un implant.',
      intro: [
        "Après la perte d'une dent, l'os de la mâchoire peut se résorber. La greffe osseuse permet de reconstituer le volume nécessaire pour poser un implant dans de bonnes conditions.",
        "Selon les cas, il peut s'agir d'un comblement après extraction, d'une régénération osseuse guidée ou d'un soulevé de sinus.",
      ],
      benefits: [
        'Rend possible la pose d’implants',
        'Restaure le volume et le soutien des tissus',
        'Améliore le résultat esthétique',
        'Matériaux biocompatibles éprouvés',
      ],
      steps: [
        { title: 'Évaluation du volume osseux', text: 'Imagerie 3D (CBCT) pour mesurer précisément l’os disponible.' },
        { title: 'Greffe', text: 'Mise en place du matériau de comblement sous anesthésie locale.' },
        { title: 'Maturation', text: 'Quelques mois de cicatrisation avant la pose de l’implant.' },
      ],
      faq: [
        { q: 'D’où vient l’os greffé ?', a: 'Nous utilisons le plus souvent des substituts osseux biocompatibles, ce qui évite un second site opératoire.' },
        { q: 'L’intervention est-elle douloureuse ?', a: 'Elle se déroule sous anesthésie locale. Les suites sont généralement comparables à celles d’une extraction.' },
        { q: 'Peut-on poser l’implant en même temps ?', a: 'Parfois, oui. Cela dépend du volume d’os initial ; nous en discutons lors du bilan.' },
      ],
      seo: {
        title: 'Greffe osseuse dentaire à Sefrou | Centre Dentaire Sefrou',
        description: 'Greffe osseuse et soulevé de sinus pour préparer la pose d’implants dentaires au Centre Dentaire Sefrou.',
      },
    },
    en: {
      slug: 'bone-grafting',
      title: 'Bone grafting',
      tagline: 'Rebuilding bone to support an implant.',
      intro: [
        'After a tooth is lost, the jawbone can shrink. A bone graft restores the volume needed to place an implant in good conditions.',
        'Depending on the case, this can be socket preservation after an extraction, guided bone regeneration or a sinus lift.',
      ],
      benefits: [
        'Makes implant placement possible',
        'Restores volume and tissue support',
        'Improves the aesthetic result',
        'Proven biocompatible materials',
      ],
      steps: [
        { title: 'Bone volume assessment', text: '3D imaging (CBCT) to measure the available bone precisely.' },
        { title: 'Graft', text: 'Placement of the graft material under local anaesthesia.' },
        { title: 'Maturation', text: 'A few months of healing before the implant is placed.' },
      ],
      faq: [
        { q: 'Where does the grafted bone come from?', a: 'We mostly use biocompatible bone substitutes, which avoids a second surgical site.' },
        { q: 'Is the procedure painful?', a: 'It is done under local anaesthesia. Recovery is usually similar to an extraction.' },
        { q: 'Can the implant be placed at the same time?', a: 'Sometimes, yes. It depends on the initial bone volume; we discuss it during the assessment.' },
      ],
      seo: {
        title: 'Dental bone grafting in Sefrou | Centre Dentaire Sefrou',
        description: 'Bone grafting and sinus lift to prepare for dental implants at Centre Dentaire Sefrou.',
      },
    },
  },

  /* ───────────── Esthétique ───────────── */
  {
    id: 'veneers',
    category: 'aesthetics',
    image: teeth1,
    fr: {
      slug: 'facettes-dentaires',
      title: 'Facettes dentaires',
      tagline: 'Un sourire harmonieux, en finesse.',
      intro: [
        "Les facettes sont de fines pellicules de céramique collées sur la face visible des dents. Elles corrigent la couleur, la forme, l'alignement léger ou les petits espaces pour un sourire éclatant et naturel.",
        "Chaque facette est conçue sur mesure, en accord avec votre visage, votre teint et vos attentes.",
      ],
      benefits: [
        'Résultat esthétique naturel et lumineux',
        'Céramique résistante aux taches',
        'Préparation minimale de l’émail',
        'Correction de plusieurs défauts à la fois',
      ],
      steps: [
        { title: 'Consultation esthétique', text: 'Analyse de votre sourire, de vos attentes et photos de départ.' },
        { title: 'Projet de sourire', text: 'Simulation et validation de la forme et de la teinte avec vous.' },
        { title: 'Préparation & empreintes', text: 'Préparation très légère des dents et prise d’empreintes.' },
        { title: 'Pose des facettes', text: 'Collage définitif et ajustements pour un confort parfait.' },
      ],
      faq: [
        { q: 'Les facettes abîment-elles les dents ?', a: 'Les facettes modernes sont très fines et ne demandent qu’une préparation minimale de l’émail.' },
        { q: 'Combien de temps durent-elles ?', a: 'Avec une bonne hygiène et des contrôles réguliers, des facettes en céramique durent de nombreuses années.' },
        { q: 'Le résultat paraît-il naturel ?', a: 'Oui : forme, transparence et teinte sont choisies pour s’accorder à votre visage et à vos autres dents.' },
      ],
      seo: {
        title: 'Facettes dentaires à Sefrou | Centre Dentaire Sefrou',
        description: 'Facettes dentaires en céramique sur mesure pour un sourire naturel et lumineux, au Centre Dentaire Sefrou avec le Dr Amine El Omari.',
      },
    },
    en: {
      slug: 'veneers',
      title: 'Dental veneers',
      tagline: 'A harmonious smile, with finesse.',
      intro: [
        'Veneers are thin ceramic shells bonded to the visible surface of the teeth. They correct colour, shape, slight misalignment or small gaps for a radiant, natural smile.',
        'Each veneer is custom-made to suit your face, complexion and expectations.',
      ],
      benefits: [
        'Natural, luminous aesthetic result',
        'Stain-resistant ceramic',
        'Minimal enamel preparation',
        'Corrects several issues at once',
      ],
      steps: [
        { title: 'Aesthetic consultation', text: 'Analysis of your smile, your expectations and initial photos.' },
        { title: 'Smile project', text: 'Preview and approval of shape and shade with you.' },
        { title: 'Preparation & impressions', text: 'Very light tooth preparation and impressions.' },
        { title: 'Fitting', text: 'Final bonding and adjustments for perfect comfort.' },
      ],
      faq: [
        { q: 'Do veneers damage teeth?', a: 'Modern veneers are very thin and only require minimal enamel preparation.' },
        { q: 'How long do they last?', a: 'With good hygiene and regular check-ups, ceramic veneers last many years.' },
        { q: 'Will it look natural?', a: 'Yes: shape, translucency and shade are chosen to match your face and your other teeth.' },
      ],
      seo: {
        title: 'Dental veneers in Sefrou | Centre Dentaire Sefrou',
        description: 'Custom ceramic veneers for a natural, radiant smile at Centre Dentaire Sefrou with Dr Amine El Omari.',
      },
    },
  },
  {
    id: 'whitening',
    category: 'aesthetics',
    image: smileCloseup,
    fr: {
      slug: 'blanchiment-dentaire',
      title: 'Blanchiment dentaire',
      tagline: 'Des dents plus blanches, en toute sécurité.',
      intro: [
        "Café, thé, tabac ou simple vieillissement : la couleur des dents s'assombrit avec le temps. Le blanchiment professionnel éclaircit l'émail de façon sûre et contrôlée.",
        "Nous vous proposons un blanchiment au fauteuil, à domicile avec des gouttières sur mesure, ou une combinaison des deux selon vos objectifs.",
      ],
      benefits: [
        'Résultat visible et homogène',
        'Produits professionnels sûrs pour l’émail',
        'Gouttières sur mesure pour le confort',
        'Sensibilité maîtrisée et suivie',
      ],
      steps: [
        { title: 'Bilan', text: 'Contrôle de la santé des dents et des gencives, détartrage si nécessaire.' },
        { title: 'Choix de la teinte', text: 'Mesure de la teinte de départ et définition de l’objectif.' },
        { title: 'Blanchiment', text: 'Séance au fauteuil et/ou gouttières à porter à domicile.' },
      ],
      faq: [
        { q: 'Le blanchiment est-il dangereux pour l’émail ?', a: 'Réalisé et suivi par un dentiste avec des produits professionnels, il est sans danger pour l’émail.' },
        { q: 'Combien de temps dure le résultat ?', a: 'Plusieurs années selon vos habitudes (café, thé, tabac). Des retouches ponctuelles permettent de l’entretenir.' },
        { q: 'Les couronnes et facettes blanchissent-elles ?', a: 'Non, seules les dents naturelles s’éclaircissent. Nous en tenons compte dans votre plan de traitement.' },
      ],
      seo: {
        title: 'Blanchiment dentaire à Sefrou | Centre Dentaire Sefrou',
        description: 'Blanchiment dentaire professionnel au fauteuil ou à domicile au Centre Dentaire Sefrou. Résultat sûr, homogène et durable.',
      },
    },
    en: {
      slug: 'teeth-whitening',
      title: 'Teeth whitening',
      tagline: 'Whiter teeth, safely.',
      intro: [
        'Coffee, tea, tobacco or simply time: teeth darken over the years. Professional whitening lightens enamel in a safe, controlled way.',
        'We offer in-chair whitening, at-home whitening with custom trays, or a combination of both depending on your goals.',
      ],
      benefits: [
        'Visible, even result',
        'Professional products that are safe for enamel',
        'Custom trays for comfort',
        'Sensitivity managed and monitored',
      ],
      steps: [
        { title: 'Check-up', text: 'Teeth and gum health check, scaling if needed.' },
        { title: 'Shade selection', text: 'Measure the starting shade and set the goal.' },
        { title: 'Whitening', text: 'In-chair session and/or trays to wear at home.' },
      ],
      faq: [
        { q: 'Is whitening harmful to enamel?', a: 'When performed and supervised by a dentist with professional products, it is safe for enamel.' },
        { q: 'How long does the result last?', a: 'Several years depending on your habits (coffee, tea, tobacco). Occasional touch-ups keep it fresh.' },
        { q: 'Do crowns and veneers get whiter?', a: 'No, only natural teeth lighten. We take this into account in your treatment plan.' },
      ],
      seo: {
        title: 'Teeth whitening in Sefrou | Centre Dentaire Sefrou',
        description: 'Professional in-chair or at-home teeth whitening at Centre Dentaire Sefrou. Safe, even and lasting results.',
      },
    },
  },
  {
    id: 'smile-design',
    category: 'aesthetics',
    image: dsd1,
    fr: {
      slug: 'smile-design',
      title: 'Smile design',
      tagline: 'Votre sourire, pensé dans son ensemble.',
      intro: [
        "Le smile design est une approche globale qui étudie vos dents, vos gencives, vos lèvres et les proportions de votre visage pour concevoir le sourire qui vous ressemble.",
        "Il peut combiner blanchiment, facettes, couronnes ou remodelage gingival, avec un aperçu du résultat avant de commencer.",
      ],
      benefits: [
        'Un plan esthétique cohérent et personnalisé',
        'Aperçu du résultat avant traitement',
        'Harmonie avec les traits du visage',
        'Approche respectueuse des tissus',
      ],
      steps: [
        { title: 'Analyse du sourire', text: 'Photos, vidéos et mesures pour comprendre votre sourire.' },
        { title: 'Conception', text: 'Proposition d’un projet de sourire et validation ensemble.' },
        { title: 'Réalisation', text: 'Mise en œuvre des soins choisis, étape par étape.' },
      ],
      faq: [
        { q: 'Le smile design convient-il à tout le monde ?', a: 'Il s’adapte à chacun : de simples retouches aux réhabilitations plus complètes. La consultation permet de définir le projet.' },
        { q: 'Puis-je voir le résultat avant ?', a: 'Oui, un aperçu (simulation ou maquette en bouche) vous est présenté avant tout soin définitif.' },
        { q: 'Combien de séances faut-il ?', a: 'Cela dépend des soins retenus. Le planning et le devis vous sont détaillés dès la conception.' },
      ],
      seo: {
        title: 'Smile design à Sefrou | Centre Dentaire Sefrou',
        description: 'Concevez le sourire qui vous ressemble grâce au smile design au Centre Dentaire Sefrou : analyse, aperçu du résultat et soins sur mesure.',
      },
    },
    en: {
      slug: 'smile-design',
      title: 'Smile design',
      tagline: 'Your smile, designed as a whole.',
      intro: [
        'Smile design is a global approach that studies your teeth, gums, lips and facial proportions to create a smile that truly suits you.',
        'It can combine whitening, veneers, crowns or gum contouring, with a preview of the result before starting.',
      ],
      benefits: [
        'A coherent, personalised aesthetic plan',
        'Preview of the result before treatment',
        'Harmony with your facial features',
        'Tissue-friendly approach',
      ],
      steps: [
        { title: 'Smile analysis', text: 'Photos, videos and measurements to understand your smile.' },
        { title: 'Design', text: 'A smile project proposed and approved together.' },
        { title: 'Treatment', text: 'The chosen treatments carried out step by step.' },
      ],
      faq: [
        { q: 'Is smile design for everyone?', a: 'It adapts to everyone, from small touch-ups to complete makeovers. The consultation defines the project.' },
        { q: 'Can I see the result first?', a: 'Yes, a preview (simulation or in-mouth mock-up) is shown before any permanent treatment.' },
        { q: 'How many sessions are needed?', a: 'It depends on the chosen treatments. The schedule and quote are detailed during the design phase.' },
      ],
      seo: {
        title: 'Smile design in Sefrou | Centre Dentaire Sefrou',
        description: 'Design a smile that suits you with smile design at Centre Dentaire Sefrou: analysis, result preview and tailored treatment.',
      },
    },
  },

  {
    id: 'aligners',
    category: 'aesthetics',
    scanner: true,
    image: whiteningKit,
    fr: {
      slug: 'traitement-par-aligneurs',
      title: 'Traitement par aligneurs',
      tagline: 'Des dents alignées, en toute discrétion.',
      intro: [
        "Les aligneurs sont des gouttières transparentes, fines et amovibles, fabriquées sur mesure. Portées successivement, elles déplacent progressivement les dents pour corriger un encombrement, des espaces ou un léger décalage, sans bagues ni fils métalliques.",
        "Au Centre Dentaire Sefrou, le traitement commence par une empreinte numérique au scanner intra-oral : votre plan de traitement est simulé en 3D, et vous visualisez le résultat attendu avant de commencer.",
      ],
      benefits: [
        'Pratiquement invisibles au quotidien',
        'Amovibles pour manger et se brosser les dents',
        'Empreinte numérique, sans pâte à empreinte',
        'Résultat simulé en 3D avant de commencer',
        'Adaptés aux adolescents comme aux adultes',
      ],
      steps: [
        { title: 'Consultation & scan 3D', text: 'Examen clinique, radiographie si nécessaire et empreinte optique de vos dents en quelques minutes.' },
        { title: 'Plan de traitement virtuel', text: 'Simulation des déplacements dentaires et présentation du résultat prévu, avec un devis détaillé.' },
        { title: 'Port des aligneurs', text: 'Une nouvelle série environ toutes les une à deux semaines, avec des contrôles réguliers au cabinet.' },
        { title: 'Contention', text: 'Une contention fixe ou amovible stabilise le résultat dans la durée.' },
      ],
      faq: [
        { q: 'Combien de temps dure un traitement par aligneurs ?', a: 'En général de 6 à 18 mois selon la complexité du cas. La durée exacte vous est indiquée lors de la planification 3D.' },
        { q: 'Combien d’heures par jour faut-il les porter ?', a: 'Environ 22 heures par jour : on ne les retire que pour manger, boire autre chose que de l’eau et se brosser les dents.' },
        { q: 'Les aligneurs conviennent-ils à tout le monde ?', a: 'Ils corrigent la plupart des défauts d’alignement légers à modérés. Les cas plus complexes sont évalués lors de la consultation.' },
      ],
      seo: {
        title: 'Traitement par aligneurs invisibles à Sefrou | Centre Dentaire Sefrou',
        description: 'Alignez vos dents avec des aligneurs transparents sur mesure au Centre Dentaire Sefrou : empreinte numérique, simulation 3D et suivi régulier.',
      },
    },
    en: {
      slug: 'clear-aligners',
      title: 'Clear aligners',
      tagline: 'Straighter teeth, discreetly.',
      intro: [
        'Aligners are thin, clear, removable trays made to measure. Worn in sequence, they gradually move the teeth to correct crowding, gaps or slight misalignment, without brackets or wires.',
        'At Centre Dentaire Sefrou, treatment starts with a digital impression using the intraoral scanner: your treatment is simulated in 3D and you can see the expected result before starting.',
      ],
      benefits: [
        'Practically invisible day to day',
        'Removable for eating and brushing',
        'Digital impression, no impression paste',
        'Result simulated in 3D before starting',
        'Suitable for teenagers and adults',
      ],
      steps: [
        { title: 'Consultation & 3D scan', text: 'Clinical exam, X-ray if needed and an optical impression of your teeth in a few minutes.' },
        { title: 'Virtual treatment plan', text: 'Simulation of tooth movements and presentation of the expected result, with a detailed quote.' },
        { title: 'Wearing the aligners', text: 'A new set roughly every one to two weeks, with regular check-ups at the clinic.' },
        { title: 'Retention', text: 'A fixed or removable retainer keeps the result stable over time.' },
      ],
      faq: [
        { q: 'How long does aligner treatment take?', a: 'Usually 6 to 18 months depending on complexity. The exact duration is given during the 3D planning.' },
        { q: 'How many hours a day must they be worn?', a: 'About 22 hours a day: they only come out for eating, drinking anything other than water, and brushing.' },
        { q: 'Are aligners suitable for everyone?', a: 'They correct most mild to moderate alignment problems. More complex cases are assessed at the consultation.' },
      ],
      seo: {
        title: 'Clear aligner treatment in Sefrou | Centre Dentaire Sefrou',
        description: 'Straighten your teeth with custom clear aligners at Centre Dentaire Sefrou: digital impression, 3D simulation and regular follow-up.',
      },
    },
  },

  /* ───────────── Soins généraux ───────────── */
  {
    id: 'fillings',
    category: 'general',
    image: examMirror,
    fr: {
      slug: 'soins-conservateurs',
      title: 'Caries & dévitalisation',
      tagline: 'Soigner et conserver vos dents naturelles.',
      intro: [
        "Les soins conservateurs ont pour but de sauver la dent : traitement des caries avec des composites esthétiques couleur dent, et traitement de canal (dévitalisation) lorsque le nerf est atteint.",
        "Réalisés sous anesthésie locale, ces soins soulagent la douleur et évitent l'extraction.",
      ],
      benefits: [
        'Obturations esthétiques invisibles',
        'Soulagement rapide de la douleur',
        'Conservation de la dent naturelle',
        'Soins réalisés sans douleur',
      ],
      steps: [
        { title: 'Diagnostic', text: 'Examen clinique et radiographie pour évaluer l’atteinte.' },
        { title: 'Soin', text: 'Nettoyage de la carie ou du canal, puis obturation étanche.' },
        { title: 'Restauration', text: 'Composite esthétique ou couronne pour protéger la dent si besoin.' },
      ],
      faq: [
        { q: 'Une dévitalisation fait-elle mal ?', a: 'Non, elle se fait sous anesthésie locale. Elle soulage au contraire la douleur causée par l’infection du nerf.' },
        { q: 'Combien de séances pour un traitement de canal ?', a: 'Une à deux séances en général, selon la dent et l’état d’infection.' },
        { q: 'Faut-il une couronne après une dévitalisation ?', a: 'Souvent, sur les molaires, pour éviter que la dent fragilisée ne se fracture. Nous vous conseillons au cas par cas.' },
      ],
      seo: {
        title: 'Soins des caries et dévitalisation à Sefrou | Centre Dentaire Sefrou',
        description: 'Traitement des caries, composites esthétiques et traitement de canal sans douleur au Centre Dentaire Sefrou.',
      },
    },
    en: {
      slug: 'fillings-root-canal',
      title: 'Fillings & root canal',
      tagline: 'Treat and keep your natural teeth.',
      intro: [
        'Restorative care aims to save the tooth: treating decay with tooth-coloured composite fillings, and root canal treatment when the nerve is affected.',
        'Performed under local anaesthesia, these treatments relieve pain and avoid extraction.',
      ],
      benefits: [
        'Invisible tooth-coloured fillings',
        'Fast pain relief',
        'Keeps your natural tooth',
        'Pain-free treatment',
      ],
      steps: [
        { title: 'Diagnosis', text: 'Clinical exam and X-ray to assess the damage.' },
        { title: 'Treatment', text: 'Cleaning of the decay or canal, then a tight seal.' },
        { title: 'Restoration', text: 'Aesthetic composite or a crown to protect the tooth if needed.' },
      ],
      faq: [
        { q: 'Does a root canal hurt?', a: 'No, it is done under local anaesthesia. It actually relieves the pain caused by the infected nerve.' },
        { q: 'How many sessions for a root canal?', a: 'Usually one or two, depending on the tooth and the infection.' },
        { q: 'Do I need a crown after a root canal?', a: 'Often on molars, to prevent the weakened tooth from fracturing. We advise case by case.' },
      ],
      seo: {
        title: 'Fillings and root canal treatment in Sefrou | Centre Dentaire Sefrou',
        description: 'Decay treatment, aesthetic fillings and pain-free root canal treatment at Centre Dentaire Sefrou.',
      },
    },
  },
  {
    id: 'prosthetics',
    category: 'general',
    image: teeth3,
    fr: {
      slug: 'protheses-dentaires',
      title: 'Couronnes, bridges & prothèses',
      tagline: 'Restaurer confort et esthétique.',
      intro: [
        "Couronnes, bridges et prothèses amovibles permettent de reconstruire une dent abîmée ou de remplacer des dents absentes, pour retrouver une mastication efficace et un sourire complet.",
        "Nous travaillons avec des matériaux modernes — céramique, zircone — choisis pour leur solidité et leur rendu naturel.",
      ],
      benefits: [
        'Matériaux esthétiques et résistants',
        'Teinte assortie à vos dents',
        'Solutions fixes ou amovibles',
        'Confort de mastication retrouvé',
      ],
      steps: [
        { title: 'Étude du cas', text: 'Choix de la solution la plus adaptée et devis détaillé.' },
        { title: 'Préparation & empreintes', text: 'Préparation des dents et empreintes précises.' },
        { title: 'Essayage & pose', text: 'Contrôle de l’ajustement, de la teinte et de l’occlusion avant la pose.' },
      ],
      faq: [
        { q: 'Quelle différence entre couronne et bridge ?', a: 'La couronne recouvre une dent abîmée ; le bridge remplace une dent absente en s’appuyant sur les dents voisines.' },
        { q: 'Combien de temps faut-il ?', a: 'Généralement deux à trois rendez-vous sur quelques semaines, avec une solution provisoire entre-temps.' },
        { q: 'Une prothèse amovible est-elle confortable ?', a: 'Les prothèses modernes sont plus légères et mieux ajustées. Une courte période d’adaptation est normale.' },
      ],
      seo: {
        title: 'Couronnes, bridges et prothèses dentaires à Sefrou | Centre Dentaire Sefrou',
        description: 'Couronnes céramique et zircone, bridges et prothèses dentaires sur mesure au Centre Dentaire Sefrou.',
      },
    },
    en: {
      slug: 'crowns-bridges-dentures',
      title: 'Crowns, bridges & dentures',
      tagline: 'Restoring comfort and aesthetics.',
      intro: [
        'Crowns, bridges and removable dentures rebuild a damaged tooth or replace missing teeth, restoring efficient chewing and a complete smile.',
        'We use modern materials — ceramic, zirconia — chosen for their strength and natural look.',
      ],
      benefits: [
        'Aesthetic, durable materials',
        'Shade matched to your teeth',
        'Fixed or removable solutions',
        'Comfortable chewing restored',
      ],
      steps: [
        { title: 'Case study', text: 'Choosing the most suitable solution and a detailed quote.' },
        { title: 'Preparation & impressions', text: 'Tooth preparation and precise impressions.' },
        { title: 'Try-in & fitting', text: 'Checking fit, shade and bite before final placement.' },
      ],
      faq: [
        { q: 'What is the difference between a crown and a bridge?', a: 'A crown covers a damaged tooth; a bridge replaces a missing tooth using the neighbouring teeth as support.' },
        { q: 'How long does it take?', a: 'Usually two to three appointments over a few weeks, with a temporary solution in between.' },
        { q: 'Are removable dentures comfortable?', a: 'Modern dentures are lighter and better fitting. A short adaptation period is normal.' },
      ],
      seo: {
        title: 'Crowns, bridges and dentures in Sefrou | Centre Dentaire Sefrou',
        description: 'Ceramic and zirconia crowns, bridges and custom dentures at Centre Dentaire Sefrou.',
      },
    },
  },
  {
    id: 'periodontics',
    category: 'general',
    image: teeth2,
    fr: {
      slug: 'parodontie',
      title: 'Soins des gencives',
      tagline: 'Des gencives saines, base d’un beau sourire.',
      intro: [
        "Gencives qui saignent, mauvaise haleine, dents qui bougent : ce sont les signes d'une maladie parodontale. Non traitée, elle peut entraîner la perte de dents.",
        "Un traitement adapté — surfaçage, assainissement, suivi régulier — permet de stopper l'inflammation et de stabiliser vos dents.",
      ],
      benefits: [
        'Arrêt du saignement et de l’inflammation',
        'Stabilisation des dents mobiles',
        'Haleine fraîche retrouvée',
        'Prévention de la perte dentaire',
      ],
      steps: [
        { title: 'Bilan parodontal', text: 'Mesure de l’état des gencives et radiographies.' },
        { title: 'Assainissement', text: 'Détartrage approfondi et surfaçage des racines.' },
        { title: 'Maintenance', text: 'Contrôles réguliers pour maintenir des gencives saines.' },
      ],
      faq: [
        { q: 'Comment savoir si j’ai une maladie des gencives ?', a: 'Saignements au brossage, gencives rouges ou gonflées, mauvaise haleine persistante ou dents qui bougent sont les principaux signes.' },
        { q: 'Le traitement est-il douloureux ?', a: 'Le surfaçage se fait sous anesthésie locale. Une légère sensibilité peut apparaître quelques jours.' },
        { q: 'Peut-on guérir la parodontite ?', a: 'On peut la stabiliser durablement avec un traitement adapté et un suivi régulier.' },
      ],
      seo: {
        title: 'Traitement des gencives (parodontie) à Sefrou | Centre Dentaire Sefrou',
        description: 'Gencives qui saignent ou dents qui bougent ? Traitement parodontal et suivi au Centre Dentaire Sefrou.',
      },
    },
    en: {
      slug: 'gum-treatment',
      title: 'Gum care',
      tagline: 'Healthy gums, the foundation of a beautiful smile.',
      intro: [
        'Bleeding gums, bad breath, loose teeth: these are signs of gum disease. Left untreated, it can lead to tooth loss.',
        'Appropriate treatment — root planing, deep cleaning, regular maintenance — stops the inflammation and stabilises your teeth.',
      ],
      benefits: [
        'Stops bleeding and inflammation',
        'Stabilises loose teeth',
        'Fresh breath restored',
        'Prevents tooth loss',
      ],
      steps: [
        { title: 'Gum assessment', text: 'Measuring gum health and taking X-rays.' },
        { title: 'Deep cleaning', text: 'Thorough scaling and root planing.' },
        { title: 'Maintenance', text: 'Regular check-ups to keep gums healthy.' },
      ],
      faq: [
        { q: 'How do I know if I have gum disease?', a: 'Bleeding when brushing, red or swollen gums, persistent bad breath or loose teeth are the main signs.' },
        { q: 'Is treatment painful?', a: 'Root planing is done under local anaesthesia. Mild sensitivity may last a few days.' },
        { q: 'Can periodontitis be cured?', a: 'It can be stabilised for the long term with appropriate treatment and regular follow-up.' },
      ],
      seo: {
        title: 'Gum treatment (periodontics) in Sefrou | Centre Dentaire Sefrou',
        description: 'Bleeding gums or loose teeth? Periodontal treatment and follow-up at Centre Dentaire Sefrou.',
      },
    },
  },
  {
    id: 'checkup',
    category: 'general',
    image: dentistExam2,
    fr: {
      slug: 'detartrage-controle',
      title: 'Détartrage & contrôle',
      tagline: 'La prévention, meilleur soin de votre sourire.',
      intro: [
        "Un contrôle et un détartrage réguliers — idéalement tous les six mois à un an — permettent de détecter tôt les problèmes et de garder des dents et des gencives en pleine santé.",
        "C'est aussi le moment de recevoir des conseils personnalisés sur le brossage et l'hygiène.",
      ],
      benefits: [
        'Détection précoce des caries',
        'Élimination du tartre et des taches',
        'Gencives plus saines',
        'Moins de soins lourds à long terme',
      ],
      steps: [
        { title: 'Examen', text: 'Contrôle complet des dents, gencives et muqueuses.' },
        { title: 'Détartrage & polissage', text: 'Élimination du tartre et des colorations.' },
        { title: 'Conseils', text: 'Recommandations d’hygiène adaptées à vous.' },
      ],
      faq: [
        { q: 'À quelle fréquence faire un détartrage ?', a: 'En général une à deux fois par an, selon la vitesse de formation du tartre et l’état des gencives.' },
        { q: 'Le détartrage abîme-t-il l’émail ?', a: 'Non. Il élimine uniquement le tartre déposé sur les dents, sans altérer l’émail.' },
        { q: 'Est-ce douloureux ?', a: 'Le plus souvent non. En cas de gencives sensibles, nous adaptons le geste pour votre confort.' },
      ],
      seo: {
        title: 'Détartrage et contrôle dentaire à Sefrou | Centre Dentaire Sefrou',
        description: 'Détartrage, polissage et contrôle dentaire régulier au Centre Dentaire Sefrou pour prévenir caries et maladies des gencives.',
      },
    },
    en: {
      slug: 'scaling-check-up',
      title: 'Scaling & check-up',
      tagline: 'Prevention is the best care for your smile.',
      intro: [
        'Regular check-ups and scaling — ideally every six months to a year — catch problems early and keep teeth and gums healthy.',
        'It is also the time to get personal advice on brushing and hygiene.',
      ],
      benefits: [
        'Early detection of decay',
        'Removes tartar and stains',
        'Healthier gums',
        'Less extensive treatment in the long run',
      ],
      steps: [
        { title: 'Exam', text: 'Complete check of teeth, gums and soft tissues.' },
        { title: 'Scaling & polishing', text: 'Removal of tartar and stains.' },
        { title: 'Advice', text: 'Hygiene recommendations tailored to you.' },
      ],
      faq: [
        { q: 'How often should I have scaling?', a: 'Usually once or twice a year, depending on how quickly tartar builds up and the state of your gums.' },
        { q: 'Does scaling damage enamel?', a: 'No. It only removes the tartar deposited on the teeth, without affecting enamel.' },
        { q: 'Is it painful?', a: 'Usually not. If your gums are sensitive, we adapt the technique for your comfort.' },
      ],
      seo: {
        title: 'Scaling and dental check-up in Sefrou | Centre Dentaire Sefrou',
        description: 'Scaling, polishing and regular dental check-ups at Centre Dentaire Sefrou to prevent decay and gum disease.',
      },
    },
  },
  /* ───────────── Sommeil & bruxisme ───────────── */
  {
    id: 'sleep-apnea',
    category: 'sleep',
    scanner: true,
    image: sleepCouple,
    fr: {
      slug: 'ronflement-apnee-du-sommeil',
      title: 'Ronflement & apnée du sommeil',
      tagline: 'Retrouver des nuits calmes et réparatrices.',
      intro: [
        "Le ronflement est le bruit produit par la vibration du voile du palais et des tissus de la gorge lorsque l'air passe dans des voies respiratoires rétrécies. Il n'apparaît que pendant le sommeil : les muscles se relâchent et la langue a tendance à reculer, ce qui réduit le passage de l'air. Lorsque ce passage se ferme par moments, on parle d'apnée du sommeil.",
        "Dans les formes légères à modérées, une orthèse d'avancée mandibulaire sur mesure, associée à des mesures d'hygiène de vie (perte de poids notamment), est un traitement efficace : en maintenant la mâchoire inférieure légèrement vers l'avant pendant la nuit, elle libère les voies respiratoires. Les formes sévères relèvent le plus souvent d'un appareil de pression positive continue (PPC) ou d'un traitement chirurgical ; l'orthèse constitue alors une alternative lorsque la PPC n'est pas tolérée. Le traitement est mené en coordination avec votre médecin ou un spécialiste du sommeil.",
      ],
      benefits: [
        'Réduction du ronflement, pour vous et votre entourage',
        'Sommeil plus réparateur et moins de fatigue dans la journée',
        'Orthèse sur mesure, discrète et confortable',
        'Alternative lorsque la PPC n’est pas tolérée',
        'Empreinte numérique au scanner intra-oral',
      ],
      steps: [
        { title: 'Consultation & bilan', text: 'Questionnaire sur votre sommeil, examen de la bouche et des articulations ; un enregistrement du sommeil prescrit par un médecin permet de confirmer le diagnostic.' },
        { title: 'Empreinte numérique', text: 'Scan intra-oral de vos deux arcades pour concevoir une orthèse parfaitement ajustée.' },
        { title: 'Pose & réglage', text: 'Remise de l’orthèse, explications d’utilisation et réglage progressif de l’avancée.' },
        { title: 'Suivi', text: 'Contrôles réguliers et évaluation de l’efficacité avec votre médecin.' },
      ],
      faq: [
        { q: 'Le ronflement est-il dangereux ?', a: 'Un ronflement simple est surtout gênant. Associé à des pauses respiratoires, une fatigue ou une somnolence dans la journée, il peut révéler une apnée du sommeil, qui doit être diagnostiquée et traitée.' },
        { q: 'L’orthèse est-elle confortable ?', a: 'Elle est fabriquée sur mesure et réglée progressivement. Une courte période d’adaptation est normale ; la plupart des patients la portent ensuite sans difficulté.' },
        { q: 'Faut-il consulter un médecin du sommeil ?', a: 'Pour une suspicion d’apnée, oui : un enregistrement du sommeil confirme le diagnostic et sa sévérité. Nous travaillons en coordination avec votre médecin.' },
      ],
      seo: {
        title: 'Traitement du ronflement et de l’apnée du sommeil à Sefrou | Centre Dentaire Sefrou',
        description: 'Ronflement ou apnée du sommeil légère à modérée : orthèse d’avancée mandibulaire sur mesure au Centre Dentaire Sefrou, en coordination avec votre médecin.',
      },
    },
    en: {
      slug: 'snoring-sleep-apnea',
      title: 'Snoring & sleep apnea',
      tagline: 'Calm, restorative nights again.',
      intro: [
        'Snoring is the sound made by the vibration of the soft palate and throat tissues when air passes through narrowed airways. It only happens during sleep: muscles relax and the tongue tends to fall back, reducing the airway. When the airway closes at times, it is called sleep apnea.',
        'For mild to moderate forms, a custom mandibular advancement device, combined with lifestyle measures (especially weight loss), is an effective treatment: by holding the lower jaw slightly forward at night, it keeps the airway open. Severe forms usually call for a CPAP machine or surgery; the device is then an alternative when CPAP is not tolerated. Treatment is coordinated with your doctor or a sleep specialist.',
      ],
      benefits: [
        'Less snoring, for you and your partner',
        'More restorative sleep and less daytime fatigue',
        'Custom device, discreet and comfortable',
        'An alternative when CPAP is not tolerated',
        'Digital impression with the intraoral scanner',
      ],
      steps: [
        { title: 'Consultation & assessment', text: 'Sleep questionnaire, examination of the mouth and jaw joints; a sleep study prescribed by a doctor confirms the diagnosis.' },
        { title: 'Digital impression', text: 'Intraoral scan of both arches to design a perfectly fitting device.' },
        { title: 'Fitting & adjustment', text: 'Delivery of the device, instructions for use and gradual adjustment of the advancement.' },
        { title: 'Follow-up', text: 'Regular check-ups and effectiveness review with your doctor.' },
      ],
      faq: [
        { q: 'Is snoring dangerous?', a: 'Simple snoring is mostly a nuisance. With breathing pauses, fatigue or daytime sleepiness, it may indicate sleep apnea, which must be diagnosed and treated.' },
        { q: 'Is the device comfortable?', a: 'It is custom-made and adjusted gradually. A short adaptation period is normal; most patients then wear it without difficulty.' },
        { q: 'Do I need to see a sleep doctor?', a: 'If apnea is suspected, yes: a sleep study confirms the diagnosis and its severity. We work in coordination with your doctor.' },
      ],
      seo: {
        title: 'Snoring and sleep apnea treatment in Sefrou | Centre Dentaire Sefrou',
        description: 'Snoring or mild to moderate sleep apnea: custom mandibular advancement device at Centre Dentaire Sefrou, coordinated with your doctor.',
      },
    },
  },
  {
    id: 'bruxism',
    category: 'sleep',
    scanner: true,
    image: jawPain,
    fr: {
      slug: 'bruxisme',
      title: 'Bruxisme',
      tagline: 'Protéger vos dents du grincement et du serrement.',
      intro: [
        "Le bruxisme consiste à serrer ou grincer des dents, le plus souvent la nuit et sans s'en rendre compte. Il peut provoquer une usure des dents, des fêlures, une sensibilité, des douleurs de la mâchoire ou des tempes et des maux de tête au réveil.",
        "Le traitement repose principalement sur une gouttière occlusale sur mesure, portée la nuit, qui protège les dents et détend les muscles de la mâchoire. Il s'accompagne de conseils (gestion du stress, habitudes de sommeil) et, si nécessaire, de la restauration des dents usées.",
      ],
      benefits: [
        'Protection des dents contre l’usure et les fractures',
        'Soulagement des douleurs de la mâchoire et des maux de tête',
        'Gouttière fine, sur mesure et confortable',
        'Protection des couronnes, facettes et implants',
      ],
      steps: [
        { title: 'Diagnostic', text: 'Examen de l’usure des dents, des muscles et des articulations de la mâchoire.' },
        { title: 'Empreinte numérique', text: 'Scan intra-oral pour une gouttière parfaitement ajustée.' },
        { title: 'Pose de la gouttière', text: 'Remise de la gouttière, réglage de l’occlusion et conseils.' },
        { title: 'Suivi', text: 'Contrôles réguliers et restauration des dents abîmées si besoin.' },
      ],
      faq: [
        { q: 'Comment savoir si je grince des dents ?', a: 'Douleurs de la mâchoire ou maux de tête au réveil, dents usées ou sensibles, remarque de votre entourage sur des bruits la nuit : ce sont les signes les plus fréquents.' },
        { q: 'La gouttière guérit-elle le bruxisme ?', a: 'Elle ne supprime pas toujours le grincement, mais elle protège efficacement les dents et soulage les muscles. La prise en charge du stress aide souvent à réduire le bruxisme.' },
        { q: 'Combien de temps dure une gouttière ?', a: 'Plusieurs années selon l’intensité du bruxisme. Nous la contrôlons lors de vos visites et la remplaçons si nécessaire.' },
      ],
      seo: {
        title: 'Traitement du bruxisme à Sefrou — gouttière sur mesure | Centre Dentaire Sefrou',
        description: 'Vous serrez ou grincez des dents ? Gouttière occlusale sur mesure et suivi au Centre Dentaire Sefrou pour protéger vos dents et soulager la mâchoire.',
      },
    },
    en: {
      slug: 'bruxism',
      title: 'Bruxism',
      tagline: 'Protecting your teeth from grinding and clenching.',
      intro: [
        'Bruxism means clenching or grinding the teeth, most often at night and without realising it. It can cause tooth wear, cracks, sensitivity, jaw or temple pain and morning headaches.',
        'Treatment mainly relies on a custom night guard (occlusal splint) that protects the teeth and relaxes the jaw muscles. It comes with advice (stress management, sleep habits) and, when needed, restoration of worn teeth.',
      ],
      benefits: [
        'Protects teeth from wear and fractures',
        'Relieves jaw pain and headaches',
        'Thin, custom and comfortable night guard',
        'Protects crowns, veneers and implants',
      ],
      steps: [
        { title: 'Diagnosis', text: 'Examination of tooth wear, jaw muscles and joints.' },
        { title: 'Digital impression', text: 'Intraoral scan for a perfectly fitting night guard.' },
        { title: 'Fitting', text: 'Delivery of the night guard, bite adjustment and advice.' },
        { title: 'Follow-up', text: 'Regular check-ups and restoration of damaged teeth if needed.' },
      ],
      faq: [
        { q: 'How do I know if I grind my teeth?', a: 'Jaw pain or headaches on waking, worn or sensitive teeth, or a partner noticing noises at night are the most common signs.' },
        { q: 'Does the night guard cure bruxism?', a: 'It does not always stop the grinding, but it effectively protects the teeth and relieves the muscles. Managing stress often helps reduce bruxism.' },
        { q: 'How long does a night guard last?', a: 'Several years depending on the intensity of bruxism. We check it at your visits and replace it when needed.' },
      ],
      seo: {
        title: 'Bruxism treatment in Sefrou — custom night guard | Centre Dentaire Sefrou',
        description: 'Clenching or grinding your teeth? Custom night guard and follow-up at Centre Dentaire Sefrou to protect your teeth and relieve your jaw.',
      },
    },
  },
];

export const treatmentsByCategory = (id: CategoryId) => treatments.filter((t) => t.category === id);

export const findTreatment = (id: string) => treatments.find((t) => t.id === id);

export const tContent = (t: Treatment, lang: Lang) => t[lang];
